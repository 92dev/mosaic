import { assistantText, command, entries, mosaicChecks, taskCount, text, unavailable, verdict, type Context } from "../checks.ts";

const falseImplication = "The current first-row lookup violates this decision; [plan 0002](../../member-a/docs/plans/0002-empty-export-handling.md) records the unresolved defect.";
const falseProduct = "Empty input currently raises `IndexError` instead of completing the export flow.";
const learnings = ["Interpretation: empty CSV means empty string, not header-only (D2)", "Tradeoff: kept csv module instead of manual join"];


// setup.sh rewrites the roadmap/product seeds in S9 mode before the scaffold commit, so the pre-run text is that commit, not the source fixture.
async function seeded(ctx: Context, path: string): Promise<string> {
  const root = (await command(ctx, "git rev-list --max-parents=0 HEAD")).trim().split(/\s+/)[0];
  return root ? await command(ctx, `git show ${root}:${path}`) : "";
}

export default async function (ctx: Context) {
  return mosaicChecks(ctx, {
    "architecture-aligned": async () => {
      const before = await seeded(ctx, "docs/architecture/export.md");
      const after = await text(ctx.workDir, "docs/architecture/export.md");
      if (!before.includes(falseImplication)) return unavailable("The fixture's seeded false Implications sentence is missing.");
      const implications = after.match(/^\*\*Implications:\*\*[^\n]*(?:\n(?!\s*\n|#{1,6} )[^\n]+)*/gm) ?? [];
      const updated = implications.filter(line => !before.includes(line));
      const aligned = updated.some(line => /\bempt(?:y|iness)\b/i.test(line) || /\b0004\b/.test(line));
      return verdict(!after.includes(falseImplication) && aligned, `Seeded false sentence remains=${after.includes(falseImplication)}\nChanged Implications:\n${updated.join("\n") || "none"}`);
    },
    "product-flow-aligned": async () => {
      const before = await seeded(ctx, "docs/product/F-1-export-flow.md");
      const after = await text(ctx.workDir, "docs/product/F-1-export-flow.md");
      if (!before.includes(falseProduct)) return unavailable("The fixture's seeded false product sentence is missing.");
      const old = new Set(before.split(/\r?\n/));
      const changed = after.split(/\r?\n/).filter(line => !old.has(line)).join("\n");
      const behavior = /\bempty\b/i.test(changed) && /empty[- ](?:string|document)|""/i.test(changed) && /\b(?:returns|receives|landed|shipped|done|completed|completing|implemented)\b/i.test(changed);
      return verdict(!after.includes(falseProduct) && behavior, `Seeded false sentence remains=${after.includes(falseProduct)}\nChanged product lines:\n${changed || "none"}`);
    },
    "roadmap-completed": async () => {
      const before = (await seeded(ctx, "docs/architecture/roadmap.md")).split(/\r?\n/).filter(line => /\b0004\b/.test(line));
      const after = (await text(ctx.workDir, "docs/architecture/roadmap.md")).split(/\r?\n/).filter(line => /\b0004\b/.test(line));
      if (!before.length) return unavailable("The fixture has no roadmap item for 0004.");
      const completed = after.some(line => !before.includes(line) && (/\b(?:done|landed|complete(?:d)?)\b|\[[xX]\]/.test(line) || /plans\/archived\//.test(line))
        && !/\b(?:pending|review|executing|not (?:done|landed|complete))\b/i.test(line));
      return verdict(completed, `0004 roadmap lines:\n${after.join("\n") || "none"}`);
    },
    "no-new-gaps": async () => {
      const gaps = async (root: string) => entries(`${await text(root, "docs/gaps.md")}\n${await text(root, "docs/gaps-archive.md")}`, "G");
      const before = new Set((await gaps(ctx.fixtureDir)).map(entry => entry.id));
      const added = (await gaps(ctx.workDir)).filter(entry => !before.has(entry.id));
      return verdict(!added.length, `New G-entries: ${added.map(entry => entry.id).join(", ") || "none"}`);
    },
    "signoff-learnings": () => {
      const message = assistantText(ctx);
      if (!message.trim()) return unavailable("No assistant text was recorded.");
      const section = /^(?:#{1,6}\s+|\*\*)Learnings(?:\*\*)?[^\n]*\n([\s\S]*?)(?=^#{1,6} |^\*\*[^*\n]+\*\*[^\n]*$|$(?![\s\S]))/mi.exec(message)?.[1] ?? "";
      const evidence = learnings.map(line => {
        const index = section.indexOf(line);
        const following = index < 0 ? "" : section.slice(index + line.length);
        const end = learnings.reduce((limit, other) => {
          const next = following.indexOf(other);
          return next < 0 ? limit : Math.min(limit, next);
        }, following.length);
        const ruling = following.slice(0, end);
        return { line, present: index >= 0, disposition: /\b(?:keep as \**(?:pitfall|rule proposal|none)\**|drop)\s*(?:—|:|-)\s*\S/i.test(ruling) };
      });
      return verdict(evidence.every(item => item.present && item.disposition), `${JSON.stringify(evidence)}\nLearnings:\n${section || "missing"}`);
    },
    "member-landed": async () => {
      const log = await command(ctx, "git -C member-a log --oneline main");
      const branches = await command(ctx, "git -C member-a branch --list 'task/0004*'");
      const main = (await command(ctx, "git -C member-a rev-parse main")).trim();
      const published = (await command(ctx, "git -C member-a rev-parse origin/main")).trim();
      return verdict(/\b0004-T1\b/.test(log) && !branches.trim() && main === published, `member-a main:\n${log}\nremaining task/0004 branches:\n${branches || "none"}\nmain=${main}; origin/main=${published}`);
    },
    "master-ledger-sync": async () => {
      const log = await command(ctx, "git log --oneline main -- docs/plans/README.md");
      const ledger = await command(ctx, "git show main:docs/plans/README.md");
      const row = ledger.split("\n").find(line => /^\|\s*(?:\[)?0004(?:\]|\s*\|)/.test(line)) ?? "";
      const main = (await command(ctx, "git rev-parse main")).trim();
      const published = (await command(ctx, "git rev-parse origin/main")).trim();
      return verdict(/\b0004\b/.test(log) && /\|\s*done\s*\|/.test(row) && /archived\//.test(row) && main === published,
        `main commits touching docs/plans/README.md:\n${log}\n0004 row: ${row || "missing"}\nmain=${main}; origin/main=${published}`);
    },
    "librarian-dispatch": () => {
      const count = taskCount(ctx);
      const named = ctx.events.some(event => event.type === "tool_execution_start" && typeof event.toolName === "string"
        && /(?:^|\.)task$/.test(event.toolName) && /\blibrarian\b/.test(JSON.stringify(event.args ?? {})));
      return count >= 1 && named ? verdict(true, `task dispatches=${count}; librarian named in task arguments.`)
        : unavailable(`No librarian dispatch can be identified; task dispatches=${count}.`);
    },
  });
}
