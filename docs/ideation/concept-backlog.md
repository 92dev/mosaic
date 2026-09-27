# Concept backlog — everything that could go into mosaic

Status: `v1` = in the design (`2026-09-24-ideation.md`), `cand` = candidate not yet designed, `later` = worth it only after loop evidence, `no` = considered and rejected (reason given). Each line: concept — source — what it buys — what it costs.

## Context surface (defect 6.0)

- `v1` Placement doctrine: always-on only if it must fire before the model knows it needs it — claude-code-harness `claude/rules/README.md:14-23` — the one rule that decides every other file's home — none.
- `v1` Three buckets: sticky (`alwaysApply`), rulebook (`description` + `rule://`), TTSR (`condition`/`question`) with `agents:` filter — omp `rulebook-matching-pipeline.md` — lazy loading with per-agent scoping — rulebook is advisory, procedures must say "read `rule://x` now".
- `v1` Single home + citation; `doctor` reports duplicated phrases — baseline meta.md rule 5, aidlc doctor — kills the 7×/4×/3× restatements — phrase matching is a proxy, not proof.
- `v1` Per-agent always-on rule (`targeted-tests` for executor + reviewers) — omp `agents:` — the rule sits in front of exactly who acts on it — none.
- `v1` Skills = procedure only, each step cites the rule — baseline §7/§10 intent — skills shrink to ≤120 lines — needs the read-step discipline to not recreate F4.
- `cand` Frequency/provenance tags on every rule line (`[incident]` or `[N prompts]`) — claude-code-harness operating-manual — tells a future editor which rules are load-bearing — no corpus yet; use incident tags only.
- `cand` `HARNESS.md`-style grep-on-demand index for mechanics ("read `rule://map` then grep by header") — claude-code-harness `harness-mechanics` skill — one 2 KB always-on pointer table instead of a 30 KB doc — must be maintained.
- `cand` Comments stripped before injection (`<!-- maintainer notes -->`) — Claude Code memory doc — maintainer notes cost zero tokens in Claude Code — omp does not strip; keep notes out of `.omp` bodies or accept the cost.
- `cand` Measure realized tokens per role from the event stream, publish in SCOREBOARD — this rig — replaces line-count guesses — none.
- `later` Prompt-cache-aware layout: stable prefix (rules, skills list) first; per-turn text only in the newest user turn; TTSR injections append (cache-safe) — Anthropic cost guide "What breaks the cache" — 2.7–5.3× on agent loops in Anthropic's measurements — omp already orders system/tools/messages; verify with cache-read ratio in `usage`.
- `later` Context prune at task boundaries (replace large stale tool results with one-line extracts) — cost guide "Manage the context lifecycle" (39% on long runs) — omp compaction settings; only pays on long sessions.
- `no` Second copy of the workflow inside `CLAUDE.md` "for safety" — baseline defect F2 — copies drift.

## Gap discipline (defect 6.1)

- `v1` "Unverified" replaces "Verification gaps"; planning never authors G-entries — baseline F5 analysis — removes the generative path for bugs-as-gaps — none.
- `v1` Defect-first close-out triage owned by the orchestrator, then the full routing table, `when:` required, cannot-classify surfaced — critic C9–C12 — obligations only — one more explicit step at close.
- `v1` Open questions structurally parked; promotion needs a cited human ruling — aidlc `stage-protocol-learnings.md` — a question can never silently become an obligation — needs `open-questions.md` kept live.
- `v1` lint: G-entry must have `when:` naming a path/glob/event/plan — extends baseline lint-ledgers — mechanical half of the routing test — a checkable `when:` can still launder a defect (hence defect-first).
- `cand` Reviewer checklist item: "reject a close-out with missing/unsupported dispositions" — critic C10 — second pair of eyes on triage — reviewer already reads the plan.
- `cand` `gap-evaluate` KEEP/UPDATE/ARCHIVE/SPLIT unchanged, plus a `STALE-TRIGGER` verdict when `when:` no longer names anything that exists — baseline skill + lint — keeps the registry honest — needs path existence checks.
- `later` Claim-sourcing sensor: every plan claim cites `[desc]/[scope]/[Q<n>]/[memory]/[assumption]` — aidlc `aidlc-claim-sources.md` — makes "why" auditable — heavy authoring tax; try on Context sections only.
- `no` Rename G-x → O-x — human decision 2026-09-24 — churn without a mechanism.

## Meta adherence (defect 6.2)

