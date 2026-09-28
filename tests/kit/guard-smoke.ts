#!/usr/bin/env bun
import { ok, strictEqual } from "node:assert";
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { resolveTarget } from "../../kit/tools/guard-main.ts";

type GuardCase = { command: string; cwd: string; expectTarget: string | null; expectBlock?: boolean };
type GuardInput = { command: string; cwd: string };
type GuardResult = { block?: boolean; reason?: string } | undefined;
type GuardHandler = (event: { toolName: string; input: GuardInput }, context: { cwd: string }) => Promise<GuardResult>;

const scratch = mkdtempSync(join(tmpdir(), "mosaic-guard smoke-"));
const root = join(scratch, "root");
const member = join(root, "member");
const feat = join(root, "feat");
const nested = join(root, "a", "b");
const semicolon = join(root, "semi;colon");
const spaced = join(root, "dir with spaces");
const config = join(root, ".omp", "mosaic.json");
const ompHook = join(root, ".omp", "hooks", "pre", "guard-main.ts");
const claudeHook = join(root, ".claude", "hooks", "guard-main.sh");
const cli = join(root, "tools", "guard-main.ts");
const originalHome = process.env.HOME;
const originalOldPwd = process.env.OLDPWD;
const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

try {
	// Trap accidental HOME/OLDPWD expansion: unresolved cd forms use the tool cwd.
	process.env.HOME = member;
	process.env.OLDPWD = feat;
	const env = { ...process.env };
	for (const name of Object.keys(env)) {
		if (name.startsWith("GIT_")) delete env[name];
	}
	delete env.BASH_ENV;
	delete env.ENV;
	delete env.CDPATH;
	env.GIT_CONFIG_NOSYSTEM = "1";
	env.GIT_CONFIG_GLOBAL = "/dev/null";
	env.GIT_CONFIG_SYSTEM = "/dev/null";
	env.GUARD_SMOKE_GIT_NAME = "Guard Smoke";

	for (const [directory, branch] of [[root, "main"], [member, "main"], [feat, "task/probe"], [nested, "main"]]) {
		mkdirSync(directory, { recursive: true });
		const initialized = Bun.spawnSync(["git", "init", "--quiet", "--template=", "-b", branch, directory], {
			cwd: scratch, env, stdout: "pipe", stderr: "pipe",
		});
		strictEqual(initialized.exitCode, 0, `git init ${directory}\n${initialized.stderr}`);
	}
	for (const directory of [semicolon, spaced, dirname(ompHook), dirname(claudeHook)]) mkdirSync(directory, { recursive: true });
	cpSync(new URL("../../kit/tools/", import.meta.url), join(root, "tools"), { recursive: true });
	copyFileSync(new URL("../../kit/.omp/hooks/pre/guard-main.ts", import.meta.url), ompHook);
	copyFileSync(new URL("../../kit/.claude/hooks/guard-main.sh", import.meta.url), claudeHook);
	writeFileSync(config, JSON.stringify({ defaultBranch: "main" }));

	let handle!: GuardHandler;
	let forbiddenExecution: Error | undefined;
	// Exercise the installed module boundary: this temp-root path is selected at runtime.
	const { default: register } = await import(pathToFileURL(ompHook).href);
	register({
		on: (_event: string, callback: GuardHandler) => { handle = callback; },
		exec: async (command: string, args: string[], options: { cwd: string }) => {
			// The hook must inspect branches, never execute any guarded commit command.
			if (command !== "git" || args.length !== 4 || args[0] !== "-C" || args[2] !== "branch" || args[3] !== "--show-current") {
				forbiddenExecution = new Error(`Guard tried to execute more than a branch query: ${command} ${args.join(" ")}`);
				throw forbiddenExecution;
			}
			const result = Bun.spawnSync([command, ...args], { cwd: options.cwd, env, stdout: "pipe", stderr: "pipe" });
			if (result.exitCode !== 0) throw new Error(result.stderr.toString());
			return { stdout: result.stdout.toString() };
		},
	});

	async function adapters(input: GuardInput) {
		// Launch outside the installed root; config and imports must follow the adapter,
		// while repository selection must follow the tool payload's cwd.
		const omp = await handle({ toolName: "bash", input }, { cwd: scratch });
		if (forbiddenExecution) throw forbiddenExecution;
		const claude = Bun.spawnSync(["bash", claudeHook], {
			cwd: scratch, env, stdin: Buffer.from(JSON.stringify({ tool_input: input })), stdout: "pipe", stderr: "pipe",
		});
		return { omp, claude };
	}

	async function check(test: GuardCase): Promise<void> {
		const label = `${test.command}\ncwd: ${test.cwd}`;
		strictEqual(resolveTarget(test.command, test.cwd), test.expectTarget, `resolver: ${label}`);
		const { omp, claude } = await adapters({ command: test.command, cwd: test.cwd });
		const blocked = test.expectBlock ?? test.expectTarget !== null;
		strictEqual(Boolean(omp?.block), blocked, `omp: ${label}\n${omp?.reason ?? ""}`);
		strictEqual(claude.exitCode, blocked ? 2 : 0, `Claude: ${label}\n${claude.stdout}\n${claude.stderr}`);
		if (blocked) strictEqual(omp?.reason, claude.stderr.toString().trimEnd(), `block wording parity: ${label}`);
	}

	const cases: GuardCase[] = [
		{ command: "git commit -m x", cwd: root, expectTarget: root },
		{ command: "git -C member commit -m x", cwd: root, expectTarget: member },
		{ command: "git -C feat commit -m x", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "cd member && git commit -m x", cwd: root, expectTarget: member },
		{ command: "npm test && cd member && git commit -m x", cwd: root, expectTarget: member },
		{ command: ":; cd member && git commit -m x", cwd: root, expectTarget: member },
		{ command: "cd feat && git commit -m x", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "git -C a -C b commit -m x", cwd: root, expectTarget: nested },
		{ command: 'echo "$(git commit -m x)"', cwd: root, expectTarget: root },
		{ command: "`git commit`", cwd: root, expectTarget: root },
		{ command: 'bash -c "cd member && git commit -m x"', cwd: root, expectTarget: member },
		{ command: "bash <<'EOF'\ncd member\ngit commit -m x\nEOF", cwd: root, expectTarget: member },
		{ command: 'grep -n "git commit" docs/process/git-flow.md', cwd: root, expectTarget: null },
		{ command: "git commit-tree HEAD^{tree}", cwd: root, expectTarget: null },
		{ command: "git -c user.name=x commit -m x", cwd: root, expectTarget: root },
		{ command: "git log", cwd: root, expectTarget: null },
		{ command: "/usr/bin/git commit -m x", cwd: root, expectTarget: root },
		{ command: "git commit -m x", cwd: scratch, expectTarget: scratch, expectBlock: false },

		// -C is applied sequentially to the current shell directory, not just the last value.
		{ command: `git -C member -C ${quote(feat)} commit -m x`, cwd: root, expectTarget: feat, expectBlock: false },
		{ command: `git -C ${quote(join(root, "a"))} -C b commit -m x`, cwd: feat, expectTarget: nested },
		{ command: "git -C ../feat commit -m x", cwd: member, expectTarget: feat, expectBlock: false },
		{ command: "cd .. && git -C member commit -m x", cwd: feat, expectTarget: member },
		{ command: "git -Ca -Cb commit -m x", cwd: root, expectTarget: nested },
		{ command: 'git -C member -C "" commit -m x', cwd: root, expectTarget: member },
		{ command: "cd feat; cd ../member; git commit -m x", cwd: root, expectTarget: member },
		{ command: "cd member\ncd ../feat\ngit commit -m x", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "pushd feat && git commit -m x", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "cd member && cd && git commit -m x", cwd: root, expectTarget: root },
		{ command: "cd - && git commit -m x", cwd: root, expectTarget: root },
		{ command: "cd ..; cd; git commit -m x", cwd: feat, expectTarget: feat, expectBlock: false },
		{ command: "cd member; cd ../feat; cd -; git commit -m x", cwd: root, expectTarget: root },

		// Nested shells inherit the current directory, but cannot change their caller's cwd.
		{ command: 'bash -lc "cd member && git commit -m x"', cwd: root, expectTarget: member },
		{ command: 'bash -ec "cd feat && git commit -m x"', cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "eval 'cd member && git commit -m x'", cwd: root, expectTarget: member },
		{ command: "cd member && bash -c 'cd ../feat; cd; git commit -m x'", cwd: root, expectTarget: member },
		{ command: "bash -c 'cd feat'; git commit -m x", cwd: root, expectTarget: root },
		{ command: "MODE=probe git -C member commit -m x", cwd: root, expectTarget: member },
		{ command: "echo git commit -m x", cwd: root, expectTarget: null },
		{ command: `printf '%s' "$(printf '%s' "$(git -C member commit -m x)")"`, cwd: root, expectTarget: member },
		{ command: 'echo `echo \\`git -C member commit\\``', cwd: root, expectTarget: member },
		{ command: `echo "$(printf '%s' ')'; git -C member commit)"`, cwd: root, expectTarget: member },
		{ command: 'echo "$(cd feat && git commit -m x)"', cwd: root, expectTarget: feat, expectBlock: false },
		{ command: 'echo "$(cd feat)"; git commit -m x', cwd: root, expectTarget: root },
		{ command: 'git -C feat commit -m "$(git -C member commit -m x)"', cwd: root, expectTarget: member },

		{ command: "bash <<-'EOF'\n\tcd feat\n\tgit commit -m x\n\tEOF", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "cat <<'EOF'\ncd member\ngit commit -m x\nEOF", cwd: root, expectTarget: null },
		{ command: "cat <<'EOF'\ngit commit -m x\nEOF\ngit -C feat commit -m x", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "bash <<'EOF'\nprintf '%s\\n' 'git commit -m x'\nEOF", cwd: root, expectTarget: null },
		{ command: "echo '$(git commit -m x)'", cwd: root, expectTarget: null },
		{ command: "echo '`git commit -m x`'", cwd: root, expectTarget: null },
		{ command: `printf '%s\\n' "git commit; cd member && git commit"`, cwd: root, expectTarget: null },
		{ command: 'cd "semi;colon" && git commit -m x', cwd: root, expectTarget: semicolon },
		{ command: "git -C dir\\ with\\ spaces commit -m x", cwd: root, expectTarget: spaced },
		{ command: 'echo "\\$(git commit -m x)"', cwd: root, expectTarget: null },
		{ command: 'echo "\\`git commit -m x\\`"', cwd: root, expectTarget: null },
		{ command: "git \\\n-C member \\\ncommit -m x", cwd: root, expectTarget: member },
		{ command: "echo git\\ commit", cwd: root, expectTarget: null },

		// Only the first executed commit is guarded, including an earlier substitution.
		{ command: "git -C feat commit -m first; git -C member commit -m second", cwd: root, expectTarget: feat, expectBlock: false },
		{ command: 'echo "$(git -C feat commit -m first)"; git -C member commit -m second', cwd: root, expectTarget: feat, expectBlock: false },
		{ command: "git --git-dir .git --work-tree . --namespace probe --super-prefix member/ --config-env user.name=GUARD_SMOKE_GIT_NAME commit -m x", cwd: root, expectTarget: root },
		{ command: "git --git-dir=.git --work-tree=. --namespace=probe --super-prefix=member/ --config-env=user.name=GUARD_SMOKE_GIT_NAME commit -m x", cwd: root, expectTarget: root },
		{ command: "git -cuser.name=x commit -m x", cwd: root, expectTarget: root },
		{ command: "git --git-dir commit log", cwd: root, expectTarget: null },
		{ command: "git --work-tree commit log", cwd: root, expectTarget: null },
		{ command: "git --namespace commit log", cwd: root, expectTarget: null },
		{ command: "git --super-prefix commit log", cwd: root, expectTarget: null },
		{ command: "git --config-env user.name=GUARD_SMOKE_GIT_NAME log", cwd: root, expectTarget: null },
		{ command: "git -c alias.probe=commit log", cwd: root, expectTarget: null },
		{ command: "git --no-pager -C member --no-optional-locks commit -m x", cwd: root, expectTarget: member },
	];
	for (const test of cases) await check(test);
	console.log(`PASS ${cases.length} command cases: resolver, installed omp hook, installed Claude hook, and branch-block wording parity`);

	const cliCases = [
		{ payload: { command: "git -C member commit -m x", cwd: root }, expected: member },
		{ payload: { tool_input: { command: "git -C ../feat commit -m x", cwd: member } }, expected: feat },
		{ payload: { command: "echo '$(git commit -m x)'", cwd: root }, expected: "SKIP" },
		{ payload: { tool_input: { command: "git log", cwd: root } }, expected: "SKIP" },
	];
	for (const { payload, expected } of cliCases) {
		const result = Bun.spawnSync([process.execPath, cli], {
			cwd: scratch, env, stdin: Buffer.from(JSON.stringify(payload)), stdout: "pipe", stderr: "pipe",
		});
		strictEqual(result.exitCode, 0, `resolver CLI: ${JSON.stringify(payload)}\n${result.stderr}`);
		strictEqual(result.stdout.toString().trimEnd(), expected, `resolver CLI: ${JSON.stringify(payload)}`);
	}
	for (const args of [[], ["--hook"]]) {
		const result = Bun.spawnSync([process.execPath, cli, ...args], {
			cwd: scratch, env, stdin: Buffer.from("{"), stdout: "pipe", stderr: "pipe",
		});
		strictEqual(result.exitCode, 2, `malformed CLI JSON ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
	}
	console.log("PASS resolver CLI: flat and tool_input payloads, target/SKIP output, malformed JSON exits 2 in both modes");

	// Configuration belongs to the installation, not the queried member or launch cwd.
	writeFileSync(config, JSON.stringify({ defaultBranch: "task/probe" }));
	await check({ command: "git commit -m x", cwd: feat, expectTarget: feat, expectBlock: true });
	await check({ command: "git commit -m x", cwd: root, expectTarget: root, expectBlock: false });
	writeFileSync(config, "{");
	const malformed = await adapters({ command: "git commit -m x", cwd: root });
	ok(malformed.omp?.block, "omp must fail closed on malformed installed config");
	strictEqual(malformed.claude.exitCode, 2, `Claude must fail closed on malformed installed config\n${malformed.claude.stderr}`);
	console.log("PASS installed config: custom default branch and malformed JSON fail-closed on both adapters");
} finally {
	if (originalHome === undefined) delete process.env.HOME;
	else process.env.HOME = originalHome;
	if (originalOldPwd === undefined) delete process.env.OLDPWD;
	else process.env.OLDPWD = originalOldPwd;
	rmSync(scratch, { recursive: true, force: true });
}
