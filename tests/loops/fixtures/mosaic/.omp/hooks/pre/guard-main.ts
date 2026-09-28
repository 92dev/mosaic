// tool_call(bash) adapter: block commits on the configured default branch.
// The port-neutral resolver follows cwd changes and inline scripts in tools/guard-main.ts.
// Binds LLM sessions only — a human terminal is the escape hatch.
// Landing policy lives in docs/process/git-flow.md, not in this commit guard.
// tool_call payload: {"toolName":"bash","input":{"command":"git commit -m x","cwd":"/repo"}}
// Read defaultBranch from the installed root's .omp/mosaic.json; if absent, default to main.
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";
import { resolveTarget } from "../../../tools/guard-main.ts";

const CONFIG_PATH = ".omp/mosaic.json";
async function configuredBranch(): Promise<string> {
	try {
		const config = JSON.parse(await readFile(join(import.meta.dir, "../../..", CONFIG_PATH), "utf8"));
		if (typeof config.defaultBranch !== "string" || !config.defaultBranch.trim() || /[\r\n\0]/.test(config.defaultBranch)) {
			throw new Error(`${CONFIG_PATH}: defaultBranch must be a nonempty single-line string`);
		}
		return config.defaultBranch;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return "main";
		throw error;
	}
}

export default function (pi: HookAPI) {
	pi.on("tool_call", async (event, ctx) => {
		if (event.toolName !== "bash") return;
		const cmd = String(event.input.command ?? "");
		if (!cmd) return;

		// The bash tool runs the command in its `cwd` param; resolution must too.
		const base = String(event.input.cwd ?? "") || ".";
		const target = resolveTarget(cmd, base);
		if (target === null) return; // not a git commit — nothing to guard
		let defaultBranch: string;
		try {
			defaultBranch = await configuredBranch();
		} catch (error) {
			return { block: true, reason: `Cannot read ${CONFIG_PATH}: ${String(error)}` };
		}

		// Fail-open: any error resolving the branch allows the command. The
		// tool-wrapper treats a thrown hook as a block, so never let git errors
		// escape (git missing, not a repo, detached HEAD, timeout, ...).
		let branch = "";
		try {
			const { stdout } = await pi.exec("git", ["-C", target, "branch", "--show-current"], {
				cwd: ctx.cwd,
				timeout: 5000,
			});
			branch = stdout.trim();
		} catch {
			return;
		}

		if (branch !== defaultBranch) return;

		return {
			block: true,
			reason:
				`Direct commits to ${defaultBranch} are blocked (docs/process/git-flow.md). Create a task branch in the target repo first:\n` +
				`  git -C ${target} checkout -b task/NNNN-<slug>   (branch name = plan filename in docs/plans/)\n` +
				`Landing on ${defaultBranch}: follow docs/process/git-flow.md after review + human sign-off.`,
		};
	});
}
