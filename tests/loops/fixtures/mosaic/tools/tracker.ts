#!/usr/bin/env bun
// Run from the link root. This CLI reads and writes local replay data only.
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
type Managed = {
	plan: string | null; repos: string[]; areas: string[]; branch: Record<string, string>; writer: string;
	lastEvent: { event: string; ts: string }; parked: string | null; resumeState?: string;
};
type Comment = { id: string; body: string; author: string; createdAt: string; writer?: string };
type Item = {
	key: string; id: string; title: string; body: string; state: string; assignee: string | null;
	labels: string[]; team: string; url: string; updatedAt: string; repos: string[];
	managed: Managed | null; comments: Comment[]; attachments: unknown[];
};

type Receipt = { repo: string; ref: string; commit: string; reachable: true };
type Payloads = {
	intent: { id: string; title: string; repos: string[]; areas: string[]; plan: string | null; url: string };
	event: { event: string; note?: string; receipt?: Receipt[] };
	comment: { id: string; body: string };
};
type Entry = { [K in keyof Payloads]: { ts: string; op: K; key: string; writer: string; payload: Payloads[K] } }[keyof Payloads];
const terminal: Record<string, true> = { done: true, abandoned: true, canceled: true, cancelled: true, duplicate: true };
const events: Record<string, true> = { approved: true, executing: true, review: true, done: true, abandoned: true, parked: true, resumed: true };
// Pretty output: the agent runtime truncates long tool-output lines, and a compact item array exceeds that limit.
const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));
const nonempty = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(nonempty);
const timestamp = (value: unknown): value is string => nonempty(value) && Number.isFinite(Date.parse(value));
class Refused extends Error {}
const refuse = (reason: string): never => { throw new Refused(reason); };
const begin = "<!-- mosaic:begin -->", end = "<!-- mosaic:end -->";
const commentHash = (key: string, body: string): string => createHash("sha256").update(key + body).digest("hex");

function csv(value: string): string[] {
	// Commas inside brace/class globs are not area separators.
	const result: string[] = [];
	let start = 0, depth = 0;
	for (let i = 0; i <= value.length; i++) {
		if (value[i] === "{" || value[i] === "[") depth++;
		if (value[i] === "}" || value[i] === "]") depth--;
		if (i === value.length || (value[i] === "," && depth === 0)) {
			const part = value.slice(start, i).trim();
			if (!part) throw new Error("empty list member");
			result.push(part);
			start = i + 1;
		}
	}
	return [...new Set(result)];
}
function anchors(body: string): [number, number] {
	const left = body.indexOf(begin), right = body.indexOf(end);
	if ((left < 0) !== (right < 0) || right < left || body.indexOf(begin, left + begin.length) > left
		|| body.indexOf(end, right + end.length) > right) refuse("MANAGED-BLOCK-CONFLICT");
	return [left, right];
}
function managedBody(body: string, managed: Managed): string {
	const block = [begin, `plan: ${managed.plan ?? "none"}`, `repos: ${managed.repos.join(", ")}`,
		`areas: ${managed.areas.join(", ") || "none"}`,
		`branch: ${Object.entries(managed.branch).map(([repo, branch]) => `${repo}:${branch}`).join(", ") || "none"}`,
		`writer: ${managed.writer}`, `last-event: ${managed.lastEvent.event} ${managed.lastEvent.ts}`,
		`parked: ${managed.parked ?? "none"}`, end].join("\n");
	const [left, right] = anchors(body);
	return left < 0 ? `${body}${body ? "\n\n" : ""}${block}` : body.slice(0, left) + block + body.slice(right + end.length);
}

