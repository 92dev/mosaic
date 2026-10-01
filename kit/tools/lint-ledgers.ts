#!/usr/bin/env bun
// Port-neutral governed-record validation. CLI: 0 valid, 1 schema errors, 2 usage/unreadable.
import * as fs from "node:fs";
import * as path from "node:path";

const STATUS_ENUM = ["draft", "approved", "executing", "review", "done", "abandoned"] as const;
const STATUS_HINT = `expected one of: ${STATUS_ENUM.join("|")}`;
const REQUIRED_SECTIONS = [
	"## Context",
	"## Scope",
	"## Task breakdown",
	"## Review checklist",
	"## Verification",
	"## Planning log",
	"## Execution log",
] as const;

const GAP_ENTRY = /^- \*\*(G-\d+) ·/;
// Structure only: a trigger field starts its own line. Whether its condition is a legitimate
// self-firing trigger (versus first use, a report, a device becoming available) is a judgment
// for the author under rule://records and for /mosaic-gap-audit's REROUTE verdict, never a regex.
const TRIGGER_LINE = /^[ \t]*(?:[-*][ \t]+)?(?:\*\*)?(Trigger[^*:\r\n]*|when):(?:\*\*)?[ \t]*(.*)$/gim;
const ANY_ENTRY = /^- \*\*/;
const LEDGER_ROW = /^\| *\[?(\d{4})\]?/;
const STATUS_CELL = new RegExp(`\\| *(${STATUS_ENUM.join("|")}) *\\|`);

type Kind = "plan" | "ledger" | "gaps" | "gapBody" | "gapsArchive" | "pitfalls" | "decisionsArchive";

/** Classify governed paths by suffix. */
function classify(file: string): Kind | undefined {
	const norm = file.replace(/\\/g, "/");
	if (!norm.endsWith(".md")) return undefined;
	// Archived plans are frozen, terminal records — not schema-gated (they may predate the schema).
	if (norm.includes("/docs/plans/archived/") || norm.startsWith("docs/plans/archived/")) return undefined;

	const at = (suffix: string): boolean => norm === suffix || norm.endsWith(`/${suffix}`);
	if (at("docs/gaps.md")) return "gaps";
	if (at("docs/gaps-archive.md")) return "gapsArchive";
	if (norm.includes("/docs/gaps/") || norm.startsWith("docs/gaps/")) return "gapBody";
	// The link catalog and each member catalog (`<member>/docs/pitfalls.md`) share one id space; no archive exists.
	if (at("docs/architecture/pitfalls.md") || at("docs/pitfalls.md")) return "pitfalls";
	// The frozen legacy decision map (D-numbers, titles, files); the sections stay in the element docs.
	if (at("docs/architecture/decisions-archive.md")) return "decisionsArchive";
	if (at("docs/plans/README.md")) return "ledger";

	if (!norm.includes("/docs/plans/") && !norm.startsWith("docs/plans/")) return undefined;
	// Retained verification artifacts under docs/plans/evidence/ are evidence, not lifecycle documents.
	if (norm.includes("/docs/plans/evidence/") || norm.startsWith("docs/plans/evidence/")) return undefined;
	const base = norm.slice(norm.lastIndexOf("/") + 1);
	if (base === "TEMPLATE.md") return undefined;
	if (base.endsWith("-wire.md")) return undefined; // wire annexes are frozen contracts, not lifecycle docs
	return /^\d{4}-.+\.md$/.test(base) ? "plan" : undefined;
}

/** Read the first whitespace-separated frontmatter status value. */
function frontmatterStatus(content: string): string | undefined {
	let seen = 0;
	for (const raw of content.split("\n")) {
		const line = raw.replace(/\r$/, "");
		if (line === "---") {
			seen++;
			if (seen >= 2) break;
			continue;
		}
		if (seen === 1 && /^status:/.test(line)) {
			return line.split(/\s+/)[1] ?? "";
		}
	}
	return undefined;
}

/** Ids repeated across entry lines. Dynamic membership over runtime-discovered keys -> Set/Map. */
function duplicates(ids: readonly string[]): string[] {
	const seen = new Set<string>();
	const dup = new Set<string>();
	for (const id of ids) {
		if (seen.has(id)) dup.add(id);
		else seen.add(id);
	}
	return [...dup];
}

function idsMatching(content: string, re: RegExp): string[] {
	const out: string[] = [];
	for (const line of content.split("\n")) {
		const m = re.exec(line.replace(/\r$/, ""));
		if (m?.[1] !== undefined) out.push(m[1]);
	}
	return out;
}

function dupErrors(ids: readonly string[], label: string): string[] {
	return duplicates(ids).map(
		d => `duplicate ${label} id '${d}' — ids are never reused; two entries under one id silently hide one of them`,
	);
}

