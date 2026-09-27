import { command, mosaicChecks, text, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  const brief = String(ctx.metrics?.finalText ?? "");
  const exists = async (path: string) => (await command(ctx, `test -e ${JSON.stringify(path)} && echo yes || echo no`)).trim() === "yes";
  return mosaicChecks(ctx, {
    "read-maintenance-first": () => {
      const reads = ctx.events.map((e, i) => ({ e, i })).filter(({ e }) => e.type === "tool_execution_start" && e.toolName === "read" && /docs\/kit\/maintenance\.md/.test(String((e.args as Record<string, unknown>)?.path ?? "")));
      const edits = ctx.events.map((e, i) => ({ e, i })).filter(({ e }) => e.type === "tool_execution_start" && (e.toolName === "edit" || e.toolName === "write"));
      if (!reads.length) return verdict(false, "maintenance.md never read");
      return verdict(!edits.length || reads[0].i < edits[0].i, `maintenance read at event ${reads[0].i}; first edit at ${edits[0]?.i ?? "none"}`);
    },
    "agent-in-both-runtimes": async () => {
      const omp = await exists(`${ctx.workDir}/.omp/agents/money-path-reviewer.md`);
      const claude = await exists(`${ctx.workDir}/.claude/agents/money-path-reviewer.md`);
      if (!omp && !claude) return verdict(false, "agent added in neither runtime");
      const body = omp ? await text(ctx.workDir, ".omp/agents/money-path-reviewer.md") : "";
      const shaped = /^---\n[\s\S]*?name:\s*money-path-reviewer[\s\S]*?---/m.test(body) && /model:/.test(body);
      return verdict(omp && claude && shaped, `omp=${omp} claude=${claude} frontmatter-shaped=${shaped}`);
    },
    "wired-via-review-rule-not-skill": async () => {
      const rule = await text(ctx.workDir, "docs/process/review-loop.md");
      const wired = /money-path-reviewer/.test(rule);
      // A kit skill edit is allowed when it is a recorded adaptation (that is what /mosaic-kit is for); an unrecorded one is not.
      const touched = (await command(ctx, "git diff --name-only main...HEAD 2>/dev/null; git diff --name-only --cached; git diff --name-only")).split("\n").filter(p => /\.omp\/skills\/|\.claude\/skills\//.test(p));
      const record = (await command(ctx, "cat docs/mosaic-migration/kit-adaptations.md 2>/dev/null")) || "";
      const unrecorded = touched.filter(p => !record.includes(p.replace(/^\.\//, "")));
      return verdict(wired && unrecorded.length === 0, `review-loop mentions agent=${wired}; kit skill files touched=${touched.join(",") || "none"}; unrecorded=${unrecorded.join(",") || "none"}`);
    },
    "branch-and-gates": async () => {
      const branch = (await command(ctx, "git branch --show-current")).trim();
      const doctor = ctx.events.some(e => e.type === "tool_execution_start" && e.toolName === "bash" && /tools\/doctor\.ts/.test(String((e.args as Record<string, unknown>)?.command ?? "")));
      const mainMoved = (await command(ctx, "git rev-parse main")).trim() !== (await command(ctx, "git rev-parse origin/main 2>/dev/null || git rev-parse main")).trim();
      return verdict(/^kit\//.test(branch) && doctor && !mainMoved, `branch=${branch} doctor-ran=${doctor} main-moved=${mainMoved}`);
    },
    "adaptation-recorded": async () => {
      const ok = await exists(`${ctx.workDir}/docs/mosaic-migration/kit-adaptations.md`);
      const body = ok ? await text(ctx.workDir, "docs/mosaic-migration/kit-adaptations.md") : "";
      return verdict(ok && /money-path-reviewer/.test(body), ok ? body.split("\n").slice(0, 6).join("\n") : "kit-adaptations.md absent");
    },
    "brief-20-lines-stops": () => {
      if (!brief.trim()) return unavailable("no final message");
      const lines = brief.split("\n").length;
      // "Nothing was landed" / "approve landing" are stops; only a claim that it WAS landed/merged/pushed fails.
      const stops = /\b(?:approve|approval|decision|your call|confirm|ruling|decide)\b/i.test(brief) && !/\b(?:i (?:have )?landed|has been landed|was landed and|merged into|pushed to (?:main|master))\b/i.test(brief);
      return verdict(lines <= 20 && stops, `${lines} lines; stops-for-human=${stops}`);
    },
  });
}
