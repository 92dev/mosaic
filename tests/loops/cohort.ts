// Cohort table: bun tests/loops/cohort.ts --tag-prefix s55 [--scenario S17b-code-review-hard] [--role review-claude]
// One row per run grouped by cell (scenario | model-thinking + role overrides): checks, parent cost/tokens/time,
// and the usage of every `task` child (or only the children of --role) from metrics.children.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { ChildUsage } from "./metrics.ts";

type Run = { tag: string; pass: number; fail: string[]; cannot: number; cost: number; tokens: number; seconds: number; children: ChildUsage[] };

const root = join(import.meta.dir, "runs");
const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const tagPrefix = arg("--tag-prefix") ?? "";
const scenarioFilter = arg("--scenario");
const roleFilter = arg("--role");

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name === "meta.json") out.push(dir);
  }
  return out;
}

const cells = new Map<string, Run[]>();
for (const dir of await walk(root)) {
  const meta = await Bun.file(join(dir, "meta.json")).json();
  if (tagPrefix && !String(meta.tag ?? "").startsWith(tagPrefix)) continue;
  if (scenarioFilter && meta.scenario !== scenarioFilter) continue;
  const checksFile = Bun.file(join(dir, "checks.json"));
  const metricsFile = Bun.file(join(dir, "metrics.json"));
  if (!(await checksFile.exists()) || !(await metricsFile.exists())) continue;
  const checks: { id: string; outcome: string }[] = await checksFile.json();
  const metrics = await metricsFile.json();
  const roleSuffix = meta.roles ? Object.entries(meta.roles as Record<string, string>).sort().map(([name, selector]) => ` +${name}=${selector.split("/").pop()}`).join("") : "";
  const key = `${meta.scenario} | ${meta.harness} | ${meta.model}-${meta.thinking}${roleSuffix}`;
  const children: ChildUsage[] = Array.isArray(metrics.children) ? metrics.children : [];
  const runs = cells.get(key) ?? [];
  runs.push({
    tag: meta.tag ?? "", pass: checks.filter(c => c.outcome === "PASS").length, fail: checks.filter(c => c.outcome === "FAIL").map(c => c.id),
    cannot: checks.filter(c => c.outcome === "CANNOT-EVALUATE").length, cost: metrics.cost ?? 0, tokens: metrics.tokens?.total ?? 0, seconds: metrics.wallSeconds ?? 0,
    children: roleFilter ? children.filter(child => child.modelRole === roleFilter) : children,
  });
  cells.set(key, runs);
}

const money = (value: number) => `$${value.toFixed(3)}`;
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
for (const key of [...cells.keys()].sort()) {
  const runs = cells.get(key)!.sort((a, b) => a.tag.localeCompare(b.tag));
  console.log(`\n## ${key}  (n=${runs.length}; parent mean ${money(mean(runs.map(r => r.cost)))}, ${Math.round(mean(runs.map(r => r.seconds)))} s)`);
  for (const run of runs) {
    const checks = `${run.pass}P/${run.fail.length}F/${run.cannot}C${run.fail.length ? ` FAIL ${run.fail.join(",")}` : ""}`;
    console.log(`  ${run.tag.padEnd(8)} ${checks.padEnd(28)} parent ${money(run.cost)} ${String(run.tokens).padStart(8)} tok ${String(Math.round(run.seconds)).padStart(5)} s`);
    for (const child of run.children) {
      console.log(`           child ${child.modelRole.padEnd(14)} ${child.agent.padEnd(16)} ${child.status.padEnd(10)} ${money(child.cost)} ${String(child.tokens).padStart(8)} tok ${String(Math.round(child.durationMs / 1000)).padStart(5)} s ${child.requests} req ${child.toolCount} tools`);
    }
  }
}