/** Split a registry into `- **G-n ·` (or, with `marker`, `- **P-n ·`) blocks. */
function gapEntries(content: string, active = false, marker: RegExp = GAP_ENTRY): { id: string; body: string; lines: number }[] {
	const out: { id: string; body: string; lines: number }[] = [];
	let id = "";
	let buf: string[] = [];
	const flush = (): void => {
		if (id !== "") {
			while (buf.length > 0 && buf[buf.length - 1]!.trim() === "") buf.pop();
			out.push({ id, body: buf.join("\n"), lines: buf.length });
		}
		id = "";
		buf = [];
	};
	for (const raw of content.split("\n")) {
		const line = raw.replace(/\r$/, "");
		const m = marker.exec(line);
		if (m?.[1] !== undefined) {
			flush();
			id = m[1];
			buf = [line];
			continue;
		}
		if (ANY_ENTRY.test(line) || (active && /^#{1,6}(?:[ \t]|$)/.test(line))) {
			flush();
			continue;
		}
		if (id !== "") buf.push(line);
	}
	flush();
	return out;
}

function triggerErrors(id: string, body: string): string[] {
	for (const match of body.matchAll(TRIGGER_LINE)) {
		if (match[2]!.trim() !== "") return [];
	}
	return [`${id} has no Trigger:/when: line naming its condition — a gap is a conditional obligation; put the condition on its own line (rule://records)`];
}

/** A split dossier is the whole body of one gap: its trigger line may sit anywhere in the file, not only inside a quoted registry row. */
function validateGapBody(content: string, abs: string): string[] {
	const id = /^#+\s+(?:\*\*)?(G-\d+)\b/m.exec(content)?.[1]
		?? /\b(G-\d+)\b/.exec(path.basename(abs))?.[1]
		?? idsMatching(content, GAP_ENTRY)[0];
	if (!id) return [];
	// The dossier of an archived gap is frozen history (rule://records), not an active obligation to shape-check.
	let archive = "";
	try {
		archive = fs.readFileSync(path.join(path.dirname(abs), "..", "gaps-archive.md"), "utf8");
	} catch {
		// fail-open: archive absent
	}
	if (idsMatching(archive, GAP_ENTRY).includes(id)) return [];
	return triggerErrors(id, content);
}

function planSection(content: string, heading: string): string {
	return new RegExp(`^## ${heading}[ \\t]*\\r?\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m").exec(content)?.[1] ?? "";
}

function reviewLogErrors(log: string): string[] {
	const errors: string[] = [];
	const laterFindings = new Map<string, number>();
	const lines = log.split(/\r?\n/);
	// Scan backwards so findings before their verdict never discharge it.
	for (let index = lines.length - 1; index >= 0; index--) {
		const line = lines[index]!;
		const finding = /^- (\S+) R(\d+) ([A-Za-z][\w.-]*): [SP] — (\S(?:.*\S)?) → (?:fixed|rejected: \S.*|deferred: \S.*)$/.exec(line);
		if (finding && finding[4]!.split(/\s+/).length <= 15) {
			const key = `${finding[1]} R${finding[2]} ${finding[3]}`;
			laterFindings.set(key, (laterFindings.get(key) ?? 0) + 1);
		}
		if (!/\bREVISE \(\d+ findings\)/.test(line)) continue;
		const verdict = /^- (\S+) R(\d+) ([A-Za-z][\w.-]*): REVISE \((\d+) findings\)$/.exec(line);
		if (!verdict) {
			const round = /\bR\d+\b/.exec(line)?.[0] ?? "unknown round";
			errors.push(`${round}: malformed REVISE verdict — use one task/round/reviewer per line, never merged reviewer names; see review-loop`);
			continue;
		}
		const key = `${verdict[1]} R${verdict[2]} ${verdict[3]}`;
		const found = laterFindings.get(key) ?? 0;
		if (found !== Number(verdict[4])) {
			errors.push(`${key}: REVISE (${verdict[4]} findings) requires exactly ${verdict[4]} attributed finding lines later in the Execution log; found ${found} in review-loop format`);
		}
	}
	return errors.reverse();
}

function validatePlan(content: string): string[] {
	const errors: string[] = [];
	const status = frontmatterStatus(content);
	if (status === undefined || status === "") {
		errors.push(`missing frontmatter 'status:' (${STATUS_HINT})`);
	} else if (!STATUS_ENUM.some(s => s === status)) {
		errors.push(`invalid status '${status}' (${STATUS_HINT})`);
	}
	// Required headings must occupy whole lines, not merely appear in prose or longer names.
	for (const h of REQUIRED_SECTIONS) {
		if (!new RegExp(`^${h}\\s*$`, "m").test(content)) errors.push(`missing required section: '${h}'`);
	}
	// Existing plans retain the old section; new plans use Unverified.
	if (!/^### Unverified\s*$/m.test(content) && !/^### Verification gaps\s*$/m.test(content)) {
		errors.push("missing required section: '### Unverified' (or legacy '### Verification gaps')");
	}
	let task = "Task breakdown";
	for (const line of planSection(content, "Task breakdown").split(/\r?\n/)) {
		const heading = /^### (.+)/.exec(line);
		if (heading) task = heading[1]!;
		const field = /^[ \t]*- class:[ \t]*(.*)$/.exec(line);
		if (field && !/^(?:docs|code)(?:[ \t]+#.*)?$/.test(field[1]!.trim())) {
			errors.push(`${task}: invalid class '${field[1]!.trim()}' (expected docs|code; omitted defaults to code)`);
		}
	}
	if (status === "review" || status === "done") errors.push(...reviewLogErrors(planSection(content, "Execution log")));
	return errors;
}

function validateLedger(content: string): string[] {
	const errors = duplicates(idsMatching(content, LEDGER_ROW)).map(
		d =>
			`duplicate plan number '${d}' — one row per plan; a second row makes the ledger ambiguous about status and landed commit`,
	);
	for (const raw of content.split("\n")) {
		const line = raw.replace(/\r$/, "");
		const m = LEDGER_ROW.exec(line);
		if (m?.[1] === undefined) continue;
		if (!STATUS_CELL.test(line)) {
			errors.push(`ledger row '${m[1]}' has no recognizable status cell (${STATUS_HINT})`);
		}
	}
	return errors;
}

function validateGaps(content: string, archive: boolean): string[] {
	const errors = dupErrors(idsMatching(content, GAP_ENTRY), "gap");
	for (const { id, body, lines } of gapEntries(content, !archive)) {
		if (archive) {
			// Closure is written several ways and all are legitimate: `closed by NNNN (<hash>)`,
			// `**CLOSED by 0054 T6**`, `**Overtaken by ...**`, `**Status:** archived as overtaken`.
			// Case-fold and accept the family; the fence is that SOMETHING says what discharged it.
			const up = body.toUpperCase();
			if (!/CLOSED BY/.test(up) && !/OVERTAKEN BY/.test(up) && !/\*\*STATUS:\*\* *(CLOSED|ARCHIVED)/.test(up)) {
				errors.push(
					`${id} records no evidence of what closed it — an archived gap documents that the check happened and what discharged it (closed by NNNN (<hash>))`,
				);
			}
			continue;
		}
		if (lines > 4) errors.push(`${id}: entry has ${lines} lines; at most four (rule://records)`);
		// A closed entry must not remain in the active registry, which sessions read as open work.
		if (/\*\*Status:\*\* *closed/.test(body)) {
			errors.push(
				`${id} is **Status:** closed but still in the ACTIVE registry — move it to gaps-archive.md (never renumber, never delete)`,
			);
			continue;
		}
		const missing: string[] = [];
		// Qualified Trigger fields and plain/bold when fields share the same structural check.
		errors.push(...triggerErrors(id, body));
		if (!/\*\*Status:\*\*/.test(body)) missing.push("**Status:**");
		// SPLIT rows (`/mosaic-gap-audit` step 3) hold only id + summary + trigger + link here; the full
		// body — including provenance — lives in docs/gaps/G-<n>-<slug>.md. Requiring provenance on
		// the row would punish entries for being correctly split.
		if (!/\*\*Detail:\*\*/.test(body) && !/\*\*(From|Provenance)[^*]*:\*\*/.test(body)) {
			missing.push("**From:** (or **Provenance:**, or a **Detail:** pointer to a split dossier)");
		}
		if (missing.length > 0) {
			errors.push(
				`${id} is missing: ${missing.join(" ")} — every gap is a conditional obligation, so it needs a trigger, a provenance and a status`,
			);
		}
	}
	return errors;
}

/** An id must live in exactly one of an active registry and its archive (gaps.md / gaps-archive.md). */
function crossFileErrors(abs: string, content: string, archive: boolean, marker: RegExp = GAP_ENTRY, label = "gap", pair: readonly [string, string] = ["gaps.md", "gaps-archive.md"]): string[] {
	const counterpart = path.join(path.dirname(abs), archive ? pair[0] : pair[1]);
	let other: string;
	try {
		other = fs.readFileSync(counterpart, "utf8");
	} catch {
		return []; // fail-open: counterpart absent
	}
	const theirs = new Set(idsMatching(other, marker));
	const where = archive ? "the active registry" : "the archive";
	const out: string[] = [];
	for (const id of new Set(idsMatching(content, marker))) {
		if (theirs.has(id)) {
			out.push(`${label} '${id}' is present here AND in ${where} — a ${label} is either active or archived, never both`);
		}
	}
	return out;
}

const PITFALL_ENTRY = /^- \*\*(P-\d+) ·/;

/** The project root is the nearest ancestor holding `.omp/mosaic.json`; undefined outside an installed project. */
function projectRoot(abs: string): string | undefined {
	let dir = path.dirname(abs);
	for (;;) {
		if (fs.existsSync(path.join(dir, ".omp", "mosaic.json"))) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) return undefined;
		dir = parent;
	}
}

/** Every pitfall catalog of the project: the link's `docs/architecture/pitfalls.md` and each member's `docs/pitfalls.md`. */
function pitfallCatalogs(root: string): string[] {
	const out = [path.join(root, "docs", "architecture", "pitfalls.md")];
	let children: fs.Dirent[] = [];
	try { children = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
	for (const child of children) {
		if (child.name.startsWith(".") || !(child.isDirectory() || child.isSymbolicLink())) continue;
		const catalog = path.join(root, child.name, "docs", "pitfalls.md");
		if (fs.existsSync(catalog)) out.push(catalog);
	}
	return out;
}

/** P-numbers are handles unique across every catalog of the project (rule://records); a removed entry has no archive. */
function validatePitfalls(abs: string, content: string): string[] {
	const errors = dupErrors(idsMatching(content, PITFALL_ENTRY), "pitfall");
	const root = projectRoot(abs);
	if (root === undefined) return errors; // fail-open: not inside an installed project
	const mine = new Set(idsMatching(content, PITFALL_ENTRY));
	for (const other of pitfallCatalogs(root)) {
		if (path.resolve(other) === path.resolve(abs)) continue;
		let text: string;
		try { text = fs.readFileSync(other, "utf8"); } catch { continue; }
		for (const id of new Set(idsMatching(text, PITFALL_ENTRY))) {
			if (mine.has(id)) errors.push(`pitfall '${id}' is also catalogued in ${path.relative(root, other)} — numbers are unique across every catalog; an entry lives in the one repo that owns its subject`);
		}
	}
	return errors;
}

const DECISION_ROW = /^\| *(D\d+) *\|/;

/** The legacy map lists a D# at most once (its map and retired tables together). */
function validateDecisions(content: string): string[] {
	return dupErrors(idsMatching(content, DECISION_ROW), "decision");
}

function subjectFor(kind: Kind, base: string): string {
	switch (kind) {
		case "plan":
			return `Plan doc '${base}'`;
		case "ledger":
			return `Plans ledger '${base}'`;
		case "gaps":
			return `Gaps registry '${base}'`;
		case "gapBody":
			return `Split gap '${base}'`;
		case "gapsArchive":
			return `Gaps archive '${base}'`;
		case "pitfalls":
			return `Pitfalls catalog '${base}'`;
		case "decisionsArchive":
			return `Legacy decision map '${base}'`;
	}
}

function validate(kind: Kind, abs: string, content: string): string[] {
	switch (kind) {
		case "plan":
			return validatePlan(content);
		case "ledger":
			return validateLedger(content);
		case "gaps":
			return [...validateGaps(content, false), ...crossFileErrors(abs, content, false)];
		case "gapBody":
			return validateGapBody(content, abs);
		case "gapsArchive":
			return [...validateGaps(content, true), ...crossFileErrors(abs, content, true)];
		case "pitfalls":
			return validatePitfalls(abs, content);
		case "decisionsArchive":
			return validateDecisions(content);
	}
}

export interface LedgerLint {
	subject: string;
	errors: string[];
}

export function lintLedger(file: string): LedgerLint | undefined {
	const abs = path.resolve(file);
	const kind = classify(abs);
	if (!kind) return;
	return { subject: subjectFor(kind, path.basename(abs)), errors: validate(kind, abs, fs.readFileSync(abs, "utf8")) };
}

export function runLedgerCli(): void {
	const [file, ...extra] = process.argv.slice(2);
	if (!file || extra.length > 0) {
		console.error(`Usage: bun ${process.argv[1]} <registry-path>`);
		process.exit(2);
	}
	let result: LedgerLint | undefined;
	try { result = lintLedger(file); }
	catch (error) {
		console.error(`Cannot read ${file}: ${error}`);
		process.exit(2);
	}
	if (!result) {
		console.error(`Not a supported active registry: ${file}`);
		process.exit(2);
	}
	if (result.errors.length > 0) {
		console.error(`${result.subject} violates the ledger schema:\n${result.errors.join("\n")}`);
		process.exit(1);
	}
	console.log(`PASS ${file}`);
}

if (import.meta.main) runLedgerCli();
