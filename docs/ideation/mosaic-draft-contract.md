# mosaic draft — build contract for `tests/loops/fixtures/mosaic/`

The first mosaic harness is authored as a second loop fixture for the same `Fixture` project, so the
six scenarios in `tests/loops/README.md` score it against `fixtures/baseline/` unchanged. Project
content (member-a, docs/architecture, registries, plans, git setup) is copied from the baseline
fixture byte-for-byte; only the harness layer changes. Decisions from `2026-09-24-ideation.md` §7
apply. Where this contract and the ideation record disagree, this contract wins (it is later).

## Layout

```
fixtures/mosaic/
  AGENTS.md                   omp entry (auto-injected; root CLAUDE.md is shadowed in omp)
  CLAUDE.md                   Claude Code entry; same content as AGENTS.md plus the Tier B read-gate list
  docs/process/*.md           Tier B rule bodies (single home). Frontmatter is the omp rule frontmatter.
  .omp/rules/<name>.md        symlinks to ../../docs/process/<name>.md  (omp rulebook / always-apply / TTSR)
  .omp/rules/targeted-tests.md, records-guard.md, mosaic-core.md   real files or symlinks — same rule
  .omp/skills/{plan,execute,gap-evaluate}/SKILL.md
  .omp/agents/{executor,plan-adversary,claude-reviewer,gpt-reviewer,registry-scout,context-scout}.md
  .omp/hooks/post/lint-ledgers.ts     (baseline's, + `when:` check)   .omp/hooks/pre/records-guard.ts? NO — TTSR rule instead
  tools/doctor.ts                     CLI, exit 0/1/2
  .claude/rules/mosaic-core.md        (always-on twin) .claude/rules/records-guard.md (paths: governed globs)
  .claude/skills/… .claude/agents/… .claude/hooks/{lint-ledgers.sh, records-guard.sh, guard-main.sh} .claude/settings.json
  docs/index.md, docs/gaps.md, docs/gaps-archive.md, docs/plans/…, docs/architecture/…   (project layer, from baseline)
  member-a/                            (from baseline, untouched)
  setup.sh                             (from baseline, untouched)
```

`docs/workflow.md` and `docs/meta.md` do not exist in mosaic. `docs/index.md` keeps the registry table and repo map, drops the cold-start prose (AGENTS.md owns it), and lists the process rules with their read-gates.

## Budgets (hard; `tools/doctor.ts` fails on breach)

| File | Max lines (body, excluding frontmatter) |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | 30 |
| `mosaic-core.md` | 30 |
| `map.md` | 60 |
| every other `docs/process/*.md` | 80 |
| every `SKILL.md` | 120 |
| every agent | 60 |

## Single-home rule

A rule statement lives in exactly one file. Any other file cites it as `rule://<name>` (omp) — the
Claude twin cites `docs/process/<name>.md`. Never restate. The doctor greps for the canonical
phrases listed in `tools/doctor.ts` (`targeted tests`, `never commit on main`, `max 2 revise`,
`files: sets are disjoint`, `never preload`, `read before edit`) and fails when a phrase appears in
more than one process file/skill/agent body (a line that contains `rule://` is exempt).

## Tier A — always on

### `AGENTS.md` (≤ 30 lines) — omp entry, auto-injected

Required content, in this order:
1. One line: what the repo is (link repo for `Fixture`; member `member-a/`).
2. Precedence in two lines: architecture docs outrank product docs outrank uploads; the human may override any recorded decision (surface the conflict).
3. "Before any change, read `rule://map`." (one line) and "Skills: `/plan`, `/execute`, `/gap-evaluate` — invoke by reading `skill://<name>`."
4. The role-relative precedence contract (≤ 6 lines): user instructions outrank skill text; the orchestrator decides and moves, executes routine judgment calls itself, and asks only when different readings would lead to materially different work; executors finish their authorized task inside `files:` and return conflicts quoting the exact rule/task clause; reviewers never edit; a guard (rule interrupt, hook) may constrain an action, never expand authority.
5. Finish-the-task line (Fable): "A step you have decided on is something to run, not to announce; end the turn only when the task is complete or blocked on input only the human can provide. Stop for destructive actions and genuine scope changes."
6. Both ports line: "`.omp/` and `.claude/` are two ports of one harness; a change to one lands with its twin in the same change — `tools/doctor.ts` checks parity."
No git-flow text, no plan lifecycle, no registry rules, no philosophy paragraphs — those are `rule://` reads.

