#!/usr/bin/env bun
// Local files only. stdout is reserved for newline-delimited MCP JSON-RPC messages.
import { randomUUID } from "node:crypto";
import { readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline";
import { commentBody, description, Refused, refuse, type Item } from "./model.ts";

type State = { id: string; name: string; type: string };
type Team = { id: string; name: string; key: string; states: State[] };
type User = { id: string; name: string; displayName: string };
type Comment = { id: string; body: string; createdAt: string; userId: string };
type Issue = { id: string; identifier: string; title: string; description: string; stateId: string;
	assigneeId: string | null; labels: string[]; teamId: string; url: string; createdAt: string; updatedAt: string; comments: Comment[] };
type Store = { teams: Team[]; users: User[]; issues: Issue[] };
const lifecycle = ["triage", "planning", "approved", "executing", "review", "done", "abandoned", "parked", "canceled", "cancelled", "duplicate"];
function record(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) refuse("expected an object");
	return value as Record<string, unknown>;
}
function text(value: unknown, field: string): string {
	if (typeof value !== "string" || !value.trim()) refuse(`${field} must be a nonempty string`);
	return value as string;
}
function list(value: unknown, field: string): string[] {
	if (!Array.isArray(value) || !value.every(entry => typeof entry === "string" && entry.trim())) refuse(`${field} must be an array of strings`);
	return value as string[];
}
function save(path: string, store: Store): void {
	const temp = `${path}.${randomUUID()}.tmp`;
	try { writeFileSync(temp, JSON.stringify(store, null, 2) + "\n", { flag: "wx" }); renameSync(temp, path); }
	finally { try { unlinkSync(temp); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; } }
}
function validateStore(value: unknown): asserts value is Store {
	const store = record(value);
	if (!Array.isArray(store.teams) || !Array.isArray(store.users) || !Array.isArray(store.issues)) throw new Error("malformed mock store");
	for (const value of store.teams) {
		const team = record(value);
		for (const key of ["id", "name", "key"]) text(team[key], key);
		if (!Array.isArray(team.states)) throw new Error("malformed mock states");
		for (const value of team.states) {
			const state = record(value);
			for (const key of ["id", "name", "type"]) text(state[key], key);
		}
	}
	for (const value of store.users) {
		const user = record(value);
		for (const key of ["id", "name", "displayName"]) text(user[key], key);
	}
	for (const value of store.issues) {
		const issue = record(value);
		for (const key of ["id", "identifier", "title", "stateId", "teamId", "url", "createdAt", "updatedAt"]) text(issue[key], key);
		if (typeof issue.description !== "string" || (issue.assigneeId !== null && typeof issue.assigneeId !== "string") || !Array.isArray(issue.comments)) throw new Error("malformed mock issue");
		list(issue.labels, "labels");
		for (const value of issue.comments) {
			const comment = record(value);
			for (const key of ["id", "createdAt", "userId"]) text(comment[key], key);
			if (typeof comment.body !== "string") throw new Error("malformed mock comment");
		}
	}
}
function load(path: string): Store {
	try {
		const value: unknown = JSON.parse(readFileSync(path, "utf8"));
		validateStore(value);
		return value;
	} catch (error) { throw new Error(`unavailable mock store: ${error instanceof Error ? error.message : String(error)}`); }
}
function teamFor(store: Store, value: unknown): Team {
	const name = text(value, "team");
	const team = store.teams.find(team => team.id === name || team.name === name || team.key === name);
	return team ?? refuse(`unknown team ${value}`);
}
function issueFor(store: Store, value: unknown): Issue {
	const issue = store.issues.find(issue => issue.id === value || issue.identifier === value);
	return issue ?? refuse(`unknown item ${value}`);
}
function stateFor(team: Team, value: unknown): State {
	const state = team.states.find(state => state.id === value || state.name === value);
	return state ?? refuse(`unknown state ${value} for ${team.name}`);
}
function issueView(store: Store, issue: Issue, detail = false) {
	const team = teamFor(store, issue.teamId), state = stateFor(team, issue.stateId);
	const assignee = issue.assigneeId === null ? null : store.users.find(user => user.id === issue.assigneeId);
	if (issue.assigneeId !== null && !assignee) throw new Error("unknown stored assignee");
	return { id: issue.id, identifier: issue.identifier, title: issue.title, description: issue.description,
		state: state.name, assignee: assignee?.name ?? null, labels: issue.labels, team: team.name,
		url: issue.url, createdAt: issue.createdAt, updatedAt: issue.updatedAt,
		...(detail ? { comments: issue.comments.map(comment => commentView(store, comment)), attachments: [] } : {}) };
}
function commentView(store: Store, comment: Comment) {
	const user = store.users.find(user => user.id === comment.userId);
	if (!user) throw new Error("unknown stored comment user");
	return { id: comment.id, body: comment.body, createdAt: comment.createdAt, user: { id: user.id, name: user.name } };
}
const string = { type: "string" };
const schemas: Record<string, { description: string; properties: Record<string, unknown>; required?: string[] }> = {
	list_issues: { description: "List all matching local issues without pagination.", properties: { identifier: string, query: string, state: string, label: string, team: string, assignee: string } },
	get_issue: { description: "Get an issue by ID or identifier.", properties: { id: string }, required: ["id"] },
	save_issue: { description: "Create an issue with team and title, or merge fields into an issue by ID.", properties: { id: string, team: string, title: string, description: string, state: string, labels: { type: "array", items: string }, assignee: { type: ["string", "null"] } } },
	list_comments: { description: "List all comments on an issue.", properties: { issueId: string }, required: ["issueId"] },
	save_comment: { description: "Append a comment to an issue.", properties: { issueId: string, body: string }, required: ["issueId", "body"] },
	list_teams: { description: "List local teams.", properties: {} },
	list_issue_statuses: { description: "List states for a team.", properties: { team: string }, required: ["team"] },
	list_users: { description: "List local users.", properties: {} },
};
function call(path: string, name: string, args: Record<string, unknown>): unknown {
	if (!Object.hasOwn(schemas, name)) return { error: `unsupported tool ${name}`, code: "UNSUPPORTED" };
	const schema = schemas[name];
	for (const key of Object.keys(args)) if (!Object.hasOwn(schema.properties, key)) refuse(`unsupported argument ${key} for ${name}`);
	for (const key of schema.required ?? []) text(args[key], key);
	const store = load(path);
	if (name === "list_teams") return store.teams.map(({ id, name, key }) => ({ id, name, key }));
	if (name === "list_users") return store.users;
	if (name === "list_issue_statuses") return teamFor(store, args.team).states;
	if (name === "get_issue") return issueView(store, issueFor(store, args.id), true);
	if (name === "list_comments") return issueFor(store, args.issueId).comments.map(comment => commentView(store, comment));
	if (name === "list_issues") {
		for (const [key, value] of Object.entries(args)) text(value, key);
		return store.issues.filter(issue => {
			const team = teamFor(store, issue.teamId), state = stateFor(team, issue.stateId);
			const user = store.users.find(user => user.id === issue.assigneeId);
			const query = typeof args.query === "string" ? args.query.toLowerCase() : null;
			return (!args.identifier || issue.identifier === args.identifier)
				&& (!query || `${issue.identifier}\n${issue.title}\n${issue.description}`.toLowerCase().includes(query))
				&& (!args.state || state.id === args.state || state.name === args.state)
				&& (!args.label || issue.labels.includes(String(args.label)))
				&& (!args.team || [team.id, team.key, team.name].includes(String(args.team)))
				&& (!args.assignee || (args.assignee === "null" ? issue.assigneeId === null : user && [user.id, user.name, user.displayName].includes(String(args.assignee))));
		}).map(issue => issueView(store, issue));
	}
	const now = new Date().toISOString();
	if (name === "save_comment") {
		const issue = issueFor(store, args.issueId);
		const body = text(args.body, "body"), id = randomUUID();
		let user = store.users.find(user => user.id === "mosaic");
		if (!user) { user = { id: "mosaic", name: "mosaic", displayName: "Mosaic" }; store.users.push(user); }
		issue.comments.push({ id, body, createdAt: now, userId: user.id });
		issue.updatedAt = now;
		save(path, store);
		return { id };
	}
	const existing = args.id === undefined ? undefined : issueFor(store, args.id);
	const team = teamFor(store, args.team ?? existing?.teamId);
	if (existing && existing.teamId !== team.id) refuse("changing issue teams is unsupported");
	const number = existing ? 0 : Math.max(0, ...store.issues.map(issue => Number(/^ENG-(\d+)$/.exec(issue.identifier)?.[1] ?? 0))) + 1;
	const issue: Issue = existing ?? { id: randomUUID(), identifier: `ENG-${number}`, title: text(args.title, "title"),
		description: "", stateId: stateFor(team, "planning").id, assigneeId: null, labels: [], teamId: team.id,
		url: `https://linear.mock/issue/ENG-${number}`, createdAt: now, updatedAt: now, comments: [] };
	if (args.title !== undefined) issue.title = text(args.title, "title");
	if (args.description !== undefined) {
		if (typeof args.description !== "string") refuse("description must be a string");
		issue.description = args.description as string;
	}
	if (args.state !== undefined) issue.stateId = stateFor(team, args.state).id;
	if (args.labels !== undefined) issue.labels = list(args.labels, "labels");
	if (args.assignee !== undefined) {
		const user = store.users.find(user => [user.id, user.name, user.displayName].includes(String(args.assignee)));
		if (args.assignee !== null && !user) refuse(`unknown assignee ${args.assignee}`);
		issue.assigneeId = user?.id ?? null;
	}
	issue.updatedAt = now;
	if (!existing) store.issues.push(issue);
	save(path, store);
	return issueView(store, issue, true);
}
function seed(path: string): Store {
	const items: Item[] = JSON.parse(readFileSync(path, "utf8"));
	if (!Array.isArray(items)) throw new Error("items.json must be an array");
	const store: Store = { teams: [], users: [], issues: [] };
	const names = [...new Set(["Engineering", ...items.map(item => item.team)])];
	for (const name of names) {
		const id = `team-${store.teams.length + 1}`;
		store.teams.push({ id, name, key: name === "Engineering" ? "ENG" : name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4),
			states: [...new Set([...lifecycle, ...items.filter(item => item.team === name).map(item => item.state)])]
				.map(name => ({ id: `${id}-${name}`, name, type: name === "done" ? "completed" : ["abandoned", "canceled", "cancelled", "duplicate"].includes(name) ? "canceled" : name === "triage" ? "triage" : ["planning", "approved"].includes(name) ? "unstarted" : "started" })) });
	}
	const userId = (name: string): string => {
		let user = store.users.find(user => user.name === name);
		if (!user) { user = { id: `user-${store.users.length + 1}`, name, displayName: name }; store.users.push(user); }
		return user.id;
	};
	for (const item of items) {
		const team = teamFor(store, item.team);
		store.issues.push({ id: item.id, identifier: item.key, title: item.title, description: description(item),
			stateId: stateFor(team, item.state).id, assigneeId: item.assignee ? userId(item.assignee) : null, labels: item.labels,
			teamId: team.id, url: item.url, createdAt: item.updatedAt, updatedAt: item.updatedAt,
			comments: item.comments.map(comment => ({ id: comment.id,
				body: comment.writer ? commentBody(item.key, comment.body, comment.writer) : comment.body,
				createdAt: comment.createdAt, userId: userId(comment.author) })) });
	}
	return store;
}
async function main(): Promise<void> {
	const flags = new Map<string, string>();
	const argv = process.argv.slice(2);
	for (let i = 0; i < argv.length; i += 2) {
		if (!["--store", "--seed-from"].includes(argv[i]) || !argv[i + 1] || argv[i + 1].startsWith("--") || flags.has(argv[i])) throw new Error("usage: bun tools/mcp/linear-mock.ts [--seed-from <items.json>] [--store <linear-mock.json>]");
		flags.set(argv[i], argv[i + 1]);
	}
	const source = flags.get("--seed-from");
	const path = resolve(flags.get("--store") ?? (source ? resolve(dirname(source), "linear-mock.json") : "docs/tracker/linear-mock.json"));
	if (source) { save(path, seed(resolve(source))); console.error(`Seeded ${path}`); return; }
	let initialized = false;
	for await (const line of createInterface({ input: process.stdin, crlfDelay: Infinity })) {
		let id: unknown = null;
		try {
			let parsed: unknown;
			try { parsed = JSON.parse(line); } catch { console.log(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })); continue; }
			const request = record(parsed);
			id = request.id ?? null;
			if (request.jsonrpc !== "2.0" || typeof request.method !== "string" || (request.id !== undefined && typeof request.id !== "string" && typeof request.id !== "number")) throw new Error("Invalid Request");
			if (request.id === undefined) { if (request.method === "notifications/initialized") initialized = true; continue; }
			let result: unknown;
			if (request.method === "initialize") result = { protocolVersion: "2025-06-18", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "mosaic-linear-mock", version: "1.0.0" } };
			else if (request.method === "ping") result = {};
			else if (!initialized) { console.log(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32002, message: "Not initialized" } })); continue; }
			else if (request.method === "tools/list") result = { tools: Object.entries(schemas).map(([name, schema]) => ({ name, description: schema.description, inputSchema: { type: "object", properties: schema.properties, required: schema.required ?? [], additionalProperties: false } })) };
			else if (request.method === "tools/call") {
				let value: unknown, isError = false;
				try {
					const params = record(request.params);
					value = call(path, text(params.name, "name"), record(params.arguments ?? {}));
					isError = !!value && typeof value === "object" && "error" in value;
				} catch (error) { isError = true; value = { error: error instanceof Error ? error.message : String(error), code: error instanceof Refused ? "REFUSED" : "UNAVAILABLE" }; }
				result = { content: [{ type: "text", text: JSON.stringify(value) }], ...(isError ? { isError: true } : {}) };
			} else { console.log(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } })); continue; }
			console.log(JSON.stringify({ jsonrpc: "2.0", id, result }));
		} catch (error) { console.log(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32600, message: error instanceof Error ? error.message : String(error) } })); }
	}
}
if (import.meta.main) main().catch(error => { console.error(error.message); process.exitCode = 2; });
