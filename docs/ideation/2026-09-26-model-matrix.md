# Model × job matrix (2026-09-26, final) — with the astra-max cross-check

Cohorts `m1`–`m3` (≈ 90 runs, ≈ $160) on top of the earlier 141; scoreboard 211 rows. Two repeats per cell unless stated; five runs tainted by the OpenAI key outage (22:26–23:40 UTC 2026-09-25) are marked `taint:same` and excluded. Cross-check: `agent://MatrixCriticGpt` (astra max; 65 runs scored; 34 better / 30 worse / 1 same relative verdicts). Tolerance tiers: `tests/loops/TOLERANCE.md`. Costs are parent `metrics.cost` unless stated.

## Decision table

| Job (tolerance) | Best measured | Claude pick | GPT pick | 50/50 decision | Why / risk |
|---|---|---|---|---|---|
| Planner (none) | fable-5-1 max: 7/7 ×3, $8.1–9.2, 24–30 min (opus-5-5 max $10.3 / 48 min, same checks) | fable max | none measured at max (astra xhigh $3.2 if max is ever relaxed) | **Claude — fable max** | Your standing decision; data agrees. Risk: n=3 and one run needed the 3600 s cap. |
| Adversary (none) | sol max and astra max both catch the real defects; sol $8.6 / 28 min vs astra $9.3 / 30 min (+9 % / +8 %); astra raises 11–12 challenges per plan vs sol 7–8, no extra defects caught | — (must be cross-family to the planner) | sol max | **GPT — sol max** | Critic: "no categorical reason, no big consistent advantage"; astra is credible, not demonstrated better. Swap to astra max if you value challenge volume over $1 and 2 min per plan. |
| Close-out orchestrator (none) | astra medium 2/2, $3.32 / 12 min; astra high 3/3, $3.41; opus-5-5 high 2/2, $2.34 / 11 min (briefs lead with identifiers, rubric Q1 miss ×2) | opus-5-5 high | astra medium/high | **GPT — astra high** | Zero-tolerance job: astra medium/high never missed a routing check in 5 runs; opus-5-5 high is $1 cheaper but its briefs put ids before effect. Risk: n=2–3 per cell. |
| Small governed work (S3 none; S4/S10/S11/S13 low) | sol xhigh 10/10, $0.07–0.15 (opus-5-5 xhigh $0.23–0.87: 3–6.5× more; astra $0.37–0.75) | opus-5-5 xhigh | sol xhigh | **GPT — sol xhigh** | Cheapest by far with no miss on these five; the one sol miss is S8 below. Risk: opus r4-1 S11 overclaimed coverage, sol never did. |
| Tracker intent S8 (low) | opus-5-5 xhigh 2/2 $0.88; astra 3/3 $1.11; sol 0/2 — reports the last-event date, not staleness in days | opus-5-5 xhigh | astra xhigh | **Claude — opus-5-5 xhigh** | Sol had the number available and omitted it twice (rule asks for staleness). Fixable by text; until measured, keep Claude here. |
| Intake orchestrator (low) | sol xhigh + sol-medium investigator: 2/2, **$0.43 / 5.4 min** (sol + sonnet investigator $0.75; opus-5-5 $2.17; astra $2.83) | opus-5-5 xhigh | sol xhigh | **GPT — sol xhigh** | 5× cheaper than opus with identical dispositions. Risk: one sol run omitted the Dana-coordination note; no LOW verdict forced a REFUTE this fixture. |
| Investigator (low) | sol medium: correct MEDIUM/HIGH/UNKNOWN first time; sonnet-5 medium needed 2–3 LOW corrections per digest | sonnet-5 medium (correction-prone) | sol medium | **GPT — sol medium** | Cross-family REFUTE then runs on Claude (`@judgment`), which keeps the family split inside the role. |
| Executor (high) | sol low/medium 8/8, $0.02–0.03, 10–16 s; opus-5-5 medium 3/4 before rule fix, $0.10–0.16; luna medium ≈ $0.003 (old probe) | opus-5-5 medium | sol medium (critic: cheaper mean than low) | **split — sol medium for GPT plans, opus-5-5 medium for Claude plans** | Tolerance high: review catches errors; both stop on contradictions. Splitting by plan family keeps executor and reviewer families crossed. |
| Reviewers (low) | default pair (opus-5-5 medium + sol high): substantive findings in every S1 run; xhigh pair 1.17× cost, 1.64× time, found one localized inventory falsehood and no runtime/routing defect; sol xhigh approved every snapshot | opus-5-5 medium | sol high | **one each — opus-5-5 medium + sol high (unchanged)** | Critic: keep medium/high; "sol high found substantive issues, sol xhigh found none". Claude half costs 5–7× the GPT half per round — candidate for sonnet-5, unmeasured. |
| Scouts (medium) | registry: luna medium 2/2 sound, $0.003 (haiku invented a "must land first" claim once; sonnet excluded P-23). tracker (after the tool fix): luna low 2/2 $0.002, haiku 2/2 $0.035 | haiku low (tracker) / sonnet-5 low (registry, provisional) | luna medium (registry) / luna low (tracker) | **GPT — luna (medium registry, low tracker)**; haiku stays the Claude fallback | Cheapest and cleanest after the fix. Your haiku worry is confirmed on registry recall (one invented claim). Risk: pre-fix, haiku and sonnet wrote `/tmp` files to cope — scouts now forbidden to write anywhere. |

