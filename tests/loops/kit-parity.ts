#!/usr/bin/env bun
import { mkdtemp, readdir, readlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildFixture, fixtureRoot, selectedHarnesses } from "./build-fixture.ts";

async function links(root: string, directory = ""): Promise<string[]> {
  const result: string[] = [];
  for (const entry of (await readdir(join(root, directory), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) result.push(`${name} -> ${await readlink(join(root, name))}`);
    else if (entry.isDirectory()) result.push(...await links(root, name));
  }
  return result;
}

const scratch = await mkdtemp(join(tmpdir(), "mosaic-kit-parity-"));
try {
  for (const harness of selectedHarnesses()) {
    const checked = fixtureRoot(harness);
    const generated = join(scratch, harness);
    await buildFixture(harness, generated);
    const diff = Bun.spawn(["diff", "-r", checked, generated], { stdin: "ignore", stdout: "inherit", stderr: "inherit" });
    const code = await diff.exited;
    const [checkedLinks, generatedLinks] = await Promise.all([links(checked), links(generated)]);
    const sameLinks = JSON.stringify(checkedLinks) === JSON.stringify(generatedLinks);
    if (!sameLinks) {
      console.error(`${harness} symlink drift:\nchecked in:\n${checkedLinks.join("\n")}\ngenerated:\n${generatedLinks.join("\n")}`);
    }
    if (code || !sameLinks) {
      const kit = harness === "baseline" ? "fixtures/baseline-kit/" : "kit/";
      console.error(`kit-parity: FAIL (${harness}) — edit ${kit}, ${harness}.manifest.json or ${harness}-overlay/, then run bun tests/loops/build-fixture.ts --harness ${harness}`);
      process.exitCode = 1;
    } else console.log(`kit-parity: PASS (${harness}) — fixture bytes and relative symlink targets match`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await rm(scratch, { recursive: true, force: true });
}
