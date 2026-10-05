import { dirname, join } from "node:path";

export type ChildUsage = {
  id: string; agent: string; modelRole: string; status: string;
  cost: number; tokens: number; requests: number; durationMs: number; toolCount: number;
};

export type Metrics = {
  requests: number;
  turns: number;
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  cost: number;
  firstRequestPromptTokens: number;
  toolCalls: Record<string, number>;
  reads: string[];
  edits: string[];
  bash: string[];
  ttsrTriggered: string[];
  finalText: string;
  assistantTexts: string[];        // every assistant text block in order; briefs may precede a short closing message
  children: ChildUsage[];          // subagents spawned by `task`, last progress snapshot each; not included in the parent's cost/tokens
  wallSeconds: number;
};

export type LoopEvent = Record<string, unknown>;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseEvent(line: string): LoopEvent {
  const event: unknown = JSON.parse(line);
  if (!isRecord(event) || typeof event.type !== "string") throw new Error("missing event type");
  return event;
}

export function parseEvents(lines: string[]): Metrics {
  const metrics: Metrics = {
    requests: 0,
    turns: 0,
    tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    cost: 0,
    firstRequestPromptTokens: 0,
    toolCalls: {},
    reads: [],
    edits: [],
    bash: [],
    ttsrTriggered: [],
    finalText: "",
    assistantTexts: [],
    children: [],
    wallSeconds: 0,
  };
  let firstTime = Infinity;
  let lastTime = -Infinity;
  const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : 0;
  const toolCalls = new Map<string, number>();
  const taskCalls = new Set<unknown>();
  const children = new Map<string, ChildUsage>();

  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    let event: LoopEvent;
    try {
      event = parseEvent(line);
    } catch (error) {
      throw new Error(`Invalid event on line ${index + 1}: ${error}`);
    }
    const message = isRecord(event.message) ? event.message : {};
    for (const value of [event.timestamp, message.timestamp, message.completedAt]) {
      const time = typeof value === "number" ? value : typeof value === "string" ? Date.parse(value) : NaN;
      if (Number.isFinite(time)) {
        firstTime = Math.min(firstTime, time);
        lastTime = Math.max(lastTime, time);
      }
    }
    if (event.type === "turn_end") metrics.turns++;
    // turn_end repeats the assistant message; only message_end owns its usage.
    if (event.type === "message_end" && message.role === "assistant") {
      const usage = isRecord(message.usage) ? message.usage : {};
      metrics.requests++;
      let total = 0;
      for (const key of ["input", "output", "cacheRead", "cacheWrite"] as const) {
        const value = number(usage[key]);
        metrics.tokens[key] += value;
        total += value;
      }
      metrics.tokens.total += typeof usage.totalTokens === "number" ? number(usage.totalTokens) : total;
      metrics.cost += isRecord(usage.cost) ? number(usage.cost.total) : 0;
      if (metrics.requests === 1) {
        metrics.firstRequestPromptTokens = number(usage.input) + number(usage.cacheRead) + number(usage.cacheWrite);
      }
      for (const block of Array.isArray(message.content) ? message.content : []) {
        if (isRecord(block) && block.type === "text" && typeof block.text === "string") {
          metrics.finalText = block.text;
          metrics.assistantTexts.push(block.text);
        }
      }
    }
    if (event.type === "tool_execution_start" && typeof event.toolName === "string") {
      const name = event.toolName;
      const args = isRecord(event.args) ? event.args : {};
      toolCalls.set(name, (toolCalls.get(name) ?? 0) + 1);
      if (/(?:^|\.)task$/.test(name)) taskCalls.add(event.toolCallId);
      if (name === "read" && typeof args.path === "string") metrics.reads.push(args.path);
      if ((name === "edit" || name === "write") && typeof args.path === "string") metrics.edits.push(args.path);
      if (name === "edit" && typeof args.input === "string") {
        for (const match of args.input.matchAll(/^\[([^\r\n]+)#[\da-f]{4}\]\s*$/gim)) metrics.edits.push(match[1]);
      }
      if (name === "bash" && typeof args.command === "string") metrics.bash.push(args.command);
    }
    // `task` streams one progress row per child; the last snapshot carries the child's final usage.
    if ((event.type === "tool_execution_update" || event.type === "tool_execution_end") && taskCalls.has(event.toolCallId)) {
      const payload = event.type === "tool_execution_end" ? event.result : event.partialResult;
      const details = isRecord(payload) && isRecord(payload.details) ? payload.details : {};
      for (const row of Array.isArray(details.progress) ? details.progress : []) {
        if (!isRecord(row) || typeof row.id !== "string") continue;
        children.set(row.id, {
          id: row.id, agent: String(row.agent ?? ""), modelRole: String(row.modelRole ?? ""), status: String(row.status ?? ""),
          cost: number(row.cost), tokens: number(row.tokens), requests: number(row.requests), durationMs: number(row.durationMs), toolCount: number(row.toolCount),
        });
      }
    }
    if (event.type === "ttsr_triggered") {
      for (const rule of Array.isArray(event.rules) ? event.rules : []) {
        if (isRecord(rule) && typeof rule.name === "string") metrics.ttsrTriggered.push(rule.name);
      }
    }
  }
  metrics.toolCalls = Object.fromEntries(toolCalls);
  metrics.children = [...children.values()];
  if (Number.isFinite(firstTime) && Number.isFinite(lastTime)) metrics.wallSeconds = (lastTime - firstTime) / 1000;
  return metrics;
}

if (import.meta.main) {
  try {
    if (Bun.argv.length !== 3) throw new Error("Usage: bun tests/loops/metrics.ts <events.jsonl>");
    const metrics = parseEvents((await Bun.file(Bun.argv[2]).text()).split(/\r?\n/));
    const metaFile = Bun.file(join(dirname(Bun.argv[2]), "meta.json"));
    if (metrics.wallSeconds === 0 && await metaFile.exists()) {
      const meta: unknown = await metaFile.json();
      if (isRecord(meta) && typeof meta.wallSeconds === "number") metrics.wallSeconds = meta.wallSeconds;
    }
    console.log(JSON.stringify(metrics, null, 2));
  } catch (error) {
    console.error(String(error));
    process.exitCode = 2;
  }
}
