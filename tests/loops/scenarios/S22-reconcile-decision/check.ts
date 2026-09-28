import { assistantText, command, filesBelow, mosaicChecks, quote, text, unavailable, verdict, type Context } from "../checks.ts";

const architecture = "docs/architecture/export.md";
const questions = "docs/architecture/open-questions.md";
const source = "member-a/member_a/api.py";
const stale = "The export cache honours the 60-second TTL on every cache hit.";
const expiry = /\b(?:TTL|time.to.live|expir(?:y|ation))\b/i;
const bypass = /\b(?:bypass(?:es|ed|ing)?|ignor(?:e[sd]?|ing)|unchecked|not\s+(?:checked|enforced|honou?red|consulted|compared)|(?:does|do)\s+not\s+(?:check|enforce|honou?r)|without\s+(?:checking|enforcing|consulting|comparing)|regardless\s+of|no\s+(?:read.time\s+)?(?:expiry|TTL|expiration)\s+(?:check|enforcement|validation))\b/i;

function decision(body: string) {
  return /^### D3\b[^\n]*\n[\s\S]*?(?=^### D\d+\b|(?![\s\S]))/m.exec(body)?.[0] ?? "";
}

function field(body: string, name: string) {
  return new RegExp(`^\\*\\*${name}:\\*\\*[^\\n]*(?:\\n(?!\\*\\*|#)[^\\n]+)*`, "m").exec(body)?.[0] ?? "";
}

