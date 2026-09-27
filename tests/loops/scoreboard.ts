import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { isRecord } from "./metrics.ts";
import { isCheckResult } from "./run.ts";
import { readEvaluations } from "./score.ts";

async function main() {
  if (Bun.argv.length !== 2) throw new Error("Usage: bun tests/loops/scoreboard.ts");
  const root = import.meta.dir;
  const runs = join(root, "runs");
  const rows: { scenario: string; startedAt: string; cells: (string | number)[] }[] = [];
  if (existsSync(runs)) {
    for await (const path of new Bun.Glob("**/meta.json").scan({ cwd: runs, absolute: true })) {
      const runDir = dirname(path);
      const meta: unknown = await Bun.file(path).json();
      const metrics: unknown = await Bun.file(join(runDir, "metrics.json")).json();
      const checks: unknown = await Bun.file(join(runDir, "checks.json")).json();
      if (!isRecord(meta) || typeof meta.scenario !== "string" || typeof meta.harness !== "string" || typeof meta.model !== "string"
        || typeof meta.thinking !== "string" || typeof meta.startedAt !== "string" || (meta.tag !== undefined && typeof meta.tag !== "string")) {
        throw new Error(`Invalid run metadata: ${path}`);
      }
      if (!isRecord(metrics) || !isRecord(metrics.tokens) || typeof metrics.tokens.total !== "number"
        || typeof metrics.firstRequestPromptTokens !== "number" || typeof metrics.cost !== "number" || typeof metrics.requests !== "number" || !isRecord(metrics.toolCalls)) {
        throw new Error(`Invalid run metrics: ${runDir}`);
      }
      if (!Array.isArray(checks) || !checks.every(isCheckResult)) throw new Error(`Invalid run checks: ${runDir}`);
      let tools = 0;
      for (const count of Object.values(metrics.toolCalls)) {
        if (typeof count !== "number" || !Number.isFinite(count)) throw new Error(`Invalid tool call count: ${runDir}`);
        tools += count;
      }
      const counts = { PASS: 0, FAIL: 0, "CANNOT-EVALUATE": 0 };
      for (const check of checks) counts[check.outcome]++;
      const verdicts = (await readEvaluations(runDir)).map(entry => `${entry.name}:${entry.verdict}`).join(", ");
      rows.push({ scenario: meta.scenario, startedAt: meta.startedAt, cells: [
        meta.scenario, meta.harness, `${meta.model}-${meta.thinking}`, meta.startedAt,
        metrics.tokens.total, metrics.firstRequestPromptTokens, metrics.cost.toFixed(4), metrics.requests, tools,
        `${counts.PASS}/${counts.FAIL}/${counts["CANNOT-EVALUATE"]}`, verdicts, meta.tag ?? "",
      ] });
    }
  }
  rows.sort((a, b) => a.scenario.localeCompare(b.scenario) || a.startedAt.localeCompare(b.startedAt));
  const lines = [
    "# Loop scoreboard",
    "",
    "Tokens include input, output, and cache tokens; prompt tokens are the first request's input plus cache; cost is USD; tool calls count executions; checks are PASS/FAIL/CANNOT-EVALUATE counts.",
    "",
    "| scenario | harness | model-thinking | timestamp | tokens.total | firstRequestPromptTokens | cost | requests | tool calls (n) | checks P/F/C | verdicts | tag |",
    "|---|---|---|---|---:|---:|---:|---:|---:|---|---|---|",
    ...rows.map(row => `| ${row.cells.map(cell => String(cell).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>")).join(" | ")} |`),
  ];
  await Bun.write(join(root, "SCOREBOARD.md"), lines.join("\n") + "\n");
}

if (import.meta.main) {
  try { await main(); } catch (error) { console.error(String(error)); process.exitCode = 2; }
}
