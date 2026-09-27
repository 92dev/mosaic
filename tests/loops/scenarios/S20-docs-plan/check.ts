import { isRecord } from "../../metrics.ts";
import { filesBelow, lint, mosaicChecks, text, unavailable, verdict, type Context } from "../checks.ts";

const planPath = "docs/plans/0004-docs-refresh.md";
const documents = ["docs/architecture/export.md", "docs/product/F-1-export-flow.md"];
const reviewerRoles: Record<string, true> = { "claude-reviewer": true, "gpt-reviewer": true };

type Dispatch = { index: number; call: unknown; agent: string; name: string; body: string; context: string };
function dispatches(ctx: Context): Dispatch[] {
  return ctx.events.flatMap((event, index) => {
    if (event.type !== "tool_execution_start" || !/(?:^|\.)task$/.test(String(event.toolName)) || !isRecord(event.args)) return [];
    const args = event.args;
    return (Array.isArray(args.tasks) ? args.tasks : []).filter(isRecord).map(task => ({
      index, call: event.toolCallId, agent: String(task.agent ?? ""), name: String(task.name ?? ""),
      body: String(task.task ?? ""), context: String(args.context ?? ""),
    }));
  });
}

function outputText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(outputText).join("\n");
  if (!isRecord(value)) return "";
  return Object.values(value).map(outputText).join("\n");
}

function reviewWaves(calls: Dispatch[]) {
  const taskWaves = new Map<string, Dispatch[]>();
  const closureWaves = new Map<string, Dispatch[]>();
  const unknown: string[] = [];
  let epoch = 1;
  let reviewed = false;
  let closing = false;
  for (const call of calls) {
    if (call.agent === "executor" && reviewed) { epoch++; reviewed = false; }
    if (call.agent === "librarian") closing = true;
    if (!reviewerRoles[call.agent]) continue;
    reviewed = true;
    const assignment = `${call.name}\n${call.body}`;
    const round = /\bR(\d+)\b|\bround\s+(\d+)\b/i.exec(assignment);
    const key = `wave ${epoch} R${round?.[1] ?? round?.[2] ?? "unspecified"}`;
    // A librarian dispatch is a phase boundary even when the closure task's short name is opaque.
    const closure = closing || /clos(?:e-?out|ure)/i.test(call.name)
      || /^(?:[^\n]*\n){0,2}[^\n]*\bclosure packet\b/i.test(call.body);
    if (closure) {
      closureWaves.set(key, [...closureWaves.get(key) ?? [], call]);
      continue;
    }
    const tasks = [...new Set(assignment.match(/\bT[12]\b/g) ?? [])];
    if (!tasks.length) {
      documents.forEach((path, index) => { if (assignment.includes(path)) tasks.push(`T${index + 1}`); });
    }
    // Shared context can name the reviewed wave when the per-reviewer task only says "review independently".
    if (!tasks.length) tasks.push(...new Set(call.context.match(/\bT[12]\b/g) ?? []));
    if (!tasks.length) unknown.push(`${call.agent} at event ${call.index}: task/closure scope is not identifiable`);
    for (const task of tasks) taskWaves.set(`${key} ${task}`, [...taskWaves.get(`${key} ${task}`) ?? [], call]);
  }
  return { taskWaves, closureWaves, unknown };
}

