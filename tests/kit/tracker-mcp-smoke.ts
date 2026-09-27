#!/usr/bin/env bun
import { deepStrictEqual, strictEqual, ok } from "node:assert";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const temp = mkdtempSync(join(tmpdir(), "mosaic-tracker-mcp-"));
const providers = ["replay", "mcp"] as const;
type Provider = typeof providers[number];
type Result = { code: number; stdout: string; stderr: string };
const dirs = { replay: join(temp, "replay"), mcp: join(temp, "mcp") };
let failures = 0;
function row(value: unknown): Record<string, unknown> {
	ok(value && typeof value === "object" && !Array.isArray(value), "expected a JSON object");
	return value as Record<string, unknown>;
}
function run(provider: Provider, args: string[]): Result {
	const result = Bun.spawnSync([process.execPath, "tools/tracker.ts", ...args], {
		cwd: dirs[provider], env: { ...process.env, MOSAIC_TRACKER_PROVIDER: provider }, stdout: "pipe", stderr: "pipe" });
	return { code: result.exitCode, stdout: result.stdout.toString().trim(), stderr: result.stderr.toString().trim() };
}
function success(provider: Provider, args: string[]): string {
	const result = run(provider, args);
	strictEqual(result.code, 0, `${provider} ${args.join(" ")}: ${result.stderr}`);
	return result.stdout;
}
function normalized(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(normalized);
	if (value && typeof value === "object") return Object.fromEntries(Object.entries(value)
		.filter(([key]) => !["id", "mcpId", "url", "ts", "createdAt", "updatedAt"].includes(key)).map(([key, entry]) => [key, normalized(entry)]));
	return typeof value === "string" ? value.replace(/\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z/g, "<timestamp>") : value;
}
function compare(args: string[]): [unknown, unknown] {
	const values = providers.map(provider => JSON.parse(success(provider, args)) as unknown);
	deepStrictEqual(normalized(values[1]), normalized(values[0]));
	return [values[0], values[1]];
}
function step(name: string, action: () => void): void {
	try { action(); console.log(`PASS ${name}`); }
	catch (error) { failures++; console.log(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`); }
}
function storedIssues(): { identifier: string; description: string; comments: { id: string; body: string }[] }[] {
	return JSON.parse(readFileSync(join(dirs.mcp, "docs/tracker/linear-mock.json"), "utf8")).issues;
}
try {
	for (const provider of providers) {
		const dir = dirs[provider];
		mkdirSync(join(dir, "docs/tracker"), { recursive: true });
		cpSync(join(root, "kit/tools"), join(dir, "tools"), { recursive: true });
		cpSync(join(root, "tests/loops/fixtures/mosaic/docs/tracker/items.json"), join(dir, "docs/tracker/items.json"));
		cpSync(join(root, "kit/docs/tracker/config.json"), join(dir, "docs/tracker/config.json"));
	}
	const seeded = Bun.spawnSync([process.execPath, "tools/mcp/linear-mock.ts", "--seed-from", "docs/tracker/items.json"], { cwd: dirs.mcp, stdout: "pipe", stderr: "pipe" });
	strictEqual(seeded.exitCode, 0, seeded.stderr.toString());
	step("list: complete inventory matches replay", () => {
		const values = providers.map(provider => {
			const output = success(provider, ["list"]), trailer = output.lastIndexOf("\n{");
			deepStrictEqual(JSON.parse(output.slice(trailer)), { complete: true });
			return JSON.parse(output.slice(0, trailer));
		});
		deepStrictEqual(normalized(values[1]), normalized(values[0]));
		deepStrictEqual(values[1].map((item: { key: string }) => item.key), ["ENG-201", "ENG-202", "ENG-210", "ENG-211", "ENG-212"]);
	});
	step("get ENG-201: managed block and human discussion match replay", () => { compare(["get", "ENG-201"]); });
	step("intersect: declared ENG-201 and unknown-scope triage match replay", () => {
		const [, result] = compare(["intersect", "--areas", "contract:export_rows", "--repos", "member-a"]);
		ok(Array.isArray(result));
		deepStrictEqual(result.map((value: unknown) => { const item = row(value); return [item.key, item.scope]; }),
			[["ENG-201", "declared"], ["ENG-210", "unknown"], ["ENG-211", "unknown"], ["ENG-212", "unknown"]]);
	});
	step("intent: ENG-213 creation matches replay", () => {
		for (const provider of providers) strictEqual(success(provider, ["intent", "--title", "Exercise MCP tracker intent", "--repos", "member-a", "--areas", "contract:export_rows", "--writer", "w-smoke"]), "ENG-213");
		compare(["get", "ENG-213"]);
	});
	step("event approved: owning writer matches replay", () => { compare(["event", "ENG-213", "approved", "--writer", "w-smoke#1"]); });
	step("foreign event: exit 1 WRITER-CONFLICT without a write", () => {
		for (const provider of providers) {
			const before = success(provider, ["receipt", "ENG-213"]);
			const result = run(provider, ["event", "ENG-213", "executing", "--writer", "w-foreign#1"]);
			strictEqual(result.code, 1); ok(result.stderr.includes("WRITER-CONFLICT"));
			strictEqual(success(provider, ["receipt", "ENG-213"]), before);
		}
		compare(["get", "ENG-213"]);
	});
	step("comment twice: stable returned id and one stored comment", () => {
		for (const provider of providers) {
			writeFileSync(join(dirs[provider], "comment.txt"), "MCP smoke evidence: the adapter retained this comment.\n");
			const args = ["comment", "ENG-213", "--file", "comment.txt", "--writer", "w-smoke#1"];
			const first = success(provider, args), second = success(provider, args);
			strictEqual(first, second);
			const item = JSON.parse(success(provider, ["get", "ENG-213"]));
			strictEqual(item.comments.length, 1); strictEqual(item.comments[0].id, first);
		}
		const comments = storedIssues().find(issue => issue.identifier === "ENG-213")!.comments;
		strictEqual(comments.length, 1); ok(/<!-- mosaic:sha256:[a-f0-9]{64} -->$/.test(comments[0].body));
		compare(["get", "ENG-213"]);
	});
	step("receipt: accepted writes match replay and retain MCP ids", () => {
		const [, value] = compare(["receipt", "ENG-213"]);
		ok(Array.isArray(value));
		const entries = value.map(row);
		deepStrictEqual(entries.map(entry => entry.op), ["intent", "event", "comment"]);
		ok(entries.every(entry => typeof entry.mcpId === "string" && entry.mcpId.length > 0));
	});
	step("park/resume: pre-park state survives separate MCP sessions", () => {
		compare(["event", "ENG-213", "parked", "--writer", "w-smoke", "--note", "Waiting for smoke review; resume after approval"]);
		compare(["get", "ENG-213"]);
		compare(["event", "ENG-213", "resumed", "--writer", "w-smoke"]);
		const [, item] = compare(["get", "ENG-213"]);
		strictEqual(row(item).state, "approved");
	});
	step("done: landing receipt required for every repo", () => {
		for (const provider of providers) {
			const refused = run(provider, ["event", "ENG-213", "done", "--writer", "w-smoke"]);
			strictEqual(refused.code, 1); ok(refused.stderr.includes("landing receipt"));
		}
		compare(["event", "ENG-213", "done", "--writer", "w-smoke", "--receipt", JSON.stringify({ repo: "member-a", ref: "origin/main", commit: "abc123", reachable: true })]);
	});
	step("unmanaged comments: intake labels and writer ownership survive MCP", () => {
		const body = "INTAKE VERDICT ENG-210\nreading: smoke\nimplemented: no\ntouches: export\nrisk: bounded\nrefute: checked\nregistry: none\nretest: smoke\nquestions: none\ndisposition: light\nfingerprint: smoke\n";
		for (const provider of providers) {
			writeFileSync(join(dirs[provider], "verdict.txt"), body);
			success(provider, ["comment", "ENG-210", "--file", "verdict.txt", "--writer", "w-intake"]);
			writeFileSync(join(dirs[provider], "verdict.txt"), "A different writer must not take over.\n");
			const refused = run(provider, ["comment", "ENG-210", "--file", "verdict.txt", "--writer", "w-foreign"]);
			strictEqual(refused.code, 1); ok(refused.stderr.includes("WRITER-CONFLICT"));
		}
		const [, item] = compare(["get", "ENG-210"]);
		strictEqual(row(item).managed, null);
		const labels = row(item).labels;
		ok(Array.isArray(labels) && labels.includes("intake:light"));
	});
	step("provider precedence: CLI over environment over config", () => {
		const config = join(dirs.mcp, "docs/tracker/config.json");
		const nativeOnlyTitle = "Visible only through the mock";
		const storePath = join(dirs.mcp, "docs/tracker/linear-mock.json");
		const store = JSON.parse(readFileSync(storePath, "utf8"));
		store.issues.find((issue: { identifier: string }) => issue.identifier === "ENG-201").title = nativeOnlyTitle;
		writeFileSync(storePath, JSON.stringify(store));
		writeFileSync(config, JSON.stringify({ provider: "mcp" }));
		const env = { ...process.env };
		delete env.MOSAIC_TRACKER_PROVIDER;
		const configured = Bun.spawnSync([process.execPath, "tools/tracker.ts", "get", "ENG-201"], { cwd: dirs.mcp, env, stdout: "pipe", stderr: "pipe" });
		strictEqual(configured.exitCode, 0, configured.stderr.toString());
		strictEqual(JSON.parse(configured.stdout.toString()).title, nativeOnlyTitle);
		strictEqual(JSON.parse(success("mcp", ["--provider", "replay", "get", "ENG-201"])).title, JSON.parse(success("replay", ["get", "ENG-201"])).title);
		writeFileSync(config, JSON.stringify({ provider: "replay" }));
		strictEqual(JSON.parse(success("mcp", ["get", "ENG-201"])).title, nativeOnlyTitle);
	});
	step("error exits: refused lookup and unavailable server", () => {
		for (const provider of providers) strictEqual(run(provider, ["get", "ENG-99999"]).code, 1);
		writeFileSync(join(dirs.mcp, "docs/tracker/config.json"), JSON.stringify({ provider: "mcp", mcp: { command: join(temp, "absent-server"), args: [] } }));
		const result = run("mcp", ["list"]);
		strictEqual(result.code, 2); ok(result.stderr.includes("INCOMPLETE/UNAVAILABLE"));
		// Receipts remain available for reconciliation even when the server cannot start.
		const entries = JSON.parse(success("mcp", ["receipt", "ENG-213"]));
		deepStrictEqual(entries.map((entry: { op: string }) => entry.op), ["intent", "event", "comment", "event", "event", "event"]);
	});
} catch (error) {
	failures++;
	console.log(`FAIL setup: ${error instanceof Error ? error.message : String(error)}`);
} finally { rmSync(temp, { recursive: true, force: true }); }
console.log(`tracker-mcp-smoke: ${failures ? `${failures} FAIL` : "all PASS"}`);
process.exitCode = failures ? 1 : 0;
