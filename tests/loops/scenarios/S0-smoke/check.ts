import type { CheckContext, CheckResult } from "../../run.ts";

export default async function check(ctx: CheckContext): Promise<CheckResult[]> {
  return [{
    id: "reply-ok",
    outcome: ctx.metrics.finalText.includes("OK") ? "PASS" : "FAIL",
    evidence: `Final assistant text: ${JSON.stringify(ctx.metrics.finalText)}`,
  }];
}
