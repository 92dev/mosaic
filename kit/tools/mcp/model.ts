import { createHash } from "node:crypto";

export type Managed = {
	plan: string | null; repos: string[]; areas: string[]; branch: Record<string, string>; writer: string;
	lastEvent: { event: string; ts: string }; parked: string | null; resumeState?: string;
};
export type Comment = { id: string; body: string; author: string; createdAt: string; writer?: string };
export type Item = {
	key: string; id: string; title: string; body: string; state: string; assignee: string | null;
	labels: string[]; team: string; url: string; updatedAt: string; repos: string[];
	managed: Managed | null; comments: Comment[]; attachments: unknown[];
};
export class Refused extends Error {}
export const refuse = (reason: string): never => { throw new Refused(reason); };
const begin = "<!-- mosaic:begin -->", end = "<!-- mosaic:end -->";

export function csv(value: string): string[] {
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
export function managedBody(body: string, managed: Managed): string {
	const block = [begin, `plan: ${managed.plan ?? "none"}`, `repos: ${managed.repos.join(", ")}`,
		`areas: ${managed.areas.join(", ") || "none"}`,
		`branch: ${Object.entries(managed.branch).map(([repo, branch]) => `${repo}:${branch}`).join(", ") || "none"}`,
		`writer: ${managed.writer}`, `last-event: ${managed.lastEvent.event} ${managed.lastEvent.ts}`,
		`parked: ${managed.parked ?? "none"}`, end].join("\n");
	const [left, right] = anchors(body);
	return left < 0 ? `${body}${body ? "\n\n" : ""}${block}` : body.slice(0, left) + block + body.slice(right + end.length);
}
// These transport-only markers preserve scope and park/resume data absent from native Linear fields.
export function description(item: Pick<Item, "body" | "repos" | "managed">): string {
	const { managed } = item;
	let body = managed ? managedBody(item.body, managed) : item.body;
	if (!managed) body += `${body ? "\n\n" : ""}<!-- mosaic:repos:${JSON.stringify(item.repos)} -->`;
	if (managed?.resumeState) body += `\n\n<!-- mosaic:resume-state:${JSON.stringify(managed.resumeState)} -->`;
	return body;
}
export function parseDescription(value: string): Pick<Item, "body" | "managed" | "repos"> {
	let repos: string[] = [], resumeState: string | undefined;
	const body = value.replace(/(?:\n\n)?<!-- mosaic:(repos|resume-state):([^\n]*?) -->/g, (_, field, encoded) => {
		const parsed = JSON.parse(encoded);
		if (field === "repos") {
			if (!Array.isArray(parsed) || !parsed.every(repo => typeof repo === "string" && repo.trim())) refuse("MANAGED-BLOCK-CONFLICT");
			repos = parsed;
		} else {
			if (typeof parsed !== "string" || !parsed.trim()) refuse("MANAGED-BLOCK-CONFLICT");
			resumeState = parsed;
		}
		return "";
	});
	const [left, right] = anchors(body);
	if (left < 0) return { body, repos, managed: null };
	const match = /^\nplan: ([^\n]+)\nrepos: ([^\n]+)\nareas: ([^\n]+)\nbranch: ([^\n]+)\nwriter: ([^\n]+)\nlast-event: (\S+) (\S+)\nparked: ([\s\S]+)\n$/.exec(body.slice(left + begin.length, right));
	if (!match) refuse("MANAGED-BLOCK-CONFLICT");
	const [, plan, repoList, areas, branches, writer, event, ts, parked] = match!;
	const branch: Record<string, string> = {};
	if (branches !== "none") for (const entry of csv(branches)) {
		const colon = entry.indexOf(":");
		if (colon < 1 || colon === entry.length - 1) refuse("MANAGED-BLOCK-CONFLICT");
		branch[entry.slice(0, colon)] = entry.slice(colon + 1);
	}
	const managed: Managed = { plan: plan === "none" ? null : plan, repos: csv(repoList),
		areas: areas === "none" ? [] : csv(areas), branch, writer, lastEvent: { event, ts }, parked: parked === "none" ? null : parked };
	if (resumeState) managed.resumeState = resumeState;
	return { body, repos: managed.repos, managed };
}
export const commentHash = (key: string, body: string): string => createHash("sha256").update(key + body).digest("hex");
export function commentBody(key: string, body: string, writer: string): string {
	return `${body}\n\n<!-- mosaic:writer:${writer} -->\n<!-- mosaic:sha256:${commentHash(key, body)} -->`;
}
export function parseComment(comment: { id: string; body: string; createdAt: string; user?: { name: string }; author?: string }): Comment {
	const marker = /\n\n<!-- mosaic:writer:([A-Za-z0-9_-]+#[1-9][0-9]*) -->\n<!-- mosaic:sha256:[a-f0-9]{64} -->$/.exec(comment.body);
	return { id: comment.id, body: marker ? comment.body.slice(0, marker.index) : comment.body,
		author: marker?.[1] ?? comment.user?.name ?? comment.author ?? "unknown", createdAt: comment.createdAt,
		...(marker ? { writer: marker[1] } : {}) };
}
