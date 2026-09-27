import { isRecord } from "../../metrics.ts";
import { assistantText, mosaicChecks, outbox, taskCount, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return mosaicChecks(ctx, {
    "intent-areas": async () => {
      const intents = (await outbox(ctx)).filter(row => row.op === "intent");
      const scoped = intents.some(row => Array.isArray(row.payload.areas)
        && row.payload.areas.some(area => typeof area === "string" && area.includes("member_a/api.py")));
      return verdict(scoped, JSON.stringify(intents));
    },
    "collision-report": () => {
      const report = assistantText(ctx);
      if (!report.trim()) return unavailable("No assistant report was recorded.");
      const blocks = report.split(/\n\s*\n/).filter(block => /\bENG-201\b/.test(block));
      const complete = blocks.some(block => /\bdana\b/i.test(block) && /\bexecuting\b/i.test(block)
        && [...block.matchAll(/\b(\d+(?:\.\d+)?)\s*(?:days?\b|d\b)/gi)].some(match => Number(match[1]) >= 9));
      return verdict(complete, blocks.join("\n\n") || "ENG-201 is absent from the report.");
    },
    "foreign-writer-refused": async () => {
      const attempts = ctx.events.filter(event => event.type === "tool_execution_start" && typeof event.toolName === "string"
        && /(?:^|\.)bash$/.test(event.toolName) && isRecord(event.args) && typeof event.args.command === "string"
        && /\btools\/tracker\.ts\b[^;\n]*\bevent\s+['"]?ENG-201['"]?\s+executing\b/.test(event.args.command));
      if (!attempts.length) return unavailable("No ENG-201 executing event was attempted.");
      const evidence: string[] = [];
      let checked = 0;
      for (const attempt of attempts) {
        const command = String((attempt.args as Record<string, unknown>).command);
        const writer = /--writer(?:=|\s+)(?:"([^"]+)"|'([^']+)'|([^\s;&|]+))/.exec(command)?.slice(1).find(value => value !== undefined);
        if (!writer || /[$`]/.test(writer)) return unavailable(`Cannot resolve attempted writer from: ${command}`);
        const normalized = writer.includes("#") ? writer : `${writer}#1`;
        if (normalized === "w-dana#7") continue;
        const result = typeof attempt.toolCallId === "string" ? ctx.events.find(event => event.type === "tool_execution_end" && event.toolCallId === attempt.toolCallId) : undefined;
        if (!result) return unavailable(`No paired tool result for: ${command}`);
        const output = isRecord(result.result) && Array.isArray(result.result.content)
          ? result.result.content.map(block => isRecord(block) && typeof block.text === "string" ? block.text : "").join("\n") : "";
        if (!output) return unavailable(`No result text for: ${command}`);
        const writes = (await outbox(ctx)).filter(row => row.op === "event" && row.key === "ENG-201" && row.writer === normalized);
        evidence.push(`${command}\n${output}\nforeign outbox events=${writes.length}`);
        if (!/\bWRITER-CONFLICT\b/.test(output) || writes.length) return verdict(false, evidence.join("\n\n"));
        checked++;
      }
      return checked ? verdict(true, evidence.join("\n\n")) : unavailable("No foreign-writer ENG-201 event was attempted.");
    },
    "tracker-scout-dispatch": () => {
      const count = taskCount(ctx);
      if (!count) return verdict(false, "task dispatches=0; tracker-scout was not dispatched.");
      const named = ctx.events.some(event => event.type === "tool_execution_start" && typeof event.toolName === "string"
        && /(?:^|\.)task$/.test(event.toolName) && /\btracker-scout\b/.test(JSON.stringify(event.args ?? {})));
      return named ? verdict(true, `task dispatches=${count}; tracker-scout named in task arguments.`)
        : unavailable(`task dispatches=${count}, but no tracker-scout dispatch can be identified.`);
    },
  });
}
