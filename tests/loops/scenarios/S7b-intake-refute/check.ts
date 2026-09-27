import { isRecord } from "../../metrics.ts";
import intakeChecks from "../S7-intake-digest/check.ts";
import { assistantText, mosaicChecks, outbox, taskCount, unavailable, verdict, type Context } from "../checks.ts";

const refuteKeys = ["ENG-214", "ENG-215"];
const keys = ["ENG-210", "ENG-211", "ENG-212", ...refuteKeys];
type Family = "GPT" | "Claude";
type Dispatch = {
  event: number; index: number; agent: string; instructions: string; key?: string;
  ids: Set<string>; models: Set<string>; roles: Set<string>;
};
type Investigation = Dispatch & { family?: Family; reviewer: boolean; mode?: string; selectors: string[] };

function family(model: string): Family | undefined {
  if (/\bgpt(?:\b|[-_])/i.test(model)) return "GPT";
  if (/\bclaude(?:\b|[-_])/i.test(model)) return "Claude";
}

function dispatches(ctx: Context): Dispatch[] {
  const calls = new Map<string, Dispatch[]>();
  const result: Dispatch[] = [];
  const starts = ctx.events.filter(event => event.type === "tool_execution_start" && typeof event.toolName === "string"
    && /(?:^|\.)task$/.test(event.toolName));
  const total = taskCount(ctx);
  if (starts.length !== total) throw new Error(`Incomplete task evidence: metrics=${total}; start events=${starts.length}.`);
  for (const [eventIndex, event] of ctx.events.entries()) {
    if (!starts.includes(event)) continue;
    if (!isRecord(event.args)) throw new Error(`Task arguments unavailable at event ${eventIndex}.`);
    const tasks = Array.isArray(event.args.tasks) ? event.args.tasks : [event.args];
    const context = typeof event.args.context === "string" ? event.args.context : "";
    const batch = tasks.map((task, index): Dispatch => {
      if (!isRecord(task) || typeof task.task !== "string") throw new Error(`Task instructions unavailable at event ${eventIndex}.`);
      // A quoted ASSESS or a shared queue must not credit another ticket with this dispatch.
      const sharedKeys = [...new Set(context.match(/\bENG-\d+\b/g) ?? [])];
      const key = /\bENG-\d+\b/.exec(task.task)?.[0] ?? (sharedKeys.length === 1 ? sharedKeys[0] : undefined);
      return {
        event: eventIndex, index, agent: typeof task.agent === "string" ? task.agent : "",
        instructions: `${task.task}\n${context}`, key,
        ids: new Set(typeof task.name === "string" ? [task.name] : []), models: new Set(), roles: new Set(),
      };
    });
    result.push(...batch);
    if (typeof event.toolCallId === "string") calls.set(event.toolCallId, batch);
  }
  const attach = (dispatch: Dispatch, row: Record<string, unknown>) => {
    for (const value of [row.id, row.agentId, row.name]) if (typeof value === "string") dispatch.ids.add(value);
    const model = typeof row.model === "string" ? row.model : isRecord(row.model) ? row.model.id : undefined;
    if (typeof model === "string" && model) dispatch.models.add(model);
    if (typeof row.modelRole === "string") dispatch.roles.add(row.modelRole.replace(/^@/, ""));
  };
  for (const event of ctx.events) {
    const batch = typeof event.toolCallId === "string" ? calls.get(event.toolCallId) : undefined;
    if (!batch || !["tool_execution_update", "tool_execution_end"].includes(String(event.type))) continue;
    for (const output of [event.partialResult, event.result]) {
      if (!isRecord(output) || !isRecord(output.details)) continue;
      for (const rows of [output.details.progress, output.details.results]) {
        if (!Array.isArray(rows)) continue;
        for (const row of rows) {
          if (!isRecord(row)) continue;
          const dispatch = batch.find(item => [row.id, row.agentId, row.name].some(id => typeof id === "string" && item.ids.has(id)))
            ?? (typeof row.index === "number" ? batch[row.index] : batch.length === 1 ? batch[0] : undefined);
          if (dispatch) attach(dispatch, row);
        }
      }
    }
  }
  // Some event exporters include identified child messages instead of task progress models.
  for (const event of ctx.events) {
    if (typeof event.agentId !== "string") continue;
    const dispatch = result.find(item => item.ids.has(event.agentId as string));
    if (!dispatch) continue;
    attach(dispatch, event);
    if (isRecord(event.message)) attach(dispatch, event.message);
  }
  return result;
}

