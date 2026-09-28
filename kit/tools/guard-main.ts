#!/usr/bin/env bun
// Port-neutral commit-target resolver used by both runtime adapters. This is a lexical
// guard, not a shell evaluator: git aliases, scripts on disk, and xargs are not inspected.
// It follows cwd changes and inline shell bodies without running any submitted command.
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";

const CONFIG_PATH = ".omp/mosaic.json";
const VALUE_OPTIONS: Record<string, true> = {
	"-C": true, "-c": true, "--git-dir": true, "--work-tree": true,
	"--namespace": true, "--super-prefix": true, "--config-env": true,
};
const SHELLS: Record<string, true> = { bash: true, sh: true, zsh: true };
type Body = { text: string; end: number };
type Segment = { tokens: string[]; substitutions: string[]; heredocs: string[] };
type Heredoc = { segment: Segment; delimiter: string; stripTabs: boolean };

function backtickBody(command: string, start: number): Body | null {
	for (let index = start + 1; index < command.length; index++) {
		if (command[index] === "\\") index++;
		else if (command[index] === "`") {
			return { text: command.slice(start + 1, index).replace(/\\([$`\\])/g, "$1"), end: index };
		}
	}
	return null;
}

/** Find a balanced $(...) body, ignoring quoted parentheses and nested substitutions. */
function substitutionBody(command: string, start: number): Body | null {
	let depth = 1;
	let quote = "";
	for (let index = start + 2; index < command.length; index++) {
		const char = command[index]!;
		if (quote === "'") {
			if (char === quote) quote = "";
			continue;
		}
		if (char === "\\") { index++; continue; }
		if (char === quote) { quote = ""; continue; }
		if (!quote && (char === "'" || char === '"')) { quote = char; continue; }
		if (char === "`" || (char === "$" && command[index + 1] === "(")) {
			const nested = char === "`" ? backtickBody(command, index) : substitutionBody(command, index);
			if (nested === null) return null;
			index = nested.end;
			continue;
		}
		if (quote) continue;
		if (char === "(") depth++;
		if (char === ")" && --depth === 0) return { text: command.slice(start + 2, index), end: index };
	}
	return null;
}

/** Quote-aware shell words; heredoc bodies never become outer commands or cwd changes. */
function segments(command: string): Segment[] {
	const result: Segment[] = [];
	const pending: Heredoc[] = [];
	let segment: Segment = { tokens: [], substitutions: [], heredocs: [] };
	let token = "";
	let started = false;
	let quote = "";
	let heredoc: { stripTabs: boolean } | null = null;
	const endToken = () => {
		if (!started) return;
		if (heredoc) {
			pending.push({ segment, delimiter: token, stripTabs: heredoc.stripTabs });
			heredoc = null;
		} else segment.tokens.push(token);
		token = "";
		started = false;
	};
	const endSegment = () => {
		endToken();
		if (segment.tokens.length || segment.substitutions.length) result.push(segment);
		segment = { tokens: [], substitutions: [], heredocs: [] };
	};
	for (let index = 0; index < command.length; index++) {
		const char = command[index]!;
		if (quote === "'") {
			if (char === quote) quote = "";
			else token += char;
			continue;
		}
		if (char === "\\" && index + 1 < command.length) {
			const next = command[index + 1]!;
			if (!quote || '$`"\\\n'.includes(next)) {
				if (next !== "\n") { token += next; started = true; }
				index++;
				continue;
			}
		}
		if (char === quote) { quote = ""; continue; }
		if (!quote && (char === '"' || char === "'")) { quote = char; started = true; continue; }
		if (!heredoc && (char === "`" || (char === "$" && command[index + 1] === "("))) {
			const body = char === "`" ? backtickBody(command, index) : substitutionBody(command, index);
			if (body !== null) {
				segment.substitutions.push(body.text);
				token += command.slice(index, body.end + 1);
				started = true;
				index = body.end;
				continue;
			}
		}
		if (quote) { token += char; continue; }
		if (char === "#" && !started) {
			while (index < command.length && command[index] !== "\n") index++;
			index--;
			continue;
		}
		if (char === "<" && command[index + 1] === "<" && command[index + 2] !== "<") {
			endToken();
			const stripTabs = command[index + 2] === "-";
			heredoc = { stripTabs };
			index += stripTabs ? 2 : 1;
			continue;
		}
		if (char === "\n") {
			endSegment();
			let cursor = index + 1;
			for (const document of pending) {
				const body: string[] = [];
				while (cursor < command.length) {
					const newline = command.indexOf("\n", cursor);
					const end = newline < 0 ? command.length : newline;
					let line = command.slice(cursor, end);
					if (document.stripTabs) line = line.replace(/^\t+/, "");
					cursor = newline < 0 ? command.length : newline + 1;
					if (line === document.delimiter) break;
					body.push(line);
				}
				document.segment.heredocs.push(body.join("\n"));
			}
			pending.length = 0;
			index = cursor - 1;
			continue;
		}
		if (/\s/.test(char)) { endToken(); continue; }
		if (char === "|" || char === "&" || char === ";") {
			endSegment();
			if (char !== ";" && command[index + 1] === char) index++;
			continue;
		}
		token += char;
		started = true;
	}
	endSegment();
	return result;
}

function joinBase(base: string, directory: string): string {
	return directory === "" ? base : isAbsolute(directory) ? directory : join(base, directory);
}

/** Consume git's global options; each relative -C is based on the preceding one. */
function commitTarget(tokens: readonly string[], start: number, cwd: string): string | null {
	let directory = cwd;
	let index = start + 1;
	while (index < tokens.length) {
		const token = tokens[index]!;
		if (VALUE_OPTIONS[token] === true) {
			if (tokens[index + 1] === undefined) return null;
			if (token === "-C") directory = joinBase(directory, tokens[index + 1]!);
			index += 2;
		} else if (token.startsWith("-C") && token.length > 2) {
			directory = joinBase(directory, token.slice(2));
			index++;
		} else if (token.startsWith("-")) index++;
		else break;
	}
	return tokens[index] === "commit" ? directory : null;
}

/** Resolve the first git commit's directory, or null when no inspected command commits. */
export function resolveTarget(command: string, cwd: string): string | null {
	let effective = cwd;
	for (const segment of segments(command)) {
		for (const body of segment.substitutions) {
			const target = resolveTarget(body, effective);
			if (target !== null) return target;
		}
		const tokens = segment.tokens;
		let start = 0;
		while (/^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[start] ?? "")) start++;
		const head = basename(tokens[start] ?? "");
		if (head === "cd" || head === "pushd") {
			const directory = tokens[start + 1] === "--" ? tokens[start + 2] : tokens[start + 1];
			effective = directory === undefined || directory === "-" ? cwd : joinBase(effective, directory);
		} else if (head === "git") {
			const target = commitTarget(tokens, start, effective);
			if (target !== null) return target;
		} else if (head === "eval") {
			const target = resolveTarget(tokens.slice(start + 1).join(" "), effective);
			if (target !== null) return target;
		} else if (SHELLS[head] === true) {
			let index = start + 1;
			let stdin = false;
			let script: string | undefined;
			for (; index < tokens.length; index++) {
				const option = tokens[index]!;
				if (option === "--") { index++; break; }
				if (!option.startsWith("-")) break;
				if (/^-[^-]*c/.test(option)) { script = tokens[index + 1] ?? ""; break; }
				if (/^-[^-]*s/.test(option)) stdin = true;
				if (["-o", "-O", "--rcfile", "--init-file"].includes(option)) index++;
			}
			const bodies = script !== undefined ? [script] : stdin || index === tokens.length ? segment.heredocs : [];
			for (const body of bodies) {
				const target = resolveTarget(body, effective);
				if (target !== null) return target;
			}
		}
	}
	return null;
}

async function hook(target: string): Promise<number> {
	let defaultBranch: string;
	try {
		try {
			const config = JSON.parse(await readFile(join(import.meta.dir, "..", CONFIG_PATH), "utf8"));
			if (typeof config.defaultBranch !== "string" || !config.defaultBranch.trim() || /[\r\n\0]/.test(config.defaultBranch)) {
				throw new Error(`${CONFIG_PATH}: defaultBranch must be a nonempty single-line string`);
			}
			defaultBranch = config.defaultBranch;
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
			defaultBranch = "main";
		}
	} catch (error) {
		console.error(`Cannot read ${CONFIG_PATH}: ${String(error)}`);
		return 2;
	}
	// Fail open on git errors, including an unavailable executable or a non-repository cwd.
	const branch = spawnSync("git", ["-C", target, "branch", "--show-current"], { encoding: "utf8", timeout: 5000 });
	if (branch.status !== 0 || branch.stdout.trim() !== defaultBranch) return 0;
	console.error(
		`Direct commits to ${defaultBranch} are blocked (docs/process/git-flow.md). Create a task branch in the target repo first:\n` +
		`  git -C ${target} checkout -b task/NNNN-<slug>   (branch name = plan filename in docs/plans/)\n` +
		`Landing on ${defaultBranch}: follow docs/process/git-flow.md after review + human sign-off.`,
	);
	return 2;
}

async function main(): Promise<number> {
	if (process.argv.length > 2 && (process.argv.length !== 3 || process.argv[2] !== "--hook")) {
		console.error("Usage: bun tools/guard-main.ts [--hook] < command.json");
		return 2;
	}
	let command: string;
	let cwd: string;
	try {
		const payload = JSON.parse(await Bun.stdin.text());
		const input = payload?.tool_input ?? payload;
		if (input === null || typeof input !== "object" || Array.isArray(input)
			|| (input.command !== undefined && typeof input.command !== "string")
			|| (input.cwd !== undefined && typeof input.cwd !== "string")) throw new Error("expected {command, cwd}");
		command = input.command ?? "";
		cwd = input.cwd || ".";
	} catch (error) {
		console.error(`Cannot read guard input: ${String(error)}`);
		return 2;
	}
	const target = resolveTarget(command, cwd);
	if (process.argv[2] === "--hook") return target === null ? 0 : hook(target);
	console.log(target ?? "SKIP");
	return 0;
}

if (import.meta.main) process.exitCode = await main();
