// tool_result(write|edit): append governed-record schema errors to the edited tool result.
// The runtime displays content/details; appended text prompts the model to fix and re-save.
// CLI: bun .omp/hooks/post/lint-ledgers.ts <registry-path>; 0 valid, 1 schema errors, 2 usage/unreadable.
import * as path from "node:path";
import { lintLedger, runLedgerCli } from "../../../tools/lint-ledgers.ts";
import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

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

export default function (pi: HookAPI) {
	pi.on("tool_result", (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;
		if (event.isError) return;

		const messages: string[] = [];
		for (const rel of targetPaths(event.input)) {
			let result;
			try { result = lintLedger(path.resolve(ctx.cwd, rel)); }
			catch { continue; } // fail-open: unreadable (e.g. renamed-away source)
			if (!result?.errors.length) continue;
			messages.push(
				`${result.subject} violates the ledger schema:\n` +
					result.errors.map(e => `  - ${e}`).join("\n") +
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

if (import.meta.main) runLedgerCli();
