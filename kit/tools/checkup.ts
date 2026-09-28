#!/usr/bin/env bun
// Run from the link root. Exit 0: PASS; 1: findings; 2: incomplete evaluation.
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { realpathWithinRoot } from "./root-containment.ts";

const classes = ["lint", "doctor", "dangling-reference", "stale-plan-link", "stale-trigger", "orphan-plan"] as const;
type CheckClass = typeof classes[number];
type Finding = { class: CheckClass; path: string; line: number; detail: string; fix: "mechanical" | "route" | "human" };
const findings: Finding[] = [];
const cannotEvaluate: { class: CheckClass; path: string; detail: string }[] = [];
function unavailable(kind: CheckClass, file: string, detail: string): void {
	if (!cannotEvaluate.some(item => item.class === kind && item.path === file && item.detail === detail)) {
		cannotEvaluate.push({ class: kind, path: file, detail });
	}
}
const args = process.argv.slice(2);
const json = args.includes("--json");
function finish(): never {
	const order = (a: { class: CheckClass; path: string }, b: { class: CheckClass; path: string }) =>
		classes.indexOf(a.class) - classes.indexOf(b.class) || a.path.localeCompare(b.path);
	findings.sort((a, b) => order(a, b) || a.line - b.line || a.detail.localeCompare(b.detail));
	cannotEvaluate.sort((a, b) => order(a, b) || a.detail.localeCompare(b.detail));
	const outcome = cannotEvaluate.length ? "CANNOT-EVALUATE" : findings.length ? "FAIL" : "PASS";
	if (json) console.log(JSON.stringify({ findings, cannotEvaluate }, null, 2));
	else {
		console.log("CLASS | LOCATION | FIX | DETAIL");
		for (const item of findings) console.log(`${item.class} | ${item.path}:${item.line} | ${item.fix} | ${item.detail.replace(/\s*\n\s*/g, " ")}`);
		for (const item of cannotEvaluate) console.log(`${item.class} | ${item.path} | CANNOT-EVALUATE | ${item.detail.replace(/\s*\n\s*/g, " ")}`);
		console.log(`checkup: ${outcome} — ${findings.length} findings, ${cannotEvaluate.length} cannot-evaluate`);
	}
	process.exit(cannotEvaluate.length ? 2 : findings.length ? 1 : 0);
}
let rootArg: string | undefined;
let sawJson = false;
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--json" && !sawJson) sawJson = true;
	else if (args[i] === "--root" && rootArg === undefined && args[i + 1] && !args[i + 1]!.startsWith("--")) rootArg = args[++i];
	else {
		for (const kind of classes) unavailable(kind, ".", "usage: bun tools/checkup.ts [--root dir] [--json]");
		finish();
	}
}
const root = path.resolve(rootArg ?? process.cwd());
const documentClasses = ["dangling-reference", "stale-plan-link", "stale-trigger", "orphan-plan"] as const;
const cutoffArchive = (file: string) => /(?:^|\/)docs\/archived(?:\/|$)/.test(file);
const docs = new Map<string, string>();
function read(file: string, kinds: readonly CheckClass[]): string | undefined {
	if (docs.has(file)) return docs.get(file)!;
	try {
		const content = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
		docs.set(file, content);
		return content;
	} catch (error) {
		for (const kind of kinds) unavailable(kind, file, `cannot read: ${String(error)}`);
		return undefined;
	}
}
function collect(dir: string): void {
	let entries: fs.Dirent[];
	try { entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true }); }
	catch (error) {
		for (const kind of ["lint", ...documentClasses] as const) unavailable(kind, dir, `cannot enumerate documents: ${String(error)}`);
		return;
	}
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const file = `${dir}/${entry.name}`;
		// Cutoff history is never an input to active registries or drift findings.
		if (cutoffArchive(file) || (file === "docs/tracker" && trackingMode !== "local")) continue;
		if (entry.isDirectory()) collect(file);
		else if (entry.isFile() || entry.isSymbolicLink()) read(file, ["lint", ...documentClasses]);
	}
}
let children: fs.Dirent[];
try { children = fs.readdirSync(root, { withFileTypes: true }); }
catch (error) {
	for (const kind of classes) unavailable(kind, ".", `cannot enumerate root: ${String(error)}`);
	finish();
}
// Components in a monorepo share the root's docs and ledger; they are not member repositories.
let monorepo = false;
let trackingMode = "none";
const configPath = ".omp/mosaic.json";
if (fs.existsSync(path.join(root, configPath))) {
	try {
		const config = JSON.parse(read(configPath, ["doctor"]) ?? "{}");
		monorepo = config.topology === "monorepo";
		trackingMode = config.tracking?.mode ?? "none";
	}
	catch (error) { unavailable("doctor", configPath, `cannot read installation metadata: ${String(error)}`); }
}
const members = monorepo ? [] : children.filter(entry => !entry.name.startsWith(".") && (entry.isDirectory() || entry.isSymbolicLink())
	&& (fs.existsSync(path.join(root, entry.name, ".git")) || fs.existsSync(path.join(root, entry.name, "docs"))))
	.map(entry => entry.name).sort();
