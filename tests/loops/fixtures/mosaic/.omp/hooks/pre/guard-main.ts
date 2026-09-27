// tool_call(bash) gate: block `git commit` on the configured default branch.
//
// Multi-repo aware (link repo + member repos): resolves the repo from `git -C <dir>` or a leading
// `cd <dir> &&` in the command, both joined against the bash tool's `cwd` parameter when relative;
// falls back to that cwd, then the session cwd. Binds LLM sessions only — a human terminal is the escape hatch.
// Landing policy lives in docs/process/git-flow.md, not in this commit guard.
//
// Detection scans tokens: `commit` must be git's actual subcommand, the first non-option token after `git`, with git's
// value-taking global options consumed. `git commit-tree` is deliberately NOT matched — it writes an
// object and moves no branch ref.
// tool_call payload: {"toolName":"bash","input":{"command":"git commit -m x","cwd":"/repo"}}
// Read defaultBranch from the installed root's .omp/mosaic.json; if absent, default to main.
import { readFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import type { HookAPI } from "@oh-my-pi/pi-coding-agent/extensibility/hooks";

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

/** git global options that consume the following token as their value. */
const VALUE_OPTIONS = new Set([
	"-C",
	"-c",
	"--git-dir",
	"--work-tree",
	"--namespace",
	"--super-prefix",
	"--config-env",
]);

/**
 * Splits a shell command into quote-aware token lists, one per `| ; & && ||`-separated segment.
 * Quotes are stripped, backslash escapes are honoured; `$(…)` and backticks are not expanded —
 * the same blind spot the previous regex had.
 */
function segments(command: string): string[][] {
	const result: string[][] = [];
	let segment: string[] = [];
	let token = "";
	let started = false;
	let quote: string | null = null;

	const endToken = () => {
		if (!started) return;
		segment.push(token);
		token = "";
		started = false;
	};
	const endSegment = () => {
		endToken();
		if (segment.length > 0) result.push(segment);
		segment = [];
	};

	for (let i = 0; i < command.length; i += 1) {
		const char = command[i]!;
		if (quote !== null) {
			if (char === quote) quote = null;
			else token += char;
			continue;
		}
		if (char === '"' || char === "'") {
			quote = char;
			started = true;
			continue;
		}
		if (char === "\\" && i + 1 < command.length) {
			token += command[i + 1]!;
			started = true;
			i += 1;
			continue;
		}
		if (/\s/.test(char)) {
			endToken();
			continue;
		}
		if (char === "|" || char === "&" || char === ";") {
			endSegment();
			if (char !== ";" && command[i + 1] === char) i += 1;
			continue;
		}
		token += char;
		started = true;
	}
	endSegment();
	return result;
}

/**
 * The `-C` directory of a `git commit` in this segment, `""` when it commits without one, or
 * `null` when the segment is not a git commit.
 */
function commitDirIn(tokens: readonly string[]): string | null {
	for (let start = 0; start < tokens.length; start += 1) {
		const head = tokens[start]!;
		if (head !== "git" && !head.endsWith("/git")) continue;
		let directory = "";
		let index = start + 1;
		while (index < tokens.length) {
			const token = tokens[index]!;
			if (VALUE_OPTIONS.has(token)) {
				if (token === "-C") directory = tokens[index + 1] ?? "";
				index += 2;
				continue;
			}
			if (token.startsWith("-C") && token.length > 2) {
				directory = token.slice(2);
				index += 1;
				continue;
			}
			if (token.startsWith("-")) {
				index += 1;
				continue;
			}
			break;
		}
		if (tokens[index] === "commit") return directory;
	}
	return null;
}

/** Join a command-derived dir against the tool-call base cwd; an absolute dir wins. */
function joinBase(base: string, directory: string): string {
	if (directory === "") return base;
	return isAbsolute(directory) ? directory : join(base, directory);
}

/** Resolve the repo dir a `git commit` targets, or null when the command has no commit. */
function resolveTarget(command: string, base: string): string | null {
	const parsed = segments(command);
	for (const tokens of parsed) {
		const directory = commitDirIn(tokens);
		if (directory === null) continue;
		if (directory !== "") return joinBase(base, directory);
		// Leading `cd <dir> && …` (first cd wins), mirroring the sh port.
		const first = parsed[0]!;
		if (first[0] === "cd" && first[1] !== undefined) return joinBase(base, first[1]);
		return base;
	}
	return null;
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
