// tool_result(write|edit) hook: validate the schema of the repo's LEDGERS and ID REGISTRIES.
//
// Port of .claude/hooks/lint-ledgers.sh — keep the two in lockstep (AGENTS.md, "Mirror the two
// envs"). The shell version feeds errors back via exit 2; here the tool-wrapper only applies a
// hook's `content`/`details` (it drops `isError`), so violations are appended to the tool result the
// model sees, prompting it to fix the file and re-save. `isError` is set too for forward-compat, but
// the appended text is the load-bearing mechanism.
//
// Dispatch is by path; anything not listed exits silently:
//
//   plan docs       */docs/plans/*.md                frontmatter status enum + required sections
//   plans ledgers   */docs/plans/README.md           unique 4-digit plan numbers, a status cell per row
//   gaps registry   */docs/gaps.md                   unique G-ids, per-entry Trigger/provenance/Status,
//                                                    no CLOSED entry left active, no id also archived
//   gaps archive    */docs/gaps-archive.md           unique G-ids, closure evidence, no id also active
//   pitfalls        */docs/architecture/pitfalls.md   unique P-ids
//   decision map    */docs/architecture/README.md     unique D-numbers
//
// WHY id uniqueness is the load-bearing check: on 2026-08-20 plan 0082's close-out pasted its two
// new gap entries one number low, overwriting G-127's text with a copy of G-128 and leaving G-128
// duplicated. A real obligation (ink-preview normalization) vanished from the registry and nothing
// noticed for five days — every `G-x` citation in the tree silently pointed at the wrong row.
import * as fs from "node:fs";
import * as path from "node:path";
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

const STATUS_ENUM = ["draft", "approved", "executing", "review", "done", "abandoned"] as const;
const STATUS_HINT = `expected one of: ${STATUS_ENUM.join("|")}`;
const REQUIRED_SECTIONS = [
	"## Context",
	"## Scope",
	"## Task breakdown",
	"## Review checklist",
	"## Verification",
	"### Verification gaps",
	"## Planning log",
	"## Execution log",
] as const;

const GAP_ENTRY = /^- \*\*(G-\d+) ·/;
const ANY_ENTRY = /^- \*\*/;
const LEDGER_ROW = /^\| *\[?(\d{4})\]?/;
const STATUS_CELL = new RegExp(`\\| *(${STATUS_ENUM.join("|")}) *\\|`);

type Kind = "plan" | "ledger" | "gaps" | "gapsArchive" | "pitfalls" | "decisions";

/** Collect edited target paths: `path` (write / single-file edit) + `paths` (multi-file edit). */
function targetPaths(input: Record<string, unknown>): string[] {
	const out = new Set<string>();
	const p = input.path;
	if (typeof p === "string" && p.length > 0) out.add(p);
	const ps = input.paths;
	if (Array.isArray(ps)) {
		for (const x of ps) {
			if (typeof x === "string" && x.length > 0) out.add(x);
		}
	}
	return [...out];
}

/** Which registry (if any) this path is. Mirrors the shell `case` arms, in the same order. */
function classify(file: string): Kind | undefined {
	const norm = file.replace(/\\/g, "/");
	if (!norm.endsWith(".md")) return undefined;
	// Archived plans are frozen, terminal records — not schema-gated (they may predate the schema).
	if (norm.includes("/docs/plans/archived/") || norm.startsWith("docs/plans/archived/")) return undefined;

	const at = (suffix: string): boolean => norm === suffix || norm.endsWith(`/${suffix}`);
	if (at("docs/gaps.md")) return "gaps";
	if (at("docs/gaps-archive.md")) return "gapsArchive";
	if (at("docs/architecture/pitfalls.md")) return "pitfalls";
	if (at("docs/architecture/README.md")) return "decisions";
	if (at("docs/plans/README.md")) return "ledger";

	if (!norm.includes("/docs/plans/") && !norm.startsWith("docs/plans/")) return undefined;
	const base = norm.slice(norm.lastIndexOf("/") + 1);
	if (base === "TEMPLATE.md") return undefined;
	if (base.endsWith("-wire.md")) return undefined; // wire annexes are frozen contracts, not lifecycle docs
	return "plan";
}

/** Frontmatter `status:` value (awk `$2` parity: whitespace-split, empty when glued). */
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

/** Split a registry into `- **G-n ·` blocks, mirroring the awk accumulator. */
function gapEntries(content: string): { id: string; body: string }[] {
	const out: { id: string; body: string }[] = [];
	let id = "";
	let buf: string[] = [];
	const flush = (): void => {
		if (id !== "") out.push({ id, body: buf.join("\n") });
		id = "";
		buf = [];
	};
	for (const raw of content.split("\n")) {
		const line = raw.replace(/\r$/, "");
		const m = GAP_ENTRY.exec(line);
		if (m?.[1] !== undefined) {
			flush();
			id = m[1];
			buf = [line];
			continue;
		}
		if (ANY_ENTRY.test(line)) {
			flush();
			continue;
		}
		if (id !== "") buf.push(line);
	}
	flush();
	return out;
}

