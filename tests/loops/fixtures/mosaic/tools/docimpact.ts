#!/usr/bin/env bun
// Candidate discovery only: a match is a read pointer, not proof that a document must change.
import * as fs from "node:fs";
import * as path from "node:path";

type ImpactClass = "cites-plan" | "affinity" | "decision" | "product-contract" | "roadmap" | "consumer-search";
type Metadata = Record<string, unknown>;
const classes: ImpactClass[] = ["cites-plan", "affinity", "decision", "product-contract", "roadmap", "consumer-search"];
const candidates: { doc: string; class: ImpactClass; why: string }[] = [];
const cannotEvaluate: { class: ImpactClass; reason: string }[] = [];
function unavailable(kind: ImpactClass, reason: string): void {
	if (!cannotEvaluate.some(entry => entry.class === kind && entry.reason === reason)) {
		cannotEvaluate.push({ class: kind, reason });
	}
}
function finish(code = 0): never {
	candidates.sort((a, b) => a.doc.localeCompare(b.doc) || classes.indexOf(a.class) - classes.indexOf(b.class));
	cannotEvaluate.sort((a, b) => classes.indexOf(a.class) - classes.indexOf(b.class) || a.reason.localeCompare(b.reason));
	console.log(JSON.stringify({ candidates, cannotEvaluate }, null, 2));
	process.exit(code);
}

