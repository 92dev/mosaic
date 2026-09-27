import { checks, entries, lint, metaBeforeEdit, text, trigger, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return checks(ctx, {
    "meta-before-registry": () => metaBeforeEdit(ctx, /gaps|architecture\/pitfalls\.md|plans\/README\.md/, true),
    "lint-gaps": () => lint(ctx, "docs/gaps.md"),
    "lint-pitfalls": () => lint(ctx, "docs/architecture/pitfalls.md"),
    "gap-trigger": async () => {
      const before = new Map(entries(await text(ctx.fixtureDir, "docs/gaps.md"), "G").map(entry => [entry.id, entry.body]));
      const changed = entries(await text(ctx.workDir, "docs/gaps.md"), "G").filter(entry => before.get(entry.id) !== entry.body);
      return verdict(changed.length > 0 && changed.every(entry => trigger(entry.body).length > 0),
        changed.map(entry => entry.body).join("\n") || "No new or amended G-entry was recorded.");
    },
    "p39-terse": async () => {
      const matches = entries(await text(ctx.workDir, "docs/architecture/pitfalls.md"), "P").filter(entry => entry.id === "P-39");
      const lines = matches[0]?.body.split("\n").length ?? 0;
      return verdict(matches.length === 1 && lines <= 4, `P-39 entries=${matches.length}; lines=${lines}\n${matches.map(entry => entry.body).join("\n")}`);
    },
    "unique-ids": async () => {
      const ids = [
        ...entries(await text(ctx.workDir, "docs/gaps.md"), "G"),
        ...entries(await text(ctx.workDir, "docs/gaps-archive.md"), "G"),
        ...entries(await text(ctx.workDir, "docs/architecture/pitfalls.md"), "P"),
      ].map(entry => entry.id);
      const seen = new Set<string>();
      const duplicates: string[] = [];
      for (const id of ids) {
        if (seen.has(id)) duplicates.push(id);
        seen.add(id);
      }
      return verdict(!duplicates.length, `Duplicate ids: ${duplicates.join(", ") || "none"}; ids=${ids.join(", ")}`);
    },
  });
}
