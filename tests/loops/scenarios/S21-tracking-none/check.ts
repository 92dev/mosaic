import { existsSync } from "node:fs";
import { join } from "node:path";
import { isRecord } from "../../metrics.ts";
import { assistantText, command, mosaicChecks, text, unavailable, verdict, type Context } from "../checks.ts";

const localTracker = /\btracker\.ts\b|\bdocs[/\\]+tracker(?=[/\\:#\s'"`]|$)/;

function accessArguments(value: unknown): string[] {
  if (typeof value === "string") {
    // Hashline edits carry their target paths in the patch, not in a path property.
    return [...value.matchAll(/^\[([^\]\n]+)#[\da-f]{4}\]/gim)].map(match => match[1]);
  }
  if (Array.isArray(value)) return value.flatMap(accessArguments);
  if (!isRecord(value)) return [];
  return Object.entries(value).flatMap(([key, entry]) => {
    if (/^(?:path|file_path|paths|cwd|command|code)$/.test(key)) {
      return (Array.isArray(entry) ? entry : [entry]).filter((item): item is string => typeof item === "string");
    }
    return accessArguments(entry);
  });
}

function ledgerRows(body: string) {
  return body.split(/\r?\n/).flatMap(line => {
    const match = /^\|\s*(?:\[(\d{4})\]\([^)]*\)|(\d{4}))\s*\|/.exec(line);
    if (!match) return [];
    const cells = line.split("|").slice(1, -1).map(cell => cell.trim());
    return [{ id: match[1] ?? match[2], title: cells[1], status: cells[2], targets: cells[3], branch: cells[4], line }];
  });
}

export default async function (ctx: Context) {
  return mosaicChecks(ctx, {
    "tracking-none-installed": async () => {
      const runtime = JSON.parse(await text(ctx.workDir, ".omp/mosaic.json"));
      const paths = ["tools/tracker.ts", "docs/tracker", "tools/mcp", ".omp/agents/tracker-scout.md", ".claude/agents/tracker-scout.md"];
      const leaked = paths.filter(path => existsSync(join(ctx.workDir, path)));
      const trackerField = /^tracker:/m.test(await text(ctx.workDir, "docs/plans/TEMPLATE.md"));
      return verdict(runtime.tracking?.mode === "none" && !leaked.length && !trackerField,
        `tracking=${JSON.stringify(runtime.tracking)}; local paths=${leaked.join(", ") || "none"}; template tracker field=${trackerField}`);
    },
    "no-local-tracker-access": () => {
      const accesses = ctx.events.filter(event => event.type === "tool_execution_start")
        .flatMap(event => accessArguments(event.args).map(argument => `${event.toolName}: ${argument}`));
      accesses.push(...ctx.metrics.reads, ...ctx.metrics.edits, ...ctx.metrics.bash);
      const forbidden = [...new Set(accesses.filter(argument => localTracker.test(argument)))];
      return verdict(!forbidden.length, forbidden.join("\n") || "No tracker CLI call or docs/tracker access was recorded.");
    },
    "collision-report": () => {
      const report = assistantText(ctx);
      if (!report.trim()) return unavailable("No assistant collision report was recorded.");
      const collision = /\b(?:collision|overlap)(?:s)?\b/i.test(report);
      const ledger = /\bledgers?\b|docs\/plans\/README\.md/i.test(report);
      const branches = /\bbranch(?:es)?\b/i.test(report);
      return verdict(collision && ledger && branches, report);
    },
    "plan-reserved": async () => {
      // The fresh fixture setup removes S9's conditional 0004 seed before its root commit.
      const initial = (await command(ctx, "git rev-list --max-parents=0 HEAD")).trim();
      if (!/^[\da-f]{40,64}$/.test(initial)) return unavailable(`Cannot identify fixture root commit: ${initial}`);
      const before = new Set(ledgerRows(await command(ctx, `git show ${initial}:docs/plans/README.md`)).map(row => row.id));
      const added = ledgerRows(await text(ctx.workDir, "docs/plans/README.md")).filter(row => !before.has(row.id));
      const published = ledgerRows(await command(ctx, "git show origin/main:docs/plans/README.md"));
      const reserved = added.length === 1 && added.every(row => /^(?:draft|reserved)$/.test(row.status)
        && Boolean(row.title) && /\bmember-a\b/.test(row.targets) && row.branch.includes(row.id)
        && published.some(remote => remote.id === row.id && remote.line === row.line));
      return verdict(reserved, `New master-ledger rows:\n${added.map(row => row.line).join("\n") || "none"}\nPublished new rows:\n${published.filter(row => !before.has(row.id)).map(row => row.line).join("\n") || "none"}`);
    },
  });
}