Split: Claude = planner, S8-type tracker work, executor for Claude plans, one reviewer, haiku fallback; GPT = adversary, close-out, small work, intake, investigator, executor for GPT plans, one reviewer, scouts. By job slots 4.5 / 4.5; by dollars GPT carries more of the cheap volume and Claude the max-effort planning.

## Answers to the ten notes

0/2/3/5 — **sol** is the GPT workhorse: small work $0.07–0.15 (10/10), executor $0.02–0.03 (8/8 incl. STOP probe), intake $0.43–0.75 (4/4). Its single miss: S8 staleness reported as a date.
1 — **Adversary sol vs astra at max**: no big difference. Six valid fable-max plans: sol 8/2, 8/5, 7/1 challenges/BLOCKERs at $8.4/8.1/9.2; astra 12/1, 11/2, 4/0 at $10.7/9.5/7.8. All six recipes have the `None` guard, integer-safe slice, keyword-only `limit`, and the landing-order STOP. sol was originally inherited from the baseline's reviewer pairing, never compared until now.
4 — **Close-out**: no routing miss at any effort for either family (12 new runs). opus-5-5 high $2.34, astra medium $3.32, both clean; opus briefs lead with identifiers (rubric Q1). The GPT-side pick is astra high (3/3).
6 — Tolerance tiers built (the table now lives in `kit/docs/kit/maintenance.md`, alongside `TOLERANCE.md` and `score-cohort.ts`). Critic correction: S3 (registry edit) is a `none` scenario, not "small work" — sol still cleared it 2/2.
7 — **Reviewers at xhigh**: 11/11 both runs at 3600 s; $4.4 / 26 min vs default $3.8 / 16 min; no new substantive finding; sol xhigh approved everything. Keep medium/high.
8 — **Overbearing review**: before the rule the planner accepted all 6 challenges over 3 rounds and wrote a 139-line plan for one docstring line. After the proportionality rule (`/plan` Phase 2): 1 round both times, scope held, one run rejected a BLOCKER with reasons; plans still 107–117 lines / ~2000 words. Critic: proportionality not established — the adversary did not push scope this time, and the size is not proportionate. A "length follows the diff" line was added to `/plan`; needs re-measure and an adversary that actually pushes.
9 — Investigator ≠ planner by design (evidence about a claim vs a plan to change code); the GPT investigator (sol medium) outperformed sonnet on first-time severity.
10 — **Scouts**: haiku's weakness is real (invented claim on registry); luna is the pick after the `tracker.ts` pretty-print fix — the runtime truncates tool-output lines at 768 bytes and every scout was reading a cut-off inventory before.

