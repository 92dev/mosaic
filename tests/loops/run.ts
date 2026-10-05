import { cp, mkdir, mkdtemp, open, readdir, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { isRecord, parseEvent, parseEvents } from "./metrics.ts";
import type { LoopEvent, Metrics } from "./metrics.ts";

export type CheckResult = { id: string; outcome: "PASS" | "FAIL" | "CANNOT-EVALUATE"; evidence: string };
export type CheckContext = {
  runDir: string;
  workDir: string;
  fixtureDir: string;
  events: LoopEvent[];
  metrics: Metrics;
  exec: (cmd: string, cwd?: string) => Promise<{ code: number; stdout: string; stderr: string }>;
};
export type RunMeta = {
  scenario: string; harness: string; model: string; thinking: string; agent?: string; roles?: Record<string, string>;
  startedAt: string; wallSeconds: number; exitCode: number; tag?: string;
  workDir: string; fixtureDir: string; timedOut: boolean; timeoutSeconds: number; notes: string[];
};

const root = import.meta.dir;

async function execute(cmd: string[], cwd: string, env = process.env) {
  const child = Bun.spawn(cmd, { cwd, env, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  const [code, stdout, stderr] = await Promise.all([
    child.exited, new Response(child.stdout).text(), new Response(child.stderr).text(),
  ]);
  return { code, stdout, stderr };
}

async function repositories(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const repos = entries.some(entry => entry.name === ".git") ? [dir] : [];
  for (const entry of entries) {
    if (entry.isDirectory() && !entry.name.endsWith(".git")) repos.push(...await repositories(join(dir, entry.name)));
  }
  return repos;
}

async function collectDiff(workDir: string, baselines: Map<string, string>, mains: Map<string, string>) {
  const patches: string[] = [];
  for (const repo of await repositories(workDir)) {
    const name = relative(workDir, repo);
    const status = await execute(["git", "status", "--porcelain"], repo);
    const untracked = await execute(["git", "ls-files", "--others", "--exclude-standard"], repo);
    const add = await execute(["git", "add", "-N", "."], repo);
    if (status.code || untracked.code || add.code) throw new Error(`Cannot capture ${name || "."}: ${status.stderr}${untracked.stderr}${add.stderr}`);
    let baseline = baselines.get(repo);
    if (!baseline) {
      const empty = await execute(["git", "hash-object", "-w", "-t", "tree", "--stdin"], repo);
      if (empty.code) throw new Error(empty.stderr);
      baseline = empty.stdout.trim();
    }
    const prefix = name ? `${name}/` : "";
    const diff = await execute([
      "git", "diff", "--no-ext-diff", "--binary", `--src-prefix=a/${prefix}`, `--dst-prefix=b/${prefix}`, baseline, "--",
    ], repo);
    if (diff.code) throw new Error(`Cannot diff ${name || "."}: ${diff.stderr}`);
    if (diff.stdout || status.stdout || untracked.stdout) {
      patches.push(`# Repository: ${name || "."}\n# Status before intent-to-add\n${status.stdout}# Untracked files\n${untracked.stdout}${diff.stdout}`);
    }
    const mainBefore = mains.get(repo);
    if (mainBefore) {
      const log = await execute(["git", "log", "--oneline", `${mainBefore}..main`], repo);
      const landed = await execute(["git", "diff", "--no-ext-diff", `--src-prefix=a/${prefix}`, `--dst-prefix=b/${prefix}`, `${mainBefore}..main`], repo);
      const branches = await execute(["git", "branch", "--list"], repo);
      if (!log.code && log.stdout.trim()) {
        patches.push(`# Repository: ${name || "."} — landed on main since setup\n${log.stdout}# Branches now\n${branches.stdout}${landed.stdout}`);
      }
    }
  }
  return patches.join("\n");
}

function codeBlock(text: string, language = "") {
  const width = Math.max(3, ...Array.from(text.matchAll(/`+/g), match => match[0].length + 1));
  const fence = "`".repeat(width);
  return `${fence}${language}\n${text}\n${fence}`;
}

function transcript(prompt: string, events: LoopEvent[], notes: string[]) {
  const sections = ["# Transcript", "## User prompt", prompt];
  let turn = 0;
  for (const event of events) {
    if (event.type === "turn_start") sections.push(`## Turn ${++turn}`);
    if (event.type === "message_end" && isRecord(event.message) && event.message.role === "assistant") {
      for (const block of Array.isArray(event.message.content) ? event.message.content : []) {
        if (!isRecord(block)) continue;
        if (block.type === "thinking" && typeof block.thinking === "string") sections.push("### Thinking", block.thinking.slice(0, 300));
        if (block.type === "text" && typeof block.text === "string") sections.push("### Assistant", block.text);
      }
    }
    if (event.type === "tool_execution_start") {
      sections.push(`### Tool: ${event.toolName}`, codeBlock(JSON.stringify(event.args ?? {}), "json"));
    }
    if (event.type === "tool_execution_end") {
      const content = isRecord(event.result) && Array.isArray(event.result.content) ? event.result.content : [];
      const text = content.map(block => isRecord(block) && typeof block.text === "string" ? block.text : JSON.stringify(block)).join("\n") || JSON.stringify(event.result ?? null);
      sections.push(`### Result: ${event.toolName}${event.isError ? " (error)" : ""}`, codeBlock(text.split(/\r?\n/).slice(0, 20).join("\n")));
    }
  }
  if (notes.length) sections.push("## Runner notes", notes.join("\n\n"));
  return `${sections.join("\n\n")}\n`;
}

export function isCheckResult(value: unknown): value is CheckResult {
  return isRecord(value) && typeof value.id === "string" && typeof value.evidence === "string"
    && (value.outcome === "PASS" || value.outcome === "FAIL" || value.outcome === "CANNOT-EVALUATE");
}

// Writes the agent body (frontmatter stripped) as the system-prompt append and returns the frontmatter `tools:` list,
// so a probe runs with the same tool set the agent has when dispatched as a child (a scout with read/grep/glob cannot `task`).
async function writeAgentBody(workDir: string, runDir: string, agent: string): Promise<string[]> {
  const source = await Bun.file(join(workDir, ".omp", "agents", `${agent}.md`)).text();
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source);
  const body = frontmatter ? source.slice(frontmatter[0].length) : source;
  await mkdir(runDir, { recursive: true });
  await Bun.write(join(runDir, "system-append.md"), body);
  const tools = frontmatter && /^tools:\s*(.+?)\s*$/m.exec(frontmatter[1])?.[1];
  return tools ? tools.replace(/^\[|\]$/g, "").split(",").map(tool => tool.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
}

async function setupFixture(workDir: string, scenarioDir: string, env: NodeJS.ProcessEnv) {
  for (const setup of [join(workDir, "setup.sh"), join(scenarioDir, "setup.sh")]) {
    if (!await Bun.file(setup).exists()) {
      if (setup === join(workDir, "setup.sh")) throw new Error(`Missing fixture setup: ${setup}`);
      continue;
    }
    const result = await execute(["bash", setup], workDir, env);
    if (result.code) return { code: result.code, error: `Setup failed (${result.code}): ${setup}\n${result.stdout}${result.stderr}` };
  }
  return { code: 0, error: "" };
}

async function main() {
  const { values } = parseArgs({ args: Bun.argv.slice(2), strict: true, options: {
    scenario: { type: "string" }, model: { type: "string" }, thinking: { type: "string" },
    harness: { type: "string", default: "baseline" }, tag: { type: "string" },
    timeout: { type: "string", default: "1800" }, "dry-run": { type: "boolean" }, "fixture-dir": { type: "string" },
    role: { type: "string", multiple: true },
  } });
  const { scenario, thinking, harness } = values;
  if (!scenario || !values.model || !thinking) throw new Error("Usage: bun tests/loops/run.ts --scenario <ID> --model <selector|@role> --thinking <level> [--harness baseline] [--tag note] [--timeout seconds] [--dry-run]");
  for (const name of [scenario, harness]) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) throw new Error(`Invalid directory name: ${name}`);
  }
  const timeoutSeconds = Number(values.timeout);
  if (!Number.isFinite(timeoutSeconds) || timeoutSeconds <= 0) throw new Error("--timeout must be positive seconds");
  const scenarioDir = join(root, "scenarios", scenario);
  const fixtureDir = values["fixture-dir"] ? resolve(values["fixture-dir"]) : join(root, "fixtures", harness);
  if (!(await stat(fixtureDir)).isDirectory()) throw new Error(`Not a fixture directory: ${fixtureDir}`);
  const prompt = (await Bun.file(join(scenarioDir, "prompt.md")).text()).trim();
  const environment = { ...process.env };
  const envFile = Bun.file(join(scenarioDir, "env"));
  if (await envFile.exists()) {
    for (const [index, line] of (await envFile.text()).split(/\r?\n/).entries()) {
      if (!line.trim() || line.trimStart().startsWith("#")) continue;
      const pair = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
      if (!pair) throw new Error(`Invalid scenario env line ${index + 1}: expected KEY=VALUE`);
      environment[pair[1]] = pair[2];
    }
  }
  let model = values.model;
  if (model.startsWith("@")) {
    const config = await execute(["omp", "config", "get", "modelRoles"], root);
    if (config.code) throw new Error(`Cannot resolve model role: ${config.stderr}`);
    const roles: unknown = JSON.parse(config.stdout);
    const selector = isRecord(roles) ? roles[model.slice(1)] : undefined;
    if (typeof selector !== "string" || !selector) throw new Error(`Unknown model role: ${model}`);
    // The explicit --thinking flag wins over a role's embedded thinking suffix.
    model = selector.replace(/:(off|minimal|low|medium|high|xhigh|max|auto)$/, "");
  }
  // --role name=selector overrides a modelRoles entry in the work copy's .omp/config.yml (fixture roles are the default cell).
  const roles: Record<string, string> = {};
  for (const entry of values.role ?? []) {
    const pair = /^([a-z][a-z-]*)=([A-Za-z0-9._/-]+:(?:off|minimal|low|medium|high|xhigh|max|auto))$/.exec(entry);
    if (!pair) throw new Error(`--role expects name=provider/model:effort, got ${entry}`);
    roles[pair[1]] = pair[2];
  }
  const roleSuffix = Object.entries(roles).sort().map(([name, selector]) => `+${name}=${selector.split("/").pop()}`).join("");
  const startedAt = new Date().toISOString();
  const modelDir = `${model}-${thinking}${roleSuffix}`.replace(/[^A-Za-z0-9._+=-]+/g, "-");
  const runDir = join(root, "runs", scenario, harness, modelDir, startedAt.replace(/:/g, "-"));
  const tempDir = await mkdtemp(`/tmp/mosaic-loop-${scenario}-`);
  const workDir = join(tempDir, "work");
  // verbatimSymlinks keeps `.omp/rules/*.md -> ../../docs/process/*.md` relative; cp would rewrite them to the source fixture.
  await cp(fixtureDir, workDir, { recursive: true, verbatimSymlinks: true });
  if (Object.keys(roles).length) {
    const configPath = join(workDir, ".omp", "config.yml");
    let config = await Bun.file(configPath).text();
    for (const [name, selector] of Object.entries(roles)) {
      const line = new RegExp(`^(\\s+${name}:\\s*)\\S+(.*)$`, "m");
      if (!line.test(config)) throw new Error(`Role ${name} is not defined in ${configPath}`);
      config = config.replace(line, `$1${selector}$2`);
    }
    await Bun.write(configPath, config);
  }
  const agentFile = Bun.file(join(scenarioDir, "agent"));
  const agent = await agentFile.exists() ? (await agentFile.text()).trim() : undefined;
  const command = ["omp", "-p", "--cwd", workDir, "--no-session", "--mode", "json", "--config", join(root, "overlay.yml"), "--model", model, "--thinking", thinking];
  if (agent) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(agent)) throw new Error(`Invalid agent name: ${agent}`);
    command.push("--append-system-prompt", join(runDir, "system-append.md"));
  }
  // The agent's frontmatter tools are read from the prepared work copy, so the prompt is appended after setup.
  const finish = async () => {
    const tools = agent ? await writeAgentBody(workDir, runDir, agent) : [];
    if (tools.length) command.push(`--tools=${tools.join(",")}`);
    command.push(prompt);
  };
  if (values["dry-run"]) {
    const setup = await setupFixture(workDir, scenarioDir, environment);
    if (setup.code) throw new Error(setup.error);
    await finish();
    console.log(command.map(arg => /^[A-Za-z0-9_./:@=-]+$/.test(arg) ? arg : `'${arg.replace(/'/g, `'\\''`)}'`).join(" "));
    return 0;
  }

  await mkdir(runDir, { recursive: true });
  const meta: RunMeta = { scenario, harness, model, thinking, agent, roles: Object.keys(roles).length ? roles : undefined, startedAt, wallSeconds: 0, exitCode: -1, tag: values.tag, workDir, fixtureDir, timedOut: false, timeoutSeconds, notes: [] };
  const started = performance.now();
  const baselines = new Map<string, string>();
  const mains = new Map<string, string>();
  let failed = false;
  let patches = "";
  await Bun.write(join(runDir, "events.jsonl"), "");
  await Bun.write(join(runDir, "stderr.log"), "");
  await Bun.write(join(runDir, "verdict.json"), JSON.stringify({ evaluators: [] }, null, 2) + "\n");
  try {
    const setup = await setupFixture(workDir, scenarioDir, environment);
    if (setup.code) {
      meta.exitCode = setup.code;
      throw new Error(setup.error);
    }
    await finish();
    for (const repo of await repositories(workDir)) {
      const revision = await execute(["git", "rev-parse", "HEAD"], repo);
      if (revision.code) throw new Error(`Cannot read fixture HEAD: ${repo}\n${revision.stderr}`);
      baselines.set(repo, revision.stdout.trim());
      // main may move while the work tree is restored to another branch (land + restore); record it separately.
      const main = await execute(["git", "rev-parse", "--verify", "-q", "main"], repo);
      if (!main.code) mains.set(repo, main.stdout.trim());
    }
    const stdout = await open(join(runDir, "events.jsonl"), "w");
    const stderr = await open(join(runDir, "stderr.log"), "w");
    try {
      const child = Bun.spawn(command, { cwd: root, env: environment, stdin: "ignore", stdout: stdout.fd, stderr: stderr.fd });
      const timer = setTimeout(() => { meta.timedOut = true; child.kill("SIGKILL"); }, timeoutSeconds * 1000);
      try { meta.exitCode = await child.exited; } finally { clearTimeout(timer); }
    } finally {
      await Promise.all([stdout.close(), stderr.close()]);
    }
    if (meta.timedOut || meta.exitCode !== 0) throw new Error(meta.timedOut ? `omp timed out after ${timeoutSeconds}s` : `omp exited ${meta.exitCode}; see stderr.log`);
  } catch (error) {
    failed = true;
    meta.notes.push(String(error));
  }
  meta.wallSeconds = (performance.now() - started) / 1000;
  try { patches = await collectDiff(workDir, baselines, mains); } catch (error) {
    failed = true;
    meta.notes.push(String(error));
    patches = `# Diff capture failed\n${error}\n`;
  }
  const events: LoopEvent[] = [];
  const lines: string[] = [];
  for (const [index, line] of (await Bun.file(join(runDir, "events.jsonl")).text()).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    try { events.push(parseEvent(line)); lines.push(line); } catch (error) {
      failed = true;
      meta.notes.push(`events.jsonl line ${index + 1}: ${error}`);
    }
  }
  const metrics = parseEvents(lines);
  if (metrics.wallSeconds === 0) metrics.wallSeconds = meta.wallSeconds;
  if (!metrics.requests) { failed = true; meta.notes.push("No completed assistant messages in the event stream."); }
  const checkPath = join(scenarioDir, "check.ts");
  const hasCheck = await Bun.file(checkPath).exists();
  if (!hasCheck) meta.notes.push("No scenario check.ts; checks.json is [].");
  await Bun.write(join(runDir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  await Bun.write(join(runDir, "transcript.md"), transcript(prompt, events, meta.notes));
  await Bun.write(join(runDir, "diff.patch"), patches);
  await Bun.write(join(runDir, "metrics.json"), JSON.stringify(metrics, null, 2) + "\n");
  let checks: CheckResult[] = [];
  if (hasCheck) {
    try {
      // The scenario directory is selected at runtime by --scenario.
      const check = (await import(pathToFileURL(checkPath).href)).default;
      const result: unknown = await check({ runDir, workDir, fixtureDir, events, metrics, exec: (cmd: string, cwd = workDir) => execute(["bash", "-c", cmd], cwd, environment) } satisfies CheckContext);
      if (!Array.isArray(result) || !result.every(isCheckResult)) throw new Error("check.ts must return CheckResult[]");
      checks = result;
    } catch (error) {
      checks = [{ id: "checker", outcome: "CANNOT-EVALUATE", evidence: String(error) }];
    }
  }
  if (failed && hasCheck) checks.unshift({ id: "runner", outcome: "CANNOT-EVALUATE", evidence: meta.notes.join("\n") });
  await Bun.write(join(runDir, "checks.json"), JSON.stringify(checks, null, 2) + "\n");
  for (const note of meta.notes) console.error(note);
  console.log(runDir);
  return checks.some(check => check.outcome === "FAIL") ? 1 : failed || checks.some(check => check.outcome === "CANNOT-EVALUATE") ? 2 : 0;
}

if (import.meta.main) {
  try { process.exitCode = await main(); } catch (error) { console.error(String(error)); process.exitCode = 2; }
}
