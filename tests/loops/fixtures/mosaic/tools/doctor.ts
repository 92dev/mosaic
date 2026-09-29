#!/usr/bin/env bun
// Run from the installed project root, or pass --root <dir>. No packages or model calls.
// Exit 0: all hard checks pass; 1: failed checks; 2: a check cannot evaluate.
import * as fs from "node:fs";
import * as path from "node:path";
import { realpathWithinRoot } from "./root-containment.ts";

type Outcome = "FAIL" | "WARN" | "CANNOT-EVALUATE";
const counts = { FAIL: 0, WARN: 0, "CANNOT-EVALUATE": 0 };
const reported = new Set<string>();
const maintenanceChecks: Record<string, true> = {
	budgets: true, "read-before-mutate": true, "mosaic-config": true, "guard-config": true,
	"single-home": true, "port-parity": true, symlinks: true, "governed-guard": true, placeholders: true,
};
function finding(outcome: Outcome, check: string, file: string, detail: string): void {
	if (maintenanceChecks[check]) detail = `/mosaic-kit: ${detail}`;
	const line = `${outcome} ${check} ${file}: ${detail.replace(/[\r\n]+/g, " ")}`;
	if (reported.has(line)) return;
	reported.add(line);
	counts[outcome]++;
	console.log(line);
}
function finish(): never {
	console.log(`doctor: ${counts.FAIL} fail, ${counts.WARN} warn, ${counts["CANNOT-EVALUATE"]} cannot-evaluate`);
	process.exit(counts["CANNOT-EVALUATE"] ? 2 : counts.FAIL ? 1 : 0);
}
const args = process.argv.slice(2);
if (args.length !== 0 && (args.length !== 2 || args[0] !== "--root" || !args[1] || args[1].startsWith("--"))) {
	finding("CANNOT-EVALUATE", "usage", ".", "usage: bun tools/doctor.ts [--root <dir>]");
	finish();
}
const root = path.resolve(args[1] ?? process.cwd());
try {
	if (!fs.statSync(root).isDirectory()) throw new Error("not a directory");
} catch (error) {
	finding("CANNOT-EVALUATE", "root", root, String(error));
	finish();
}
const texts = new Map<string, string>();
function text(check: string, file: string): string | undefined {
	const cached = texts.get(file);
	if (cached !== undefined) return cached;
	try {
		const content = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
		texts.set(file, content);
		return content;
	} catch (error) {
		finding("CANNOT-EVALUATE", check, file, `cannot read: ${String(error)}`);
		return undefined;
	}
}
const listings = new Map<string, string[]>();
function files(check: string, dir: string, recursive = true): string[] {
	const key = `${dir}:${recursive}`;
	const cached = listings.get(key);
	if (cached) return cached;
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
	} catch (error) {
		finding("CANNOT-EVALUATE", check, dir, `cannot list: ${String(error)}`);
		return [];
	}
	const result: string[] = [];
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const file = `${dir}/${entry.name}`;
		// Historical sources are frozen (rule://records Archive class: docs/archived, plans/archived, architecture
		// source records); active links into them still resolve normally.
		if (/(?:^|\/)docs\/(?:(?:plans\/)?archived|architecture\/(?:archived|source))(?:\/|$)/.test(file)) continue;
		if (entry.isDirectory()) {
			if (recursive && entry.name !== ".git" && entry.name !== "node_modules"
				&& !fs.existsSync(path.join(root, file, ".git"))) result.push(...files(check, file));
		} else if (entry.isFile() || entry.isSymbolicLink()) result.push(file);
	}
	listings.set(key, result);
	return result;
}
function body(content: string): string {
	return content.replace(/^---\n(?:[\s\S]*?\n)?---(?:\n|$)/, "");
}
function lines(content: string): string[] {
	return content === "" ? [] : content.replace(/\n$/, "").split("\n");
}
const configPath = ".omp/mosaic.json";
let defaultBranch = "main";
let trackingMode = "none";
if (fs.existsSync(path.join(root, configPath))) {
	const content = text("mosaic-config", configPath);
	if (content !== undefined) {
		try {
			const config = JSON.parse(content);
			if (typeof config.defaultBranch !== "string" || !config.defaultBranch.trim() || /[\r\n\0]/.test(config.defaultBranch)) {
				throw new Error("defaultBranch must be a nonempty single-line string");
			}
			if (config.topology !== "multi-repo" && config.topology !== "monorepo") throw new Error("topology must be multi-repo or monorepo");
			const tracking = config.tracking === undefined ? { mode: "none" } : config.tracking;
			if (!tracking || (tracking.mode !== "none" && tracking.mode !== "local" && tracking.mode !== "mcp")) throw new Error("tracking.mode must be none, local, or mcp");
			if (tracking.mode === "mcp") {
				for (const field of ["server", "team", "queue"]) {
					const value = tracking.mcp?.[field];
					if (field !== "server" && value === undefined) continue;
					if (typeof value !== "string" || !value.trim() || /[\r\n\0]/.test(value)) {
						throw new Error(`tracking.mcp.${field} must be a nonempty single-line string`);
					}
				}
			} else if (tracking.mcp !== undefined) throw new Error("tracking.mcp is only valid in mcp mode");
			defaultBranch = config.defaultBranch;
			trackingMode = tracking.mode;
		} catch (error) {
			finding("FAIL", "mosaic-config", configPath, String(error));
		}
	}
}
const processNames = [
	"mosaic-core", "map", "plan-triage", "git-flow", "dispatch", "review-loop", "verification",
	"records", "registries", "plan-home", "stack", "human-gates", "writing-for-the-reader",
	"targeted-tests", "records-guard", "model-notes", "intake", "tracker",
];
const skillNames = ["mosaic-plan", "mosaic-execute", "mosaic-gap-audit", "mosaic-intake", "mosaic-checkup", "mosaic-kit"];
const agentPairs = [
	["executor", "executor"], ["plan-adversary", "plan-adversary"], ["registry-scout", "registry-scout"],
	["context-scout", "context-scout"], ["claude-reviewer", "reviewer"], ["gpt-reviewer", "reviewer"],
	["tracker-scout", "tracker-scout"], ["librarian", "librarian"], ["ticket-investigator", "ticket-investigator"],
] as const;
const installedAgentPairs = agentPairs.filter(([name]) => name !== "tracker-scout" || trackingMode === "local");
// Structural contracts belong to the kit, not unrelated project harness entries.
const processFiles = processNames.map(name => `docs/process/${name}.md`).sort();
const ompRules = processNames.map(name => `.omp/rules/${name}.md`);
function skillFiles(port: ".omp" | ".claude"): string[] {
	return skillNames.map(name => `${port}/skills/${name}/SKILL.md`);
}
function agentFiles(port: ".omp" | ".claude"): string[] {
	return [...new Set(installedAgentPairs.map(pair => `${port}/agents/${pair[port === ".omp" ? 0 : 1]}.md`))];
}
const harnessFiles = [
	...ompRules, ...([".omp", ".claude"] as const).flatMap(port => [...skillFiles(port), ...agentFiles(port)]),
	".omp/config.yml", ".omp/hooks/pre/guard-main.ts", ".omp/hooks/post/lint-ledgers.ts",
	".claude/settings.json", ".claude/rules/mosaic-core.md", ".claude/rules/records-guard.md",
	".claude/hooks/guard-main.sh", ".claude/hooks/lint-ledgers.sh", ".claude/hooks/records-guard.sh",
];
if (fs.existsSync(path.join(root, ".omp/mosaic.json"))) harnessFiles.push(".omp/mosaic.json");