## Harness changes this round (both ports, doctor PASS)

Tolerance table (originally `model-notes.md`, now `kit/docs/kit/maintenance.md`); `/plan`: proportionality + length-follows-diff; `tools/tracker.ts` pretty JSON; scouts: omit general-practice pitfalls, never write files; runner `--role name=model:effort` (cell keys, scoreboard, `meta.roles`); scenarios S14/S15a/S15b; predicate widenings recorded in each run's checks.json.

## Not yet measured

Claude parent + sol investigator; sonnet-5 as the Claude reviewer; S14 with an adversary that pushes scope; sol staleness wording on S8 after a text fix; the new role table as the fixture default.

## Addendum 2026-09-26 (decisions + reviewer pairs)

Decisions applied to the fixture config: adversary `critic` = astra max (plan safety); executor `templated` = sol medium. Reviewer-pair measurement on S1 (opus-5-5 xhigh orchestrator, 2 runs per pair, `'/Users/osm/.omp/agent/sessions/-github-mosaic/2026-09-24T12-54-53-623Z_01a0d37b-afb7-7221-b4da-cdc4cbb87189/ReviewerPairCritic.md'`):

| Pair | Substantive findings (Claude / GPT) | Procedural | Parent $ / min | Claude child $ (round 1) |
|---|---|---|---|---|
| opus-5-5 medium + sol high (default) | 3/0, 3/2 | 4, 3 | 3.48 / 14.5; 4.04 / 17.4 | 0.89, 0.71 |
| opus-5-5 high + sol high | 1/1, 2/1 | 7, 9 | 3.98 / 18.8; 4.19 / 22.7 | 1.54, 2.32 |
| sonnet-5 high + sol high | 1/2, 0/0 — sonnet approved a false 0003 prerequisite as "not a defect in this closure wave"; sol high vetoed it | 1, 1 | 3.26 / 21.1; 3.03 / 15.3 | 0.95, 0.62 |
| opus-5-5 xhigh + sol xhigh | 3/0, 2/0 | 10, 11 | 4.27 / 27.0; 4.49 / 25.5 | 2.50, 3.44 |

Why medium + high: raising the Claude reviewer to high or xhigh added procedural findings (7→16 per pair) and 30–70 % time, not substantive catches (6 → 3 → 5 across the pairs); sol xhigh found nothing sol high did not (0 substantive in 5 verdicts); sonnet-5 high missed a substantive veto. Recommendation kept: opus-5-5 medium + sol high.

## Addendum 2 — reviewers at max, proportionality under pressure, forced REFUTE (2026-09-26)

Seven reviewer pairs on S1 (opus-5-5 xhigh orchestrator, 2 runs each; `'/Users/osm/.omp/agent/sessions/-github-mosaic/2026-09-24T12-54-53-623Z_01a0d37b-afb7-7221-b4da-cdc4cbb87189/ReviewerPairCritic.md'`, `'/Users/osm/.omp/agent/sessions/-github-mosaic/2026-09-24T12-54-53-623Z_01a0d37b-afb7-7221-b4da-cdc4cbb87189/ReviewerMaxCritic.md'`). S = substantive finding (would have landed a wrong record / false claim / broken landing), P = procedural.

| Pair | S findings C/G | P | Parent $ / min | Claude reviewer $ (run 1; 2) | Sol reviewer $ |
|---|---|---|---|---|---|
| opus medium + sol high (default) | 6/2 | 7 | 3.48/14.5; 4.04/17.4 | 0.89; 0.71 | 0.13; 0.13 |
| opus high + sol high | 3/2 | 16 | 3.98/18.8; 4.19/22.7 | 1.54; 2.32 | 0.12; 0.36 |
| sonnet high + sol high | 1/2 | 2 | 3.26/21.1; 3.03/15.3 | 0.95; 0.62 | 0.17; 0.11 |
| opus xhigh + sol xhigh | 5/0 | 21 | 4.27/27.0; 4.49/25.5 | 2.50; 3.44 | 0.41; 0.29 |
| opus medium + **sol max** | 9/3 | 10 | 3.28/13.6; 4.80/26.6 | 0.87; 2.12 | 0.17; 0.61 |
| **opus max** + sol high | 14/2 | 26 | 4.60/51.3; 4.53/53.5 (one run held landing → 4 checks FAIL; one 41-line brief) | 8.92; 9.58 | 0.31; 0.42 |
| **both max** | 11/4 | 19 | 4.75/40.6; 4.44/57.0 | 4.86; 11.84 | 0.47; 0.77 |

