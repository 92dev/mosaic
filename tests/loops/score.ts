import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { isRecord } from "./metrics.ts";

export type Evaluation = { name: string; verdict: "better" | "worse" | "same"; note: string; at: string };

export async function readEvaluations(runDir: string): Promise<Evaluation[]> {
  const file = Bun.file(join(runDir, "verdict.json"));
  if (!await file.exists()) return [];
  const data: unknown = await file.json();
  if (!isRecord(data) || !Array.isArray(data.evaluators)) throw new Error(`Invalid verdict.json: ${runDir}`);
  const evaluators: Evaluation[] = [];
  for (const entry of data.evaluators) {
    if (!isRecord(entry) || typeof entry.name !== "string" || typeof entry.note !== "string" || typeof entry.at !== "string"
      || (entry.verdict !== "better" && entry.verdict !== "worse" && entry.verdict !== "same")) {
      throw new Error(`Invalid evaluator in ${runDir}/verdict.json`);
    }
    evaluators.push({ name: entry.name, verdict: entry.verdict, note: entry.note, at: entry.at });
  }
  return evaluators;
}

if (import.meta.main) {
  try {
    const { values, positionals } = parseArgs({ args: Bun.argv.slice(2), allowPositionals: true, strict: true, options: {
      evaluator: { type: "string" }, verdict: { type: "string" }, note: { type: "string" },
    } });
    const { evaluator, verdict, note } = values;
    if (positionals.length !== 1 || !evaluator?.trim() || note === undefined || (verdict !== "better" && verdict !== "worse" && verdict !== "same")) {
      throw new Error('Usage: bun tests/loops/score.ts <runDir> --evaluator <name> --verdict better|worse|same --note "..."');
    }
    const runDir = resolve(positionals[0]);
    if (!await Bun.file(join(runDir, "meta.json")).exists()) throw new Error(`Not a run directory: ${runDir}`);
    const evaluators = await readEvaluations(runDir);
    const evaluation: Evaluation = { name: evaluator, verdict, note, at: new Date().toISOString() };
    const index = evaluators.findIndex(entry => entry.name === evaluator);
    if (index === -1) evaluators.push(evaluation); else evaluators[index] = evaluation;
    await Bun.write(join(runDir, "verdict.json"), JSON.stringify({ evaluators }, null, 2) + "\n");
  } catch (error) {
    console.error(String(error));
    process.exitCode = 2;
  }
}