function writerToken(value: string): string {
	if (!/^[A-Za-z0-9_-]+(?:#[1-9][0-9]*)?$/.test(value)) refuse("invalid opaque writer token; use token#generation without paths or hostnames");
	return value.includes("#") ? value : `${value}#1`;
}
function checkWriter(item: Item, writer: string): void {
	const owner = item.managed?.writer ?? item.comments.find(comment => comment.writer)?.writer;
	if (owner ? owner !== writer : !writer.endsWith("#1")) refuse("WRITER-CONFLICT");
}
function validateItem(item: Item): void {
	if (!item || ![item.key, item.id, item.title, item.state, item.team, item.url].every(nonempty)
		|| typeof item.body !== "string" || !timestamp(item.updatedAt) || !strings(item.repos) || !item.repos.length
		|| !strings(item.labels) || (item.assignee !== null && !nonempty(item.assignee))
		|| !Array.isArray(item.attachments) || !Array.isArray(item.comments)
		|| item.comments.some(comment => !comment || !nonempty(comment.id) || typeof comment.body !== "string")) {
		throw new Error("malformed inventory item");
	}
	const managed = item.managed;
	if (managed !== null) {
		if (!managed || !strings(managed.repos) || !strings(managed.areas) || !nonempty(managed.writer)
			|| !managed.lastEvent || !timestamp(managed.lastEvent.ts) || !nonempty(managed.lastEvent.event)
			|| (managed.plan !== null && !nonempty(managed.plan))
			|| !managed.branch || typeof managed.branch !== "object" || Array.isArray(managed.branch)
			|| Object.values(managed.branch).some(branch => !nonempty(branch))
			|| (managed.parked !== null && !nonempty(managed.parked))
			|| managed.repos.length !== item.repos.length || managed.repos.some(repo => !item.repos.includes(repo))) {
			throw new Error(`malformed managed block for ${item.key}`);
		}
		item.body = managedBody(item.body, managed);
	}
}
function receipts(value: unknown, repos: string[]): Receipt[] {
	const entries = Array.isArray(value) ? value : [value];
	if (!entries.length || entries.some(entry => !entry || !nonempty(entry.repo) || !nonempty(entry.ref)
		|| !nonempty(entry.commit) || entry.reachable !== true)
		|| repos.some(repo => !entries.some(entry => entry.repo === repo))) {
		refuse("done requires a reachable landing receipt for every repo");
	}
	return entries;
}
function disposition(body: string, key: string): string | undefined {
	if (body.split(/\r?\n/, 1)[0] !== `INTAKE VERDICT ${key}`) return;
	const fields = ["reading", "implemented", "touches", "risk", "refute", "registry", "retest", "questions", "disposition", "fingerprint"];
	if (!fields.every(field => new RegExp(`^${field}: [^\\r\\n]+`, "m").test(body))) return;
	return /^disposition: (inline|light|plan|recommend-close|held)(?:\s|$)/m.exec(body)?.[1];
}
function apply(items: Map<string, Item>, entry: Entry): void {
	if (!entry || !timestamp(entry.ts) || !nonempty(entry.key) || !nonempty(entry.writer) || !entry.payload) throw new Error("malformed outbox entry");
	if (entry.op === "intent") {
		if (items.has(entry.key)) throw new Error(`duplicate intent ${entry.key}`);
		const payload = entry.payload;
		if (!strings(payload.areas) || !payload.areas.length || !entry.writer.endsWith("#1")) throw new Error("malformed intent");
		const item: Item = { key: entry.key, id: payload.id, title: payload.title, body: "", state: "planning",
			assignee: null, labels: ["mosaic"], team: "Engineering", url: payload.url, updatedAt: entry.ts,
			repos: payload.repos, comments: [], attachments: [],
			managed: { plan: payload.plan, repos: payload.repos, areas: payload.areas, branch: {}, writer: entry.writer,
				lastEvent: { event: "intent", ts: entry.ts }, parked: null } };
		validateItem(item);
		items.set(item.key, item);
		return;
	}
	const item = items.get(entry.key);
	if (!item) throw new Error(`outbox refers to unknown item ${entry.key}`);
	if (entry.op === "comment" && item.comments.some(comment => comment.id === entry.payload.id)) return;
	checkWriter(item, entry.writer);
	if (entry.op === "comment") {
		const payload = entry.payload;
		if (typeof payload.body !== "string" || payload.id !== commentHash(entry.key, payload.body)) throw new Error("malformed comment event");
		item.comments.push({ ...payload, author: entry.writer, writer: entry.writer, createdAt: entry.ts });
		const label = disposition(payload.body, item.key);
		if (label) item.labels = [...item.labels.filter(label => !/^intake:(inline|light|plan|recommend-close|held)$/.test(label)), `intake:${label}`];
		item.updatedAt = entry.ts;
		return;
	}
	const managed: Managed = item.managed ?? { plan: null, repos: item.repos, areas: [], branch: {}, writer: entry.writer,
		lastEvent: { event: "intent", ts: entry.ts }, parked: null };
	if (entry.op === "event") {
		const { event, note, receipt } = entry.payload;
		if (!Object.hasOwn(events, event)) throw new Error("unknown lifecycle event");
		if (event === "done") receipts(receipt, item.repos);
		if (event === "parked") {
			if (!nonempty(note)) refuse("parked requires --note with reason and resume condition");
			if (item.state !== "parked") managed.resumeState = item.state;
			managed.parked = note;
		} else if (event === "resumed") {
			if (item.state !== "parked" || !managed.resumeState) refuse("resumed requires a parked item");
		} else if (item.state === "parked") refuse("parked item requires explicit resumed event");
		item.state = event === "resumed" ? managed.resumeState! : event;
		if (event === "resumed") { managed.parked = null; delete managed.resumeState; }
		managed.lastEvent = { event, ts: entry.ts };
	} else throw new Error("unknown outbox operation");
	item.managed = managed;
	item.updatedAt = entry.ts;
	item.body = managedBody(item.body, managed);
}
function summary(item: Item) {
	const { key, id, title, state, assignee, labels, url, updatedAt, managed } = item;
	return { key, id, title, state, assignee, labels, url, updatedAt, managed };
}
function overlaps(left: string, right: string): boolean {
	if (left.startsWith("contract:") || right.startsWith("contract:")) return left === right;
	left = left.replace(/^\.\//, "").replace(/\/$/, "");
	right = right.replace(/^\.\//, "").replace(/\/$/, "");
	if (new Bun.Glob(left).match(right) || new Bun.Glob(right).match(left)) return true;
	// Compare compatible path components until either path ends or a recursive glob begins.
	// This keeps sibling literal files separate while allowing a directory to cover its files.
	const a = left.split("/"), b = right.split("/");
	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		if (a[i] === "**" || b[i] === "**") return true;
		if (new Bun.Glob(a[i]).match(b[i]) || new Bun.Glob(b[i]).match(a[i])) continue;
		const globA = a[i].search(/[*?[{]/), globB = b[i].search(/[*?[{]/);
		if (globA < 0 || globB < 0) return false;
		const prefixA = a[i].slice(0, globA), prefixB = b[i].slice(0, globB);
		if (!prefixA.startsWith(prefixB) && !prefixB.startsWith(prefixA)) return false;
	}
	return true;
}

function main(): void {
	const flags = new Map<string, string>();
	const positionals: string[] = [];
	const raw = process.argv.slice(2);
	for (let i = 0; i < raw.length; i++) {
		const arg = raw[i];
		if (!arg.startsWith("--")) { positionals.push(arg); continue; }
		if (flags.has(arg)) throw new Error(`duplicate flag ${arg}`);
		if (arg === "--all") { flags.set(arg, "true"); continue; }
		const value = raw[++i];
		if (!nonempty(value) || value.startsWith("--")) throw new Error(`missing value for ${arg}`);
		flags.set(arg, value);
	}
	const [command, key, event] = positionals;
	const options: Record<string, string[]> = { list: ["--state", "--label", "--team", "--all"], get: [],
		intersect: ["--areas", "--repos"], intent: ["--title", "--repos", "--areas", "--plan", "--writer"],
		event: ["--writer", "--note", "--receipt"], comment: ["--file", "--writer"], receipt: [] };
	if (!Object.hasOwn(options, command)) throw new Error("usage: bun tools/tracker.ts [--provider replay] [--replay <dir>] list|get|intersect|intent|event|comment|receipt");
	for (const flag of flags.keys()) if (!["--replay", "--provider"].includes(flag) && !options[command].includes(flag)) throw new Error(`unsupported ${flag} for ${command}`);
	const arity = command === "event" ? 3 : ["get", "comment", "receipt"].includes(command) ? 2 : 1;
	if (positionals.length !== arity) throw new Error(`wrong arguments for ${command}`);
	const required = (flag: string): string => flags.get(flag) ?? refuse(`missing ${flag}`);
	const dir = resolve(flags.get("--replay") ?? "docs/tracker");
	if (flags.has("--provider") && flags.get("--provider") !== "replay") throw new Error("unsupported provider");
	const items = new Map<string, Item>();
	const outbox: Entry[] = [];
	let separator = "";
	try {
		const seed = JSON.parse(readFileSync(resolve(dir, "items.json"), "utf8"));
		if (!Array.isArray(seed)) throw new Error("items.json must be an array");
		for (const item of seed) {
			validateItem(item);
			if (items.has(item.key)) throw new Error(`duplicate key ${item.key}`);
			items.set(item.key, item);
		}
		let log = "";
		try { log = readFileSync(resolve(dir, "outbox.jsonl"), "utf8"); }
		catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
		if (log && !log.endsWith("\n")) separator = "\n";
		for (const line of log.split("\n")) {
			if (!line.trim()) continue;
			const entry = JSON.parse(line) as Entry;
			apply(items, entry);
			outbox.push(entry);
		}
	} catch (error) {
		throw new Error(`INCOMPLETE/UNAVAILABLE: ${error instanceof Error ? error.message : String(error)}`);
	}
	const itemFor = (key: string): Item => items.get(key) ?? refuse(`unknown item ${key}`);
	const append = (entry: Entry): Entry => {
		apply(items, entry);
		appendFileSync(resolve(dir, "outbox.jsonl"), `${separator}${JSON.stringify(entry)}\n`);
		separator = "";
		outbox.push(entry);
		return entry;
	};
	if (command === "list") {
		const states = flags.has("--state") ? csv(required("--state")) : null;
		json([...items.values()].filter(item => (flags.has("--all") || !Object.hasOwn(terminal, item.state))
			&& (!states || states.includes(item.state)) && (!flags.has("--label") || item.labels.includes(required("--label")))
			&& (!flags.has("--team") || item.team === required("--team"))).map(summary));
		json({ complete: true });
	} else if (command === "get") json(itemFor(key));
	else if (command === "receipt") { itemFor(key); json(outbox.filter(entry => entry.key === key)); }
	else if (command === "intersect") {
		const areas = csv(required("--areas")), repos = flags.has("--repos") ? csv(required("--repos")) : null;
		const now = Date.now();
		// An active item on the same repo with no declared areas (no managed block, or an empty areas list) cannot be ruled out: reported with scope "unknown".
		json([...items.values()].filter(item => !Object.hasOwn(terminal, item.state)
			&& (!repos || item.repos.some(repo => repos.includes(repo)))
			&& (!item.managed || item.managed.areas.length === 0 || item.managed.areas.some(area => areas.some(query => overlaps(area, query)))))
			.map(item => ({ ...summary(item), scope: item.managed?.areas.length ? "declared" : "unknown",
				stale: Math.max(0, Math.floor((now - Date.parse(item.managed?.lastEvent.ts ?? item.updatedAt)) / 86_400_000)) })));
	} else if (command === "intent") {
		const writer = writerToken(required("--writer"));
		if (!writer.endsWith("#1")) refuse("intent requires writer generation 1");
		const number = Math.max(0, ...[...items.keys()].map(key => Number(/^ENG-(\d+)$/.exec(key)?.[1] ?? 0))) + 1;
		const newKey = `ENG-${number}`;
		const entry = append({ ts: new Date().toISOString(), op: "intent", key: newKey, writer,
			payload: { id: randomUUID(), title: required("--title"), repos: csv(required("--repos")), areas: csv(required("--areas")),
				plan: flags.get("--plan") ?? null, url: `replay://${newKey}` } });
		console.log(entry.key);
	} else if (command === "comment") {
		const item = itemFor(key), writer = writerToken(required("--writer"));
		const body = readFileSync(resolve(required("--file")), "utf8");
		const id = commentHash(key, body);
		const existing = item.comments.find(comment => comment.id === id);
		if (existing) console.log(existing.id);
		else {
			checkWriter(item, writer);
			append({ ts: new Date().toISOString(), op: "comment", key, writer, payload: { id, body } });
			console.log(id);
		}
	} else if (command === "event") {
		const item = itemFor(key), writer = writerToken(required("--writer"));
		checkWriter(item, writer);
		if (!Object.hasOwn(events, event)) refuse(`unsupported event ${event}`);
		const payload: Payloads["event"] = { event };
		if (flags.has("--note")) payload.note = required("--note");
		if (flags.has("--receipt")) {
			let supplied: unknown;
			try { supplied = JSON.parse(required("--receipt")); } catch { refuse("invalid receipt JSON"); }
			payload.receipt = receipts(supplied, item.repos);
		} else if (event === "done") refuse("done requires a reachable landing receipt for every repo");
		append({ ts: new Date().toISOString(), op: "event", key, writer, payload });
		json(summary(item));
	}
}
try { main(); }
catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = error instanceof Refused ? 1 : 2;
}