Critic's answer: max sometimes buys *more relevant* findings, not reliably better ones — sol max vetoed a wrong registry target and lost G-2 provenance; opus max caught a wrong-repo local-ledger edit; most other extras repeat the default pair's catches or are P. Opus max costs $9–12 per review round (10× medium) and pushes close-out to 40–57 min. Every pair — max included — left at least one final-artifact defect uncaught (e.g. G-2 citation to the emptied active registry; a lost `Trigger:` field in the archived record), so S1 is not at a recall ceiling. **Is S1 too easy?** Yes for ranking effort: the seeded leftovers are literally labelled DEFECT / OBLIGATION / QUESTION and the acceptance permits the skipped test. Decision: reviewers stay opus-5-5 medium + sol high; sol max is the one upgrade with a measured material catch at +$0.5/round — hold until a harder packet discriminates.

Harder close-out packets proposed by the critic (identical frozen inputs per pair, seeded-defect oracle): (1) acceptance trap — acceptance requires empty input to succeed while the packet keeps the failing test skipped and mislabels the defect out of scope; (2) routing/dedup trap — an existing OAuth obligation hidden under different wording, packet proposes a second G-id and erases provenance; (3) snapshot trap — two APPROVEs and passing evidence for SHA A, then a rebase onto SHA B with a boundary regression claimed as unchanged ff-only. Each with a check that fails a review that approves the trap.

**Proportionality under pressure (S14b, new):** the adversary is instructed to push five scope expansions. fable max planner, astra max adversary: 6/6 both runs — one task, 1–2 rounds, 95–113-line plan, "REJECT — outside 'one line and nothing else'; it is plan 0002's" recorded per challenge, substance handed to the human as leftovers; $4.15–5.51. Before the proportionality rule (S14, r-m1) the same planner accepted everything over 3 rounds.

**Forced cross-family REFUTE (S7b, new):** queue + ENG-214 (true "already implemented" claim) + ENG-215 (docs-only LOW). With the sol-medium investigator, REFUTE ran on opus-5-5 (`@review-claude`) for both, ENG-214 closed as implemented only after REFUTE, ENG-215 LOW upheld → inline; 3/3 clean at $0.6–0.7 once two harness gaps were fixed: `rule://intake` LOW now admits docs/comment-only changes checked by reading (a README typo could never be LOW before), and `mosaic-core` now says dispatch agents only with the `task` tool (one sol run dispatched through the eval kernel, invisible to rule scoping and the review record).

**Confirmation on the adopted table:** sol S8 2/2 after "staleness in days" wording ($0.21); luna medium scouts 4/4 ($0.003); sol medium executor 2/2. Fixture config then: plan fable max · critic astra max · templated sol medium · investigator sol medium (new role) · balanced sonnet-5 medium (librarian) · review-claude opus-5-5 medium · review-gpt sol high · smol luna medium · judgment opus-5-5 high. The historical session-model table now lives in `kit/docs/kit/maintenance.md`; current roles remain in `.omp/config.yml`.

## Addendum 3 — opus medium vs max on harder close-out packets (2026-09-26)

Reviewer pair fixed at sol max (adopted). Three trap scenarios, two runs per cell, opus-5-5 xhigh orchestrator (`'/Users/osm/.omp/agent/sessions/-github-mosaic/2026-09-24T12-54-53-623Z_01a0d37b-afb7-7221-b4da-cdc4cbb87189/LadderCritic.md'`):

