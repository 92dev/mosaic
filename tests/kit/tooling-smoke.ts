#!/usr/bin/env bun
import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { install } from "../../kit/install.ts";

const scratch = mkdtempSync(join(tmpdir(), "mosaic-tooling-"));
const target = join(scratch, "target");
function put(file: string, content: string | Uint8Array): void {
	const destination = join(target, file);
	mkdirSync(dirname(destination), { recursive: true });
	writeFileSync(destination, content);
}
function run(command: string[], code: number): string {
	const result = Bun.spawnSync(command, { cwd: target, stdout: "pipe", stderr: "pipe" });
	strictEqual(result.exitCode, code, `${command.join(" ")}\n${result.stdout}\n${result.stderr}`);
	return result.stdout.toString();
}
const bun = process.execPath;
const manifest = join(scratch, "manifest.json");
try {
	writeFileSync(manifest, JSON.stringify({
		project: { name: "Monorepo", summary: "Monorepo contains an API and worker." },
		topology: "monorepo", git: { defaultBranch: "master" },
		remotes: { link: "https://example.invalid/monorepo.git" }, members: [],
		components: ["apps/api", "packages/worker"].map(component => ({
			name: component.split("/")[1], path: component, stack: "TypeScript", testCommand: "bun test", coverageNote: "",
		})),
	}));
	await install({ manifest, target });
	run([bun, "tools/doctor.ts"], 0);
	deepStrictEqual(JSON.parse(run([bun, "tools/checkup.ts", "--json"], 0)), { findings: [], cannotEvaluate: [] });
	console.log("PASS fresh two-component monorepo: doctor and checkup");

	for (const file of ["view.tsx", "Makefile", ".github/workflows/check.yml", "docs/diagram.drawio", ".claude/assets/font.ttf", "image.png"]) {
		put(file, file.endsWith(".png") || file.endsWith(".ttf") ? new Uint8Array([0, 255, 123, 123]) : "{{project syntax}}\n");
	}
	put(".claude/worktrees/other/.git", "gitdir: /not-this-repository\n");
	put(".claude/worktrees/other/AGENTS.md", "{{OTHER_PROJECT}}\n");
	put("docs/evidence.log", "[not a Markdown link](missing-file)\n");
	run([bun, "tools/doctor.ts"], 0);
	for (const file of ["AGENTS.md", ".omp/config.yml", ".claude/hooks/guard-main.sh", "docs/process/map.md", "docs/index.md", "docs/plans/TEMPLATE.md", "docs/architecture/README.md", "docs/tracker/config.json", "tools/checkup.ts"]) {
		const original = readFileSync(join(target, file), "utf8");
		put(file, `${original}\n{{UNRENDERED}}\n`);
		const result = run([bun, "tools/doctor.ts"], 1);
		ok(result.includes(`FAIL placeholders ${file}:`), result);
		put(file, original);
	}
	console.log("PASS placeholders: project assets excluded; harness text defects rejected");

	put(".claude/skills/project-only/SKILL.md", "---\nname: project-only\n---\nArchive the ledger using {{PROJECT_SYNTAX}}.\n" + "Retain this project instruction.\n".repeat(125));
	put(".omp/agents/project-only.md", "---\nname: project-only\n---\nRead skill://project-only and rule://project-only.\n" + "Retain this project instruction.\n".repeat(65));
	run([bun, "tools/doctor.ts"], 0);
	console.log("PASS non-kit harness: unchanged single-port project entries need no twins, splits, or kit metadata");

	const legacy = "# Legacy notes\n\nD9 was a local label. Review plan 0042 for OldContract.\n[Old source](missing.md) and rule://retired-history.\n";
	put("docs/archived/docs/old/x.md", legacy);
	put("docs/archived/docs/product/legacy.md", "# Old product without metadata\n\nOldContract cites plan 0042.\n");
	put("docs/archived/docs/gaps.md", "# Unstructured old gaps and defects\n");
	put("docs/history.md", "[plan 0042 and D9](archived/docs/old/x.md)\n");
	run([bun, "tools/doctor.ts"], 0);
	deepStrictEqual(JSON.parse(run([bun, "tools/checkup.ts", "--json"], 0)), { findings: [], cannotEvaluate: [] });
	put("archive-impact.md", "---\nplan: \"0042\"\nrepo: link-repo\nareas: [contract:OldContract]\n---\n# Impact probe\n");
	const archiveImpact = JSON.parse(run([bun, "tools/docimpact.ts", "archive-impact.md"], 0));
	deepStrictEqual(archiveImpact.cannotEvaluate, []);
	ok(archiveImpact.candidates.every((candidate: { doc: string }) => !candidate.doc.startsWith("docs/archived/")));
	put("docs/old/x.md", legacy);
	const activeLegacy = JSON.parse(run([bun, "tools/checkup.ts", "--json"], 1));
	ok(activeLegacy.findings.some((finding: { class: string; path: string }) => finding.class === "dangling-reference" && finding.path === "docs/old/x.md"));
	ok(activeLegacy.findings.every((finding: { path: string }) => !finding.path.startsWith("docs/archived/")));
	deepStrictEqual(activeLegacy.cannotEvaluate, []);
	rmSync(join(target, "docs/old/x.md"));
	rmSync(join(target, "archive-impact.md"));
	console.log("PASS cutoff history: frozen sources excluded, inbound links valid, identical active prose still checked");

	put("docs/product/labels.md", "D9 is a project-local label.\n");
	put("apps/docs/component.md", "D8 is a component-local label.\n");
	put("packages/docs/component.md", "D7 is a component-local label.\n");
	deepStrictEqual(JSON.parse(run([bun, "tools/checkup.ts", "--json"], 0)), { findings: [], cannotEvaluate: [] });
	const index = readFileSync(join(target, "docs/architecture/README.md"), "utf8");
	put("docs/architecture/README.md", `${index}\n| D1 | Default | decision.md |\n`);
	put("docs/architecture/decision.md", "# Decisions\n\n### D1 — Default\n");
	put("docs/process/sub/citations.md", [
		"Release 0991 is a local label.",
		"plan 0992",
		"docs/plans/0993-unwritten.md",
		"ADR-0994 implements plan 0995.",
		"See adr/0996-choice.md and plan 0997.",
		"See 0998-choice and plan 0999.",
		"See D9 G-999 P-999.",
	].join("\n") + "\n");
	put("docs/adr/citations.md", "plan 0888 and D8 are not kit citations here.\n");
	put("docs/analysis/citations.md", "D7 is local; plan 0777 is not.\nG-998 and P-998 keep their namespaces.\n");
	put("docs/plans/0881-probe.md", "---\nplan: 0881\nstatus: draft\n---\n# 0883 — Probe\n\nplan: 0882\n" +
		["Context", "Scope", "Task breakdown", "Review checklist", "Verification", "Planning log", "Execution log"].map(section => `\n## ${section}\n`).join("") + "\n### Unverified\n");
	const checked = JSON.parse(run([bun, "tools/checkup.ts", "--json"], 1));
	deepStrictEqual(checked.cannotEvaluate, []);
	deepStrictEqual(checked.findings.map((finding: { class: string; path: string; detail: string }) => [finding.class, finding.path, finding.detail.split(" ")[0]]), [
		["dangling-reference", "docs/analysis/citations.md", "0777"],
		["dangling-reference", "docs/analysis/citations.md", "G-998"],
		["dangling-reference", "docs/analysis/citations.md", "P-998"],
		["dangling-reference", "docs/plans/0881-probe.md", "0881"],
		["dangling-reference", "docs/process/sub/citations.md", "0992"],
		["dangling-reference", "docs/process/sub/citations.md", "0993"],
		["dangling-reference", "docs/process/sub/citations.md", "D9"],
		["dangling-reference", "docs/process/sub/citations.md", "G-999"],
		["dangling-reference", "docs/process/sub/citations.md", "P-999"],
		["dangling-reference", "docs/product/labels.md", "D9"],
	]);
	console.log("PASS citations: explicit plan cues, ADR exclusions, indexed D scope, unchanged G/P");

	put("docs/plans/program.md", "# Existing project program, not a kit lifecycle plan\n");
	for (const command of [[bun, ".omp/hooks/post/lint-ledgers.ts"], ["bash", ".claude/hooks/lint-ledgers.sh"]]) {
		run([...command, "docs/plans/program.md"], 2);
		put("docs/plans/0881-probe.md", "---\nstatus: draft\n---\n# Incomplete numbered plan\n");
		run([...command, "docs/plans/0881-probe.md"], 1);
	}
	console.log("PASS both lint ports: project programs unsupported; numbered plans still schema-gated");

	const gaps = readFileSync(join(target, "docs/gaps.md"), "utf8");
	put("docs/gaps.md", `${gaps}\n- **G-999 · Missing path**\n  **Trigger:** when \`missing/docs/**\` is added.\n  **Duty:** Recheck the path.\n  **Why not now:** The path does not exist.\n  **From:** smoke\n  **Status:** open\n`);
	const triggered = JSON.parse(run([bun, "tools/checkup.ts", "--json"], 1));
	deepStrictEqual(triggered.cannotEvaluate, []);
	deepStrictEqual(triggered.findings.filter((finding: { class: string }) => finding.class === "stale-trigger").map((finding: { path: string; detail: string }) => [finding.path, finding.detail.split(" ")[0]]), [["docs/gaps.md", "G-999"]]);
	console.log("PASS monorepo root stale-trigger evaluation");

	put("impact.md", "---\nplan: 0001\nrepo: link-repo\nareas: [contract:export_rows]\n---\n# Impact probe\n");
	put("docs/prd/legacy.md", "# Existing PRD without metadata\n");
	put("docs/product/partial.md", "---\ncontracts: [export_rows]\n---\n# Missing repo metadata\n");
	put("docs/product/valid.md", "---\ncontracts: [export_rows]\nrepos: [link-repo]\n---\n# Export feature\n");
	const impact = JSON.parse(run([bun, "tools/docimpact.ts", "impact.md"], 0));
	deepStrictEqual(impact.candidates.filter((candidate: { class: string }) => candidate.class === "product-contract").map((candidate: { doc: string }) => candidate.doc), ["docs/product/valid.md"]);
	const unknownProducts = impact.cannotEvaluate.filter((entry: { class: string }) => entry.class === "product-contract");
	deepStrictEqual(unknownProducts.map((entry: { reason: string }) => entry.reason.split(":")[0]), [
		"docs/prd/legacy.md", "docs/product/labels.md", "docs/product/partial.md",
	]);
	ok(unknownProducts.every((entry: { reason: string }) => entry.reason.includes("repos")));
	ok(unknownProducts.slice(0, 2).every((entry: { reason: string }) => entry.reason.includes("contracts")));
	console.log("PASS docimpact: metadata-free product/PRD documents are unknown, not empty success");
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
