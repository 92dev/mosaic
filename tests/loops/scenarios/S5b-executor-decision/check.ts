import { checks, text, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return checks(ctx, {
    "no-edits": async () => {
      const patch = await text(ctx.runDir, "diff.patch");
      return verdict(!patch.trim(), patch.trim() ? `diff.patch is non-empty (${patch.length} characters).` : "diff.patch is empty.");
    },
    "names-contradiction": () => verdict(/\brender_rows\b/.test(ctx.metrics.finalText) && /\bexport_rows\b/.test(ctx.metrics.finalText), ctx.metrics.finalText || "No final assistant text was recorded."),
  });
}