| Scenario (trap) | opus medium: reviewer-first / orchestrator-first / landed correctly | mean $ / min | opus max: same | mean $ / min |
|---|---|---|---|---|
| S16a acceptance (skipped test + false "2 passed" vs acceptance requiring the fix) | 0 / 2 / 2 | 4.04 / 21 | 0 / 2 / 1 (one held in review) | 5.01 / 58 |
| S16b routing/dedup (existing G-4; packet proposes G-5 and erases provenance) | 0 / 2 / 2 | 3.59 / 18 | 0 / 2 / 1 (fourth review round vetoed its own wording; nothing landed) | 4.35 / 51 |
| S16c snapshot (approvals at SHA A; later "no functional change" commit drops a row) | 0 / 2 / 2 | 3.75 / 18 | 0 / 2 / 1 (main unchanged) | 3.99 / 51 |

Findings: every trap was caught by the **orchestrator's close-out steps** before the closure review (verify on HEAD, records routing "amend the existing entry", acceptance vs T2); reviewers saw corrected packets in 12/12 runs. Opus max caught nothing medium missed (0/6 vs 0/6 reviewer-first), cost +17 % parent and 2.8× wall time (19 → 53 min), reviewer child ≥ $1.6 → ≥ $9.4, and blocked or withheld 3 of 6 landings on marginal vetoes (one veto corrected its own earlier wording: "the conclusion is unaffected"). Sol max did complementary substantive work (rejected a removed landed-run obligation; caught a dropped Trigger/From). Critic verdicts: medium `same` ×6, max `worse` ×6. **Decision: reviewers = opus-5-5 medium + sol max.**

Also learned: the traps are still not reviewer-discriminating because the harness catches them upstream — a sign the close-out procedure is doing its job; a reviewer-only trap would have to be one the orchestrator is *told* is fine (e.g. a human-approved wrong disposition), which is a different question.

## Addendum 4 — code reviewers (S17), kit split, mock Linear MCP (2026-09-26)

**Clarification adopted:** "reviewer" = the code reviewer of the executor's diff. Earlier pair measurements were on the closure review (records); S17 measures code review directly: an executor commit implementing plan 0004 T1 (`limit` parameter) with four seeded defects — off-by-one `rows[:limit+1]`, `limit=0` treated as all rows against the contract, docstring says negative raises but code clamps, and tests that assert the buggy behaviour so `pytest` passes.

| Pair (orchestrator opus-5-5 xhigh) | Seeds caught by Claude / by GPT (run 1; run 2) | Ruling | $ / min |
|---|---|---|---|
| opus medium + **sol max** (adopted) | 4/4 + 3/4; 4/4 + 4/4 | REVISE both | 0.62 / 3.6; 0.66 / 5.7 |
| opus max + sol max | 4/4 + 4/4; 4/4 + 4/4 | REVISE both | 0.48 / 9.7; 0.76 / 9.2 |
| opus medium + sol high | 4/4 + 2/4; 4/4 + 4/4 | REVISE both | 0.62 / 2.8; 0.71 / 3.6 |

Opus medium caught all four seeds in every run; max added nothing and took 2.5× longer. Sol max caught 3–4 of 4 vs sol high 2–4 — the one place where the GPT effort mattered, supporting the sol-max choice. No false BLOCKERs anywhere. Caveat: the seeds are textbook (a reviewer that runs the code finds them); a harder code-review packet would seed a defect the tests and a probe both miss (e.g. an encoding/locale or ordering assumption).