- `v1` Deterministic gates own enforcement (`lint-ledgers` + `doctor`, exit 0/1/2) — claude-code-harness "a gate that cannot evaluate its condition reports success", omp-harness lint-ledgers CLI + 20-defect test suite — no model call, byte-reproducible — catches shape, not meaning.
- `v1` Explicit "read `rule://records` now" step before any governed mutation; `doctor` fails a skill that lacks it — F4 — meta rules arrive at the point of use — a few lines per skill.
- `v1` TTSR `records-guard` (edit+write, both path frames, `interruptMode: tool-only`) as once-per-session reminder — omp TTSR — zero context until it fires — `ttsr.repeatMode` is global (`once` default); not a gate.
- `v1` `/checkup` = deterministic `preprocess.ts` → candidates → single-session audit with mosaic candidate classes — omp-harness `checkup`/`session-audit` — periodic sweep without a standing agent — needs session JSONL access.
- `v1` Port-pair parity check in `doctor` (`.claude` ↔ `.omp` role pairs modulo recorded idiom deltas) — baseline F3 bug — the reviewer-copy defect fails a gate — deltas must be declared per pair.
- `cand` Judged `question:` rules, `agents: main`, advisory: "does this decision brief use an internal id without a plain restatement?" — omp TTSR §10 — semantic check regex can't do — needs `ttsr.judge: on` or a TypeSafe judge; judge sees only the output.
- `cand` Claude Code side: `.claude/rules/*.md` with `paths:` (lazy) for records rules; `PreToolUse` hook returning `additionalContext` on governed paths; `UserPromptExpansion` hook to inject per-skill context — Claude Code hooks/memory docs (verified 2026-09-24) — same behaviour in the second port — hand-maintained twin.
- `cand` `Stop` hook with `additionalContext` "run lint before finishing" — Claude Code hooks — a lifecycle sweep at turn end — Claude Code only.
- `cand` Stage-file immutability: skill bodies frozen; customization via additive rule files only — aidlc `stage-protocol-learnings.md` — stops workflow.md-style drift — needs a "core vs project layer" split.
- `later` Rule-drift `doctor` row: overlapping headings across layered rule files — aidlc `08-rule-system.md` — cheap advisory — only matters once rules are layered (org/team/project).
- `no` Standing librarian/advisor agent watching every turn — human decision 2026-09-24; advisor is per-session not per-phase (critic C6) — second model on every delta.

## Human explanation (defect 6.3)

- `v1` `human-gates` rule at decision points only: claim first in ordinary words; ids after, once; no session-invented labels; plain as true as the code; each sentence checkable from the previous; triad (produced / look at / after approval) — infer-dist.txt, claude-code-harness `communication.md:33-73`, aidlc `stage-protocol.md:15-50` — the human can decide from the brief alone — ~40 lines read at 3 moments.
- `v1` Jargon → plain table for mosaic's own vocabulary (G-x, P-x, D#, NNNN, adversary, REVISE, ff-only, `files:`) — aidlc reserved-vocabulary table — mechanical substitution — must be kept in sync with the vocabulary.
- `v1` `rule://writing-for-the-reader` = infer-dist.txt on demand — source — background when needed — never auto-loaded.
- `cand` Reviewer checks outbound artifacts (PR bodies, docs) against `human-gates` at their delivery step — critic C15 — third-party deliverables covered — one checklist item.
- `cand` Progress-update line: "say in a line what you're about to do; close with a recap that stands alone" for interactive sessions — Fable 5.1 / Opus 5.5 guides — the human sees the agent working — a few lines in AGENTS.md; omit in unattended mode.
- `no` Apply the brief to every message — human decision 2026-09-24 — restates the operator's own vocabulary.

## Roles, models, cost

