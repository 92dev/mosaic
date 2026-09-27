import { readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import type { CheckContext, CheckResult } from "../run.ts";
import { isRecord } from "../metrics.ts";

export type Context = CheckContext;
type Verdict = Omit<CheckResult, "id">;
type Probe = () => Verdict | Promise<Verdict>;
export const verdict = (ok: boolean, evidence: string): Verdict => ({ outcome: ok ? "PASS" : "FAIL", evidence });
export const unavailable = (evidence: string): Verdict => ({ outcome: "CANNOT-EVALUATE", evidence });
export const text = (root: string, file: string) => Bun.file(join(root, file)).text();
export const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;

export async function checks(ctx: Context, probes: Record<string, Probe>): Promise<CheckResult[]> {
  try {
    if (!ctx.workDir || !(await readdir(ctx.workDir)).length) throw new Error("workDir is missing or empty");
  } catch (error) {
    return Object.keys(probes).map(id => ({ id, ...unavailable(String(error)) }));
  }
  return Promise.all(Object.entries(probes).map(async ([id, probe]) => {
    try { return { id, ...await probe() }; }
    catch (error) { return { id, ...unavailable(String(error)) }; }
  }));
}

export function entries(content: string, prefix: "G" | "P") {
  const result: { id: string; body: string }[] = [];
  let current: { id: string; body: string } | undefined;
  for (const line of content.replaceAll("\r", "").split("\n")) {
    const match = /^- \*\*((?:G|P)-\d+) ·/.exec(line);
    if (match || /^#{1,6} |^- \*\*/.test(line)) {
      if (current) result.push({ ...current, body: current.body.trimEnd() });
      current = match?.[1].startsWith(`${prefix}-`) ? { id: match[1], body: line } : undefined;
    } else if (current) current.body += `\n${line}`;
  }
  if (current) result.push({ ...current, body: current.body.trimEnd() });
  return result;
}

export function trigger(body: string): string {
  return (/\*\*Trigger[^*\n]*:\*\*([\s\S]*?)(?=\*\*[^*\n]+:\*\*|$)/i.exec(body)?.[1] ?? "").trim();
}

export async function lint(ctx: Context, file: string): Promise<Verdict> {
  const command = `bun .omp/hooks/post/lint-ledgers.ts ${quote(file)}`;
  const result = await ctx.exec(command, ctx.workDir);
  const evidence = `${command}\nexit=${result.code}\n${result.stdout}${result.stderr}`.trimEnd();
  if (result.code === 0 && result.stdout.split(/\r?\n/).includes(`PASS ${file}`)) return verdict(true, evidence);
  if (result.code === 1 && /violates the ledger schema:/.test(result.stderr)) return verdict(false, evidence);
  return unavailable(evidence);
}

export async function command(ctx: Context, cmd: string) {
  const result = await ctx.exec(cmd, ctx.workDir);
  if (result.code !== 0) throw new Error(`${cmd}\nexit=${result.code}\n${result.stdout}${result.stderr}`);
  return result.stdout;
}

function toolPaths(args: unknown): string[] {
  if (typeof args === "string") return [...args.matchAll(/^\[([^\]\n]+)#[0-9a-f]{4}\]/gim)].map(match => match[1]);
  if (!args || typeof args !== "object") return [];
  const paths: string[] = [];
  if ("path" in args && typeof args.path === "string") paths.push(args.path);
  if ("file_path" in args && typeof args.file_path === "string") paths.push(args.file_path);
  if ("paths" in args && Array.isArray(args.paths)) paths.push(...args.paths.filter((path): path is string => typeof path === "string"));
  if ("patch" in args) paths.push(...toolPaths(args.patch));
  if ("input" in args) paths.push(...toolPaths(args.input));
  if ("edits" in args && Array.isArray(args.edits)) for (const edit of args.edits) paths.push(...toolPaths(edit));
  return paths;
}

export function metaBeforeEdit(ctx: Context, registry: RegExp, allowRule = false): Verdict {
  // baseline: docs/meta.md; mosaic: rule://records (omp) or docs/process/records.md (Claude twin).
  const isMeta = (path: string) => /(?:^|\/)meta\.md(?=[:#\]]|$)/.test(path)
    || /^rule:\/\/records$/.test(path) || /(?:^|\/)docs\/process\/records\.md(?=[:#\]]|$)/.test(path)
    || (allowRule && /^rule:\/\/[^\s]*meta/i.test(path));
  const edits = ctx.metrics.edits.filter(path => registry.test(path));
  if (!edits.length) return unavailable("No registry edit was recorded in metrics.edits.");
  if (!ctx.metrics.reads.some(isMeta)) return verdict(false, `No meta.md read before registry edits: ${JSON.stringify(edits)}`);
  const calls = ctx.events.filter((event): event is { type: "tool_execution_start"; toolName: string; args: unknown } =>
    typeof event === "object" && event !== null && "type" in event && event.type === "tool_execution_start"
    && "toolName" in event && typeof event.toolName === "string" && "args" in event);
  const firstEdit = calls.findIndex(event => /(?:^|\.)(?:edit|write)$/.test(event.toolName)
    && toolPaths(event.args).some(path => registry.test(path)));
  if (firstEdit < 0) return unavailable("Registry edits exist in metrics, but their event order is unavailable.");
  const firstRead = calls.findIndex(event => /(?:^|\.)read$/.test(event.toolName) && toolPaths(event.args).some(isMeta));
  if (firstRead < 0) return unavailable("meta.md appears in metrics.reads, but its read event is unavailable.");
  return verdict(firstRead < firstEdit, `meta read tool-call index=${firstRead}; first registry edit index=${firstEdit}; reads=${JSON.stringify(ctx.metrics.reads)}`);
}

export function diffPaths(patch: string): string[] {
  const headers = patch.match(/^diff --git .+$/gm) ?? [];
  if (patch.trim() && !headers.length) throw new Error("Non-empty diff.patch has no git diff headers.");
  const paths = new Set<string>();
  for (const header of headers) {
    const match = /^diff --git ("[^"]+"|\S+) ("[^"]+"|\S+)$/.exec(header);
    if (!match) throw new Error(`Unrecognized diff header: ${header}`);
    for (const token of match.slice(1)) {
      const path: unknown = token.startsWith('"') ? JSON.parse(token) : token;
      if (typeof path !== "string") throw new Error(`Invalid diff path: ${token}`);
      paths.add(path.replace(/^[ab]\//, ""));
    }
  }
  return [...paths];
}

export async function filesBelow(root: string, relative: string, missingOK = false): Promise<string[]> {
  let children;
  try { children = await readdir(join(root, relative), { withFileTypes: true }); }
  catch (error) {
    if (missingOK && error instanceof Error && "code" in error && error.code === "ENOENT") return [];
    throw error;
  }
  const files: string[] = [];
  for (const child of children) {
    const path = `${relative}/${child.name}`;
    files.push(...(child.isDirectory() ? await filesBelow(root, path) : [path]));
  }
  return files.sort();
}

export async function isBaseline(ctx: Context): Promise<boolean> {
  const meta = Bun.file(join(ctx.runDir, "meta.json"));
  if (!await meta.exists()) return basename(ctx.fixtureDir) === "baseline";
  const value: unknown = await meta.json();
  if (!isRecord(value) || typeof value.harness !== "string") throw new Error("meta.json has no harness.");
  return value.harness === "baseline";
}

export function mosaicChecks(ctx: Context, probes: Record<string, Probe>): Promise<CheckResult[]> {
  return checks(ctx, Object.fromEntries(Object.entries(probes).map(([id, probe]) => [
    id, async () => await isBaseline(ctx) ? unavailable("no intake/tracker/librarian in baseline") : probe(),
  ])));
}

export type OutboxEntry = { ts: string; op: string; key: string; writer: string; payload: Record<string, unknown> };

export async function outbox(ctx: Context): Promise<OutboxEntry[]> {
  const result: OutboxEntry[] = [];
  const file = Bun.file(join(ctx.workDir, "docs/tracker/outbox.jsonl"));
  if (!(await file.exists())) return result; // no accepted write ever happened
  for (const [index, line] of (await file.text()).split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const row: unknown = JSON.parse(line);
    if (!isRecord(row) || typeof row.ts !== "string" || typeof row.op !== "string"
      || typeof row.key !== "string" || typeof row.writer !== "string" || !isRecord(row.payload)) {
      throw new Error(`Invalid tracker outbox record at line ${index + 1}.`);
    }
    result.push({ ts: row.ts, op: row.op, key: row.key, writer: row.writer, payload: row.payload });
  }
  return result;
}

export function taskCount(ctx: Context): number {
  if (!ctx.metrics || !isRecord(ctx.metrics.toolCalls)) throw new Error("Tool-call metrics are unavailable.");
  let count = 0;
  for (const [name, value] of Object.entries(ctx.metrics.toolCalls)) {
    if (!/(?:^|\.)task$/.test(name)) continue;
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("Invalid task-call count.");
    count += value;
  }
  return count;
}

export function assistantText(ctx: Context): string {
  if (!Array.isArray(ctx.metrics?.assistantTexts)) throw new Error("metrics.assistantTexts is unavailable.");
  return ctx.metrics.assistantTexts.join("\n\n");
}