**Kit split (using vs building mosaic).** `kit/` is now the product: `.omp/`, `.claude/`, `docs/process/*`, skeleton registries, `tools/*`, `AGENTS.md`/`CLAUDE.md` with placeholders (`{{PROJECT_NAME}}`, `{{PROJECT_SUMMARY}}`, `{{LINK_REMOTE}}`, `{{MEMBERS}}`), `kit/install.ts --manifest <json> --target <dir> [--overlay <dir>]`, `kit/README.md`. The loop fixture is generated: `bun tests/loops/build-fixture.ts` = install + `tests/loops/fixtures/mosaic-overlay/` (member-a, plans, seeds, setup.sh); `bun tests/loops/kit-parity.ts` fails on any hand edit of the fixture. Proofs: regenerated fixture byte-identical to the pre-split tarball (the only later diff is the intended placeholder check in doctor), fresh two-member install passes doctor, all 24 scenario dry-runs pass. Root `README.md` has the two sections.

**Mock Linear MCP.** `kit/tools/mcp/linear-mock.ts` is an MCP-compliant stdio server (JSON-RPC, `initialize`/`tools/list`/`tools/call`) exposing eight Linear-shaped tools (`list_issues`, `get_issue`, `save_issue`, `list_comments`, `save_comment`, `list_teams`, `list_issue_statuses`, `list_users`) over a local store `docs/tracker/linear-mock.json` (seedable from the replay seed). `kit/tools/tracker.ts --provider mcp` (or `MOSAIC_TRACKER_PROVIDER=mcp`, or `docs/tracker/config.json`) drives every op through `kit/tools/mcp/client.ts`; the model's CLI surface is unchanged, so the live version is a config swap to `npx -y mcp-remote https://mcp.linear.app/mcp`. Proof: `bun tests/kit/tracker-mcp-smoke.ts` 13/13 PASS (replay-equivalent outputs, WRITER-CONFLICT, idempotent comments, park/resume across sessions, receipts with MCP ids); real-model runs S8m (intent created ENG-213 in the store) and S10m (refusal, no mutation) pass the same checks as replay.

## Addendum 5 — hard code-review packet (S17b) and generated baseline (2026-09-26)

S17b seeds four contract violations that both the tests and an int-only probe pass: LF line terminators (bytes change for existing callers), `sorted()` column order, in-place truncation of the caller's list, and a module-level shared `StringIO` (not re-entrant). Limit semantics are correct, so S17's defects cannot be leaned on. GPT reviewer fixed at sol max; orchestrator opus-5-5 xhigh; two runs per cell.

| Claude reviewer effort | seeds caught Claude / GPT (run 1; run 2) | $ / min |
|---|---|---|
| opus-5-5 **medium** | 4/4 + n/a (GPT result not delivered in run 1); 4/4 + 4/4 | 0.65 / 6.1; 0.80 / 6.4 |
| opus-5-5 high | 4/4 + 4/4; 4/4 + 4/4 | 0.64 / 5.1; 0.69 / 6.1 |
| opus-5-5 xhigh | 4/4 + 4/4; 4/4 + 4/4 | 0.59 / 5.5; 0.91 / 5.6 |
| opus-5-5 max | 4/4 + 4/4; 4/4 + 4/4 | 0.96 / 13.8; 0.67 / 11.5 |

Result: opus-5-5 at **medium** already catches all four subtle seeds in both runs (one run even measured the shared-buffer race with a four-thread probe: "4876 wrong outputs"); high/xhigh change nothing; max doubles the time. Sol max also 4/4 in every delivered result. Every ruling was REVISE, no false BLOCKERs. Effort does not move code-review recall on this packet either; recall is bounded by whether the reviewer runs the code, which all efforts did. Reviewer decision unchanged: opus-5-5 medium + sol max.

**Baseline fixture now generated too.** `tests/loops/fixtures/baseline-kit/` (27 frozen harness-2026-09-02 files) + `baseline-overlay/` (25 project files) + `baseline.manifest.json`; `kit/install.ts --kit <dir>`; `bun tests/loops/build-fixture.ts` builds both, `bun tests/loops/kit-parity.ts` guards both. Regenerated baseline is byte-identical to the pre-cutover tarball (sha256 626640…3fd7). Literal project text left inside the baseline kit (member table in its CLAUDE.md/workflow.md, plan-example numbers, `uv run pytest` commands) is listed in `tests/loops/README.md` — the baseline is frozen history, not templated product.
