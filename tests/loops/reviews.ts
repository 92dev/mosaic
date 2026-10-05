// Dump each completed reviewer result verbatim for a tag cohort: bun tests/loops/reviews.ts --tag-prefix s55 --scenario S17b-code-review-hard
// One section per run (cell, tag, per-reviewer child usage) and one subsection per reviewer verdict, for critics reading findings.
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { parseEvent } from "./metrics.ts";
import type { ChildUsage } from "./metrics.ts";
import { reviewerResults } from "./scenarios/S17b-code-review-hard/check.ts";

const root = join(import.meta.dir, "runs");
const arg = (name: string) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : undefined; };
const tagPrefix = arg("--tag-prefix") ?? "";
const scenarioFilter = arg("--scenario");

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name === "meta.json") out.push(dir);
  }
  return out;
}

const sections: { key: string; text: string }[] = [];
for (const dir of await walk(root)) {
  const meta = await Bun.file(join(dir, "meta.json")).json();
  if (tagPrefix && !String(meta.tag ?? "").startsWith(tagPrefix)) continue;
  if (scenarioFilter && meta.scenario !== scenarioFilter) continue;
  const metricsFile = Bun.file(join(dir, "metrics.json"));
  if (!(await metricsFile.exists())) continue;
  const metrics = await metricsFile.json();
  const checks: { id: string; outcome: string; evidence: string }[] = await Bun.file(join(dir, "checks.json")).json();
  const roleSuffix = meta.roles ? Object.entries(meta.roles as Record<string, string>).sort().map(([name, selector]) => ` +${name}=${selector.split("/").pop()}`).join("") : "";
  const key = `${meta.scenario} | ${meta.model}-${meta.thinking}${roleSuffix} | ${meta.tag}`;
  const events = (await Bun.file(join(dir, "events.jsonl")).text()).split(/\r?\n/).filter(line => line.trim()).map(parseEvent);
  const children: ChildUsage[] = Array.isArray(metrics.children) ? metrics.children : [];
  const usage = children.map(child => `${child.modelRole}: $${child.cost.toFixed(3)}, ${child.tokens} tok, ${Math.round(child.durationMs / 1000)} s, ${child.requests} req, ${child.toolCount} tools`).join("; ");
  const recall = checks.find(check => check.id === "per-reviewer-recall")?.evidence ?? "";
  const fails = checks.filter(check => check.outcome !== "PASS").map(check => `${check.id}=${check.outcome}`).join(", ") || "all PASS";
  const reviews = reviewerResults(events).map(review => `### ${review.agent} — ${review.verdict}\n\n${review.body}\n`).join("\n");
  sections.push({ key, text: `## ${key}\n\nRun: ${dir.replace(root + "/", "")}\nChildren: ${usage || "none"}\nChecks: ${fails}\nRecall:\n${recall}\n\n${reviews || "(no completed reviewer result)"}\n` });
}
sections.sort((a, b) => a.key.localeCompare(b.key));
console.log(sections.map(section => section.text).join("\n"));