function gateTiming(ctx: Context, calls: Dispatch[]) {
  const executors = calls.filter(call => call.agent === "executor");
  const first = executors.find(call => /\bT1\b/.test(`${call.name} ${call.body}`) || call.body.includes(documents[0]));
  const second = executors.find(call => /\bT2\b/.test(`${call.name} ${call.body}`) || call.body.includes(documents[1]));
  if (!first || !second || first === second || !first.name || !second.name) return unavailable("Two named executor dispatches for T1/T2 are not identifiable.");
  const completed = new Map<string, number>();
  const gates: { index: number; source: string }[] = [];
  const recordCompletion = (id: string, index: number) => {
    if ((id === first.name || id === second.name) && !completed.has(id)) completed.set(id, index);
  };
  for (const [index, event] of ctx.events.entries()) {
    const args = isRecord(event.args) ? event.args : {};
    if (event.type === "tool_execution_start" && /(?:^|\.)(?:bash|eval)$/.test(String(event.toolName))) {
      const source = String(args.command ?? args.code ?? "");
      if (/tools\/(?:doctor|checkup)\.ts\b/.test(source) && /\bbun\b|\bBun\.(?:spawn|spawnSync|\$)/.test(source)) gates.push({ index, source });
    }
    const payload = event.type === "tool_execution_end" ? event.result
      : event.type === "tool_execution_update" ? event.partialResult
      : event.type === "message_end" && isRecord(event.message) && event.message.role === "custom" ? event.message.content : undefined;
    if (payload === undefined) continue;
    const visit = (value: unknown) => {
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (!isRecord(value)) return;
      if (/^(?:completed|failed|cancelled|error)$/.test(String(value.status))) recordCompletion(String(value.id ?? value.name ?? ""), index);
      if (Array.isArray(value.recentTools)) {
        const source = outputText(value.recentTools);
        if (/tools\/(?:doctor|checkup)\.ts\b/.test(source) && /\bbun\b|\bBun\.(?:spawn|spawnSync|\$)/.test(source)) gates.push({ index, source });
      }
      Object.values(value).forEach(visit);
    };
    visit(payload);
    for (const match of outputText(payload).matchAll(/<task-result\b([^>]*)>/g)) {
      const id = /\bid=["']([^"']+)["']/.exec(match[1])?.[1];
      if (id && /\bstatus=["'](?:completed|failed|cancelled|error)["']/.test(match[1])) recordCompletion(id, index);
    }
  }
  const firstEnd = completed.get(first.name);
  const secondEnd = completed.get(second.name);
  const parallel = first.index === second.index || (firstEnd !== undefined && second.index < firstEnd && first.index < second.index)
    || (secondEnd !== undefined && first.index < secondEnd && second.index < first.index);
  if (!parallel) return unavailable(firstEnd === undefined || secondEnd === undefined
    ? "Executor completion order is unavailable; parallel execution cannot be established." : "Executors ran sequentially; no parallel join gate to evaluate.");
  const start = Math.min(first.index, second.index);
  const between = gates.filter(gate => gate.index > start && gate.index < Math.max(first.index, second.index));
  if (between.length) return verdict(false, `Gates ran between parallel executor dispatches: ${JSON.stringify(between)}`);
  if (firstEnd === undefined || secondEnd === undefined) return unavailable("Parallel executors were dispatched, but both completion events are not available.");
  const join = Math.max(firstEnd, secondEnd);
  const premature = gates.filter(gate => gate.index > start && gate.index < join);
  return verdict(!premature.length, `dispatches=${first.index},${second.index}; completions=${firstEnd},${secondEnd}; premature gates=${JSON.stringify(premature)}`);
}

export default async function (ctx: Context) {
  const calls = dispatches(ctx);
  const { taskWaves, closureWaves, unknown } = reviewWaves(calls);
  return mosaicChecks(ctx, {
    "single-reviewer-task-waves": async () => {
      const config = Bun.YAML.parse(await text(ctx.workDir, ".omp/config.yml"));
      const roles = isRecord(config) && isRecord(config.modelRoles) ? config.modelRoles : {};
      let model = roles.templated;
      const seen = new Set<string>();
      while (typeof model === "string" && model.startsWith("@") && !seen.has(model)) { seen.add(model); model = roles[model.slice(1)]; }
      const family = typeof model === "string" ? /claude|anthropic/i.test(model) ? "Claude" : /gpt|openai/i.test(model) ? "GPT" : undefined : undefined;
      if (!family) return unavailable(`Cannot resolve @templated's model family: ${String(model)}`);
      if (!taskWaves.size) return unavailable("No identifiable docs task-wave reviewer dispatches.");
      const expected = family === "GPT" ? "claude-reviewer" : "gpt-reviewer";
      const evidence = [...taskWaves].map(([wave, dispatches]) => `${wave}: ${dispatches.map(call => call.agent).join(", ")}`);
      const valid = [...taskWaves.values()].every(wave => wave.length === 1 && wave[0].agent === expected);
      if (!valid) return verdict(false, `@templated=${model}; expected exactly one ${expected}\n${evidence.join("\n")}`);
      if (unknown.length || !["T1", "T2"].every(task => [...taskWaves.keys()].some(key => key.endsWith(` ${task}`)))) return unavailable(`Task review coverage is incomplete.\n${[...evidence, ...unknown].join("\n")}`);
      return verdict(true, `@templated=${model}; expected exactly one ${expected}\n${evidence.join("\n")}`);
    },
    "pair-at-closure": () => {
      if (!closureWaves.size) return unavailable("No identifiable closure-wave reviewer dispatches.");
      const valid = [...closureWaves.values()].every(wave => wave.length === 2 && ["claude-reviewer", "gpt-reviewer"].every(role => wave.some(call => call.agent === role)));
      return verdict(valid, [...closureWaves].map(([key, wave]) => `${key}: ${wave.map(call => call.agent).join(", ")}`).join("\n"));
    },
    "findings-attributed": async () => {
      const plan = await text(ctx.workDir, planPath);
      if (!/^status: (?:review|done)\b/m.test(plan)) return unavailable("The plan has not reached review/done; attribution lint is not yet gated.");
      return lint(ctx, planPath);
    },
    "no-bad-citation": async () => {
      const source = await text(ctx.workDir, "member-a/member_a/api.py");
      const lastLine = source.replace(/\n$/, "").split(/\r?\n/).length;
      const citations: { path: string; citation: string; start: number; end: number }[] = [];
      const markdown = (await filesBelow(ctx.workDir, "docs")).filter(path => path.endsWith(".md") && !path.includes("/archived/"));
      for (const path of markdown) {
        const body = await text(ctx.workDir, path);
        for (const match of body.matchAll(/api\.py(?::|#)L?(\d+)(?:[-–—]L?(\d+))?/g)) {
          citations.push({ path, citation: match[0], start: Number(match[1]), end: Number(match[2] ?? match[1]) });
        }
      }
      const bad = citations.filter(citation => citation.start < 1 || citation.end < citation.start || citation.end > lastLine);
      if (bad.length) return verdict(false, `api.py has ${lastLine} lines; invalid citations=${JSON.stringify(bad)}`);
      if (!citations.length) {
        const results = ctx.events.filter(event => event.type === "tool_execution_end" || event.type === "message_end").map(event => outputText(event.result ?? event.message)).join("\n");
        if (!/\bSTOP\b[^\n]*(?:source|range|lines?)|(?:source|range|lines?)[^\n]*\bSTOP\b/i.test(results)) return unavailable("No source-line citations or source-range STOP evidence is available.");
      }
      return verdict(true, `api.py has ${lastLine} lines; valid citations=${JSON.stringify(citations)}; no nonexistent source line retained in active documentation.`);
    },
    "gates-after-join": () => gateTiming(ctx, calls),
    // Same close-out dispatch fence as S9, with missing event evidence kept unknown.
    "no-executor-at-closeout": () => {
      if (!calls.length) return unavailable("No task dispatch events recorded.");
      const executors = calls.filter(call => call.agent === "executor");
      const closeout = executors.filter(call => /clos(?:e-?out|ure)|disposition|execution log|registry|sign-?off|librarian|alignment|index/i.test(call.name + " " + call.body.slice(0, 200)) && !/\bREVISE\b|findings appended|repair/i.test(call.body.slice(0, 200)));
      return verdict(!closeout.length, closeout.length ? closeout.map(call => `${call.name}: ${call.body.slice(0, 200)}`).join("\n") : `executor dispatches=${executors.length}; none for close-out work`);
    },
    "brief-40": () => {
      const texts = Array.isArray(ctx.metrics?.assistantTexts) ? ctx.metrics.assistantTexts : [];
      const brief = [...texts].reverse().find(message => message.split("\n").length > 8) ?? texts.at(-1) ?? "";
      if (!brief.trim()) return unavailable("No assistant message recorded.");
      const lines = brief.split("\n").length;
      return verdict(lines <= 40, `${lines} physical lines in the last substantive assistant message.`);
    },
  });
}
