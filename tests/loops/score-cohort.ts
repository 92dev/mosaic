// Record one orchestrator verdict per run in a tag cohort, relative to the same-scenario/same-family baseline cell.
// bun tests/loops/score-cohort.ts --tag-prefix r3 --evaluator claude-orchestrator
import { readdir } from "node:fs/promises";
import { join } from "node:path";

type Run = { dir: string; scenario: string; harness: string; model: string; family: string; tag: string; pass: number; fail: string[]; cannot: number; cost: number; seconds: number };

const root = join(import.meta.dir, "runs");
const arg = (name: string, fallback: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const tagPrefix = arg("--tag-prefix", "r3");
const evaluator = arg("--evaluator", "claude-orchestrator");

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name === "meta.json") out.push(dir);
  }
  return out;
}

const runs: Run[] = [];
for (const dir of await walk(root)) {
  const meta = await Bun.file(join(dir, "meta.json")).json();
  if (!String(meta.tag ?? "").startsWith(tagPrefix)) continue;
  const checks: { id: string; outcome: string }[] = await Bun.file(join(dir, "checks.json")).json();
  const metrics = await Bun.file(join(dir, "metrics.json")).json();
  const roleSuffix = meta.roles ? Object.entries(meta.roles as Record<string, string>).sort().map(([name, selector]) => ` +${name}=${selector.split("/").pop()}`).join("") : "";
  const model: string = meta.model + roleSuffix;
  runs.push({
    dir, scenario: meta.scenario, harness: meta.harness, model, tag: meta.tag,
    family: /anthropic/.test(model) ? "claude" : "gpt",
    pass: checks.filter(c => c.outcome === "PASS").length, fail: checks.filter(c => c.outcome === "FAIL").map(c => c.id),
    cannot: checks.filter(c => c.outcome === "CANNOT-EVALUATE").length, cost: metrics.cost ?? 0, seconds: metrics.wallSeconds ?? 0,
  });
}

const mean = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : NaN;
// TOLERANCE.md tiers: a `none` cell with any FAIL is worse regardless of cost; a `high` cell competes on cost once its checks pass.
const tolerance = (scenario: string): "none" | "low" | "medium" | "high" =>
  /^S(?:1|3|9|6|12|14)-/.test(scenario) ? "none" : /^S5[ab]-/.test(scenario) ? "high" : /^S15[ab]-/.test(scenario) ? "medium" : "low";
for (const run of runs) {
  const baseline = runs.filter(r => r.scenario === run.scenario && r.harness === "baseline" && r.family === run.family);
  let verdict = "same";
  let note: string;
  const summary = `${run.pass}P/${run.fail.length}F/${run.cannot}C, $${run.cost.toFixed(2)}, ${Math.round(run.seconds)}s`;
  if (run.harness === "baseline") {
    note = `Reference run (${run.model}, ${run.tag}): ${summary}${run.fail.length ? `; FAIL ${run.fail.join(",")}` : ""}.`;
  } else if (!baseline.length) {
    verdict = run.fail.length ? "worse" : "better";
    note = `No baseline counterpart (${run.tag}, tolerance ${tolerance(run.scenario)}): ${summary}${run.fail.length ? `; FAIL ${run.fail.join(",")}` : "; all checks pass"}.`;
  } else {
    const baseFails = mean(baseline.map(r => r.fail.length)), baseCost = mean(baseline.map(r => r.cost)), baseSecs = mean(baseline.map(r => r.seconds));
    const tier = tolerance(run.scenario);
    if (run.fail.length && (tier === "none" || run.fail.length > baseFails)) verdict = "worse";
    else if (run.fail.length === 0 && (baseFails > 0 || run.cost <= baseCost * 1.05)) verdict = "better";
    else verdict = "same";
    note = `[tolerance ${tolerance(run.scenario)}] vs baseline ${run.family} mean (${baseline.length} runs: ${baseFails.toFixed(1)} FAIL, $${baseCost.toFixed(2)}, ${Math.round(baseSecs)}s): ${summary}${run.fail.length ? `; FAIL ${run.fail.join(",")}` : ""}. Tag ${run.tag}.`;
  }
  const proc = Bun.spawn(["bun", join(import.meta.dir, "score.ts"), run.dir, "--evaluator", evaluator, "--verdict", verdict, "--note", note], { stdout: "pipe", stderr: "pipe" });
  await proc.exited;
  console.log(`${verdict.padEnd(6)} ${run.scenario} ${run.harness} ${run.model} ${run.tag} — ${summary}`);
}