function validatePlan(content: string): string[] {
	const errors: string[] = [];
	const status = frontmatterStatus(content);
	if (status === undefined || status === "") {
		errors.push(`missing frontmatter 'status:' (${STATUS_HINT})`);
	} else if (!STATUS_ENUM.some(s => s === status)) {
		errors.push(`invalid status '${status}' (${STATUS_HINT})`);
	}
	// Substring match over the whole file, mirroring `grep -qF`.
	for (const h of REQUIRED_SECTIONS) {
		if (!content.includes(h)) errors.push(`missing required section: '${h}'`);
	}
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
	for (const { id, body } of gapEntries(content)) {
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
		// A CLOSED entry sitting in the open registry is the defect this catches most cheaply: the
		// active list is standing context for every /palladio-plan, so a discharged obligation left
		// in it costs every future session real attention. (Measured: G-132 sat here closed since
		// 2026-08-23.)
		if (/\*\*Status:\*\* *closed/.test(body)) {
			errors.push(
				`${id} is **Status:** closed but still in the ACTIVE registry — move it to gaps-archive.md (never renumber, never delete)`,
			);
			continue;
		}
		const missing: string[] = [];
		// Both spellings are load-bearing in the live registry: 111 `**Trigger:**` alongside
		// qualified forms (`**Trigger (owed|narrowed|armed):**`), and provenance is written 72x
		// `**From:**` / 40x `**Provenance:**`. The fence is "the field EXISTS", not "the field is
		// spelled my way" — a linter that flags 60 correct entries gets switched off, and then
		// guards nothing.
		if (!/\*\*Trigger[^*]*:\*\*/.test(body)) missing.push("**Trigger:**");
		if (!/\*\*Status:\*\*/.test(body)) missing.push("**Status:**");
		// SPLIT rows (`/gap-evaluate` step 3) hold only id + summary + trigger + link here; the full
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

/** An id must live in exactly one of gaps.md / gaps-archive.md. */
function crossFileErrors(abs: string, content: string, archive: boolean): string[] {
	const counterpart = path.join(path.dirname(abs), archive ? "gaps.md" : "gaps-archive.md");
	let other: string;
	try {
		other = fs.readFileSync(counterpart, "utf8");
	} catch {
		return []; // fail-open: counterpart absent
	}
	const theirs = new Set(idsMatching(other, GAP_ENTRY));
	const where = archive ? "the active registry" : "the archive";
	const out: string[] = [];
	for (const id of new Set(idsMatching(content, GAP_ENTRY))) {
		if (theirs.has(id)) {
			out.push(`gap '${id}' is present here AND in ${where} — a gap is either open or closed, never both`);
		}
	}
	return out;
}

function subjectFor(kind: Kind, base: string): string {
	switch (kind) {
		case "plan":
			return `Plan doc '${base}'`;
		case "ledger":
			return `Plans ledger '${base}'`;
		case "gaps":
			return `Gaps registry '${base}'`;
		case "gapsArchive":
			return `Gaps archive '${base}'`;
		case "pitfalls":
			return `Pitfalls catalog '${base}'`;
		case "decisions":
			return `Decision map '${base}'`;
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
		case "gapsArchive":
			return [...validateGaps(content, true), ...crossFileErrors(abs, content, true)];
		case "pitfalls":
			return dupErrors(idsMatching(content, /^- \*\*(P-\d+) ·/), "pitfall");
		case "decisions":
			return dupErrors(idsMatching(content, /^\| *(D\d+) *\|/), "decision");
	}
}

export default function (pi: HookAPI) {
	pi.on("tool_result", (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;
		if (event.isError) return;

		const messages: string[] = [];
		for (const rel of targetPaths(event.input)) {
			const kind = classify(rel);
			if (kind === undefined) continue;
			const abs = path.isAbsolute(rel) ? rel : path.resolve(ctx.cwd, rel);

			let content: string;
			try {
				content = fs.readFileSync(abs, "utf8");
			} catch {
				continue; // fail-open: unreadable (e.g. renamed-away source) → skip
			}

			const errors = validate(kind, abs, content);
			if (errors.length === 0) continue;

			const base = abs.slice(abs.replace(/\\/g, "/").lastIndexOf("/") + 1);
			messages.push(
				`${subjectFor(kind, base)} violates the ledger schema:\n` +
					errors.map(e => `  - ${e}`).join("\n") +
					`\nFix the file and save again.`,
			);
		}

		if (messages.length === 0) return;

		return {
			content: [...event.content, { type: "text" as const, text: messages.join("\n\n") }],
			isError: true,
		};
	});
}

if (import.meta.main) {
	const [file, ...extra] = process.argv.slice(2);
	if (!file || extra.length > 0) {
		console.error("Usage: bun .omp/hooks/post/lint-ledgers.ts <registry-path>");
		process.exit(2);
	}
	const abs = path.resolve(file);
	const kind = classify(abs);
	if (!kind) {
		console.error(`Not a supported active registry: ${file}`);
		process.exit(2);
	}
	let content: string;
	try {
		content = fs.readFileSync(abs, "utf8");
	} catch (error) {
		console.error(`Cannot read ${file}: ${error}`);
		process.exit(2);
	}
	const errors = validate(kind, abs, content);
	if (errors.length > 0) {
		console.error(`${subjectFor(kind, path.basename(abs))} violates the ledger schema:\n${errors.join("\n")}`);
		process.exit(1);
	}
	console.log(`PASS ${file}`);
}
