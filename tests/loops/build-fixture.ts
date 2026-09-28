#!/usr/bin/env bun
import { mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { install } from "../../kit/install.ts";

export const harnesses = ["baseline", "mosaic"] as const;
export type Harness = typeof harnesses[number];

export function selectedHarnesses(args = Bun.argv.slice(2)): readonly Harness[] {
  const { values } = parseArgs({ args, strict: true, options: { harness: { type: "string" } } });
  if (values.harness === undefined) return harnesses;
  const harness = harnesses.find(name => name === values.harness);
  if (!harness) throw new Error("--harness must be baseline or mosaic");
  return [harness];
}

export function fixtureRoot(harness: Harness): string {
  return join(import.meta.dir, "fixtures", harness);
}

export async function buildFixture(harness: Harness, target = fixtureRoot(harness)): Promise<void> {
  target = resolve(target);
  await mkdir(dirname(target), { recursive: true });
  const staging = await mkdtemp(join(dirname(target), `.${harness}-build-`));
  try {
    await install({
      kit: harness === "baseline" ? join(import.meta.dir, "fixtures", "baseline-kit") : undefined,
      kitCommit: "fixture",
      manifest: join(import.meta.dir, "fixtures", `${harness}.manifest.json`),
      overlay: join(import.meta.dir, "fixtures", `${harness}-overlay`),
      target: staging,
      force: true,
    });
    const checks: string[][] = [];
    if (harness === "mosaic") {
      checks.push([join(import.meta.dir, "../../kit/tools/doctor.ts")]);
    } else {
      // The frozen harness predates mosaic's doctor; use its own registry schema guard.
      const registries = ["docs/gaps.md", "docs/gaps-archive.md", "docs/architecture/README.md", "docs/architecture/pitfalls.md"];
      for await (const file of new Bun.Glob("**/docs/plans/*.md").scan({ cwd: staging })) {
        if (!file.endsWith("/TEMPLATE.md")) registries.push(file);
      }
      for (const file of registries.sort()) checks.push([join(staging, ".omp/hooks/post/lint-ledgers.ts"), file]);
    }
    for (const command of checks) {
      const check = Bun.spawn([process.execPath, ...command], {
        cwd: staging, stdin: "ignore", stdout: "inherit", stderr: "inherit",
      });
      const code = await check.exited;
      if (code) throw new Error(`${harness} fixture check exited ${code}; existing fixture was not changed`);
    }
    // Only generated output is replaced. Staging removes obsolete generated files as well.
    await rm(target, { recursive: true, force: true });
    await rename(staging, target);
    console.log(`Built ${harness} fixture: ${target}`);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  try {
    for (const harness of selectedHarnesses()) await buildFixture(harness);
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
