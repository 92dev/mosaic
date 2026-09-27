// Repeat analysis: bun tests/loops/flaky.ts [--tag-prefix r3] → rewrites FLAKINESS.md.
// Groups runs by scenario/harness/model-thinking; a cell with ≥ 2 runs reports per-check agreement and cost spread.
import { readdir } from "node:fs/promises";
import { join } from "node:path";

type CheckResult = { id: string; outcome: string };
type Run = { dir: string; tag: string; checks: CheckResult[]; cost: number; seconds: number; requests: number; tokens: number };

const root = join(import.meta.dir, "runs");
const prefixArg = process.argv.indexOf("--tag-prefix");
const tagPrefix = prefixArg >= 0 ? process.argv[prefixArg + 1] : "";

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name === "meta.json") out.push(dir);
  }
  return out;
}

const cells: Record<string, Run[]> = {};
for (const dir of await walk(root)) {
  const meta = await Bun.file(join(dir, "meta.json")).json();
  if (tagPrefix && !String(meta.tag ?? "").startsWith(tagPrefix)) continue;
  const checksFile = Bun.file(join(dir, "checks.json"));
  const metricsFile = Bun.file(join(dir, "metrics.json"));
  if (!(await checksFile.exists()) || !(await metricsFile.exists())) continue;
  const metrics = await metricsFile.json();
  const roleSuffix = meta.roles ? Object.entries(meta.roles as Record<string, string>).sort().map(([name, selector]) => ` +${name}=${selector.split("/").pop()}`).join("") : "";
  const key = `${meta.scenario} | ${meta.harness} | ${meta.model}-${meta.thinking}${roleSuffix}`;
  (cells[key] ??= []).push({
    dir: dir.replace(root + "/", ""), tag: meta.tag ?? "", checks: await checksFile.json(),
    cost: metrics.cost ?? 0, seconds: metrics.wallSeconds ?? 0, requests: metrics.requests ?? 0, tokens: metrics.tokens?.total ?? 0,
  });
}

const lines = ["# Repeat analysis", "", `Generated from runs/** ${tagPrefix ? `with tag prefix \`${tagPrefix}\`` : ""}. A cell is flaky when any check outcome differs between repeats. Spread = max/min.`, "",
  "| cell | runs | flaky checks | agreement | cost mean (spread) | seconds mean (spread) | requests mean |", "|---|---:|---|---:|---:|---:|---:|"];
const flakyCells: string[] = [];
for (const key of Object.keys(cells).sort()) {
  const runs = cells[key];
  if (runs.length < 2) continue;
  const ids = [...new Set(runs.flatMap(run => run.checks.map(check => check.id)))];
  const flaky: string[] = [];
  let agree = 0;
  for (const id of ids) {
    const outcomes = new Set(runs.map(run => run.checks.find(check => check.id === id)?.outcome ?? "MISSING"));
    if (outcomes.size > 1) flaky.push(`${id} (${[...outcomes].join("/")})`); else agree++;
  }
  const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const spread = (values: number[]) => { const min = Math.min(...values); return min > 0 ? (Math.max(...values) / min).toFixed(2) + "×" : "n/a"; };
  const costs = runs.map(run => run.cost), secs = runs.map(run => run.seconds), reqs = runs.map(run => run.requests);
  lines.push(`| ${key} | ${runs.length} | ${flaky.join(", ") || "none"} | ${agree}/${ids.length} | $${mean(costs).toFixed(2)} (${spread(costs)}) | ${Math.round(mean(secs))} (${spread(secs)}) | ${Math.round(mean(reqs))} |`);
  if (flaky.length) flakyCells.push(key);
}
lines.push("", `Flaky cells: ${flakyCells.length ? flakyCells.join("; ") : "none"}.`, "");
await Bun.write(join(import.meta.dir, "FLAKINESS.md"), lines.join("\n"));
console.log(lines.join("\n"));