### `CLAUDE.md` (≤ 30 lines) — Claude Code entry

Same six items, with `rule://map` → `docs/process/map.md`, plus a table of the Tier B files with a one-line "read when" each (Claude Code has no rulebook listing, so the entry file is the listing).

### `mosaic-core.md` (`alwaysApply: true`, ≤ 30 lines; Claude twin `.claude/rules/mosaic-core.md` without frontmatter)

Seed: `claude-code-harness/omp-harness/omp/agent/RULES.md`, rewritten:
- Never fabricate tool output, validation tokens, numbers, or user-attributed decisions; reference secrets as `$VAR`.
- Read a file before editing it; re-read when something may have changed it.
- Re-scan for constraints stated earlier before deleting, touching prod, or widening scope.
- Confirm before irreversible commands; a timeout or a clarifying question is not approval.
- Claims of done/verified/passing need attributable evidence for the exact state claimed — a command whose output you have this session, or a file you read. Reuse still-valid evidence; rerun only after the relevant state changed. A summary is not a reason to rerun.
- Say "I don't know"; report bad news directly.
- Batch independent tool calls: privately list what you need next, then request everything independent in one response.
- Edit surgically; do not rewrite a file to change a few lines.

## Tier B — rulebook (`docs/process/*.md`, frontmatter `description:` required; `globs:` optional)

Each file starts with a `description:` (one sentence, ≤ 140 chars — it is what the model sees in the listing) and a first body line `Read when: …`.