if (!monorepo && !members.length) {
	for (const kind of ["lint", ...documentClasses] as const) unavailable(kind, ".", "no member repos found (expected a child repo with .git or docs)");
}
const repos = ["", ...members];
for (const repo of repos) collect(repo ? `${repo}/docs` : "docs");
const planArchive = (file: string) => /(?:^|\/)docs\/plans\/archived\//.test(file);
const frozen = (file: string) => planArchive(file) || /(?:^|\/)docs\/(?:gaps-archive\.md$|architecture\/archived\/)/.test(file);

function run(script: string, args: string[], kind: CheckClass): SpawnSyncReturns<string> | undefined {
	if (!fs.existsSync(path.join(root, script))) {
		unavailable(kind, script, "missing check command");
		return undefined;
	}
	const result = spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: "utf8" });
	if (result.error || result.status === null) {
		unavailable(kind, script, `could not run: ${String(result.error ?? result.signal)}`);
		return undefined;
	}
	return result;
}
const registries = new Set(["docs/gaps.md", "docs/gaps-archive.md", "docs/architecture/pitfalls.md", "docs/architecture/README.md", "docs/plans/README.md",
	...members.map(repo => `${repo}/docs/plans/README.md`)]);
for (const file of docs.keys()) {
	if (/(?:^|\/)docs\/(?:gaps(?:-archive)?\.md|gaps\/.*\.md|architecture\/(?:pitfalls|README)\.md)$/.test(file)
		|| (/(?:^|\/)docs\/plans\/(?:[^/]+\/)*\d{4}-[^/]+\.md$/.test(file) && !planArchive(file) && !file.endsWith("-wire.md"))) registries.add(file);
}
for (const file of [...registries].sort()) {
	if (read(file, ["lint"]) === undefined) continue;
	const result = run("tools/lint-ledgers.ts", [file], "lint");
	if (!result || result.status === 0) continue;
	const detail = `exit ${result.status}: ${String(result.stdout).trim()} ${String(result.stderr).trim()}`.trim();
	if (result.status === 1) findings.push({ class: "lint", path: file, line: 1, detail, fix: "human" });
	else unavailable("lint", file, detail);
}