// Budgets count physical body lines, including blanks, excluding the final newline.
const budgets = new Map<string, number>([["AGENTS.md", 30], ["CLAUDE.md", 30], [".claude/rules/mosaic-core.md", 30]]);
for (const file of processFiles) {
	budgets.set(file, file.endsWith("/mosaic-core.md") ? 30 : file.endsWith("/intake.md") ? 40
		: file.endsWith("/map.md") ? 60 : 80);
}
for (const port of [".omp", ".claude"] as const) {
	for (const file of skillFiles(port)) budgets.set(file, /\/mosaic-(?:intake|checkup)\/SKILL\.md$/.test(file) ? 80 : 120);
	for (const file of agentFiles(port)) budgets.set(file, 60);
}
budgets.set("docs/kit/maintenance.md", 120);
for (const [file, max] of budgets) {
	const content = text("budgets", file);
	if (content === undefined) continue;
	const count = lines(body(content)).length;
	if (count > max) finding("FAIL", "budgets", file, `${count} body lines exceeds ${max}`);
}

// A missing reference target is a failure; an unreadable source cannot be evaluated.
function reference(source: string, target: string, label: string, line: number, directoryOK = false): void {
	try {
		const real = realpathWithinRoot(root, path.resolve(root, target));
		if (real === null) {
			finding("FAIL", "references", source, `line ${line}: unresolved ${label} (${target}) (outside repository)`);
			return;
		}
		if (!directoryOK && !fs.statSync(real).isFile()) throw new Error("target is not a file");
	} catch {
		finding("FAIL", "references", source, `line ${line}: unresolved ${label} (${target})`);
	}
}
const referenceFiles = new Set(["AGENTS.md", ...files("references", "docs"), ...harnessFiles.filter(file => file.startsWith(".omp/"))]);
for (const file of referenceFiles) {
	const content = text("references", file);
	if (content === undefined) continue;
	for (const [index, line] of lines(content).entries()) {
		for (const match of line.matchAll(/\b(rule|skill):\/\/(\w[\w-]*)/g)) {
			const target = match[1] === "rule" ? `.omp/rules/${match[2]}.md` : `.omp/skills/${match[2]}/SKILL.md`;
			reference(file, target, match[0], index + 1);
		}
	}
}
// Markdown links belong to Markdown documents, not evidence logs, diagrams, or other assets.
for (const file of ["AGENTS.md", "CLAUDE.md", ...files("references", "docs").filter(file => file.endsWith(".md"))]) {
	const content = text("references", file);
	if (content === undefined) continue;
	for (const [index, line] of lines(content).entries()) {
		for (const match of line.matchAll(/!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g)) {
			const destination = match[1] ?? match[2]!;
			if (/^(?:[a-z][\w+.-]*:|\/|#)/i.test(destination)) continue;
			try {
				const relative = decodeURIComponent(destination.split(/[?#]/, 1)[0]!);
				if (relative) reference(file, path.join(path.dirname(file), relative), destination, index + 1, true);
			} catch {
				finding("FAIL", "references", file, `line ${index + 1}: invalid link ${destination}`);
			}
		}
	}
}

// This lexical guard requires a read step on an earlier line, including for plain prose steps.
const mutation = /\b(?:edit(?:s|ed|ing)?|updat(?:e|es|ed|ing)|promot(?:e|es|ed|ing)|mov(?:e|es|ed|ing)|writ(?:e|es|ing)|append(?:s|ed|ing)?|archiv(?:e|es|ed|ing)|sync(?:s|ed|ing)?)\b/i;
const governed = /\b(?:gaps?|ledgers?|pitfalls?|archives?)\b|\bG-(?:x|\d+)\b/i;
for (const port of [".omp", ".claude"] as const) {
	for (const file of skillFiles(port)) {
		const content = text("read-before-mutate", file);
		if (content === undefined) continue;
		const rows = lines(body(content));
		const first = rows.findIndex(line => mutation.test(line) && governed.test(line));
		if (first < 0) continue;
		const pointer = port === ".omp" ? "rule://records" : "docs/process/records.md";
		if (!rows.slice(0, first).some(line => /\bread\b/i.test(line) && line.includes(pointer))) {
			const offset = lines(content).length - rows.length;
			finding("FAIL", "read-before-mutate", file, `line ${first + offset + 1}: governed mutation precedes a read ${pointer} step`);
		}
	}
}

const ompGuard = text("guard-config", ".omp/hooks/pre/guard-main.ts");
const sharedGuard = text("guard-config", "tools/guard-main.ts");
if (ompGuard !== undefined && sharedGuard !== undefined) {
	const ompConfig = /^const CONFIG_PATH = "([^"]+)";$/m.exec(ompGuard)?.[1];
	const sharedConfig = /^const CONFIG_PATH = "([^"]+)";$/m.exec(sharedGuard)?.[1];
	if (ompConfig !== configPath || sharedConfig !== configPath) {
		finding("FAIL", "guard-config", configPath, "an installed commit guard does not read the configured default branch");
	}
}

const canonicalPhrases = ["targeted tests", `never commit on ${defaultBranch.toLowerCase()}`, "max 2 revise", "disjoint", "never preload", "read a file before editing"];
const homes = new Map(canonicalPhrases.map(phrase => [phrase, new Set<string>()]));
for (const file of ["AGENTS.md", "CLAUDE.md", ...processFiles, ...skillFiles(".omp"), ...agentFiles(".omp")]) {
	const content = text("single-home", file);
	if (content === undefined) continue;
	for (const line of lines(body(content))) {
		if (/rule:\/\/|docs\/process\//i.test(line)) continue;
		for (const phrase of canonicalPhrases) if (line.toLowerCase().includes(phrase)) homes.get(phrase)!.add(file);
	}
}
for (const [phrase, sources] of homes) {
	if (sources.size > 1) finding("WARN", "single-home", ".", `${JSON.stringify(phrase)} appears in ${[...sources].sort().join(", ")}`);
}

// Recorded port idioms; keep replacements narrow so substantive instructions still compare.
const portIdioms: [RegExp, string][] = [
	[/\bvia `task`/g, "via Claude Code subagent dispatch"],
	[/\bsend an irc DM\b/g, "send a follow-up message"],
	[/\birc DMs\b/g, "follow-up messages"],
	[/`claude-reviewer` and `gpt-reviewer`/g, "`reviewer`"],
	[/\bin parallel with identical inputs\b/g, "with these inputs"],
];
function normalized(content: string): string[] {
	let shared = body(content).trim();
	shared = shared.replace(/rule:\/\/(\w[\w-]*)/g, "docs/process/$1.md");
	for (const [pattern, replacement] of portIdioms) shared = shared.replace(pattern, replacement);
	return shared.trim().split("\n");
}
function comparePair(omp: string, claude: string): void {
	const left = text("port-parity", omp);
	const right = text("port-parity", claude);
	if (left === undefined || right === undefined) return;
	const a = normalized(left);
	const b = normalized(right);
	const differences: number[] = [];
	for (let i = 0; i < Math.max(a.length, b.length) && differences.length < 3; i++) {
		if (a[i] !== b[i]) differences.push(i + 1);
	}
	if (differences.length) finding("FAIL", "port-parity", omp, `differs from ${claude} at normalized body lines ${differences.join(", ")}`);
}
for (const [omp, claude] of installedAgentPairs) comparePair(`.omp/agents/${omp}.md`, `.claude/agents/${claude}.md`);
for (const name of skillNames) comparePair(`.omp/skills/${name}/SKILL.md`, `.claude/skills/${name}/SKILL.md`);
const core = text("port-parity", "docs/process/mosaic-core.md");
const coreTwin = text("port-parity", ".claude/rules/mosaic-core.md");
if (core !== undefined && coreTwin !== undefined && body(core) !== body(coreTwin)) {
	finding("FAIL", "port-parity", ".claude/rules/mosaic-core.md", "body differs from docs/process/mosaic-core.md");
}

for (const file of ompRules) {
	try {
		fs.realpathSync(path.join(root, file));
	} catch {
		finding("FAIL", "symlinks", file, "rule target does not resolve");
	}
}
for (const file of processFiles) {
	if (file.endsWith("/model-notes.md")) continue;
	if (text("symlinks", file) === undefined) continue;
	const link = `.omp/rules/${path.basename(file)}`;
	let stat: fs.Stats;
	try {
		stat = fs.lstatSync(path.join(root, link));
	} catch (error) {
		finding("CANNOT-EVALUATE", "symlinks", link, `missing: ${String(error)}`);
		continue;
	}
	try {
		const abs = path.join(root, link);
		if (!stat.isSymbolicLink()) {
			finding("FAIL", "symlinks", link, `must be a symlink to ${file}`);
		} else if (fs.realpathSync(abs) !== fs.realpathSync(path.join(root, file))) {
			finding("FAIL", "symlinks", link, `does not point to ${file}`);
		}
	} catch (error) {
		finding("FAIL", "symlinks", link, `rule target does not resolve: ${String(error)}`);
	}
}

function frontmatter(content: string): string {
	return /^---\n((?:[\s\S]*?\n)?)---(?:\n|$)/.exec(content)?.[1] ?? "";
}
function compareGlobs(expected: Set<string>, actual: Set<string>, file: string): void {
	const missing = [...expected].filter(glob => !actual.has(glob));
	const extra = [...actual].filter(glob => !expected.has(glob));
	if (missing.length || extra.length) finding("FAIL", "governed-guard", file, `missing [${missing.join(", ")}]; extra [${extra.join(", ")}]`);
}
const guard = text("governed-guard", "docs/process/records-guard.md");
const guardTwin = text("governed-guard", ".claude/rules/records-guard.md");
const guardHook = text("governed-guard", ".claude/hooks/records-guard.sh");
if (guard !== undefined && guardTwin !== undefined && guardHook !== undefined) {
	const scope = /^scope:\s*(.*)$/m.exec(frontmatter(guard))?.[1] ?? "";
	const expected = new Set([...scope.matchAll(/tool:(?:edit|write)\(([^)]+)\)/g)].map(match => match[1]!));
	if (expected.size === 0) finding("FAIL", "governed-guard", "docs/process/records-guard.md", "scope contains no edit/write globs");
	const paths = /(?:^|\n)paths:[ \t]*(\[[^\n]*\]|(?:\n[ \t]+-[^\n]*)*)/.exec(frontmatter(guardTwin))?.[1] ?? "";
	const listed = paths.startsWith("[") ? paths.slice(1, -1).split(",") : paths.split("\n").map(line => line.replace(/^\s*-\s*/, ""));
	const twinGlobs = new Set(listed.map(glob => glob.trim().replace(/^(["'])(.*)\1$/, "$2")).filter(Boolean));
	const hookList = /^governed_globs=\([ \t]*\n([\s\S]*?)^\)/m.exec(guardHook)?.[1] ?? "";
	const hookGlobs = new Set([...hookList.matchAll(/["']([^"'\n]+)["']/g)].map(match => match[1]!));
	compareGlobs(expected, twinGlobs, ".claude/rules/records-guard.md");
	compareGlobs(expected, hookGlobs, ".claude/hooks/records-guard.sh");
}
// Placeholder ownership is the installed harness's text surface, not the project tree.
// Exclude project sources (JSX), workflows, Makefiles, fonts/images, and nested checkouts.
const placeholderFiles = new Set([
	"AGENTS.md", "CLAUDE.md", "docs/index.md", "docs/gaps.md", "docs/gaps-archive.md",
	"docs/architecture/README.md", "docs/architecture/pitfalls.md", "docs/architecture/pitfalls-archive.md", "docs/architecture/decisions-archive.md", "docs/architecture/open-questions.md", "docs/kit/maintenance.md",
	"docs/plans/README.md", "docs/plans/TEMPLATE.md", "docs/product/README.md",
	...harnessFiles, ...processFiles,
	...(trackingMode === "local" ? files("placeholders", "docs/tracker", false).filter(file => file.endsWith(".json")) : []),
	...files("placeholders", "tools").filter(file => file.endsWith(".ts")),
]);
for (const file of placeholderFiles) {
	const content = text("placeholders", file);
	if (content?.includes("\u007b\u007b")) finding("FAIL", "placeholders", file, "unrendered template placeholder");
}
finish();
