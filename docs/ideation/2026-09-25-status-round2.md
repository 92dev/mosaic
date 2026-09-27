# Status 2026-09-25 — round 2 (intake, tracker plane, librarian, plan authoring)

All four round-2 features work end to end in loop tests on both model families; every deterministic check passes after check-format leniency fixes; the cost of the two heaviest flows (plan authoring, close-out with librarian) is the open question. Decisions taken today are in `2026-09-25-ideation-v2.md` §7; nothing beyond them was decided.

## What was built (all in `tests/loops/fixtures/mosaic/`, both ports, doctor PASS)

| Feature | Files | Notes |
|---|---|---|
| Intake | `docs/process/intake.md` (33 lines), `skills/intake` (22), `agents/ticket-investigator` (31) | Verdict block with fixed fields; one risk profile; v1 stops at the human digest; verdicts are tracker comments, never a markdown ledger |
| Tracker plane (replay only) | `docs/process/tracker.md` (48), `tools/tracker.ts`, `docs/tracker/items.json` seed, `agents/tracker-scout` (12), `/plan` Phase 1 intent + collision step, `/execute` `done` event after landing receipts, TEMPLATE `tracker:`/`areas:` | `--provider linear` exits 2 (unsupported in v1); writer generation conflicts refused; `done` needs a receipt per repo; comment ids deduplicate |
| Librarian + learnings | `tools/docimpact.ts`, `agents/librarian` (18), `/execute` step 8 (alignment) and step 9 (Learnings in the brief), seeds: `export.md` frontmatter, `F-1-export-flow.md`, roadmap item, plan 0004 (S9 only) | docimpact returns candidate classes + `cannotEvaluate`; librarian is read-only and returns amend/append/repoint/no-change with evidence |
| Scenarios | `S6-plan-adversary`, `S7-intake-digest`, `S8-tracker-intent`, `S9-closure-librarian`; run.ts `env` file convention; dry-run now runs setups | S7–S9 return CANNOT-EVALUATE on the baseline by design |

Fixture defect found by the runs and fixed: plan 0004 (status review) was present outside S9, which steered the first S7 runs' ENG-210 disposition to "resume plan 0004"; `setup.sh` now removes it unless `MOSAIC_S9=1`. The S7 GPT re-run on the fixed fixture gives ENG-210 → `light` (MEDIUM, cross-family REFUTE upheld), ENG-211 → `plan` via draft 0003, ENG-212 → `held` with owner and resume condition.

## Results (checks P/F/C; cost; time)

| Scenario | Opus 5 xhigh | GPT-6 Astra xhigh | Read |
|---|---|---|---|
| S6 plan authoring — baseline | 6/0/1, $12.11, 27 min, 123 req | 6/0/1, $3.06, 13 min, 31 req | reference |
| S6 — mosaic | 7/0/0, $6.31, 22 min, 69 req | 7/0/0, $3.73, 15 min, 38 req | Opus: half the baseline cost; GPT: +20% for the tracker intent + collision check; both name Dana's ENG-201 as a prerequisite |
| S7 intake | 9/0/0, $3.76, 10 min | 9/0/0, $2.72 (v0) / $4.45 (fixed fixture), 8–18 min | three verdicts with all fields; held items carry owner + resume condition; no code, no ledger |
| S8 tracker intent | 3/0/1, $1.96 | 3/0/1, $1.42 | intent written with areas; collision reported (owner, state, 9 days stale); foreign-writer refusal never exercised by the model (by design CANNOT-EVALUATE) |
| S9 closure librarian | 8/0/0, $9.99, 25 min, 94 req | 8/0/0, $6.07, 19 min, 61 req | false Implications sentence removed and replaced, F-1 flow updated, roadmap flipped, both repos landed, Learnings in the brief; Opus promoted a real deviation to P-39 |

Cost notes: S9 is the most expensive flow (librarian + registry-scout + dual review of docs and dispositions + landing two repos). S6 on Opus halves versus baseline because the baseline plan skill reads workflow.md whole and re-reads it per phase. Executor probes (S5): opus-5-5 medium and astra low/medium ≈ $0.2 per bounded task; luna medium ≈ $0.003 with the same checks passing.

## Check fixes made during evaluation (format leniency, not semantics)

S6 accepts the baseline's `### Verification gaps` heading; S7 accepts `refute: not required — <reason>` and a `held` disposition that cites plan 0003; S9 accepts "empty-string/empty document" wording variants, an Implications line that cites the fix, bold `**keep as none**`, a Learnings heading with trailing text, and a terminal-sync commit whose subject does not say "ledger sync".

## Open

- D7: where the `Support Ticket` intake queue lives (no triage state on that team).
- Real tracker adapter (Linear) — not started by decision; the replay adapter's contract is exercised by S7/S8.
- Cost tuning for S9/S6 (one review wave for docs + dispositions is already the rule; the remaining cost is model effort at xhigh and scout dispatches).

## Cross-reference (GPT critic, 11 runs)

Verdicts: S6 mosaic better on both families; S7 same (Opus, fixed-fixture GPT) / better (GPT v0); S8 better ×2; S9 GPT same, S9 Opus **worse** — it landed after `gpt-reviewer` returned `REVISE` (conflict ruling treated as approval) and then recorded a P-39 whose merge-base check does not catch the inherited-history case it describes (critic verified with `git merge-base`). Factual corrections to my notes: S6 Opus had 16 challenges over two rounds (not nine); S9 Opus made four task calls spawning five agents. Cost anatomy: rule reads are bounded and non-duplicated (9–12 distinct per long run); the avoidable overhead is repeated missing-input debates (librarian first asked for the diff it should have been given), synthetic tasks that relabel inherited history, and expired-agent retrievals in S7. Three risks before a live tracker: writer ownership is not a lock; evidence must be bound to repo-root→HEAD identity and complete pagination; provider/workspace isolation — one investigator called the live Linear `get_issue` during a replay run because the user-level MCP is loaded by the native provider (overlay now disables it with `disabledExtensions: [mcp:linear]`).

Its eight edits were applied to the fixture (both ports, doctor PASS, unmeasured): a conflict ruling never replaces the two final APPROVEs (`review-loop.md`); learnings proposals carry exact wording into the closure review, and post-sign-off application is mechanical (`execute` step 9); resuming a branch lists everything landing would publish and classifies inherited commits before review, no synthetic relabel tasks (`execute` preconditions); the librarian receives an immutable contract-diff artifact, keeps still-true clauses, and never closes G-entries (`execute` step 8); accepting every finding is not convergence — a BLOCKER or contract change forces one more round (`plan` step 6); intake binds evidence to `<repo root>=<HEAD>` pairs (`intake` skill); the 40-line cap applies to the decision brief with one receipt appendix allowed (`human-gates.md`); the writer token is random and retained, replay keys are never resolved through live tools, a local receipt is not delivery (`tracker.md`, `intake` skill).

## Spend
Round 2 runs ≈ $75 (S6 ×4 $25, S7 ×3 $11, S8 ×2 $3.4, S9 ×2 $16, executor probes $1, plus checks/rechecks free).
