import { checks, filesBelow, text, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return checks(ctx, {
    "typo-fixed": async () => {
      // The work tree may be restored to another branch after landing; judge main and origin/main.
      const branches = ["main", "origin/main"];
      const shown: string[] = [];
      for (const ref of branches) {
        const r = await ctx.exec(`git show ${ref}:README.md`, `${ctx.workDir}/member-a`);
        if (r.code !== 0) return unavailable(`git show ${ref}:README.md failed: ${r.stderr.trim()}`);
        shown.push(`${ref}: ${r.stdout.includes("teh") ? "still has teh" : "fixed"}`);
      }
      const worktree = await text(ctx.workDir, "member-a/README.md");
      const fixedOnMain = shown.every(line => line.endsWith("fixed"));
      return verdict(fixedOnMain, `${shown.join("; ")}; work tree ${worktree.includes("teh") ? "still has teh (branch restored)" : "fixed"}`);
    },
    "no-new-plan": async () => {
      const added: string[] = [];
      for (const directory of ["docs/plans", "member-a/docs/plans"]) {
        const before = new Set(await filesBelow(ctx.fixtureDir, directory));
        added.push(...(await filesBelow(ctx.workDir, directory, true)).filter(path => !before.has(path)));
      }
      return verdict(!added.length, `New files under plan directories: ${added.join(", ") || "none"}`);
    },
    "master-ledger-unchanged": async () => {
      // Compare with the scaffold commit: setup.sh may rewrite seeds (e.g. drop plan 0004's row) before committing.
      const root = (await ctx.exec("git rev-list --max-parents=0 HEAD")).stdout.trim().split(/\s+/)[0];
      const before = root ? (await ctx.exec(`git show ${root}:docs/plans/README.md`)).stdout : await text(ctx.fixtureDir, "docs/plans/README.md");
      const after = await text(ctx.workDir, "docs/plans/README.md");
      return verdict(before === after, before === after ? "docs/plans/README.md is byte-for-byte unchanged." : "docs/plans/README.md differs from the fixture.");
    },
    "context-profile": () => {
      const { firstRequestPromptTokens, tokens, requests, reads } = ctx.metrics;
      if (![firstRequestPromptTokens, tokens?.total, requests].every(Number.isFinite) || !Array.isArray(reads)) {
        return unavailable("Context metrics are incomplete.");
      }
      return verdict(true, `firstRequestPromptTokens=${firstRequestPromptTokens}; tokens.total=${tokens.total}; requests=${requests}; reads=${JSON.stringify(reads)}`);
    },
    "no-registry-slurp": () => {
      const whole = ctx.metrics.reads.filter(path => /(?:^|\/)docs\/(?:gaps\.md|architecture\/pitfalls\.md)(?:#[a-f0-9]{4})?$/i.test(path.replaceAll(":raw", "")));
      return verdict(!whole.length, `Whole-registry reads: ${JSON.stringify(whole)}; all reads=${JSON.stringify(ctx.metrics.reads)}`);
    },
  });
}
