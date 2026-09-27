---
name: mosaic-plan
description: Author a plan from the template, resolve adversarial challenges, and present it for human approval. Argument: change description.
---
# /mosaic-plan — Author a plan
Read each named rule once per session; a later step naming a rule you already read means apply it, not reread it.
Planning runs at maximum effort. Use the configured planning role; if that role or effort is unavailable, record the limitation in the approval brief.

## Phase 0 — Triage
1. Read `rule://plan-triage`. Choose the vehicle before reserving a number. If a lighter path applies, say which, hand back to that path, and stop this skill. Honor an explicit human request for a plan on borderline work.

## Phase 1 — Research and draft
1. Read `rule://plan-home`. Determine target repos and the plan's home.
2. Read `rule://tracker`. Determine link-root-relative `areas` (paths/globs and `contract:<name>`); run `bun tools/tracker.ts intersect --areas '<areas>' --repos '<repos>'` from the link root. `[]` with a complete inventory is the collision result; dispatch `tracker-scout` via `task` only when the list is non-empty, to read those items' managed blocks and last comments. Name every intersecting item in the approval brief with owner, state, and staleness in days (the `stale` field), and state the result as a positive claim: those are the only intersecting items, the inventory was complete (or was not), and unknown-scope items are unresolved rather than cleared.
   Before reserving the number, run `bun tools/tracker.ts intent --title '<title>' --repos '<repos>' --areas '<areas>' --writer '<opaque token>'` from the link root; retain the key and use `get <key>` to obtain the immutable id, URL, and writer generation. Follow the tracker rule on unavailable writes; record an unavailable collision check rather than claiming none.
3. Read `rule://records`; read `rule://plan-home`; read `rule://git-flow`.
   Reserve the number under `rule://plan-home` R2. This is the row Phase 3 will update.
4. Read `rule://plan-home`. Copy the link repo's `docs/plans/TEMPLATE.md` to `<home>/docs/plans/NNNN-<slug>.md`; create its `docs/plans/` directory on first use. Fill today's date, title, number, `status: draft`, target `repo:` list, branch, `areas:`, and `tracker: {provider: replay, id, key, url}` from the intent. If unavailable, use `tracker: null` and queue the unsent intent in the Execution log. Use `rule://plan-home` R5/R8 for task paths and prose links.
5. Read `rule://registries`. Research unfamiliar areas with `context-scout` via `task`, then read the architecture decisions its brief identifies. Send the proposed scope to `registry-scout` via `task` for pitfalls, active gaps, and related plans.
   - If the idea trips a flagged pitfall, stop and tell the human.
   - Express the rule's gap disposition as `closes G-x`, or a G-x-cited deferral in Context.
6. Read `rule://dispatch`; read `rule://plan-home`; read `rule://records`. Write executor-sized tasks using the dispatch contract and the correct repo/path frame; set `class: docs` for documentation tasks and `class: code` otherwise, with acceptance per class. Documentation tasks still use executors; close-out work is never a task. Before dispatch, verify every source path, heading, and numeric range a task names against the source itself; a task must not ask an executor to infer members that are not there. Include the records rule in `reads:` for governed-file tasks. Delegate research-heavy subparts if useful; author the plan yourself.
7. Read `rule://review-loop`. Write concrete diff checks, citing the relevant P-x, in the Review checklist. The instructions an executor will run are what the plan proves: test the exact final commands and code, including optional-value guards and the full declared value domain; a sketch that differs from the final instructions is illustrative, never evidence.
8. Read `rule://verification`. Fill Verification and Unverified from the research under that rule.

## Phase 2 — Adversarial rounds
1. Read `rule://map`; read `rule://plan-triage`. For a genuinely trivial plan, ask the human to waive the debate; log the granted waiver's author and reason, then go to Phase 3. Without a waiver, run this phase before presenting approval.
2. Spawn `plan-adversary` once via `task`, giving the plan path, Context, and target repos. Let it inspect the repo itself; do not substitute your account of the repo. Its reply is Round 1.
3. Read `rule://map`. Rule on every challenge:
   - `ACCEPT`: amend the draft.
   - `REJECT`: record reasoning grounded in docs or repo evidence.
   - `INVESTIGATE`: consult `context-scout` or a second-opinion agent via `task` about the disputed point; use the evidence to decide.
4. Append the round to the Planning log: challenge severity and grounding, each ruling, panel input, draft changes, and checkpoint disposition.
5. Read `rule://map`. Report every round to the human: challenges, rulings, changes. A human interjection may steer, overrule, or end debate; an overrule reopens that ruling only.
   Wait before another round when any of these is open:
   - A human-owned call surfaced or moved: product semantics/UX, material scope growth, direction change since the human last saw the draft, spend, credentials, deploy, or a P-x/G-x requiring a human ruling.
   - You would reject a challenge grounded in recorded D#/P-x truth.
   - A standing BLOCKER cannot be resolved by an amendment you are authorized to make.
   Otherwise log `Checkpoint: informational — nothing human-owned open` and continue. Unattended: record a blocking decision OPEN and surface it at the next human contact; only explicit prior delegation of that decision class permits proceeding.
6. Read `rule://map`; read `rule://plan-triage`. Decide whether to end before dispatching again; there is no fixed round cap:
   - `NO FURTHER CHALLENGES` with no standing CONTEST: end.
   - Every challenge ruled, amendments applied, nothing critical or decisive for the human left open, and draft barely changed: end for insufficient delta without another confirmation round. Rule each challenge against the human's stated scope first: a challenge that adds tasks, files, tests, decisions, or preflights beyond the request is rejected as out of scope with that reason even when it is correct, and its substance goes to the brief as a leftover for the human. A one-task plan converges after one round unless that round raised a BLOCKER. A plan's length follows its diff: a one-file change gets a Context of a few lines, one task, and only the verification that proves that file — no preflight or sequencing sections unless a recorded collision requires them. Accepting every finding is not convergence: a round that added a BLOCKER or materially changed a contract, an authority or acceptance criterion, or a safety property requires one more round on the changed draft, naming the changed claim; wording or command edits under Verification do not.
   - Otherwise, if the next round is 6, stop at the runaway gate (default threshold 5; the human may set another upfront). Present what remains, why it has not converged, and continue/amend/stop choices.
   - Otherwise send a follow-up to the same adversary with your rulings and notice of the revised draft; await its reply. It re-reads the plan and retains context; do not spawn a fresh adversary. Return to step 3.
7. Read `rule://human-gates`. At debate end, digest everything still outside the draft: rejected challenges and reasoning, contested rejections, deferred MINORs, and open questions. Give each a suggested disposition and implications; ask amend / another round / something else. Apply the answer here or proceed. If nothing stands, go directly to Phase 3's approval request.

## Phase 3 — Ledger and approval
1. Read `rule://records`; read `rule://plan-home`.
   Confirm the reserved master-ledger row's title and status; do not add it twice. For a member-homed plan, seed or update the local ledger using R3's schema.
2. Read `rule://human-gates`; read `rule://map`; read `rule://tracker`. Present the plan and a Planning-log summary: rounds, standing rejections, human rulings, and the retained collision check with each item's owner, state, and staleness (or its unavailable result). Only the human authorizes `draft → approved`; record that authorization before changing status. Do not begin execution in this invocation.
