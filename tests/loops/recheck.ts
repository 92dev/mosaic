// Re-run a scenario's check.ts against an existing run (its work dir must still exist).
// bun tests/loops/recheck.ts <runDir>
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseEvents } from "./metrics.ts";

const runDir = resolve(process.argv[2] ?? "");
const meta = await Bun.file(join(runDir, "meta.json")).json();
const workDir: string = meta.workDir;
if (!(await Bun.file(join(workDir, "setup.sh")).exists())) {
  console.error(`work dir missing: ${workDir}`);
  process.exit(2);
}
const lines = (await Bun.file(join(runDir, "events.jsonl")).text()).split(/\r?\n/).filter(line => line.trim());
const events = lines.map(line => JSON.parse(line));
const metrics = parseEvents(lines);
if (metrics.wallSeconds === 0) metrics.wallSeconds = meta.wallSeconds;
const checkPath = resolve(import.meta.dir, "scenarios", meta.scenario, "check.ts");
const exec = async (cmd: string, cwd = workDir) => {
  const proc = Bun.spawn(["bash", "-c", cmd], { cwd, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
  return { code, stdout, stderr };
};
// Dynamic import: the check module is selected at runtime by the run's scenario name.
const check = (await import(pathToFileURL(checkPath).href)).default;
const checks = await check({ runDir, workDir, fixtureDir: meta.fixtureDir, events, metrics, exec });
await Bun.write(join(runDir, "checks.json"), JSON.stringify(checks, null, 2) + "\n");
console.log(JSON.stringify(checks, null, 2));
process.exit(checks.some((c: { outcome: string }) => c.outcome === "FAIL") ? 1 : checks.some((c: { outcome: string }) => c.outcome === "CANNOT-EVALUATE") ? 2 : 0);