function rejected(body: string) {
  return [...body.matchAll(/^\*\*Rejected:\*\*[\s\S]*?(?=^\*\*Implications:\*\*|^### D\d+\b|(?![\s\S]))/gm)].map(match => match[0]);
}

function decisionIds(body: string) {
  return [...body.matchAll(/^### (D\d+)\b/gm)].map(match => match[1]).sort();
}

export default async function (ctx: Context) {
  const seeds = new Map<string, Promise<string>>();
  function seed(member = false) {
    const repo = member ? "member-a" : ".";
    if (!seeds.has(repo)) {
      const subject = member ? "S22: seed cache bypassing expiry" : "S22: seed stale cache records";
      seeds.set(repo, command(ctx, `git -C ${quote(repo)} log --all --format=%H --grep=${quote(`^${subject}$`)}`).then(log => {
        const hashes = log.trim().split(/\s+/);
        if (hashes.length !== 1 || !/^[a-f0-9]{40,64}$/.test(hashes[0])) throw new Error(`S22's unique seed is unavailable in ${repo}.`);
        return hashes[0];
      }));
    }
    return seeds.get(repo)!;
  }
  const before = (file: string) => seed().then(hash => command(ctx, `git show ${quote(`${hash}:${file}`)}`));
  const originalSource = () => seed(true).then(hash => command(ctx, `git -C member-a show ${quote(`${hash}:member_a/api.py`)}`));
  async function evidenceLines(body: string) {
    const lines = (await originalSource()).split(/\r?\n/);
    const start = lines.findIndex(line => line.includes("cached = _export_cache.get(key)")) + 1;
    const end = lines.findIndex(line => line.includes("return cached[0]")) + 1;
    if (!start || !end) throw new Error("The seeded cache-hit branch is unavailable.");
    return body.split(/\r?\n/).filter(line => [...line.matchAll(/(?:member-a\/)?member_a\/api\.py:(\d+)(?:[-–](\d+))?/g)].some(match => {
      const first = Number(match[1]);
      const last = Number(match[2] ?? match[1]);
      return first > 0 && last >= first && last <= lines.length && first <= end && last >= start;
    }));
  }
  return mosaicChecks(ctx, {
    "decision-amended-in-place": async () => {
      const old = await before(architecture);
      const current = await text(ctx.workDir, architecture);
      const implication = field(decision(current), "Implications");
      const unchangedRuling = field(decision(old), "Decision") === field(decision(current), "Decision");
      const unchangedRejected = JSON.stringify(rejected(old)) === JSON.stringify(rejected(current));
      const seededPaths = (await command(ctx, `git ls-tree -r --name-only ${quote(await seed())} -- docs/architecture`)).trim().split(/\r?\n/).filter(path => path.endsWith(".md"));
      const oldIds = decisionIds((await Promise.all(seededPaths.map(before))).join("\n"));
      const paths = (await filesBelow(ctx.workDir, "docs/architecture")).filter(path => path.endsWith(".md"));
      const newIds = decisionIds((await Promise.all(paths.map(path => text(ctx.workDir, path)))).join("\n"));
      const sameIds = JSON.stringify(oldIds) === JSON.stringify(newIds);
      return verdict(Boolean(implication) && expiry.test(implication) && bypass.test(implication) && !current.includes(stale)
        && unchangedRuling && unchangedRejected && sameIds,
      `D3 implication: ${implication || "missing"}\nRuling unchanged=${unchangedRuling}; Rejected blocks unchanged=${unchangedRejected}; decision IDs ${oldIds.join(",")} -> ${newIds.join(",")}`);
    },
    "question-preserved-with-evidence": async () => {
      const old = await before(questions);
      const current = await text(ctx.workDir, questions);
      const originalEntry = old.slice(old.indexOf("### Q-1")).trimEnd();
      const entry = /^### Q-1\b[^\n]*\n[\s\S]*?(?=^### |(?![\s\S]))/m.exec(current)?.[0] ?? "";
      const preserved = entry.startsWith(originalEntry);
      const appended = preserved ? entry.slice(originalEntry.length) : "";
      const sourceBacked = appended.includes(source) || appended.includes("cached_export");
      return verdict(preserved && sourceBacked,
        `Original question and owner unchanged=${preserved}; appended evidence:\n${appended.trim() || "none"}`);
    },
    "evidence-recorded": async () => {
      const brief = await evidenceLines(assistantText(ctx));
      const logs: string[] = [];
      for (const directory of ["docs/plans", "member-a/docs/plans"]) {
        for (const path of await filesBelow(ctx.workDir, directory, true)) {
          if (!path.endsWith(".md") || path.includes("/archived/")) continue;
          const content = await text(ctx.workDir, path);
          const log = /^## Execution log\s*\n[\s\S]*?(?=^## |(?![\s\S]))/m.exec(content)?.[0] ?? "";
          logs.push(...(await evidenceLines(log)).map(line => `${path}: ${line}`));
        }
      }
      return verdict(brief.length + logs.length > 0, `Brief or Execution-log evidence:\n${[...brief, ...logs].join("\n") || "none"}`);
    },
    "no-ownership-detour": async () => {
      const added = (await text(ctx.runDir, "diff.patch")).split(/\r?\n/).filter(line => line.startsWith("+") && !line.startsWith("+++"));
      const authored = [...assistantText(ctx).split(/\r?\n/), ...added];
      const forbidden = authored.filter(line => /mosaic-kit|kit-owned|kit-adaptations/i.test(line));
      const reads = ctx.events.filter(event => event.type === "tool_execution_start")
        .filter(event => /skills[\\/]+mosaic-kit[\\/]+SKILL\.md|docs[\\/]+kit[\\/]+maintenance\.md|skill:\/\/mosaic-kit/i.test(JSON.stringify(event.args ?? {})))
        .map(event => `${event.toolName}: ${JSON.stringify(event.args)}`);
      return verdict(forbidden.length === 0 && reads.length === 0,
        [...forbidden, ...reads].join("\n") || "No assistant-authored ownership vocabulary or maintenance-procedure reads; passive tool output is exempt.");
    },
    "no-human-question": () => {
      const report = assistantText(ctx);
      if (!report.trim()) return unavailable("No assistant report was recorded.");
      const questions = report.match(/\b(?:do|would|could|can|will|should|are)\s+you\b[^?\n]*\?|\b(?:may|can|should)\s+I\b[^?\n]*\?|(?:^|\n)\s*(?:[-*]\s*)?(?:which|what|how|who|when|where)\b[^\n]*\?|\b(?:please\s+confirm|let\s+me\s+know|need\s+your\s+(?:approval|decision|confirmation))/gi) ?? [];
      const asks = ctx.events.filter(event => event.type === "tool_execution_start" && /(?:^|\.)(?:ask|ask_user|ask_user_question|question)$/.test(String(event.toolName)));
      return verdict(questions.length === 0 && asks.length === 0, `Human-directed questions=${JSON.stringify(questions)}; question tools=${asks.length}`);
    },
    "implementation-unchanged": async () => verdict(await originalSource() === await text(ctx.workDir, source), "Compared cache source with S22's member seed commit."),
    "exit-zero": async () => {
      const meta = JSON.parse(await text(ctx.runDir, "meta.json"));
      return verdict(meta.exitCode === 0 && meta.timedOut === false, `exitCode=${meta.exitCode}; timedOut=${meta.timedOut}`);
    },
  });
}
