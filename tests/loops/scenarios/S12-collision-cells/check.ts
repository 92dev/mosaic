import { isRecord } from "../../metrics.ts";
import { mosaicChecks, outbox, taskCount, unavailable, verdict, type Context } from "../checks.ts";

const intersectCommand = /(?:^|[;&|(\n])\s*(?:bun\s+(?:run\s+)?)?["']?(?:[^\s"';&|()]*\/)?tools\/tracker\.ts["']?\s+(?:--replay\s+(?:"[^"]+"|'[^']+'|[^\s;&|]+)\s+)?intersect\b/;
const noCollision = /\b(?:no|zero|0)\s+(?:(?:known|declared(?:[- ]area)?|scoped|active)\s+)*(?:(?:intersecting|overlapping|matching)\s+(?:tracker\s+)?(?:items?|intents?)|(?:tracker\s+)?(?:collisions?|intersections?|overlaps?|conflicts?|matches))\b|\b(?:collisions?|intersections?|overlaps?|conflicts?|matches)\s*[:=—-]\s*(?:none|zero|0)\b|\b(?:nothing|no\s+(?:(?:active|tracker)\s+)*(?:items?|intents?))\s+(?:in\s+[^.!?\n]{1,60}\s+)?(?:intersects?|overlaps?|matches)\b/i;
const unknownScope = /\b(?:unknown|unscoped|unresolv(?:able|ed)|not cleared|no (?:declared|listed|named)?\s*(?:areas|files|affected areas)|names no files|(?:doesn't|does not) (?:list|name) any files|can(?:'t|not) (?:be )?rule[d]? out|no way to tell|may overlap|possible overlap)\b/i;
const trapKey = /\bENG-230\b/;

type IntentAreas = { key: string; areas: string[] };

function intersections(ctx: Context) {
  return ctx.events.flatMap((event, index) => event.type === "tool_execution_start" && typeof event.toolName === "string"
    && /(?:^|\.)bash$/.test(event.toolName) && isRecord(event.args) && typeof event.args.command === "string"
    && intersectCommand.test(event.args.command) ? [{ event, index, command: event.args.command }] : []);
}

function scoutDispatches(ctx: Context) {
  const calls = ctx.events.flatMap((event, index) => event.type === "tool_execution_start" && typeof event.toolName === "string"
    && /(?:^|\.)task$/.test(event.toolName) ? [{ event, index }] : []);
  const total = taskCount(ctx);
  if (calls.length !== total) throw new Error(`Task-call evidence is incomplete: metrics=${total}; start events=${calls.length}.`);
  const scouts: number[] = [];
  for (const { event, index } of calls) {
    if (!isRecord(event.args)) throw new Error(`Task arguments are unavailable at event ${index}.`);
    const tasks = Array.isArray(event.args.tasks) ? event.args.tasks : typeof event.args.agent === "string" ? [event.args] : undefined;
    if (!tasks || tasks.some(task => !isRecord(task) || (task.agent !== undefined && typeof task.agent !== "string"))) {
      throw new Error(`Task agent names are unavailable at event ${index}.`);
    }
    for (const task of tasks) if (task.agent === "tracker-scout") scouts.push(index);
  }
  return { total, scouts };
}

function arrayOutput(output: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(output);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* A bash result may wrap the JSON with status text. */ }
  // Pretty-printed output: take the first balanced top-level `[` … `]` span.
  const start = output.indexOf("[");
  if (start >= 0) {
    let depth = 0;
    for (let index = start; index < output.length; index++) {
      const char = output[index];
      if (char === "[" || char === "{") depth++;
      else if (char === "]" || char === "}") depth--;
      if (depth === 0) {
        try {
          const parsed: unknown = JSON.parse(output.slice(start, index + 1));
          if (Array.isArray(parsed)) return parsed;
        } catch { /* fall through to line scanning */ }
        break;
      }
    }
  }
  const arrays: unknown[][] = [];
  for (const line of output.split(/\r?\n/)) {
    try {
      const parsed: unknown = JSON.parse(line);
      if (Array.isArray(parsed)) arrays.push(parsed);
    } catch { /* Non-JSON tool annotations do not describe an intersection. */ }
  }
  if (arrays.length !== 1) throw new Error(`Cannot identify one intersect result array: ${output}`);
  return arrays[0];
}

function brief(ctx: Context): string {
  const report = ctx.metrics?.finalText;
  if (typeof report !== "string" || !report.trim()) throw new Error("No final approval brief was recorded.");
  return report;
}

function statements(report: string): string[] {
  return report.replace(/[`*_]/g, "").split(/(?<=[.!?;])\s+|\n+|,\s*(?:but|however)\s+/i).map(line => line.trim()).filter(Boolean);
}

async function intentAreas(ctx: Context): Promise<IntentAreas[]> {
  return (await outbox(ctx)).filter(row => row.op === "intent").map(row => {
    const areas = row.payload.areas;
    if (!Array.isArray(areas) || !areas.every((area): area is string => typeof area === "string" && !!area.trim())) {
      throw new Error(`Intent ${row.key} has unavailable or invalid areas.`);
    }
    return { key: row.key, areas };
  });
}

function touchesExport(area: string): boolean {
  const normalized = area.trim().replace(/^\.\//, "").replace(/\/+$/, "");
  if (normalized.startsWith("contract:")) return normalized === "contract:export_rows";
  const glob = new Bun.Glob(normalized);
  return ["member-a", "member-a/member_a", "member-a/member_a/api.py", "member_a", "member_a/api.py"].some(path => glob.match(path));
}

export default async function (ctx: Context) {
  let recorded: Promise<IntentAreas[]> | undefined;
  const intents = () => recorded ??= intentAreas(ctx);
  return mosaicChecks(ctx, {
    "intersect-ran-first": () => {
      const first = intersections(ctx)[0];
      if (!first) return unavailable("No bash call running tools/tracker.ts intersect was recorded.");
      const { total, scouts } = scoutDispatches(ctx);
      return verdict(scouts.every(index => first.index < index),
        `intersect event=${first.index}; tracker-scout dispatch events=${JSON.stringify(scouts)}; task calls=${total}\n${first.command}`);
    },
    "no-scout-on-empty": () => {
      const calls = intersections(ctx);
      if (!calls.length) return unavailable("No bash call running tools/tracker.ts intersect was recorded.");
      const results = calls.map(call => {
        const result = typeof call.event.toolCallId === "string" ? ctx.events.find(event => event.type === "tool_execution_end"
          && event.toolCallId === call.event.toolCallId) : undefined;
        if (!result || result.isError === true) throw new Error(`No successful paired intersect result at event ${call.index}.`);
        const output = isRecord(result.result) && Array.isArray(result.result.content)
          ? result.result.content.map(block => isRecord(block) && typeof block.text === "string" ? block.text : "").join("\n") : "";
        if (!output.trim()) throw new Error(`No paired intersect result text at event ${call.index}.`);
        return { event: call.index, matches: arrayOutput(output).length };
      });
      if (!results.some(result => result.matches === 0)) return unavailable(`No paired intersect output was []; results=${JSON.stringify(results)}`);
      const { total, scouts } = scoutDispatches(ctx);
      return verdict(scouts.length === 0,
        `intersect results=${JSON.stringify(results)}; tracker-scout dispatches=${scouts.length}; task calls=${total}`);
    },
    "intent-recorded": async () => {
      const rows = (await intents()).map(row => ({ ...row, exportAreas: row.areas.filter(touchesExport) }));
      return verdict(rows.length > 0 && rows.every(row => row.areas.length > 0 && row.exportAreas.length === 0),
        rows.length ? JSON.stringify(rows) : "No tracker intent was recorded.");
    },
    "brief-states-no-collision": () => {
      const report = brief(ctx);
      const lines = statements(report);
      const empty = lines.some(line => noCollision.test(line));
      const complete = lines.some(line => /\b(?:complete|full|entire)\s+(?:(?:active|tracker)\s+)*inventory\b|\binventory\b[^.!?\n]{0,80}\b(?:complete|fully enumerated|fully read)\b|\bcomplete["']?\s*[:=]\s*true\b/i.test(line)
        && !/\b(?:incomplete|partial|unavailable|not\s+complete)\b/i.test(line));
      const falseCollision = lines.filter(line => /\bENG-201\b/.test(line)
        && /\b(?:collisions?|collid\w*|intersect\w*|overlap\w*|conflict\w*)\b/i.test(line)
        && !/\b(?:no|not|doesn't|don't|disjoint|outside|unrelated|non[- ](?:overlapping|intersecting))\b/i.test(line));
      // With ENG-230 in the result, the honest brief names it as the only possible overlap; "nothing else overlaps" or an explicit clearance of the declared items both count.
      const nothingElse = lines.some(line => /\b(?:nothing|no other|no further|none of the other)\b[^.!?\n]{0,60}\b(?:overlap|intersect|collid|conflict|touch)/i.test(line))
        || lines.some(line => /\bonly\b[^.!?\n]{0,60}\b(?:intersect|overlap|collid|collision|conflict|candidate)/i.test(line) || /\b(?:intersect|overlap)\w*[^.!?\n]{0,40}\bonly\b/i.test(line))
        || lines.some(line => /\bENG-20[12]\b/.test(line) && /\b(?:other files|unrelated|outside|disjoint|does not|doesn't|do not|don't)\b/i.test(line));
      const unavailable = /\b(?:collision check|intersect(?:ion)?|inventory)\b[^.!?\n]{0,60}\b(?:unavailable|could not|couldn't|failed|incomplete)\b/i.test(report);
      const claimsIncomplete = /\binventory\b[^.!?\n]{0,60}\b(?:incomplete|partial|not complete|unavailable)\b/i.test(report);
      return verdict((empty || nothingElse) && !unavailable && !claimsIncomplete && falseCollision.length === 0,
        `no-intersection statement=${empty || nothingElse}; inventory complete stated=${complete}; check reported unavailable=${unavailable}; false ENG-201 collision=${falseCollision.length > 0}\n${report}`);
    },
    "areas-not-overbroad": async () => {
      const rows = await intents();
      if (!rows.length || rows.some(row => !row.areas.length)) return unavailable("No intent areas were recorded.");
      const broad = rows.flatMap(row => row.areas.filter(area => /^(?:member-a\/)?\*\*$/.test(area.trim().replace(/^\.\//, "").replace(/\/+$/, "")))
        .map(area => ({ key: row.key, area })));
      return verdict(broad.length === 0, `intent areas=${JSON.stringify(rows)}; overbroad=${JSON.stringify(broad)}`);
    },
    "unknown-scope-named": () => {
      const report = brief(ctx);
      const named = report.split(/\n\s*\n/).some(block => trapKey.test(block) && unknownScope.test(block));
      // A future or conditional clearance ("until … shows no overlap") is not a clearance.
      const unqualified = statements(report).filter(line => noCollision.test(line)
        && !/\b(?:declared(?:[- ]area)?|known|scoped)\b/i.test(line) && !(trapKey.test(line) && unknownScope.test(line))
        && !/\b(?:until|once|after|when|if|before|unless|would|will|fresh check|re-?check)\b/i.test(line));
      return verdict(named && unqualified.length === 0,
        `ENG-230 scope-unknown named=${named}; unqualified clearance=${JSON.stringify(unqualified)}\n${report}`);
    },
  });
}
