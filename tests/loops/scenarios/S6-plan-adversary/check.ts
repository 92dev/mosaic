import { checks, command, entries, filesBelow, isBaseline, outbox, taskCount, text, unavailable, verdict, type Context } from "../checks.ts";

const sections = ["## Context", "## Scope", "### In scope", "### Out of scope", "## Task breakdown", "## Review checklist", "## Verification", "### Unverified", "## Planning log", "## Execution log"];

async function newPlans(ctx: Context) {
  const paths: string[] = [];
  for (const dir of ["docs/plans", "member-a/docs/plans"]) {
    const before = new Set(await filesBelow(ctx.fixtureDir, dir));
    paths.push(...(await filesBelow(ctx.workDir, dir, true)).filter(path => !before.has(path)
      && /^(?:member-a\/)?docs\/plans\/\d{4}-[^/]+\.md$/.test(path)));
  }
  return Promise.all(paths.map(async path => ({ path, id: /\/(\d{4})-/.exec(path)![1], body: await text(ctx.workDir, path) })));
}

export default async function (ctx: Context) {
  return checks(ctx, {
    "new-plan-sections": async () => {
      const plans = await newPlans(ctx);
      const evidence = plans.map(plan => {
        const headings = new Set(plan.body.split(/\r?\n/).map(line => line.trim()));
        // The baseline template names the section "### Verification gaps"; mosaic renamed it "### Unverified".
        if (headings.has("### Verification gaps")) headings.add("### Unverified");
        return { path: plan.path, missing: sections.filter(section => !headings.has(section)) };
      });
      return verdict(plans.length > 0 && evidence.every(plan => !plan.missing.length), JSON.stringify(evidence.length ? evidence : "No new numbered plan."));
    },
    "adversary-rulings": async () => {
      const plans = await newPlans(ctx);
      const evidence = plans.map(plan => {
        const log = /^## Planning log\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(plan.body)?.[1] ?? "";
        const round = /\b(?:adversar(?:y|ial)\s+)?round\s*(?:#\s*)?[1-9]\d*\b/i.test(log);
        const ruling = /\b(?:ACCEPT(?:ED)?|REJECT(?:ED)?|INVESTIGATE)\b[^\n]*\S/i.test(log);
        return { path: plan.path, round, ruling, log };
      });
      return verdict(evidence.length > 0 && evidence.every(plan => plan.round && plan.ruling), JSON.stringify(evidence));
    },
    "reserved-ledger-row": async () => {
      const plans = await newPlans(ctx);
      const ledger = await text(ctx.workDir, "docs/plans/README.md");
      const rows = plans.map(plan => ledger.split(/\r?\n/).find(line => new RegExp(`^\\|\\s*(?:\\[)?${plan.id}(?:\\]|\\s*\\|)`).test(line)) ?? "");
      return verdict(rows.length > 0 && rows.every(row => /\|\s*(?:draft|reserved)\s*\|/.test(row)), rows.join("\n") || "No reserved row for a new plan.");
    },
    "reserve-pushed": async () => {
      const plans = await newPlans(ctx);
      const log = await command(ctx, "git log origin/main --format=%s -- docs/plans/README.md");
      const ledger = await command(ctx, "git show origin/main:docs/plans/README.md");
      const pushed = plans.length > 0 && plans.every(plan => log.split("\n").some(line => line.includes(plan.id) && /\breserv(?:e|ed|ation|ing)\b/i.test(line))
        && ledger.split("\n").some(line => new RegExp(`^\\|\\s*(?:\\[)?${plan.id}(?:\\]|\\s*\\|)`).test(line)));
      return verdict(pushed, `origin/main ledger commits:\n${log}\nNew plan ids: ${plans.map(plan => plan.id).join(", ") || "none"}`);
    },
    "no-new-gaps": async () => {
      const before = new Set(entries(await text(ctx.fixtureDir, "docs/gaps.md"), "G").map(entry => entry.id));
      const added = entries(await text(ctx.workDir, "docs/gaps.md"), "G").filter(entry => !before.has(entry.id));
      return verdict(!added.length, `New G-entries: ${added.map(entry => entry.id).join(", ") || "none"}`);
    },
    "task-dispatch": () => {
      const count = taskCount(ctx);
      return verdict(count >= 1, `task dispatches=${count}`);
    },
    "tracker-intent": async () => {
      if (await isBaseline(ctx)) return unavailable("no intake/tracker/librarian in baseline");
      const plans = await newPlans(ctx);
      const intents = (await outbox(ctx)).filter(row => row.op === "intent");
      const tracked = plans.length > 0 && plans.every(plan => /^tracker:\s*(?:\S|\n\s+\S)/m.test(/^---\r?\n([\s\S]*?)\r?\n---/.exec(plan.body)?.[1] ?? ""));
      return verdict(tracked && intents.length > 0, `tracker frontmatter=${tracked}; intent keys=${intents.map(row => row.key).join(", ") || "none"}`);
    },
  });
}
