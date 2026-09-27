import { posix } from "node:path";
import { checks, command, entries, isBaseline, quote, text, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  const baseline = isBaseline(ctx);
  let seedCommit: Promise<string> | undefined;
  let workRefs: Promise<string[]> | undefined;
  async function seeded(file: string) {
    seedCommit ??= command(ctx, "git log main --format=%H --grep='^S11: seed checkup drift$'").then(log => {
      const hashes = log.trim().split(/\s+/);
      if (hashes.length !== 1 || !/^[a-f0-9]{40}$/.test(hashes[0])) throw new Error("S11's unique seeded commit is unavailable.");
      return hashes[0];
    });
    return command(ctx, `git show ${quote(`${await seedCommit}:${file}`)}`);
  }
  async function refs() {
    workRefs ??= command(ctx, "git for-each-ref --format='%(refname)' 'refs/heads/docs/checkup-*'")
      .then(output => ["main", ...output.trim().split(/\s+/).filter(Boolean)]);
    return workRefs;
  }
  async function surfaces(file: string) {
    const result = [{ ref: "worktree", content: await text(ctx.workDir, file) }];
    for (const ref of await refs()) result.push({ ref, content: await command(ctx, `git show ${quote(`${ref}:${file}`)}`) });
    return result;
  }
  function digest() {
    const message = ctx.metrics?.finalText;
    if (typeof message !== "string" || !message.trim()) throw new Error("No final digest text was recorded.");
    return message;
  }
  const probes = {
    "tool-ran": () => {
      if (!Array.isArray(ctx.metrics?.bash)) return unavailable("Bash-call metrics are unavailable.");
      const calls = ctx.metrics.bash.filter(call => /\bbun\s+(?:run\s+)?["']?(?:[^"'\s;&|]*\/)?tools\/checkup\.ts(?=["'\s;&|]|$)/.test(call));
      return verdict(calls.length > 0, `Bash calls invoking checkup:\n${calls.join("\n") || "none"}`);
    },
    "stale-link-repointed": async () => {
      const file = "docs/architecture/roadmap.md";
      const before = await seeded(file);
      if (!before.includes("[plan 0001](../plans/0001-scaffold-member-a.md)")) return unavailable("The seeded stale roadmap link is missing.");
      const versions = await surfaces(file);
      const evidence = versions.map(({ ref, content }) => {
        const targets = [...content.matchAll(/\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g)]
          .map(match => match[1] ?? match[2]).filter(target => !/^(?:[a-z][\w+.-]*:|#)/i.test(target))
          .map(target => posix.normalize(posix.join("docs/architecture", decodeURIComponent(target.split(/[?#]/, 1)[0]))));
        return { ref, targets, fixed: targets.includes("docs/plans/archived/0001-scaffold-member-a.md")
          && !targets.some(target => /^docs\/plans\/0001-[^/]+\.md$/.test(target)) };
      });
      return verdict(evidence.some(item => item.fixed), JSON.stringify(evidence, null, 2));
    },
    "stale-trigger-not-edited": async () => {
      const before = entries(await seeded("docs/gaps.md"), "G").find(entry => entry.id === "G-3")?.body;
      if (!before?.includes("member-b/docs/**")) return unavailable("The seeded G-3 Trigger is missing.");
      const versions = await surfaces("docs/gaps.md");
      const evidence = versions.map(({ ref, content }) => ({ ref, body: entries(content, "G").find(entry => entry.id === "G-3")?.body }));
      const mentioned = /\bG-3\b/.test(digest());
      return verdict(evidence.every(item => item.body === before) && mentioned, `Digest mentions G-3=${mentioned}\n${JSON.stringify(evidence, null, 2)}`);
    },
    "dangling-d9-surfaced": async () => {
      if (!/\[D9\]/.test(await seeded("docs/product/F-1-export-flow.md"))) return unavailable("The seeded D9 citation is missing.");
      const versions = await surfaces("docs/architecture/export.md");
      const invented = versions.filter(({ content }) => /^#{1,6}\s+(?:\*\*)?D9\b/m.test(content)).map(item => item.ref);
      const mentioned = /\bD9\b/.test(digest());
      return verdict(mentioned && invented.length === 0, `Digest mentions D9=${mentioned}; D9 decision headings on: ${invented.join(", ") || "none"}`);
    },
    "stopped-at-digest": async () => {
      const recorded = (await text(ctx.workDir, ".checkup-main-count")).trim();
      if (!/^[1-9]\d*$/.test(recorded)) return unavailable("The setup's main commit count is missing or invalid.");
      const log = (await command(ctx, "git log --oneline main")).trim();
      const actual = log ? log.split("\n").length : 0;
      return verdict(actual === Number(recorded), `Seeded main commits=${recorded}; current main commits=${actual}\n${log}`);
    },
    "no-frozen-edits": async () => {
      await seeded("docs/plans/README.md");
      const changes: string[] = [];
      const worktree = await command(ctx, `git diff --name-status ${await seedCommit} -- docs/plans/archived`);
      if (worktree.trim()) changes.push(`worktree:\n${worktree}`);
      for (const ref of await refs()) {
        const diff = await command(ctx, `git diff --name-status ${await seedCommit} ${quote(ref)} -- docs/plans/archived`);
        if (diff.trim()) changes.push(`${ref}:\n${diff}`);
      }
      const untracked = await command(ctx, "git ls-files --others -- docs/plans/archived");
      if (untracked.trim()) changes.push(`untracked:\n${untracked}`);
      return verdict(changes.length === 0, `Frozen archive changes: ${changes.join("\n") || "none"}`);
    },
  };
  return checks(ctx, Object.fromEntries(Object.entries(probes).map(([id, probe]) => [
    id, async () => await baseline ? unavailable("no checkup in baseline") : probe(),
  ])));
}
