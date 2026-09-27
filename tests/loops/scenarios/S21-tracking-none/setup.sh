#!/usr/bin/env bash
set -euo pipefail

# The frozen baseline does not have install-time tracking modes.
[[ -f tools/doctor.ts ]] || exit 0
bun - "${BASH_SOURCE[0]}" <<'TS'
import { existsSync } from "node:fs";
import { cp, mkdtemp, rename, rm } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(dirname(Bun.argv[2]), "../../../..");
const work = process.cwd();
const parent = dirname(work);
if (basename(work) !== "work" || !basename(parent).startsWith("mosaic-loop-S21-tracking-none-")) {
  throw new Error("S21 setup replaces only its runner-created disposable work directory.");
}
const roles = (await Bun.file(join(work, ".omp/config.yml")).text())
  .match(/^modelRoles:\r?\n(?:[ \t]+[^\n]*(?:\n|$))*/m)?.[0] ?? "";
const staging = await mkdtemp(join(parent, "s21-none-"));
try {
  const manifest = await Bun.file(join(root, "tests/loops/fixtures/mosaic.manifest.json")).json();
  manifest.tracking = { mode: "none" };
  const manifestPath = join(staging, "manifest.json");
  await Bun.write(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const sourceOverlay = join(root, "tests/loops/fixtures/mosaic-overlay");
  const overlay = join(staging, "overlay");
  await cp(sourceOverlay, overlay, {
    recursive: true, verbatimSymlinks: true,
    // These local fixture replacements must not override the kit's none-mode rendering.
    filter: source => !["docs/plans/TEMPLATE.md", "docs/index.md", "docs/tracker"].includes(relative(sourceOverlay, source)),
  });
  const target = join(staging, "work");
  const { install } = await import(pathToFileURL(join(root, "kit/install.ts")).href);
  await install({ manifest: manifestPath, overlay, target });
  const runtime = await Bun.file(join(target, ".omp/mosaic.json")).json();
  if (runtime.tracking?.mode !== "none") throw new Error("Fresh S21 install did not select tracking.mode=none.");
  const localPaths = ["tools/tracker.ts", "docs/tracker", "tools/mcp", ".omp/agents/tracker-scout.md", ".claude/agents/tracker-scout.md"];
  const leaked = localPaths.filter(path => existsSync(join(target, path)));
  if (leaked.length) throw new Error(`Fresh none install contains local tracker paths: ${leaked.join(", ")}`);
  if (/^tracker:/m.test(await Bun.file(join(target, "docs/plans/TEMPLATE.md")).text())) {
    throw new Error("Fresh none plan template contains tracker frontmatter.");
  }
  // run.ts applies --role before scenario setup; preserve selectors, not the copied local harness.
  const configPath = join(target, ".omp/config.yml");
  let config = await Bun.file(configPath).text();
  for (const [, name, selector] of roles.matchAll(/^  ([a-z][a-z-]*):[ \t]*(\S+)/gm)) {
    config = config.replace(new RegExp(`^(  ${name}:[ \\t]*)\\S+`, "m"), `$1${selector}`);
  }
  await Bun.write(configPath, config);
  await rm(work, { recursive: true });
  await rm(join(parent, "origins"), { recursive: true, force: true });
  await rename(target, work);
} finally {
  await rm(staging, { recursive: true, force: true });
}
TS

# Re-enter the replacement directory, then seed fresh repositories and collision evidence.
cd "$PWD"
MOSAIC_S9=0 bash setup.sh
printf 'S21 ready: fresh installer tracking.mode=none; no local tracker; collision sources=ledgers plus branches\n'