const [planArg, ...flags] = process.argv.slice(2);
if (!planArg || (flags.length !== 0 && (flags.length !== 2 || flags[0] !== "--root" || !flags[1]))) {
	console.error("Usage: bun tools/docimpact.ts <plan-path> [--root dir]");
	process.exit(2);
}
const root = path.resolve(flags[1] ?? process.cwd());
const planPath = path.resolve(root, planArg);
let plan: string;
try {
	plan = fs.readFileSync(planPath, "utf8").replace(/\r\n/g, "\n");
} catch (error) {
	for (const kind of classes) unavailable(kind, `Cannot read plan ${planArg}: ${String(error)}`);
	finish(2);
}
function frontmatter(content: string): Metadata | undefined {
	const block = /^---\n([\s\S]*?)\n---(?:\n|$)/.exec(content);
	if (!block) return undefined;
	try {
		const value = Bun.YAML.parse(block[1]!);
		return value && typeof value === "object" && !Array.isArray(value) ? value as Metadata : undefined;
	} catch {
		return undefined;
	}
}
function strings(value: unknown): string[] | undefined {
	if (typeof value === "string") return value.split(",").map(item => item.trim()).filter(Boolean);
	if (Array.isArray(value) && value.every(item => typeof item === "string")) return value;
	return undefined;
}
function escape(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function token(value: string): RegExp {
	return new RegExp(`(^|[^\\w])${escape(value)}(?![\\w])`);
}
const metadata = frontmatter(plan);
const rawId = metadata?.plan;
const planId = typeof rawId === "string" || typeof rawId === "number" ? String(rawId).padStart(4, "0") : undefined;
const planPattern = planId && /^\d{4}$/.test(planId) ? token(planId) : undefined;
if (!planPattern) {
	for (const kind of ["cites-plan", "roadmap"] as const) unavailable(kind, `${planArg}: missing or invalid plan frontmatter`);
}
const repos = strings(metadata?.repo);
if (!repos?.length) unavailable("affinity", `${planArg}: missing or invalid repo frontmatter`);
const areas = strings(metadata?.areas);
if (!areas) {
	for (const kind of ["product-contract", "consumer-search"] as const) unavailable(kind, `${planArg}: missing or invalid areas frontmatter`);
}
const contracts = areas?.filter(area => area.startsWith("contract:")).map(area => area.slice("contract:".length)).filter(Boolean) ?? [];
const symbols = contracts.map(contract => ({ name: contract, pattern: token(contract) }));
const decisions = new Set(plan.match(/\bD\d+\b/g) ?? []);
const foundDecisions = new Set<string>();

const docs = new Map<string, string>();
function collect(dir: string): void {
	let entries: fs.Dirent[];
	try {
		entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true });
	} catch (error) {
		for (const kind of classes) unavailable(kind, `${dir}: cannot enumerate documents: ${String(error)}`);
		return;
	}
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		const doc = `${dir}/${entry.name}`;
		// Frozen history may be cited, but is not a candidate for closure edits.
		if (/(?:^|\/)docs\/(?:plans\/)?archived(?:\/|$)/.test(doc)) continue;
		if (entry.isDirectory()) collect(doc);
		else if (entry.isFile() || entry.isSymbolicLink()) {
			if (path.resolve(root, doc) === planPath) continue;
			try {
				docs.set(doc, fs.readFileSync(path.join(root, doc), "utf8").replace(/\r\n/g, "\n"));
			} catch (error) {
				for (const kind of classes) unavailable(kind, `${doc}: cannot read document: ${String(error)}`);
			}
		}
	}
}
collect("docs");
for (const repo of repos ?? []) {
	if (repo !== "link-repo" && repo !== "." && fs.existsSync(path.join(root, repo, "docs"))) collect(`${repo}/docs`);
}
function candidate(doc: string, kind: ImpactClass, why: string): void {
	candidates.push({ doc, class: kind, why });
}
// These architecture registries have their own schemas, not element-document affinity metadata.
const architectureRegistries: Record<string, true> = {
	"README.md": true, "pitfalls.md": true, "pitfalls-archive.md": true, "decisions-archive.md": true, "open-questions.md": true, "roadmap.md": true,
};
for (const [doc, content] of docs) {
	const lines = content.split("\n");
	const citation = planPattern ? lines.findIndex(line => planPattern.test(line)) : -1;
	if (citation >= 0) candidate(doc, "cites-plan", `${doc}:${citation + 1} cites plan ${planId}`);
	if (path.basename(doc) === "roadmap.md" && citation >= 0) {
		candidate(doc, "roadmap", `${doc}:${citation + 1}: ${lines[citation]!.trim()}`);
	}
	const architecture = /(?:^|\/)docs\/architecture\//.test(doc) && doc.endsWith(".md");
	if (architecture) {
		if (!architectureRegistries[path.basename(doc)] && !doc.includes("/archived/")) {
			const affinities = strings(frontmatter(content)?.affinity);
			if (!affinities) unavailable("affinity", `${doc}: missing or invalid affinity frontmatter`);
			else if (repos?.length && affinities.some(affinity => affinity === "cross-area" || repos.includes(affinity))) {
				candidate(doc, "affinity", `affinity ${affinities.join(", ")} intersects touched repos ${repos.join(", ")}`);
			}
		}
		const matches: string[] = [];
		for (let index = 0; index < lines.length; index++) {
			const heading = /^#{1,6}\s+(D\d+)\b/.exec(lines[index]!);
			if (heading && decisions.has(heading[1]!)) {
				foundDecisions.add(heading[1]!);
				matches.push(`${heading[1]} at ${doc}:${index + 1}`);
			}
		}
		if (matches.length) candidate(doc, "decision", `plan cites ${matches.join(", ")}`);
	}
	// Existing projects may keep PRDs without kit metadata; absence is unknown, not an empty match.
	if (/(?:^|\/)docs\/(?:product|prd)\//.test(doc) && doc.endsWith(".md") && path.basename(doc) !== "README.md") {
		const product = frontmatter(content);
		const docContracts = strings(product?.contracts);
		const docRepos = strings(product?.repos);
		const missing = [!docContracts && "contracts", !docRepos?.length && "repos"].filter(Boolean);
		if (missing.length) unavailable("product-contract", `${doc}: missing or invalid ${missing.join("/")} frontmatter`);
		else {
			const overlap = docContracts!.filter(contract => contracts.includes(contract));
			if (overlap.length) candidate(doc, "product-contract", `contracts intersect plan areas: ${overlap.join(", ")}`);
		}
	}
	const mentions = symbols.flatMap(symbol => {
		const index = lines.findIndex(line => symbol.pattern.test(line));
		return index < 0 ? [] : [`${symbol.name} at ${doc}:${index + 1}`];
	});
	if (mentions.length) candidate(doc, "consumer-search", `mentions changed public contracts: ${mentions.join(", ")}`);
}
for (const decision of decisions) {
	if (!foundDecisions.has(decision)) unavailable("decision", `No architecture decision heading found for ${decision} cited by ${planArg}`);
}
finish();
