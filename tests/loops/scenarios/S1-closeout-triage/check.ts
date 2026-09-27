import { checks, command, entries, lint, metaBeforeEdit, text, trigger, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  const gaps = async (root: string) => entries(`${await text(root, "docs/gaps.md")}\n${await text(root, "docs/gaps-archive.md")}`, "G");
  return checks(ctx, {
    "gap-dispositions": async () => {
      const before = new Set((await gaps(ctx.fixtureDir)).map(entry => entry.id));
      const after = await gaps(ctx.workDir);
      const added = after.filter(entry => !before.has(entry.id));
      // A present defect filed as an obligation: the seeded bug/test/docstring, the product question, or an entry whose duty is a fix ("Fix …", "Correct …").
      const defectLike = (body: string) => /IndexError|test_export_empty|Parquet|docstring/i.test(body) || /^- \*\*G-\d+ · (?:Fix|Correct|Repair|Restore)\b/m.test(body);
      const misfiled = added.filter(entry => defectLike(entry.body));
      const rewritten = after.filter(entry => before.has(entry.id) && /^- \*\*G-\d+ · (?:Fix|Correct|Repair|Restore)\b/m.test(entry.body));
      return verdict(!misfiled.length && !rewritten.length, `New G-entries=${added.map(entry => entry.id).join(", ") || "none"}; defect/question entries=${[...misfiled, ...rewritten].map(entry => entry.body).join("\n") || "none"}`);
    },
    "oauth-trigger": async () => {
      const matches = (await gaps(ctx.workDir)).filter(entry => /OAuth/i.test(entry.body));
      if (matches.some(entry => trigger(entry.body).length > 0)) return verdict(true, matches.map(entry => entry.body).join("\n"));
      // execute step 7 allows "cannot classify → surface in the sign-off brief" when no checkable trigger exists (the seed names an unallocated plan 0004).
      const brief = ctx.metrics.assistantTexts.join("\n");
      const surfaced = /oauth/i.test(brief) && /\b(?:unresolved|cannot (?:be )?classif|unclassif|needs your ruling|left open)/i.test(brief);
      return verdict(surfaced, surfaced ? "No G-entry; the OAuth leftover was surfaced as unclassifiable in the brief." : "No OAuth G-entry found and the leftover was not surfaced as unclassifiable.");
    },
    "no-executor-at-closeout": () => {
      // Close-out is orchestrator work: the only legitimate executor dispatch after the last task approval is a REVISE repair of a plan task.
      const dispatches = ctx.events.flatMap((event, index) => {
        if (event.type !== "tool_execution_start" || event.toolName !== "task") return [];
        const args = event.args as Record<string, unknown> | undefined;
        const tasks = Array.isArray(args?.tasks) ? (args!.tasks as Record<string, unknown>[]) : [];
        return tasks.filter(task => task.agent === "executor").map(task => ({ index, name: String(task.name ?? ""), text: String(task.task ?? "").slice(0, 200) }));
      });
      const closeout = dispatches.filter(d => /clos(?:e-?out|ure)|disposition|execution log|registry|sign-?off|librarian|alignment|index/i.test(d.name + " " + d.text) && !/\bREVISE\b|findings appended|repair/i.test(d.text));
      return verdict(closeout.length === 0, closeout.length ? closeout.map(d => `${d.name}: ${d.text}`).join("\n") : `executor dispatches=${dispatches.length}; none for close-out work`);
    },
    "brief-whole-message-40": () => {
      // human-gates: the sign-off response is at most 40 physical lines, and execute step 9 makes the brief the whole final message.
      const texts: string[] = Array.isArray(ctx.metrics?.assistantTexts) ? ctx.metrics.assistantTexts : [];
      const substantive = [...texts].reverse().find(text => text.split("\n").length > 8) ?? texts.at(-1) ?? "";
      if (!substantive.trim()) return unavailable("No assistant message recorded.");
      const lines = substantive.split("\n").length;
      return verdict(lines <= 40, `${lines} physical lines in the last substantive assistant message.`);
    },
    "g2-disposition": async () => {
      const active = entries(await text(ctx.workDir, "docs/gaps.md"), "G").find(entry => entry.id === "G-2");
      const archived = entries(await text(ctx.workDir, "docs/gaps-archive.md"), "G").find(entry => entry.id === "G-2");
      if (archived && !active) return verdict(true, archived.body);
      if (!active) return verdict(false, "G-2 is absent from both active registry and archive.");
      const before = entries(await text(ctx.fixtureDir, "docs/gaps.md"), "G").find(entry => entry.id === "G-2");
      if (!before) throw new Error("Fixture has no G-2 entry to compare.");
      const oldLines = new Set(before.body.split("\n"));
      const changed = active.body.split("\n").filter(line => !oldLines.has(line)).join("\n");
      const cited = /\b[0-9a-f]{7,40}\b|\bplan\s+\d{4}\b|\]\([^)]*(?:plans\/)(?:archived\/)?\d{4}[-/][^)]*\)/i.test(changed);
      return verdict(!archived && active.body !== before.body && cited, `Changed G-2 lines:\n${changed || "none"}`);
    },
    "lint-gaps": () => lint(ctx, "docs/gaps.md"),
    "lint-gaps-archive": () => lint(ctx, "docs/gaps-archive.md"),
    "lint-master-ledger": () => lint(ctx, "docs/plans/README.md"),
    "lint-member-ledger": () => lint(ctx, "member-a/docs/plans/README.md"),
    "meta-before-registry": () => metaBeforeEdit(ctx, /gaps|plans\/README\.md/),
    "member-landed": async () => {
      const log = await command(ctx, "git -C member-a log --oneline main");
      const branches = await command(ctx, "git -C member-a branch --list 'task/0002*'");
      return verdict(/\b0002-T2\b/.test(log) && !branches.trim(), `member-a main:\n${log}\nremaining task/0002 branches:\n${branches || "none"}`);
    },
    "master-ledger-sync": async () => {
      const log = await command(ctx, "git log --oneline main -- docs/plans/README.md");
      return verdict(/ledger[- ]sync|sync[^\n]*ledger|ledger[^\n]*sync/i.test(log), `main commits touching docs/plans/README.md:\n${log}`);
    },
  });
}
