import { isRecord, type LoopEvent } from "../../metrics.ts";
import { checks, command, text, unavailable, verdict, type Context } from "../checks.ts";

const reviewers = ["claude-reviewer", "gpt-reviewer"] as const;
type Reviewer = typeof reviewers[number];
type Review = { agent: Reviewer; verdict: string; body: string };
const isReviewer = (name: unknown): name is Reviewer => reviewers.some(reviewer => reviewer === name);
const seeds = {
  "offbyone-caught": [
    /\boff[- ]by[- ]one\b/i,
    /rows\s*\[\s*:\s*limit\s*\+\s*1\s*\]/i,
    /\b(?:extra row|one (?:too many|extra) (?:data )?rows?|(?:returns?|exports?|emits?|includes?)\b[^.!?\n]{0,65}\b(?:limit\s*\+\s*1|two|2) (?:data )?rows?)\b/i,
  ],
  "zero-means-all-caught": [
    /\b(?:limit\s*(?:=|==)\s*0|zero(?: limit)?|limit of (?:0|zero))\b[^.!?\n]{0,140}\b(?:all|every|unlimited|unbounded|full|no limit|None)\b/i,
    /\b(?:all|every|unlimited|unbounded|full)\b[^.!?\n]{0,140}\b(?:limit\s*(?:=|==)\s*0|zero(?: limit)?|limit of (?:0|zero))\b/i,
    /\bif not limit\b[^.!?\n]{0,100}\b(?:0|zero|falsy|falsey|truthiness)\b/i,
  ],
  "negative-clamp-caught": [
    /\bnegative\w*\b[^.!?\n]{0,150}\b(?:clamp\w*|silent\w*|accept\w*|does not raise|doesn't raise|instead of (?:rais\w*|ValueError)|rather than (?:rais\w*|ValueError))\b/i,
    /(?:\b(?:clamp\w*|silent\w*)\b|max\s*\(\s*0\s*,\s*limit\s*\))[^.!?\n]{0,150}\b(?:negative\w*|ValueError)\b/i,
    /\b(?:missing|never raises?|does not raise|doesn't raise|fails? to raise|must raise|should raise)\b[^.!?\n]{0,80}\bValueError\b/i,
  ],
  "tests-encode-bug-caught": [
    /\b(?:tests?|assertions?|expectations?)\b[^.!?\n]{0,100}\b(?:encod\w*|enshrin\w*|bless\w*|codif\w*|mirror\w*|assert\w*|validat\w*|match\w*|lock\w* in)\b[^.!?\n]{0,80}\b(?:bug\w*|wrong|incorrect|broken|defect\w*|implementation|current behavio\w*)\b/i,
    /\b(?:bug\w*|incorrect|wrong|broken|defect\w*)\b[^.!?\n]{0,110}\b(?:tests?|assertions?|expectations?)\b|\b(?:tests?|assertions?|expectations?)\b[^.!?\n]{0,100}\b(?:wrong|incorrect|contradict\w* (?:the )?(?:approved )?contract)\b/i,
    /\b(?:tests?|suite)\b[^.!?\n]{0,65}\b(?:pass\w*|green)\b[^.!?\n]{0,65}\b(?:because|despite|but|while)\b[^.!?\n]{0,100}\b(?:contract|bug\w*|wrong|implementation)\b/i,
  ],
};
type Seed = keyof typeof seeds;
const seedNames = Object.keys(seeds) as Seed[];
const plain = (value: string) => value.replace(/[`*]/g, "");

// S16c's task/wait/read/async-result traversal, retaining structured field names
// so JSON verdicts and severity labels survive just like prose reviewer output.
function outputText(value: unknown): string {
  if (typeof value === "string") {
    try { return outputText(JSON.parse(value)); } catch { return value; }
  }
  if (Array.isArray(value)) return value.map(outputText).join("\n");
  if (!isRecord(value)) return "";
  if (Array.isArray(value.content)) return outputText(value.content);
  if (typeof value.text === "string" && (value.type === "text" || Object.keys(value).length === 1)) return outputText(value.text);
  return Object.entries(value).map(([key, item]) => key === "findings" && Array.isArray(item)
    ? `Findings:\n${item.map((finding, index) => `${index + 1}. ${outputText(finding)}`).join("\n")}`
    : `${key}: ${outputText(item)}`).join("\n");
}

export function reviewerResults(events: LoopEvent[]): Review[] {
  const aliases = new Map<string, Reviewer>();
  const dispatches = new Map<unknown, Reviewer[]>();
  const starts = new Map<unknown, LoopEvent>();
  for (const event of events) {
    if (event.type !== "tool_execution_start") continue;
    if (event.toolCallId !== undefined) starts.set(event.toolCallId, event);
    if (!/(?:^|\.)task$/.test(String(event.toolName)) || !isRecord(event.args)) continue;
    const agents: Reviewer[] = [];
    for (const task of Array.isArray(event.args.tasks) ? event.args.tasks : []) {
      if (!isRecord(task) || !isReviewer(task.agent)) continue;
      agents.push(task.agent);
      if (typeof task.name === "string") aliases.set(task.name, task.agent);
    }
    if (event.toolCallId !== undefined) dispatches.set(event.toolCallId, agents);
  }
  const results: Review[] = [];
  const seen = new Set<string>();
  const add = (agent: Reviewer, body: string) => {
    const normalized = plain(body);
    const decision = /["']?verdict["']?\s*:\s*["']?(APPROVE|REVISE)\b/i.exec(normalized)?.[1]
      ?? /^\s*(?:#{1,6}\s+)?(?:VERDICT:\s*)?(APPROVE|REVISE)\b/im.exec(normalized)?.[1]
      ?? /\b(?:claude-reviewer|gpt-reviewer)\b\s*(?:—|:|-)?\s*(APPROVE|REVISE)\b/i.exec(normalized)?.[1];
    const key = `${agent}\0${body.trim()}`;
    if (decision && !seen.has(key)) {
      seen.add(key);
      results.push({ agent, verdict: decision.toUpperCase(), body: body.trim() });
    }
  };
  for (const event of events) {
    const result = event.type === "tool_execution_end" && !event.isError ? event.result
      : event.type === "message_end" && isRecord(event.message) && event.message.role === "custom"
        && event.message.customType === "async-result" ? event.message.content : undefined;
    if (result === undefined) continue;
    const body = outputText(result);
    const wrapped = [...body.matchAll(/<task-result\b([^>]*)>([\s\S]*?)<\/task-result>/g)];
    if (wrapped.length) {
      for (const match of wrapped) {
        const agent = /\bagent=["']([^"']+)["']/.exec(match[1])?.[1];
        const status = /\bstatus=["']([^"']+)["']/.exec(match[1])?.[1];
        if (!isReviewer(agent) || (status && !/^(?:completed|success|succeeded)$/.test(status))) continue;
        const payload = /<(?:output|preview)\b[^>]*>([\s\S]*?)<\/(?:output|preview)>/.exec(match[2])?.[1] ?? match[2];
        add(agent, outputText(payload.trim()));
      }
      continue;
    }
    let attributed = false;
    const visit = (value: unknown) => {
      if (typeof value === "string") { try { visit(JSON.parse(value)); } catch {} return; }
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (!isRecord(value)) return;
      if (isReviewer(value.agent)) {
        attributed = true;
        if (typeof value.status === "string" && !/^(?:completed|success|succeeded)$/.test(value.status)) return;
        add(value.agent, outputText(value.result ?? value.output ?? value.data ?? value));
      } else Object.values(value).forEach(visit);
    };
    visit(result);
    if (attributed) continue;
    const start = starts.get(event.toolCallId);
    const path = isRecord(start?.args) && typeof start.args.path === "string" ? start.args.path : "";
    const alias = /^agent:\/\/([^/]+)/.exec(path)?.[1];
    const agent = alias && (aliases.get(alias) ?? (isReviewer(alias) ? alias : undefined));
    if (agent) { add(agent, body); continue; }
    // Ordinary file reads, executor results, and assistant paraphrases are not reviews.
    if (!/(?:^|\.)(?:task|wait)$/.test(String(event.toolName))) continue;
    const dispatched = dispatches.get(event.toolCallId) ?? [];
    const named = reviewers.filter(name => body.includes(name));
    if (dispatched.length === 1) add(dispatched[0], body);
    else if (named.length === 1) add(named[0], body);
  }
  return results;
}

function findingBlocks(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const findingHeading = /^\s*(?:#{1,6}\s*)?(?:blocking )?findings\s*(?::|$)/i;
  const heading = lines.findIndex(line => findingHeading.test(plain(line)));
  const content = heading < 0 ? lines : [plain(lines[heading]).replace(findingHeading, ""), ...lines.slice(heading + 1)];
  const blocks: string[] = [];
  let current: string[] = [];
  const flush = () => { if (current.length) blocks.push(current.join("\n").trim()); current = []; };
  for (const line of content) {
    const clean = plain(line.replace(/^(\s*)\*\s+/, "$1- "));
    if (/^\s{0,3}(?:#{1,6}\s*)?(?:\d+[.)]\s+|[-*]\s+|\[?BLOCKER\b)/i.test(clean)) {
      flush();
      current.push(line);
    } else if (/^#{1,6}\s/.test(clean)) {
      flush();
    } else if (current.length) current.push(line);
  }
  flush();
  return blocks.length ? blocks : content
    .filter(line => line.trim() && !/^\s*(?:verdict:)?\s*(?:APPROVE|REVISE)\s*$/i.test(plain(line)));
}

function caught(seed: Seed, body: string): boolean {
  const line = plain(body).replace(/\s+/g, " ");
  if (/\b(?:no|without an?) off[- ]by[- ]one\b|\boff[- ]by[- ]one\b[^.!?]{0,25}\b(?:absent|ruled out|fixed|resolved)\b/i.test(line) && seed === "offbyone-caught") return false;
  return seeds[seed].some(pattern => pattern.test(line));
}

function findingEvidence(reviews: Review[], seed: Seed): string[] {
  return [...new Set(reviews.flatMap(review => findingBlocks(review.body).flatMap(block => {
    if (!caught(seed, block)) return [];
    const line = block.split(/\r?\n/).find(line => caught(seed, line)) ?? block.replace(/\s+/g, " ");
    return [`${review.agent}: ${line.trim()}`];
  })))];
}

function rulingLines(body: string) {
  return body.split(/\r?\n/).flatMap(line => {
    const clean = plain(line).trim();
    // A reviewer verdict repeated by the parent is not the parent's wave ruling.
    if (/^(?:[-\d.)\s]*)(?:claude-reviewer|gpt-reviewer)\b/i.test(clean)) return [];
    // "Your decision: approve sending correction round 1 back to the executor" asks the human; it is not the ruling.
    if (/^(?:your (?:decision|call)|decision (?:needed|required|for you)|human decision|for you to decide)\b/i.test(clean)) return [];
    const match = /\b(?:(?:review(?: wave)?|wave|overall|final|resolved)(?:\s+(?:ruling|verdict|decision|result))?|ruling|verdict|decision)(?:\s+(?:for\s+)?(?:task\s+)?T1)?\s*(?::|—|-|is)?\s*(REVISE|APPROVE)\b/i.exec(clean)
      ?? /^(?:#{1,6}\s*)?(REVISE|APPROVE)\b/.exec(clean)
      // "T1 round 1 is REVISE" / "T1: APPROVE" name the task first.
      ?? /\bT1\b[^.\n]{0,40}\b(?:is|:)\s*(REVISE|APPROVE)\b/i.exec(clean)
      // "My ruling: T1 does not pass review" / "T1 passes review" / "T1 needs revision" are rulings in plain words.
      ?? (/\b(?:my\s+)?ruling\b[^.\n]{0,40}\b(?:does not|doesn't|did not|fails? to) pass\b|\bruling\b[^.\n]{0,40}\b(?:needs? revision|is REVISE|must be revised|not approved)\b|\bT1\b[^.\n]{0,40}\b(?:needs? (?:revision|rework|to be revised)|goes back for revision|(?:is|was) (?:sent|returned) (?:back )?for revision|(?:is not|isn't) approved)\b/i.test(clean) ? [null, "REVISE"] as unknown as RegExpExecArray
        : /\b(?:my\s+)?ruling\b[^.\n]{0,40}\bpass(?:es|ed)\b(?! review\s+(?:only|partially))|\bT1\b[^.\n]{0,40}\b(?:is approved|passes review)\b/i.test(clean) ? [null, "APPROVE"] as unknown as RegExpExecArray : null);
    return match ? [{ decision: match[1].toUpperCase(), line }] : [];
  });
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
      const seed = (await text(ctx.workDir, "member-a/.git/mosaic-s17-seed")).trim();
      if (!/^[0-9a-f]{40}(?:[0-9a-f]{24})?$/.test(seed)) return unavailable("Invalid setup checkpoint in member-a/.git/mosaic-s17-seed.");
      const branch = "task/0004-export-limit";
      const branchDiff = await command(ctx, `git -C member-a diff --no-ext-diff --name-status ${seed} ${branch} -- member_a/api.py tests`);
      const workDiff = await command(ctx, `git -C member-a diff --no-ext-diff --name-status ${seed} -- member_a/api.py tests`);
      const indexDiff = await command(ctx, `git -C member-a diff --no-ext-diff --cached --name-status ${seed} -- member_a/api.py tests`);
      const untracked = await command(ctx, "git -C member-a ls-files --others --exclude-standard -- member_a/api.py tests");
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
