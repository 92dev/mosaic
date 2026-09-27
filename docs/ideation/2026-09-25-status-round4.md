# Status 2026-09-25 (round 4, autonomous) — collision cells, checkup edges, planner effort at max

Cohorts r6–r9 (≈ 30 runs, ≈ $150 incl. six planner-max runs at $8–12 each). Every cell two repeats; critic = astra max (`agent://R6CriticGpt`, 20 runs, 106 rubric answers; 6 better / 11 same / 3 worse).

## Findings

**Planner at max: fable-5-1 beats opus-5-5.** Frozen harness text, same adversary (`gpt-6-sol:max`), 3600 s cap. Opus-5-5 max on S6: 7/7 ×2, $11.00 / 56 min and $9.66 / 40 min (4 rounds/12 findings, 3/6). Fable max: 7/7 ×3, $8.41 (timed out at 1800 s before presenting), $8.12 / 24 min, $9.22 / 30 min (3/8, 2/7). Opus is +20% cost / +73% time with no consistent quality premium; both families' retained recipes carry the `None` guard, keyword-only signature, list slicing, and the landing-order BLOCKER. Critic: keep planner = fable max (provisional; one fable attempt timed out at the old cap). Standing decision confirmed by data.

**Collision check gains two behaviours (S12, new).** Seed: ENG-230, a triage ticket on member-a with no declared areas. (1) `tracker.ts intersect` now lists any active item on a target repo with no declared areas — empty `areas` or no managed block at all (intake tickets) — as `scope: unknown`; opus at max found the omission itself in r7 ("the tracker's overlap search skips requests that have no managed block"). (2) `rule://tracker`: an unknown-scope item is named as unresolved unless its title/body names a different area, in which case say which. Plan skill: state the collision result as a positive claim (only these items intersect; inventory complete or not; unknown-scope unresolved, never cleared). Measured: r6 (old text) 3/4 runs omitted the positive claim; r7 (new text) 4/4 state it; r8 (unmanaged listing) astra 2/2 list ENG-210/211/212 as export-only by body and hold ENG-230 unresolved. No run in 10 dismissed ENG-230 by title. Critic: keep both; the three excluded tickets are audit signal but low-actionable for the human — prefer one compact sentence.

**Checkup edges (S13, new).** Missing member ledger → lint CANNOT-EVALUATE; two archived candidates for plan 0001 → `fix: human` (tool changed: ambiguous stale links are never `mechanical`). 4/4 runs: both candidates named, link untouched on every ref, main unchanged, no invented ledger row, coverage gap named, no "whole repo covered" claim, digests 19–32 lines, $0.47–0.60.

**Sign-off brief length (S1).** Execute step 9 ("the brief is the whole final message") cut opus from 65/49 lines to 44/45; the brief section itself is 29/30. Astra 32/34. Critic: the S1 prompt asked for "report + brief" and licensed the split; prompt now asks for one ≤ 40-line response and the check measures the whole substantive message again; r9 opus re-run on the combined prompt: 11/11 ×2, 30 and 34 lines, $3.48 / 14.5 min and $4.04 / 17.4 min — the cheapest S1 opus cells so far.

**Writer conflict (S10, from round 3, re-measured here as r5).** Terminal-refusal rule: r4 0/4 → r5 4/4 on the two new checks, both families.

## Tool and rig fixes made while measuring

`tools/checkup.ts`: ambiguous archived candidates → human. `tools/tracker.ts intersect`: unknown-scope semantics (twice widened). S12/S13 predicates widened for wording only (evidence in checks.json of every run); S12 respects a stated incomplete inventory. S1 check `brief-whole-message-40` added. `flaky.ts --tag-prefix`, `score-cohort.ts` used per cohort.

## Not measured (applied on critic evidence)

Closure packet carries the commit range since last approval; reviewers reuse step-5 outputs; optional notes before the approval snapshot. Checkup skill: empty `cannotEvaluate` ≠ whole-repo coverage.

## Next loop (ranked)

1. S12 empty-inventory cell: a query whose intersect is truly `[]` (no active tickets on the repo) must dispatch no scout — currently CANNOT-EVALUATE in every run because the seed makes every query non-empty; add a variant with intake tickets closed.
2. Controlled max trial with equal caps (fable ×2 vs opus ×2 at 3600 s, same text) if the human wants the planner choice on more than n=3/n=2.
3. Late-scope reconciliation (r7 opus-1: closure paths added after intent; the tool cannot extend an item's areas): add `tracker.ts areas <key> --add` for the item's own writer, and a plan-skill line to re-run intersect when tasks add paths outside the intent.
4. Checkup after speculative-number reuse: plan 0002's "plan 0004" text meaning changes once a real 0004 exists; checkup should flag a plan citation whose title/subject does not match the cited plan (needs a `subject` word list — likely a human class).
5. Promote the fixture to the repo-root kit (with placeholders) and run the first Claude Code session on the `.claude/` twins — waiting on the human.