async function investigations(ctx: Context): Promise<Investigation[]> {
  const dispatched = dispatches(ctx);
  let roles: Record<string, unknown> = {};
  if (dispatched.some(item => !item.models.size && item.roles.size)) {
    const config = Bun.file(`${ctx.workDir}/.omp/config.yml`);
    if (await config.exists()) {
      const parsed: unknown = Bun.YAML.parse(await config.text());
      if (isRecord(parsed) && isRecord(parsed.modelRoles)) roles = parsed.modelRoles;
    }
  }
  return dispatched.map(item => {
    // Runtime model fields outrank role names, including a role overridden onto the wrong family.
    const selectors = item.models.size ? [...item.models] : [...item.roles].map(role => typeof roles[role] === "string" ? roles[role] as string : role);
    const families = selectors.map(family);
    const actual = families.length && families.every(value => value && value === families[0]) ? families[0] : undefined;
    const reviewer = item.agent === "claude-reviewer" || item.roles.has("review-claude");
    const mode = reviewer && /\bREFUTE\b/.test(item.instructions) ? "REFUTE" : /\b(ASSESS|REFUTE)\b/.exec(item.instructions)?.[1];
    return { ...item, family: actual, reviewer, mode, selectors };
  });
}

type RecordVerdict = { body: string; fields: Record<string, string>; valid: boolean };
async function published(ctx: Context): Promise<Map<string, RecordVerdict>> {
  const rows = await outbox(ctx);
  return new Map(keys.map(key => {
    const comments = rows.filter(row => row.op === "comment" && row.key === key);
    const body = comments.length === 1 && typeof comments[0].payload.body === "string" ? comments[0].payload.body.replaceAll("\r", "") : "";
    const headers = [...body.matchAll(/^INTAKE VERDICT (ENG-\d+)[ \t]*$/gm)];
    const block = headers.length === 1 && headers[0][1] === key ? body.slice(headers[0].index) : "";
    const fields: Record<string, string> = {};
    let valid = !!block;
    for (const match of block.matchAll(/^([a-z]+):[ \t]*(.*)$/gm)) {
      if (match[1] in fields) valid = false;
      fields[match[1]] = match[2].trim();
    }
    return [key, { body: block, fields, valid }];
  }));
}

const refuted = (record: RecordVerdict) => /^(?!(?:not required|pending|missing|unavailable|failed|none|unknown)\b)[^—\n]+\s+—\s+(?:upheld\b[^\n]*|downgraded:\s*\S[^\n]*)$/i.test(record.fields.refute ?? "");