- `map.md` (≤ 60): roles table (orchestrator, plan-adversary, executor, reviewers, registry-scout, context-scout, human) in ≤ 12 lines; lifecycle diagram `draft → approved → executing → review → done / abandoned` with the transition table (who flips, where it lands) ≤ 10 lines; "light path is still a loop" in 3 lines; pointer list: which rule to read for what (plan-triage, git-flow, dispatch, review-loop, verification, records, registries, plan-home, stack, human-gates). Orchestrator posture in 3 lines (decide and move; don't reopen ruled challenges; escalate on contradiction, not discomfort).
- `plan-triage.md`: when a plan is NOT required (the six cases), the two-step test, the light path's self-serve early exits, data-only ingestion exemption. Compressed from baseline workflow §2 without losing a case.
- `git-flow.md`: branch per plan in every targeted repo, `task/NNNN-<slug>`, per-task commits `NNNN-T<k>: …`, never commit on `main` (hook `guard-main`), rebase-first then `--ff-only`, push, delete branch, `--no-ff` only with a recorded justification; no PRs.
- `dispatch.md`: executor contract (`files:`/`reads:`/`instructions:`/`acceptance:`), parallel only for disjoint `files:`, prompt = task block + Context + reads + acceptance + repo, STOP-and-report on ambiguity, orchestrator resolves.
- `review-loop.md`: inputs, verdict contract, REVISE re-dispatch of the same task, ≤ 2 cycles then human, harness-self-edit exception, both reviewers must APPROVE (omp), reviewers conflict → orchestrator rules and logs.
- `verification.md`: Verification section runnable by an LLM; "Unverified" section mandatory (what could not be proven and why — evidence, not a registry draft); evidence outlives the command (`--reporter`/json to a file; never a filter as the only sink); whole-repo builds/suites once per loop by the orchestrator; negative probes rebuild after revert; classify before you fix (one crashed run ≠ N regressions).
- `records.md` (the former meta.md, ≤ 80): doc classes table; record-routing table (Decision / Obligation G-x with `when:` / Pitfall / Open question / Product / no retained record); the routing test; the 11 rules compressed to one line each; the meta-diff reviewer checklist; "This file is read at the point of use: every skill step that mutates a governed file says `read rule://records` first."
- `registries.md`: never preload gaps/pitfalls/ledgers/plans; dispatch registry-scout with the scope; read flagged entries whole; context-scout for code areas; challengers read pitfalls whole.
- `plan-home.md`: R1–R8 verbatim-compressed (home, eager numbering by pushed ledger row, local ledgers, ledger truth, path relativity, branching, orchestration home, cross-repo links).
- `stack.md`: `uv run pytest <file…>` from the member repo root; targeted only inside the loop (see `targeted-tests`); member repos: `member-a` (Python, uv).
- `human-gates.md` (≤ 80): applies to the approval request, the leftovers digest, and the sign-off brief only. Rules: name the audience; first sentence states the claim in ordinary words (who did what, what follows); identifiers after, once, in parentheses; no session-invented labels or agent names; plain stays exactly as true as the code; each sentence checkable from the previous; the triad — what was produced, what the human should look at, what happens after approval; ≤ 40 lines. Jargon→plain table for: plan NNNN, G-x, P-x, D#, F-x, plan-adversary, REVISE/APPROVE, `files:`, ff-only land, registry-scout, light path, Unverified. Vocabulary the human used in this session is known — do not restate it.
- `writing-for-the-reader.md`: `../infer-dist.txt` adapted (the idea, the five defects, the correction that cuts both ways) — background, `description:` says "read when a human brief is being rewritten".
- `targeted-tests.md` (`alwaysApply: true`, `agents: [executor, "*-reviewer", reviewer]`): never a full or package-wide suite inside the loop; run exactly the tests covering the touched files (`uv run pytest <file…>` from the member root); unclear set → name it in the report, don't widen; whole-suite verification belongs to the orchestrator once at the end.
- `records-guard.md` (TTSR): `scope: "tool:edit(docs/gaps.md), tool:write(docs/gaps.md), tool:edit(docs/gaps/**), tool:write(docs/gaps/**), tool:edit(docs/gaps-archive.md), tool:write(docs/gaps-archive.md), tool:edit(**/docs/plans/README.md), tool:write(**/docs/plans/README.md), tool:edit(docs/architecture/pitfalls.md), tool:write(docs/architecture/pitfalls.md), tool:edit(docs/architecture/README.md), tool:edit(.omp/**), tool:write(.omp/**), tool:edit(.claude/**), tool:write(.claude/**), tool:edit(docs/process/**), tool:write(docs/process/**)"`, `condition: ".*"`, `interruptMode: tool-only`, `description:` (so it is also readable). Body ≤ 12 lines: "You are editing a governed record. Before continuing: read `rule://records` if you have not this session; match the row/entry schema exactly; never compress a sole-record row; a G-entry needs `when:`; provenance goes in the commit message; the twin port changes in the same change." Claude twin: `.claude/rules/records-guard.md` with `paths:` = the same globs (fires on read, which precedes edit) and `.claude/hooks/records-guard.sh` PreToolUse (matcher `Edit|Write`) returning `additionalContext` with the same body when the path matches.

## Skills (≤ 120 lines each; procedure only; every step that depends on a rule says "read `rule://x`")

- `plan/SKILL.md` — Phase 0 triage ("read `rule://plan-triage`; if lighter path, say so and stop"); Phase 1 research/draft (targets & home → `rule://plan-home`; reserve number; create from `docs/plans/TEMPLATE.md`; context-scout / registry-scout; task breakdown → `rule://dispatch`; review checklist; Verification + Unverified → `rule://verification`); Phase 2 adversarial rounds (spawn plan-adversary; rule ACCEPT/REJECT/INVESTIGATE; log; round report — informational unless human-owned; end on convergence / insufficient delta / runaway gate 5; leftovers digest → "read `rule://human-gates`"); Phase 3 ledger + present ("read `rule://human-gates`"; only a human flips draft→approved).
- `execute/SKILL.md` — preconditions; branch (`rule://git-flow`, `rule://plan-home`); dispatch waves (`rule://dispatch`); review (`rule://review-loop`); verify (`rule://verification`); **close-out triage** (new step, before asking for sign-off): "read `rule://records`", gather acceptance criteria + verification outputs + unresolved findings + Unverified; for each leftover: defect check first (unmet acceptance or a bug in code, touched or not → REVISE loop if in scope, else propose a plan/light path) → then the routing table → `when:` for obligations → cannot-classify surfaced; write dispositions into the Execution log; **sign-off brief** ("read `rule://human-gates`"); on sign-off: status done, archive, registry sync (dispositions applied, `closes G-x` → archive), lint, land, ledger sync; mid-flight invalidation.
- `gap-evaluate/SKILL.md` — baseline's, with "read `rule://records`" first and a `STALE-TRIGGER` verdict (the `when:` names nothing that exists).

## Agents (≤ 60 lines; family-neutral; each ends with the precedence contract's role line)

- `executor.md`: baseline hard rules 1–5 (rule 6 becomes the `targeted-tests` rule, not restated), final report contract, plus: "If the instructions contradict the repo or leave a decision open, STOP and report quoting the instruction and the observed state; routine choices with no observable difference are yours." `model: "@templated"`, `read-summarize: false`.
- `plan-adversary.md`: baseline charter compressed; attack surface adds "Unverified items that are really defects the plan should fix now"; `model: "@critic"`.
- `claude-reviewer.md` / `gpt-reviewer.md`: baseline compressed, checklist item added: "a close-out with missing or unsupported dispositions is REVISE"; targeted-tests not restated; `model: "@review-claude"` / `"@review-gpt"`.
- `registry-scout.md`, `context-scout.md`: baseline compressed; `model: "@smol"`.
- `.claude/agents/`: `executor`, `plan-adversary`, `reviewer` (single), `registry-scout`, `context-scout` with the `targeted-tests` body inlined at the end (Claude has no per-agent rules).

## Tools

- `tools/doctor.ts` (bun CLI, exit 0/1/2): budgets; unresolved `rule://`, `skill://`, and relative links; skills that edit governed paths without a preceding "read `rule://records`" line; duplicate canonical phrases; port parity for each role pair (`.omp/agents/X.md` vs `.claude/agents/X.md`: bodies equal after stripping frontmatter and the inlined `targeted-tests` block; reviewer ↔ claude-reviewer+gpt-reviewer compared on the shared body); `.omp/rules/*.md` symlinks resolve; `.claude/rules/mosaic-core.md` equals `docs/process/mosaic-core.md` body. Prints one line per finding; CANNOT-EVALUATE when a file it must read is missing.
- `.omp/hooks/post/lint-ledgers.ts`: baseline's + G-entry `when:` presence (a `Trigger:`/`when:` line naming a path, a glob, `plan NNNN`, or an event word) → FAIL otherwise.

## Model-guide text placement (deferred decision: family-specific text)

Only family-neutral text is written now. Family-specific blocks (Fable "Delivering work", Opus unattended-run, Astra transparency prompt) are collected in `docs/process/model-notes.md` (rulebook, `description: read when configuring a session for a specific model family`) and not injected anywhere until the human decides.

## Acceptance for the draft

`bun tools/doctor.ts` exits 0 on the fixture; `bun .omp/hooks/post/lint-ledgers.ts` exits 0 on every registry; `bash setup.sh` works from a copy; the six scenarios run against `--harness mosaic` and produce packets; S3 shows `records-guard` in `metrics.ttsrTriggered` on at least one model.