function activeCitations(file: string, prose: string): string {
	return prose.replace(/!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g, (link, angle, plain) => {
		const destination: string = angle ?? plain;
		if (/^(?:[a-z][\w+.-]*:|#|\/\/)/i.test(destination)) return link;
		try {
			const decoded = decodeURIComponent(destination.split(/[?#]/, 1)[0]!);
			const target = path.relative(root, decoded.startsWith("/") ? path.join(root, decoded) : path.resolve(root, path.dirname(file), decoded));
			return cutoffArchive(target) ? link.replace(/[^\n]/g, " ") : link;
		} catch { return link; } // Doctor reports malformed active links.
	});
}
// Code examples and namespace ranges are not citations; retain physical line numbers.
const markdown = new Map<string, string[]>();
const frontmatterEnds = new Map<string, number>();
for (const [file, content] of docs) {
	if (!file.endsWith(".md")) continue;
	const lines = content.split("\n");
	let fence: string | undefined;
	for (let index = 0; index < lines.length; index++) {
		const marker = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(lines[index]!);
		if (fence) {
			lines[index] = "";
			if (marker && marker[1]![0] === fence[0] && marker[1]!.length >= fence.length && !marker[2]!.trim()) fence = undefined;
		} else if (marker && (marker[1]![0] !== "`" || !marker[2]!.includes("`"))) {
			fence = marker[1];
			lines[index] = "";
		}
	}
	const prose = activeCitations(file, lines.join("\n").replace(/(?<![\\`])(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, span => span.replace(/[^\n]/g, " ")));
	markdown.set(file, prose.split("\n").map(line => line.replace(/\b(?:D(?:\d+|n)|[GP]-(?:\d+|n)|0\d{3})[ \t]*\.\.[ \t]*(?:D(?:\d+|n)|[GP]-(?:\d+|n)|0\d{3})\b/g, "")));
	if (lines[0] === "---") frontmatterEnds.set(file, lines.indexOf("---", 1));
}

const definitions = new Map<string, Set<string>>();
// A project may use ADRs or local D-labels instead. Enable the D namespace only when indexed.
const decisionIndex = markdown.get("docs/architecture/README.md") ?? [];
if (decisionIndex.some(line => /^\| *(D\d+) *\|/.test(line))) {
	const architecture = [...docs.keys()].filter(file => /^docs\/architecture\/[^/]+\.md$/.test(file));
	const decisions = new Set<string>();
	for (const file of architecture) {
		for (const line of markdown.get(file)!) {
			const heading = /^#{1,6}\s+(?:\*\*)?(D\d+)\b/.exec(line);
			if (heading) decisions.add(heading[1]!);
			for (const anchor of line.matchAll(/\b(?:id|name)\s*=\s*["'](D\d+)["']|\{#(D\d+)\}/gi)) decisions.add((anchor[1] ?? anchor[2]!).toUpperCase());
		}
	}
	definitions.set("D", decisions);
}
for (const [prefix, files] of [["G-", ["docs/gaps.md", "docs/gaps-archive.md"]], ["P-", ["docs/architecture/pitfalls.md"]], ["0", ["docs/plans/README.md"]]] as const) {
	const ids = new Set<string>();
	let complete = true;
	for (const file of files) {
		const content = read(file, ["dangling-reference"]);
		if (content === undefined) { complete = false; continue; }
		const pattern = prefix === "0" ? /^\|\s*\[?(0\d{3})\]?(?=\s*\||\()/gm
			: new RegExp(`^(?:- \\*\\*|#{1,6}\\s+)(?:\\*\\*)?(${prefix}\\d+)\\b`, "gm");
		for (const match of markdown.get(file)!.join("\n").matchAll(pattern)) ids.add(match[1]!);
	}
	if (complete) definitions.set(prefix, ids);
}
function planCitations(file: string, line: string, index: number): string[] {
	const inPlans = /(?:^|\/)docs\/plans\//.test(file);
	// ADR cues win for the entire line. A plan path's slug is not an ADR cue.
	const withoutPlanPaths = line.replace(/(?:\bdocs\/plans\/|(?:\.\.?\/)+plans\/)[^\s)]+/g, "");
	if (/(?:^|\/)docs\/adr\//.test(file) || /\bADR\b|\badr\//i.test(line)
		|| (!inPlans && /\b\d{4}-[A-Za-z][\w-]*/.test(withoutPlanPaths))) return [];
	const ids = [...line.matchAll(/\bplan\s+(0\d{3})\b|\bdocs\/plans\/(0\d{3})-/gi)].map(match => match[1] ?? match[2]!);
	const ledger = /(?:^|\/)docs\/plans\/README\.md$/.test(file) ? /^\|\s*\[?(0\d{3})\]?(?=\s*\||\()/.exec(line) : null;
	const header = inPlans && index > 0 && index < (frontmatterEnds.get(file) ?? -1)
		? /^plan:\s*["']?(0\d{3})["']?\s*(?:#.*)?$/.exec(line) : null;
	if (ledger) ids.push(ledger[1]!);
	if (header) ids.push(header[1]!);
	return ids;
}
for (const [file, lines] of markdown) {
	if (planArchive(file)) continue;
	for (const [index, line] of lines.entries()) {
		for (const id of new Set([...(line.match(/\b(?:D\d+|G-\d+|P-\d+)\b/g) ?? []), ...planCitations(file, line, index)])) {
			if (id.startsWith("D") && !/(?:^|\/)docs\/(?:architecture\/|plans\/|gaps[^/]*\.md$|product\/|process\/)/.test(file)) continue;
			const prefix = id.startsWith("D") ? "D" : id.startsWith("G-") ? "G-" : id.startsWith("P-") ? "P-" : "0";
			const known = definitions.get(prefix);
			if (known && !known.has(id)) findings.push({ class: "dangling-reference", path: file, line: index + 1,
				detail: `${id} has no ${prefix === "D" ? "architecture heading/anchor" : prefix === "G-" ? "active or archived gap entry" : prefix === "P-" ? "pitfall entry" : "master-ledger row"}`, fix: "human" });
		}
	}
}

const archived = new Map<string, string[]>();
for (const file of docs.keys()) {
	const match = /^(.*docs\/plans)\/archived\/(?:[^/]+\/)*(0\d{3})-[^/]+\.md$/.exec(file);
	if (!match) continue;
	const key = `${match[1]}/${match[2]}`;
	const paths = archived.get(key) ?? [];
	paths.push(file);
	archived.set(key, paths);
}
function links(line: string): string[] {
	const destinations = [...line.matchAll(/!?\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g)].map(match => match[1] ?? match[2]!);
	const definition = /^\s{0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|(\S+))/.exec(line);
	if (definition) destinations.push(definition[1] ?? definition[2]!);
	return destinations;
}
const staleLocations = new Map<string, Finding>();
for (const [file, lines] of markdown) {
	if (frozen(file)) continue;
	for (const [index, line] of lines.entries()) {
		for (const destination of new Set(links(line))) {
			if (/^(?:[a-z][\w+.-]*:|#|\/\/)/i.test(destination)) continue;
			let target: string;
			try {
				const decoded = decodeURIComponent(destination.split(/[?#]/, 1)[0]!);
				target = path.relative(root, decoded.startsWith("/") ? path.join(root, decoded) : path.resolve(root, path.dirname(file), decoded));
			} catch (error) { unavailable("stale-plan-link", file, `line ${index + 1}: invalid link ${destination}: ${String(error)}`); continue; }
			const match = /^(.*docs\/plans)\/(0\d{3})-[^/]+\.md$/.exec(target);
			if (!match) continue;
			const alternatives = archived.get(`${match[1]}/${match[2]}`);
			if (!alternatives) continue;
			// One archived candidate is a mechanical repoint; several candidates need a human to name the target.
			const item: Finding = { class: "stale-plan-link", path: file, line: index + 1,
				detail: `${destination} cites archived plan ${match[2]}; archived path: ${alternatives.join(", ")}${alternatives.length > 1 ? " (ambiguous: several archived files match)" : ""}`,
				fix: alternatives.length > 1 ? "human" : "mechanical" };
			findings.push(item);
			staleLocations.set(`${file}:${index + 1}:${target}`, item);
		}
	}
}
// Doctor's unresolved-path diagnostic is retained on the same stale-link finding, not counted twice.
const doctor = run("tools/doctor.ts", [], "doctor");
if (doctor) {
	const output = `${String(doctor.stdout)}\n${String(doctor.stderr)}`;
	let diagnosed = false;
	for (const line of output.split(/\r?\n/)) {
		const match = /^(FAIL|CANNOT-EVALUATE) (\S+) (.+?): (.*)$/.exec(line);
		if (!match) continue;
		diagnosed = true;
		const file = match[3]!;
		if (match[1] === "CANNOT-EVALUATE") { unavailable("doctor", file, line); continue; }
		const sourceLine = Number(/^line (\d+):/.exec(match[4]!)?.[1] ?? 1);
		const target = match[2] === "references" ? /: unresolved .*? \(([^)]+)\)(?: \(outside repository\))?$/.exec(match[4]!)?.[1] : undefined;
		const stale = target ? staleLocations.get(`${file}:${sourceLine}:${path.normalize(target)}`) : undefined;
		if (stale) stale.detail += `; ${line}`;
		else findings.push({ class: "doctor", path: file, line: sourceLine, detail: line,
			fix: match[4]!.startsWith("/mosaic-kit:") ? "route" : "human" });
	}
	if (doctor.status !== 0 && !diagnosed) unavailable("doctor", "tools/doctor.ts", `exit ${doctor.status} without a diagnostic: ${output.trim()}`);
	if (doctor.status === 2 && !cannotEvaluate.some(item => item.class === "doctor")) unavailable("doctor", "tools/doctor.ts", `exit 2: ${output.trim()}`);
}

function matchesTarget(target: string): boolean {
	for (const repo of repos) {
		const cwd = path.join(root, repo);
		const candidate = path.resolve(cwd, target);
		if (fs.existsSync(candidate) && realpathWithinRoot(root, candidate) !== null) return true;
		for (const match of new Bun.Glob(target).scanSync({ cwd, onlyFiles: false, dot: true, followSymlinks: true })) {
			const candidate = path.resolve(cwd, match);
			if (fs.existsSync(candidate) && realpathWithinRoot(root, candidate) !== null) return true;
		}
	}
	return false;
}
for (const repo of repos) {
	const file = `${repo ? `${repo}/` : ""}docs/gaps.md`;
	const content = repo ? docs.get(file) : read(file, ["stale-trigger"]);
	if (content === undefined || (!monorepo && !members.length)) continue;
	const lines = content.split("\n");
	let id = "";
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index]!;
		if (/^#{1,6} |^- \*\*/.test(line)) id = /^- \*\*(G-\d+)\b/.exec(line)?.[1] ?? "";
		const trigger = /^[ \t]*(?:[-*][ \t]+)?(?:\*\*)?(?:Trigger[^*:\r\n]*|when):(?:\*\*)?[ \t]*(.*)$/i.exec(line);
		if (!id || !trigger) continue;
		const targets = new Set([...trigger[1]!.matchAll(/`([^`]+)`|([^\s`<>"()]*\/[^\s`<>"()]*)/g)]
			.map(match => (match[1] ?? match[2]!).replace(/[.,;:]+$/, "")).filter(target => target.includes("/") && !/^[a-z][\w+.-]*:\/\//i.test(target)));
		const missing: string[] = [];
		for (const target of targets) {
			try { if (!matchesTarget(target)) missing.push(target); }
			catch (error) { unavailable("stale-trigger", file, `${id}: cannot evaluate ${target}: ${String(error)}`); }
		}
		if (missing.length) findings.push({ class: "stale-trigger", path: file, line: index + 1,
			detail: `${id} Trigger matches nothing in the link or member repos: ${missing.join(", ")}; route to skill://mosaic-gap-audit scoped to ${id}`, fix: "route" });
	}
}
const referencedPlans = new Set<string>();
for (const [file, lines] of markdown) {
	if (/(?:^|\/)docs\/plans\//.test(file)) continue;
	for (const [index, line] of lines.entries()) for (const id of planCitations(file, line, index)) referencedPlans.add(id);
}
for (const [key, paths] of archived) {
	const id = path.basename(key);
	if (!referencedPlans.has(id)) for (const file of paths) findings.push({ class: "orphan-plan", path: file, line: 1,
		detail: `Archived plan ${id} has no reference in a document outside docs/plans; informational, human review only`, fix: "human" });
}
finish();