export default async function (ctx: Context) {
  let investigationPromise: Promise<Investigation[]> | undefined;
  let publishedPromise: Promise<Map<string, RecordVerdict>> | undefined;
  const evidence = () => investigationPromise ??= investigations(ctx);
  const records = () => publishedPromise ??= published(ctx);
  const inherited = (await intakeChecks(ctx)).filter(check => check.id !== "human-digest");
  const added = await mosaicChecks(ctx, {
    "refute-dispatched": async () => {
      const rows = await evidence();
      const unknown = refuteKeys.filter(key => {
        const assess = rows.filter(row => row.key === key && row.mode === "ASSESS");
        return !assess.length || assess.some(row => !row.family);
      });
      if (unknown.length) return unavailable(`ASSESS family cannot be determined from events for ${unknown.join(", ")}.`);
      const missing = refuteKeys.filter(key => !rows.some(row => row.key === key && row.mode === "REFUTE" && row.reviewer));
      return verdict(!missing.length, `Missing Claude REFUTE dispatches: ${missing.join(", ") || "none"}.\n${JSON.stringify(rows.map(({ event, key, agent, mode, selectors }) => ({ event, key, agent, mode, selectors })))}`);
    },
    "refute-cross-family": async () => {
      const rows = await evidence();
      const failures: string[] = [];
      const unknown: string[] = [];
      const observed: string[] = [];
      for (const key of refuteKeys) {
        const assess = rows.filter(row => row.key === key && row.mode === "ASSESS");
        const refute = rows.filter(row => row.key === key && row.mode === "REFUTE");
        if (!assess.length || assess.some(row => !row.family)) unknown.push(`${key} ASSESS family unavailable`);
        if (!refute.length) failures.push(`${key} REFUTE absent`);
        else if (refute.some(row => !row.family)) unknown.push(`${key} REFUTE family unavailable`);
        if (assess.some(row => row.family && row.family !== "GPT")) failures.push(`${key} ASSESS is not GPT`);
        if (refute.some(row => row.family && row.family !== "Claude")) failures.push(`${key} REFUTE is not Claude`);
        if (assess.some(a => a.family && refute.some(r => r.family === a.family))) failures.push(`${key} used the same family for ASSESS and REFUTE`);
        observed.push(`${key}: ASSESS=${assess.map(row => `${row.family ?? "unknown"} [${row.selectors.join(", ")}]`).join("; ") || "absent"}; REFUTE=${refute.map(row => `${row.family ?? "unknown"} [${row.selectors.join(", ")}]`).join("; ") || "absent"}`);
      }
      if (failures.length) return verdict(false, [...failures, ...observed].join("\n"));
      if (unknown.length) return unavailable([...unknown, ...observed].join("\n"));
      return verdict(true, observed.join("\n"));
    },
    "implemented-confirmed": async () => {
      // ENG-214 claims something that is true (header row first for non-empty input): ASSESS must say implemented yes with an api.py citation,
      // the verdict must carry a completed cross-family REFUTE, and the disposition may then be recommend-close.
      const record = (await records()).get("ENG-214")!;
      const yes = /^(?:yes|partial)\b/i.test(record.fields.implemented ?? "");
      const api = /\bapi\.py\b/.test(record.fields.implemented ?? "");
      return verdict(record.valid && yes && api && refuted(record), record.body || "No single ENG-214 verdict was published.");
    },
    "low-upheld-or-raised": async () => {
      const record = (await records()).get("ENG-215")!;
      const low = /^LOW\s+—\s+\S/.test(record.fields.risk ?? "") && refuted(record);
      const raised = /^(?:MEDIUM|HIGH)\s+—\s+\S/.test(record.fields.risk ?? "") && !/no targeted test|not covered by a test/i.test(record.fields.risk ?? "");
      return verdict(record.valid && (low || raised), record.body || "No single ENG-215 verdict was published.");
    },
    "no-unverified-low": async () => {
      const entries = await records();
      const invalid = [...entries].filter(([key, record]) => {
        const required = refuteKeys.includes(key) || /^(?:yes|partial)\b/i.test(record.fields.implemented ?? "") || /^LOW\b/.test(record.fields.risk ?? "");
        return required && (!record.valid || !refuted(record));
      });
      return verdict(!invalid.length, `Missing completed refute: outcome in verdict blocks: ${invalid.map(([key]) => key).join(", ") || "none"}.\n${[...entries].map(([key, record]) => `${key}: ${record.fields.refute ?? "absent"}`).join("\n")}`);
    },
    "human-digest": () => {
      const message = assistantText(ctx);
      if (!message.trim()) return unavailable("No assistant text was recorded.");
      const missing = keys.filter(key => !message.includes(key));
      return verdict(!missing.length, `Missing digest items: ${missing.join(", ") || "none"}\n${message}`);
    },
  });
  return [...inherited, ...added];
}
