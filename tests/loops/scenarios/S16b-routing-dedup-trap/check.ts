import { isRecord, parseEvent } from "../../metrics.ts";
import closeoutChecks from "../S1-closeout-triage/check.ts";
import { checks, command, entries, filesBelow, text, unavailable, verdict, type Context } from "../checks.ts";

const originalFrom = "**From:** plan 0001 close-out";
const originalTrigger = "**Trigger:** when `member-a/member_a/auth*` changes or an OAuth migration lands";
const authorization = /authori[sz]ation|OAuth/i;

type Review = { agent: string; body: string; partial: boolean };
async function reviewerResults(ctx: Context): Promise<Review[]> {
  const events = (await text(ctx.runDir, "events.jsonl")).split(/\r?\n/).filter(line => line.trim()).map(parseEvent);
  const found = new Map<string, Review>();
  const add = (agent: string, body: string, partial = false) => {
    if (/\b(?:APPROVE|REVISE)\b/.test(body)) found.set(`${agent}\n${body}`, { agent, body, partial });
  };
  const collect = (value: unknown) => {
    if (typeof value === "string") {
      for (const match of value.matchAll(/<task-result\b[^>]*\bagent=["'](claude-reviewer|gpt-reviewer)["'][^>]*>([\s\S]*?)<\/task-result>/g)) {
        add(match[1], match[2], /<preview\b/.test(match[2]));
      }
      if (/^\s*[\[{]/.test(value)) {
        try { collect(JSON.parse(value)); } catch { /* A truncated preview is handled above. */ }
      }
    } else if (Array.isArray(value)) {
      for (const item of value) collect(item);
    } else if (isRecord(value)) {
      if (value.agent === "claude-reviewer" || value.agent === "gpt-reviewer") add(value.agent, JSON.stringify(value));
      for (const item of Object.values(value)) collect(item);
    }
  };
  for (const event of events) {
    // Do not mistake a read/edit of the plan's prewritten APPROVE lines for a reviewer result.
    if (event.type === "tool_execution_end" && (typeof event.toolName !== "string" || /(?:^|\.)(?:task|wait)$/.test(event.toolName))) {
      const size = found.size;
      collect(event.result);
      if (found.size === size) {
        const body = JSON.stringify(event.result ?? "");
        const agents = [...new Set(body.match(/\b(?:claude|gpt)-reviewer\b/g) ?? [])];
        if (agents.length === 1) add(agents[0], body);
      }
    } else if (event.type === "message_end" && isRecord(event.message) && event.message.role === "custom" && event.message.customType === "async-result") {
      collect(event.message.content);
    }
  }
  return [...found.values()];
}

function citesExisting(body: string): boolean {
  const plain = body.replace(/~~[\s\S]*?~~/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*`]/g, "");
  if (!/\bG-4\b/.test(plain) || !/\(b\)|authori[sz]ation|OAuth/i.test(plain)) return false;
  // The seeded draft mentions G-4 only as the record to supersede; that is not a disposition to G-4.
  if (/\bG-4\b\s+(?:(?:is|was|will be|has been)\s+)?(?:archived|superseded|replaced|retired)\b|\b(?:supersedes?|replaces?|archive[sd]?|retire[sd]?)\s+(?:the existing\s+)?G-4\b/i.test(plain)) return false;
  return /\bG-\d+\b/.exec(plain)?.[0] === "G-4"
    || /\b(?:amend(?:ed)?|reuse[sd]?|retain(?:ed)?|keep|kept|update[sd]?|extend(?:ed)?|cite[sd]?|preserve[sd]?|route[sd]? to|covered by|tracked in|merged into|in favor of)\b[^.;\n]{0,80}\bG-4\b/i.test(plain);
}

export default async function (ctx: Context) {
  const inherited = await closeoutChecks(ctx);
  const added = await checks(ctx, {
    "no-duplicate-gap": async () => {
      const before = new Set(entries(`${await text(ctx.fixtureDir, "docs/gaps.md")}\n${await text(ctx.fixtureDir, "docs/gaps-archive.md")}`, "G").map(entry => entry.id));
      const duplicates = entries(await text(ctx.workDir, "docs/gaps.md"), "G")
        .filter(entry => entry.id !== "G-4" && !before.has(entry.id) && authorization.test(entry.body));
      return verdict(!duplicates.length, `New authorization/OAuth G-entries other than G-4:\n${duplicates.map(entry => entry.body).join("\n") || "none"}`);
    },
    "existing-cited": async () => {
      const messages = Array.isArray(ctx.metrics?.assistantTexts) ? ctx.metrics.assistantTexts : [];
      const brief = [...messages].reverse().find(message => message.split("\n").length > 8) ?? messages.at(-1) ?? "";
      const sources = [{ path: "sign-off brief", body: brief }];
      for (const path of (await filesBelow(ctx.workDir, "member-a/docs/plans")).filter(path => /(?:^|\/)0002-empty-export-handling\.md$/.test(path))) {
        const plan = await text(ctx.workDir, path);
        sources.push({ path, body: (plan.split(/^## Execution log[ \t]*\r?$/m)[1] ?? "").split(/^## /m)[0] });
      }
      const candidates = sources.flatMap(source => source.body.split(/\n(?=\s*(?:[-*] |\(?[a-c][.)] ))|\n\s*\n/)
        .filter(body => /\(b\)|authori[sz]ation|OAuth/i.test(body)).map(body => ({ path: source.path, body, cited: citesExisting(body) })));
      return verdict(candidates.some(candidate => candidate.cited), `Leftover (b) dispositions:\n${candidates.map(candidate => `${candidate.path}: cites G-4=${candidate.cited}\n${candidate.body}`).join("\n") || "none"}`);
    },
    "provenance-kept": async () => {
      const records = entries(`${await text(ctx.workDir, "docs/gaps.md")}\n${await text(ctx.workDir, "docs/gaps-archive.md")}`, "G").filter(entry => entry.id === "G-4");
      return verdict(records.some(entry => entry.body.includes(originalFrom) && entry.body.includes(originalTrigger)),
        `Required exact substrings:\n${originalFrom}\n${originalTrigger}\nG-4 records:\n${records.map(entry => entry.body).join("\n") || "missing"}`);
    },
    "reviewer-caught": async () => {
      // Include commits later removed by amendment/rebase, not just the final registry snapshot.
      const history = await command(ctx, "git log --all --reflog --format='commit %H' --no-ext-diff --unified=0 -p -- docs/gaps.md docs/gaps-archive.md");
      const minted = history.split(/(?=^commit [0-9a-f]+$)/m).filter(commit => /^\+- \*\*G-5 ·/m.test(commit));
      if (!minted.length) return verdict(true, "no duplicate minted");
      const commits = minted.map(commit => commit.split("\n")[0]).join(", ");
      const reviews = await reviewerResults(ctx);
      if (!reviews.length) return unavailable(`G-5 was minted in ${commits}; no identifiable reviewer verdict in events.jsonl.`);
      const caught = reviews.filter(review => /\bREVISE\b/.test(review.body)
        && /\bG-5\b|authori[sz]ation|OAuth/i.test(review.body)
        && /duplicat|dedup|same (?:obligation|subject|trigger)|already (?:covered|tracked)|existing G-4/i.test(review.body));
      const evidence = `G-5 was minted in ${commits}.\nReviewer results:\n${reviews.map(review => `${review.agent}${review.partial ? " (partial)" : ""}: ${review.body}`).join("\n")}`;
      if (!caught.length && reviews.some(review => review.partial)) return unavailable(`Reviewer output is truncated; cannot rule out a duplicate finding.\n${evidence}`);
      return verdict(caught.length > 0, evidence);
    },
  });
  return [...inherited, ...added];
}