- `v1` Semantic roles in `modelRoles` (`@judgment`, `@balanced`, `@templated`, `@critic`, `@judge`); ids only in `config.yml`; agent bodies family-neutral — aidlc tiers, critic C17 — swap models without editing agents — role ≠ family, so family-specific prompt text needs its own home.
- `v1` Executor cheap by default; re-run failures at `@judgment` — Anthropic cost guide "re-run failures" (≈41% cheaper on the measured benchmark) — cost — needs a checkable failure signal (tests, lint).
- `v1` Cross-model refutation (Claude ↔ GPT adversary/reviewers) — baseline AGENTS.md — independent recall — two subscriptions; out-of-usage fallback rules kept.
- `cand` Effort per dispatch: `low/medium` for mechanical scans, `high` for synthesis; `task.enableEffort` — claude-code-harness `full-audit-fanout.js` incident (#78460), omp task-agent-discovery — avoids thinking-budget burn — must be set in dispatch config.
- `cand` Time budget line for agent teams (`elapsed 340s / 1200s`) — Opus 5.5 guide — faster parallel completion at same quality — a harness hook appends it; advisory only.
- `cand` `prewalk` (start on a strong model, hand off to `smol` at first edit) for plan-then-implement sessions — omp `prewalk.md` — cheaper implementation phase — test on S4-like tasks first.
- `cand` Out-of-usage handling: switch family, drop dual review, periodic usage check — baseline AGENTS.md "Handling Out-Of-Usage" — resilience — must not silently degrade quality; log the degradation in the Execution log.
- `later` Prompt audit against the current model on every model change (`/claude-api prompt-audit` pattern) — cost guide — removes "verify twice"-class text — needs a mosaic checklist of over-obeyed phrases.
- `later` Batch API for unattended sweeps (`/checkup`, gap-evaluate full audit) — cost guide (50% off) — omp routes through providers; batch support unknown.
- `no` Pin `thinkingLevel: xhigh` in skill frontmatter — omp-harness dropped it; aidlc retired per-agent pins — forces cost regardless of session model.

## Model-specific prompt text (where it lives is undecided — see deferred)

- Fable 5.1: finish-the-whole-task + "Delivering work" pair; surgical edits over whole-file rewrites; remove anti-formatting rules; compaction preservation list; let the lead keep working while subagents run — Fable guide.
- Opus 5.5: `medium` default; unattended-run paragraph only for night tasks; `<pasted_content>` tags for pasted text; progress-update reminders after N silent tool steps — Opus guide.
- GPT-6 Astra: "user instructions outrank skills"; "name and quote the SKILL.md line that made you pause"; delegation nudge; plain-paragraph style; testing calibration ("don't broaden tests without a new reason") — `gpt-guideline.txt`.
- Shared: batch independent tool calls; "First privately list what you need next; then request every item that doesn't depend on another's result" — Fable guide.

## Verification & evidence

- `v1` Evidence packets (`local://<slug>-*`, immutable) instead of re-embedding diffs/logs in prompts — omp-harness `harness-omp-*` — bounded reviewer inputs — discipline to write them.
- `v1` Verify = attributable evidence for the exact state claimed; reuse still-valid outputs; rerun only after state changed — critic C14 rewrite of omp-harness RULES.md — no redundant reruns — needs "state changed" to be visible.
- `v1` Evidence outlives the command (`--reporter=json` to a file, never `| tail`) — baseline P-24 — one run, many questions — stack-specific commands in `rule://stack`.
- `cand` Counting rule: numbers come from one deterministic tool call, prose from the model, never blended — aidlc skills — no hallucinated stats in briefs/scoreboards — none.
- `cand` Negative-probe discipline (inject failure, confirm the gate fails, revert, rebuild) — baseline TEMPLATE — proves gates evaluate — kept in the template.
- `cand` Independent read-back after any external mutation (push, deploy, ticket update) — omp-harness harness-omp-* — catches silent failures — one extra command.
- `cand` Session-audit anti-self-confirmation: parse typed events (`is_error`), never grep prose — claude-code-harness `session-audit` — honest sweeps — needs the event schema.

## Records & registries

- `v1` Record-routing table kept whole (Decision / Obligation / Pitfall / Open question / Product / none) — baseline meta.md — every ruling has one home — routing is judgment; lint checks shape.
- `v1` Never-preload registries; scouts return id + one line + where to read — baseline §10 — cheap reading — a scout miss costs one agent.
- `cand` Registry entries carry a `when:` that lint can resolve (path exists / plan number exists) — this design — stale triggers surface mechanically — path churn creates noise.
- `cand` Frozen archives + sole-record rows + queried-not-recorded live state as `doctor` checks (archive file unchanged since its last "closed by" line; ledger row count monotonic) — baseline meta rules 2, 9, 11 — mechanical where possible.
- `later` Memory backend (`memory.backend: local`) for cross-session lessons — omp memory.md — process memory — conflicts with "if it isn't in docs/ it didn't happen"; docs remain the record.

## Loop-testing (rules 1–3)

- `v1` `omp -p --mode json` runs, evidence packets, deterministic checks first, evaluator verdicts recorded by CLI — this rig — every rule change scored — cost per run.
- `cand` `judge_batch` over rubrics with stated thresholds as a third evaluator — omp eval prelude — cheap regression signal — probabilities, not verdicts.
- `cand` Per-scenario "state assertions" on the resulting repo (git log shape, ledger rows) before any semantic scoring — critic C8 — determinism first — none.
- `cand` Fixture variants: `baseline`, `mosaic`; same scenarios; scoreboard diff — this rig — before/after per change — fixture maintenance.
- `later` Replay of real sessions (`omp --from-claude`, `history://`) as scenarios — omp CLI — real prompts instead of synthetic — privacy/sanitisation.
