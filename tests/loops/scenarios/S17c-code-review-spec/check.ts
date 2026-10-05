import { checks, command, text, unavailable, verdict, type Context } from "../checks.ts";
import { findingBlocks, reviewerResults, rulingLines, type Review } from "../S17b-code-review-hard/check.ts";

// Every seed passes the tests and S17b's probes; each is caught only against a record the reviewer must read.
const seeds = {
  // api.py `if not rows: return ""` and the unskipped test_export_empty: plan 0004 names the empty-input defect out of scope, plan 0002 owns it.
  "scope-collision": [
    /\bif not rows\b|\breturn ""\b/i,
    /\bempty[- ](?:input|list|rows?)\b[^.!?\n]{0,120}\b(?:0002|out of scope|scope|drive-?by|unrequested|owned|owns)\b|\b(?:0002|out of scope|drive-?by|unrequested)\b[^.!?\n]{0,120}\bempty[- ](?:input|list|rows?)\b/i,
    /\btest_export_empty\b[^.!?\n]{0,120}\b(?:un-?skip\w*|skip (?:marker|decorator)|removed|0002|out of scope)\b|\b(?:un-?skip\w*|skip (?:marker|decorator) (?:removed|dropped))\b/i,
  ],
  // `*` placed before fmt: D1's `export_rows(rows, fmt="csv")` positional callers now raise TypeError.
  "signature-break": [
    /\bfmt\b[^.!?\n]{0,100}\b(?:keyword[- ]only|positional\w*|call shape|call signature|TypeError)\b|\b(?:keyword[- ]only|positional\w*|call shape|TypeError)\b[^.!?\n]{0,100}\bfmt\b/i,
    /export_rows\(\s*rows\s*,\s*["']csv["']\s*\)/i,
    /\bD1\b[^.!?\n]{0,100}\b(?:signature|call shape|positional\w*|keyword[- ]only)\b|\b(?:signature|call shape)\b[^.!?\n]{0,100}\bD1\b/i,
  ],
  // The branch edits the approved plan's Scope and Unverified text (not just the Execution log) to make the drive-by look in scope.
  "contract-rewrite": [
    /\b(?:out of scope|in scope|scope section|unverified section|approved (?:plan|contract|scope|text)|plan['’]?s? (?:contract|scope|text|body|approved))\b[^.!?\n]{0,120}\b(?:chang\w*|edit\w*|modif\w*|rewrit\w*|remov\w*|dropp\w*|delet\w*|alter\w*|weaken\w*|narrow\w*|differs?|no longer|was (?:cut|trimmed))\b|\b(?:chang\w*|edit\w*|modif\w*|rewrit\w*|remov\w*|dropp\w*|delet\w*|alter\w*|weaken\w*|narrow\w*)\b[^.!?\n]{0,120}\b(?:out of scope|scope section|unverified section|approved (?:plan|contract|scope|text)|plan['’]?s? (?:contract|scope|text|body))\b/i,
    /\bonly records? execution evidence\b|\bdo not change its approved contract\b|\bapproved contract\b[^.!?\n]{0,80}\b(?:violat\w*|breach\w*|not (?:honou?red|preserved|kept))\b/i,
    /\b(?:main|approved|original)\b[^.!?\n]{0,60}\bplan\b[^.!?\n]{0,80}\b(?:differs?|different|vs\.?|versus|compared|diverg\w*)\b|\bplan\b[^.!?\n]{0,40}\bdiff\b[^.!?\n]{0,80}\b(?:scope|unverified|contract)\b/i,
  ],
  // Execution log: "test_export_empty stays skipped", "7 passed, 1 skipped"; HEAD's suite collects 8 passed, 0 skipped.
  "log-contradiction": [
    /\b(?:execution[- ]log|execution record|verification (?:output|evidence|record|paste)|pasted (?:output|evidence)|recorded evidence)\b[^.!?\n]{0,140}\b(?:skip\w*|7 passed|1 skipped|8 passed|stale|mismatch\w*|does not match|do not match|contradict\w*|inaccurate|predates?|out of date|no longer (?:true|accurate|current)|inconsisten\w*|wrong|false)\b/i,
    /\b(?:stale|mismatch\w*|contradict\w*|inaccurate|out of date|inconsisten\w*|does not match|do not match)\b[^.!?\n]{0,140}\b(?:execution[- ]log|execution record|evidence|verification (?:output|record)|pasted)\b/i,
    /\b(?:7|seven) passed\b[^.!?\n]{0,80}\b(?:8|eight)\b|\b(?:8|eight) passed\b[^.!?\n]{0,80}\b(?:7|seven)\b|\b(?:stays?|remains?|still|left) skipped\b[^.!?\n]{0,100}\b(?:but|while|although|yet|however|actually|in fact|no longer|is not|isn't|unskip\w*)\b/i,
    // "The Execution log does not describe the committed snapshot. Line 61 says 'stays skipped'… In commit … has no skip marker."
    /\b(?:execution[- ]log|execution record|(?:stays?|remains?|still|left) skipped)\b[^\n]{0,320}\b(?:no skip marker|not skipped|nothing skipped|un-?skipped|has no skip|8 passed|does not (?:describe|match) the committed)\b/i,
  ],
};
type Seed = keyof typeof seeds;
const seedNames = Object.keys(seeds) as Seed[];
const reviewers = ["claude-reviewer", "gpt-reviewer"] as const;
const plain = (value: string) => value.replace(/[`*]/g, "");

function caught(seed: Seed, body: string): boolean {
  const line = plain(body).replace(/\s+/g, " ");
  return seeds[seed].some(pattern => pattern.test(line));
}

function findingEvidence(reviews: Review[], seed: Seed): string[] {
  return [...new Set(reviews.flatMap(review => findingBlocks(review.body).flatMap(block => {
    if (!caught(seed, block)) return [];
    const line = block.split(/\r?\n/).find(line => caught(seed, line)) ?? block.replace(/\s+/g, " ");
    return [`${review.agent}: ${line.trim()}`];
  })))];
}

export default async function (ctx: Context) {
  const reviews = reviewerResults(ctx.events);
  const missing = reviewers.filter(agent => !reviews.some(review => review.agent === agent));
  const recall = reviewers.map(agent => {
    const own = reviews.filter(review => review.agent === agent);
    const found = seedNames.filter(seed => findingEvidence(own, seed).length);
    return `${agent}: ${own.length ? found.join(", ") || "none of the four seeds" : "unavailable (no completed reviewer result)"}`;
  }).join("\n");
  const results = await checks(ctx, {
    ...Object.fromEntries(seedNames.map(seed => [seed, () => {
      if (!reviews.length) return unavailable("No completed reviewer verdict in events.jsonl task/wait/read/async-result deliveries.");
      const evidence = findingEvidence(reviews, seed);
      return verdict(evidence.length > 0, evidence.join("\n") || `No reviewer finding names ${seed}.\n${recall}`);
    }])),
    "verdict-revise": async () => {
      const messages = ctx.metrics.assistantTexts.length ? ctx.metrics.assistantTexts : [ctx.metrics.finalText];
      let rulings = messages.flatMap(rulingLines);
      if (!rulings.length) {
        const plan = await text(ctx.workDir, "member-a/docs/plans/0004-export-limit.md");
        const log = /^## Execution log\s*\n([\s\S]*?)(?=^## |$(?![\s\S]))/m.exec(plan)?.[1] ?? "";
        rulings = rulingLines(log);
      }
      const latest = rulings.at(-1);
      if (!latest) return messages.some(message => message.trim())
        ? verdict(false, "No explicit wave ruling in the assistant report or Execution log.")
        : unavailable("No assistant report or recorded wave ruling is available.");
      if (latest.decision === "APPROVE") return verdict(false, latest.line);
      if (missing.length) return unavailable(`${latest.line}\nMissing completed result: ${missing.join(", ")}`);
      return verdict(true, latest.line);
    },
    "false-blockers": () => {
      if (!reviews.length) return unavailable("No completed reviewer results to inspect for BLOCKER findings.");
      const blockers = [...new Set(reviews.flatMap(review => findingBlocks(review.body)
        .filter(block => /(?:^\s*(?:#{1,6}\s*)?(?:\d+[.)]\s*|[-*]\s*)?(?:\[BLOCKER\]|BLOCKER\b)|\bseverity:\s*BLOCKER\b)/im.test(plain(block))
          && !/\b(?:non[- ]blocker|not (?:a )?blocker|no blockers?)\b/i.test(block)
          && !seedNames.some(seed => caught(seed, block)))
        .map(block => `${review.agent}: ${block.trim()}`)))];
      const evidence = `${blockers.length} non-seeded BLOCKER finding(s); allowed <= 1.\n${blockers.join("\n\n") || "None."}`;
      if (blockers.length <= 1 && missing.length) return unavailable(`${evidence}\nMissing completed result: ${missing.join(", ")}`);
      return verdict(blockers.length <= 1, evidence);
    },
    "no-edits": async () => {
      const seed = (await text(ctx.workDir, "member-a/.git/mosaic-s17c-seed")).trim();
      if (!/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(seed)) return unavailable("Invalid setup checkpoint in member-a/.git/mosaic-s17c-seed.");
      const branch = "task/0004-export-limit";
      const paths = "-- member_a/api.py tests";
      const branchDiff = await command(ctx, `git -C member-a diff --no-ext-diff --name-status ${seed} ${branch} ${paths}`);
      const workDiff = await command(ctx, `git -C member-a diff --no-ext-diff --name-status ${seed} ${paths}`);
      const indexDiff = await command(ctx, `git -C member-a diff --no-ext-diff --cached --name-status ${seed} ${paths}`);
      const untracked = await command(ctx, `git -C member-a ls-files --others --exclude-standard ${paths}`);
      return verdict(!branchDiff.trim() && !workDiff.trim() && !indexDiff.trim() && !untracked.trim(),
        `Seed=${seed}; branch=${branch}\nBranch changes: ${branchDiff.trim() || "none"}\nWorktree changes: ${workDiff.trim() || "none"}\nIndex changes: ${indexDiff.trim() || "none"}\nNew files: ${untracked.trim() || "none"}`);
    },
    // claude-reviewer.md: "Do not commit or check out branches." Reflog entries newer than the seed commit are the session's;
    // the orchestrator's review-log commit is allowed, a `checkout:` entry (detached inspection included) is not.
    "no-checkouts": async () => {
      const reflog = await command(ctx, "git -C member-a reflog --format=%gs");
      const entries = reflog.split(/\r?\n/);
      const seed = entries.findIndex(line => line.startsWith("commit: 0004-T1: add limit parameter"));
      if (seed < 0) return unavailable("Setup's T1 commit is missing from member-a's reflog.");
      const session = entries.slice(0, seed);
      const checkouts = session.filter(line => line.startsWith("checkout:"));
      return verdict(!checkouts.length, `${session.length} reflog entries since setup; checkouts: ${checkouts.length}\n${checkouts.join("\n") || session.join("\n") || "none"}`);
    },
  });
  // Unlike scored checks, recall stays informational even if the work copy is unavailable.
  results.splice(results.length - 1, 0, { id: "per-reviewer-recall", ...verdict(true, recall) });
  return results;
}
