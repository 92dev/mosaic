import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";
import { parseComment, parseDescription, Refused, type Comment, type Item } from "./model.ts";

type Pending = { resolve(value: unknown): void; reject(error: Error): void; timer: NodeJS.Timeout };
const unavailable = (message: string) => new Error(`INCOMPLETE/UNAVAILABLE: ${message}`);
export function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw unavailable("expected an object");
	return value as Record<string, unknown>;
}
function text(value: unknown): string {
	if (typeof value !== "string") throw unavailable("expected a string");
	return value;
}
function name(value: unknown): string {
	return typeof value === "string" ? value : text(object(value).name);
}

export class McpClient {
	private process: ChildProcessWithoutNullStreams;
	private pending = new Map<number, Pending>();
	private sequence = 0;
	private failure?: Error;
	private stderr = "";

	private constructor(value: unknown) {
		const config = object(value);
		if (config.command !== undefined && (typeof config.command !== "string" || !config.command.trim())) throw unavailable("invalid mcp.command");
		if (config.args !== undefined && (!Array.isArray(config.args) || !config.args.every(arg => typeof arg === "string"))) throw unavailable("invalid mcp.args");
		this.process = spawn(typeof config.command === "string" ? config.command : "bun",
			Array.isArray(config.args) ? config.args : ["tools/mcp/linear-mock.ts", "--store", "docs/tracker/linear-mock.json"], { stdio: "pipe" });
		this.process.stderr.on("data", chunk => { this.stderr = (this.stderr + chunk.toString()).slice(-8192); });
		this.process.on("error", error => this.fail(unavailable(error.message)));
		this.process.stdin.on("error", error => this.fail(unavailable(error.message)));
		this.process.on("close", (code, signal) => this.fail(unavailable(`MCP server closed (${signal ?? code})${this.stderr ? `: ${this.stderr.trim()}` : ""}`)));
		createInterface({ input: this.process.stdout }).on("line", line => {
			try {
				const message = object(JSON.parse(line));
				if (message.jsonrpc !== "2.0") throw new Error("invalid JSON-RPC response");
				if (message.id === undefined) return;
				if (typeof message.id !== "number") throw new Error("invalid response ID");
				const request = this.pending.get(message.id);
				if (!request) return;
				const errorMessage = message.error ? text(object(message.error).message) : undefined;
				clearTimeout(request.timer);
				this.pending.delete(message.id);
				if (errorMessage !== undefined) request.reject(unavailable(errorMessage));
				else if (!Object.hasOwn(message, "result")) request.reject(unavailable("missing MCP result"));
				else request.resolve(message.result);
			} catch (error) { this.fail(unavailable(`invalid MCP output: ${error instanceof Error ? error.message : String(error)}`)); }
		});
	}
	static async connect(config: unknown = {}): Promise<McpClient> {
		const client = new McpClient(config);
		try {
			const result = object(await client.request("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "mosaic-tracker", version: "1.0.0" } }));
			if (result.protocolVersion !== "2025-06-18" || !object(result.capabilities).tools) throw unavailable("server does not support MCP 2025-06-18 tools");
			client.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
			return client;
		} catch (error) { client.close(); throw error; }
	}
	private fail(error: Error): void {
		this.failure ??= error;
		for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(error); }
		this.pending.clear();
	}
	private request(method: string, params: unknown): Promise<unknown> {
		if (this.failure) return Promise.reject(this.failure);
		const id = ++this.sequence;
		const { promise, resolve, reject } = Promise.withResolvers<unknown>();
		const timer = setTimeout(() => { this.fail(unavailable(`${method} timed out after 30 s`)); this.close(); }, 30_000);
		this.pending.set(id, { resolve, reject, timer });
		this.process.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
		return promise;
	}
	async call(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
		const result = object(await this.request("tools/call", { name, arguments: args }));
		const first = Array.isArray(result.content) && result.content.length ? object(result.content[0]) : {};
		const content = first.type === "text" && typeof first.text === "string" ? first.text : "";
		let value: unknown;
		try { value = JSON.parse(content); }
		catch { if (!result.isError) throw unavailable(`${name} returned non-JSON text`); }
		if (result.isError) {
			const error = value && typeof value === "object" ? object(value) : {};
			const message = typeof error.error === "string" ? error.error : typeof error.message === "string" ? error.message : content || `${name} failed`;
			if (error.code === "UNAVAILABLE" || error.code === "UNSUPPORTED" || /INCOMPLETE\/UNAVAILABLE|unsupported/i.test(message)) throw unavailable(message);
			throw new Refused(message);
		}
		return value;
	}
	close(): void {
		this.fail(unavailable("MCP client closed"));
		this.process.stdin.end();
		this.process.kill();
	}
}

export function collection(value: unknown, key: "issues" | "comments"): unknown[] {
	if (Array.isArray(value)) return value;
	const result = object(value);
	if (result.hasNextPage || (result.pageInfo && object(result.pageInfo).hasNextPage)) throw unavailable(`incomplete ${key}`);
	const entries = result[key];
	if (!Array.isArray(entries)) throw unavailable(`malformed ${key}`);
	return entries;
}
export function commentFromResult(value: unknown): Comment {
	const comment = object(value);
	return parseComment({ id: text(comment.id), body: text(comment.body), createdAt: text(comment.createdAt),
		...(comment.user ? { user: { name: name(comment.user) } } : {}), ...(comment.author ? { author: name(comment.author) } : {}) });
}
export function itemFromIssue(value: unknown): Item {
	const issue = object(value);
	if (!Array.isArray(issue.labels)) throw unavailable("malformed issue labels");
	return { key: text(issue.identifier), id: text(issue.id), title: text(issue.title), ...parseDescription(text(issue.description)),
		state: name(issue.state), assignee: issue.assignee == null ? null : name(issue.assignee), labels: issue.labels.map(name),
		team: name(issue.team), url: text(issue.url), updatedAt: text(issue.updatedAt),
		comments: Array.isArray(issue.comments) ? issue.comments.map(commentFromResult) : [],
		attachments: Array.isArray(issue.attachments) ? issue.attachments : [] };
}
