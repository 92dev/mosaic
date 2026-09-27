import { checks, text, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return checks(ctx, {
    "no-edits": async () => {
      if (ctx.metrics.edits.length) return verdict(false, `Recorded edits: ${JSON.stringify(ctx.metrics.edits)}`);
      const patch = await text(ctx.runDir, "diff.patch");
      return verdict(!patch.trim(), patch.trim() ? `diff.patch is non-empty (${patch.length} characters).` : "metrics.edits and diff.patch are empty.");
    },
    "approval-message": () => ctx.metrics.finalText.length > 0
      ? verdict(true, ctx.metrics.finalText)
      : unavailable("No final assistant text was recorded."),
  });
}
