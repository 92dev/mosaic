# Loop-test rig

Runs one harness variant against one scenario on one model with `omp -p`, captures the JSON event
stream, and produces an evidence packet that deterministic checks and human/model evaluators score.
Numbers on the scoreboard come from the runner, never typed by hand.

## Run

```sh
bun tests/loops/run.ts --scenario S4-cold-start --model claude-opus-5-5 --thinking medium [--harness baseline] [--tag note]
bun tests/loops/scoreboard.ts                       # rewrite SCOREBOARD.md from runs/**
bun tests/loops/score.ts runs/<...>/ --evaluator claude --verdict better|worse|same --note "..."
```

`--model` accepts a concrete selector or a `modelRoles` alias (`@CLAUDE-TEST`); the runner resolves
aliases with `omp config get modelRoles`. A run copies `fixtures/<harness>/` to a temp dir, loads
the scenario's optional `env`, runs `fixtures/<harness>/setup.sh` (git init, bare origins, branches),
then the scenario's optional `setup.sh`, then executes:

```
omp -p --cwd <tmp> --no-session --mode json --config tests/loops/overlay.yml \
    --model <selector> --thinking <level> [--append-system-prompt <agent body>] "<prompt.md>"
```

## Layout

```
tests/loops/
  README.md            this file (the contract)
  overlay.yml          config overlay: no user-level discovery, no advisor, no memory
  run.ts               runner (bun)
  metrics.ts           events.jsonl -> metrics.json (importable + CLI)
  scoreboard.ts        runs/** -> SCOREBOARD.md
  score.ts             record an evaluator verdict into a run's verdict.json
  fixtures/baseline/   checked-in generated harness-2026-09-02 fixture; never hand-edit
  fixtures/baseline-kit/          frozen baseline ports, workflow/meta rules, and plan template
  fixtures/baseline.manifest.json baseline identity, members, and remotes
  fixtures/baseline-overlay/      baseline fake project, populated registries, and local setup
  fixtures/mosaic/     checked-in generated mosaic fixture; never hand-edit
  fixtures/mosaic.manifest.json   mosaic identity, members, remotes, and local tracking mode
  fixtures/mosaic-overlay/        mosaic fake project and whole-file registry/example replacements
  build-fixture.ts     install each harness + manifest + overlay; check; replace generated fixture
  kit-parity.ts        independent rebuild + byte and symlink-target drift guard for both harnesses
  scenarios/<ID>/      prompt.md, rubric.md, check.ts; optional setup.sh, env, agent
  runs/<ID>/<harness>/<model>-<thinking>/<timestamp>/   evidence packets (gitignored)
  SCOREBOARD.md
```

Scenario `env` files contain literal `KEY=VALUE` lines (identifier keys, no shell expansion or
quote removal); blank lines and `#` comments are ignored. Values override the inherited environment
for **both** setups, the model process, and checker commands. Use this when fixture setup must
choose a scenario-specific seed: S9 sets `MOSAIC_S9=1` before the fixture creates its review branch.

`--dry-run` copies the fixture and runs both local setups, then prints the model command without
starting `omp -p`. The printed `--cwd` points to the prepared copy, so its branches can be inspected.

## Generated fixtures

Both `fixtures/baseline/` and `fixtures/mosaic/` are checked-in generated output. They remain the
runner's fixture paths, but neither is an authoring location.

| Harness | Harness source | Identity, members, remotes | Fake project and seeded records |
|---|---|---|---|
| `mosaic` | [`../../kit/`](../../kit/README.md) — the installable product | `fixtures/mosaic.manifest.json` | `fixtures/mosaic-overlay/` |
| `baseline` | `fixtures/baseline-kit/` — frozen harness-2026-09-02, not a product | `fixtures/baseline.manifest.json` | `fixtures/baseline-overlay/` |

```sh
bun tests/loops/build-fixture.ts                   # both harnesses
bun tests/loops/build-fixture.ts --harness baseline # or --harness mosaic
bun tests/loops/kit-parity.ts                      # both; also accepts --harness baseline|mosaic
```

The same installer handles both: `bun kit/install.ts --kit <dir> --manifest <json> --overlay <dir>
--target <dir>`. `--kit` defaults to `kit/` beside the installer, independently of the working
directory. It copies the install roots present in that source (`AGENTS.md`, `CLAUDE.md`, `.omp/`,
`.claude/`, `docs/`, `tools/`); installer code and kit-maintainer documentation are not installed.
Migration references live in the checkout's [`../../install/`](../../install/README.md), beside `kit/`; the checkout-only `/mosaic-install` skill reads them there. They are not installed or exported into fixtures.

The mosaic fixture explicitly selects `tracking: { "mode": "local" }`, retaining the replay CLI,
seed inventory, and writer-conflict behavior used by S8, S10, S12, and S15b. The installer's default
is `none`; S21 exercises it through a fresh installation rather than a mode-flipped fixture copy.

The builder installs with `--force` into staging and validates before replacing a fixture
(including removing obsolete generated files). Mosaic runs `kit/tools/doctor.ts`; the baseline
predates that doctor and runs its own `.omp/hooks/post/lint-ledgers.ts` against active plans,
ledgers, gaps/archive, pitfalls, and the decision map. A failed check leaves the existing fixture
untouched. The builder does not run `setup.sh`, initialize repositories, or invoke a model.
`run.ts` still copies the fixture with `verbatimSymlinks`, preserving mosaic's
`.omp/rules/*.md -> ../../docs/process/*.md`, and runs fixture/scenario setup only in the
disposable work copy.

**Overlay files replace kit files of the same path in full; they are not fragments or merges.**
Mosaic's overlay includes populated registries, the documentation index, the plan template's
export-doc example, and `docs/process/plan-home.md`'s concrete member-plan example. Preserve
their fixture content when changing a kit file they override. Its member also carries the
conditional plan-0004 seed used by S9.

Baseline's kit owns both ports (agents, skills, settings, and hooks), `AGENTS.md`, `CLAUDE.md`,
`docs/workflow.md`, `docs/meta.md`, and `docs/plans/TEMPLATE.md`. Its overlay owns `member-a/`,
`setup.sh`, `.gitignore`, the documentation index, populated gaps and ledgers, seeded plans,
and all product/architecture documents (including the fixture's selected pitfalls catalog).
Mixed guidance-and-record files stay whole in the overlay; no row-level merging is introduced.

The baseline split preserves the frozen fixture byte-for-byte, including historical examples.
Its manifest renders the existing `{{PROJECT_NAME}}`, `{{PROJECT_SUMMARY}}`, `{{LINK_REMOTE}}`,
`{{MEMBERS}}` (plan template), and `{{MEMBER_REMOTE:member-a}}` placeholders. No new renderer or
baseline-specific placeholder semantics were added. The following project text remains literal:

- `CLAUDE.md`: the `member-a` / Python CSV diagram, `member-a/` / `member_a` member-table
  description, and the `docs/architecture/export.md` contract example.
- `docs/workflow.md`: the Python member-tree row, `member-a/...` path-frame example,
  member-homed plan `0002-empty-export-handling`, and the export-contract link.
- Both ports' `palladio-plan/SKILL.md`: the `member-a` frontmatter example; both
  `palladio-execute/SKILL.md` files: the concrete plan-0002/0003 argument examples.
- `uv run pytest <file…>` in `docs/workflow.md`, both execute skills, both executors,
  `.claude/agents/reviewer.md`, and `.omp/agents/{claude-reviewer,gpt-reviewer}.md`.
- `docs/plans/TEMPLATE.md`: the export-doc link and inherited ACC-credentials verification example.

The shared renderer has no member-row/name rendering for these historical file paths, no stack
command token, and no project-document or credential-example token. Retaining their exact text
avoids changing the frozen harness or expanding the product's template contract just for history.

`kit-parity.ts` rebuilds each selected harness into a temporary directory, runs `diff -r`
against its checked-in fixture, compares relative symlink targets separately, and exits 1 on
drift. Run it as the guard against hand-edited or stale output. Product harness changes belong
in `kit/` (both ports together), not the frozen baseline; fixture-only changes belong in the
corresponding manifest or overlay. Regenerate the selected fixture after changing a source.
The historical draft/experiment contracts remain under `docs/ideation/`.

## Evidence packet (one directory per run)

| File | Written by | Content |
|---|---|---|
| `meta.json` | run.ts | `{scenario, harness, model, thinking, agent?, startedAt, wallSeconds, exitCode, tag?}` |
| `events.jsonl` | omp | raw event stream |
| `stderr.log` | omp | stderr |
| `transcript.md` | run.ts | user prompt; per turn: thinking (first 300 chars), tool calls (`name` + one-line args), tool results (first 20 lines), assistant text in full |
| `diff.patch` | run.ts | `git diff` of the work dir vs the pristine fixture (all repos), plus untracked files |
| `metrics.json` | metrics.ts | see schema below |
| `checks.json` | scenario `check.ts` | `CheckResult[]` |
| `verdict.json` | score.ts | `{evaluators: [{name, verdict, note, at}]}` |

### `Metrics`

```ts
type Metrics = {
  requests: number;                 // assistant message_end count
  turns: number;                    // turn_end count
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number; total: number };
  cost: number;                     // sum of usage.cost.total
  firstRequestPromptTokens: number; // input + cacheRead + cacheWrite of the first assistant request
  toolCalls: Record<string, number>;
  reads: string[];                  // read paths in call order (includes rule://, skill://)
  edits: string[];                  // edit/write paths in call order
  bash: string[];                   // bash commands in call order
  ttsrTriggered: string[];          // rule names from ttsr_triggered events
  finalText: string;                // last assistant text block
  assistantTexts: string[];         // all assistant text blocks; a brief may precede the final closing message
  wallSeconds: number;
};
```

### `CheckResult`

```ts
type CheckResult = { id: string; outcome: "PASS" | "FAIL" | "CANNOT-EVALUATE"; evidence: string };
```

A check that cannot evaluate its condition returns `CANNOT-EVALUATE`, never `PASS`. run.ts exit code:
0 all PASS, 1 any FAIL, 2 any CANNOT-EVALUATE and no FAIL.

`check.ts` default-exports `async (ctx) => CheckResult[]` where
`ctx = { runDir, workDir, fixtureDir, events, metrics, exec(cmd: string, cwd?: string) => Promise<{code, stdout, stderr}> }`.

## Fixture `baseline` — pinned identifiers (scenarios depend on these)

Instantiated from the 2026-09-02 baseline harness (a pre-mosaic private harness, not shipped in this repo; its files survive as `fixtures/baseline-kit/`). Both ports
(`.claude/`, `.omp/`) present and mirrored; the loop uses the `.omp/` port.

- Project: `Fixture` — "a tiny link repo used to loop-test the harness". Member repo: `member-a/`
  (Python package `member_a/`, pytest tests, `README.md` containing the typo `teh`).
- Stack command rebound: `pnpm --filter <pkg> exec vitest run <file…>` → `uv run pytest <file…>` (cwd = the member repo; `member-a/pyproject.toml` declares pytest as a dev dependency, `uv.lock` committed) in every site (executor, reviewers, execute skill, workflow §6). Skill names kept (`palladio-*`). Dropped: `monday-triage`, `palladio-deploy`, `ticket-investigator`, `docs/triage/`, `docs/deploy/`. `gpt-reviewer.md` made a real GPT reviewer (baseline shipped a byte copy of `claude-reviewer.md`).
- `member_a/api.py`: `export_rows(rows, fmt="csv")`; **bug**: raises `IndexError` on `rows == []` (the "500 on empty body"). `tests/test_api.py`: one passing test; `test_export_empty` marked `@pytest.mark.skip(reason="tracked in plan 0002 verification gaps")`.
- Architecture: `docs/architecture/README.md` + `docs/architecture/export.md` with `D1` (CSV is the default export format) and `D2` (exports never raise on empty input; return an empty document). Pitfalls: keep P-23/P-24/P-31/P-34/P-38 from the kit.
- Gaps (`docs/gaps.md`): `G-1` trigger "when `member_a/api.py` gains a second output format" (intersects plan 0003), `G-2` trigger "when plan 0002 lands" — re-verify the skipped empty-input test (deliberately the kind of entry that is really a defect), `G-3` trigger "when a second member repo is added". Archive: `G-0` closed by 0001.
- Plans: `0001` done, archived at `docs/plans/archived/0001-scaffold-member-a.md`. `0002` **member-homed** at `member-a/docs/plans/0002-empty-export-handling.md`, `status: executing`, branch `task/0002-empty-export-handling` in `member-a`, all tasks executed, both reviewers APPROVE with one `[note]` ("`export_rows` docstring still says 'always returns at least the header row'"), Verification run with outputs pasted, and **Verification gaps** listing exactly three items: (a) DEFECT — "`export_rows([])` still raises IndexError; `test_export_empty` left skipped"; (b) OBLIGATION — "when the auth module (plan 0004, not yet drafted) moves to OAuth, re-verify export authorization"; (c) QUESTION — "product has not decided whether Parquet is a required second format". `0003` draft, `repo: member-a, link-repo` (cross-repo ⇒ link-homed at `docs/plans/0003-export-format-option.md`; tasks: member-a JSON export + link-repo D3 amendment), Planning log with two adversary rounds (C1 accepted, C2 rejected citing D1, C3 deferred MINOR citing G-1), no approval recorded.
- Git: `setup.sh` initialises the link repo and `member-a` as separate repos, each with a bare `origin` under the temp dir, `main` up to date, and the `task/0002-empty-export-handling` branch in `member-a` carrying the plan's commits. `bun .omp/hooks/post/lint-ledgers.ts <file>` passes on every registry in the pristine fixture.

### Fixture-only approval brief example

This example was removed from the installed human-gates rule so a project's approval brief does not inherit the export fixture's scope or prerequisites.

For the product owner: the draft proposes a change that lets callers request JSON while existing export calls still return CSV (the JSON-export plan).
The draft specifies JSON output, deliberate rejection of unsupported formats, and the corresponding contract update.
Please review the accepted formats and confirm that keeping CSV as the default matches existing callers' needs.
The earlier empty-input fix must land first; the proposed checks cover empty exports and unsupported names too.
Parquet remains a product question outside this change, so approving the draft makes no promise to support it.
After approval, I will implement the tasks, obtain independent review, run the listed checks, and return for sign-off before merging.

## Scenarios

| ID | Prompt (summary) | Deterministic checks | Rubric (evaluators) |
|---|---|---|---|
| `S1-closeout-triage` | Human signed off plan 0002; run the execute skill close-out (step 6) and land it | (a) not filed as a G-entry; (b) filed with a trigger; (c) not filed as a G-entry; `G-2` archived or updated with evidence; lint PASS on gaps/ledgers; `docs/meta.md` read before any registry edit; branch landed ff-only | sign-off brief plain-language quality; every disposition evidenced |
| `S2-approval-brief` | Present plan 0003 for approval (plan skill Phase 3) | no file edits; message exists | human-gates rubric: claim first in ordinary words; each id restated once; what happens after approval; no session-invented labels; ≤ 40 lines |
| `S3-governed-edit` | Add a new gap (given text) and pitfall P-39 (given text) | `docs/meta.md` (or its rule) read before the first registry edit; lint PASS; ids unique; entry has trigger; pitfall terse (≤ 4 lines) | routing correctness (is the given gap text actually a gap?) |
| `S4-cold-start` | New session: fix `teh`→`the` in `member-a/README.md` following the workflow | typo fixed; no plan doc created; no ledger row; `firstRequestPromptTokens`, `tokens.total`, `reads` recorded | took the light path without over-ceremony; did not read registries whole |
| `S5a-executor-routine` | (agent: executor) task block with routine ambiguity (two equivalent import orderings) | files changed ⊆ `files:`; task completed; no STOP | proceeded without asking |
| `S5b-executor-decision` | (agent: executor) task block whose instructions contradict repo state (function name differs) | no edits outside `files:`; report names the contradiction | stopped and quoted the exact clause; did not guess |
| `S6-plan-adversary` | Plan optional `limit` through adversary rounds; stop at presentation | new plan sections and Unverified; logged rulings; reservation row pushed to origin/main; no new gaps; task dispatch; mosaic tracker intent | conservative semantics; real challenges; collision ENG-201 named; no approval |
| `S7-intake-digest` | Investigate the intake queue; stop at human digest | three parsed verdict comments; product hold owner/resume; plan 0003 cited; known risk/refute; only outbox changes; no markdown ledger; digest | evidence, cross-family refute, correct routing, no implementation or closure |
| `S8-tracker-intent` | Check collision, write intent, reserve number; stop before tasks | API areas in intent; ENG-201 owner/state/staleness; tracker-scout dispatch; paired foreign-writer refusal if attempted | complete discovery, visible stale collision, writer discipline, bounded planning |
| `S9-closure-librarian` | Close out and land pre-approved plan 0004 | architecture/product/roadmap aligned; no new gaps; verbatim learnings with dispositions; member landing and published master-ledger sync; librarian dispatch | read-only alignment advice, reviewed doc diff, honest coverage, human brief |
| `S20-docs-plan` | Execute approved link-homed documentation plan 0004 through sign-off, without landing | one cross-family reviewer per docs task wave; paired closure review; attributed REVISE findings via ledger lint; valid API source ranges; shared gates after parallel join (sequential is CANNOT-EVALUATE); no close-out executor; ≤ 40-line brief | source-backed statements, clean source-range trap handling, phase ownership, honest evidence, no landing |
| `S21-tracking-none` | Same planning prompt as S8, including the tracker request, on a fresh `none` install | none runtime with no local tracker installation; no tracker CLI call or `docs/tracker` access; collision brief names ledger plus branches; one new scoped reservation published to `origin/main` | respects installed mode, discovers real overlap without a tracker, explains no intent was created, stops before tasks |

S7–S9 report `CANNOT-EVALUATE: no intake/tracker/librarian in baseline` for every check on the
baseline harness. S6 runs on both; only its tracker check is not evaluable on baseline. S8 seeds
ENG-201 with foreign writer generation `w-dana#7`; no attempted foreign event means its refusal
check is CANNOT-EVALUATE, not a pass. S9's branch assertion requires the fixture's `MOSAIC_S9` seed.

S20's scenario setup creates `docs/0004-docs-refresh` from `main` with two disjoint `class: docs`
tasks. T1 deliberately requests source lines 5–40 from an 11-line exporter: narrow the range
upstream or STOP cleanly, never retain a nonexistent citation. S20 is mosaic-only; its checker
uses the installed `@templated` role family, task dispatch/completion events, and active documents.

S21 is mosaic-only. Its setup invokes `kit/install.ts` with a temporary manifest selecting
`tracking: { "mode": "none" }` and an empty target, then replaces only the runner's disposable
worktree and origins and initializes fresh repositories. The project/domain overlay is preserved
except for its local-only tracker data, documentation index, and plan template; the latter two
come from the kit's none-mode rendering. Runtime mode, absent tracker paths, and absent template
tracker frontmatter are asserted before setup succeeds. Runner `--role` selectors are preserved.
The prompt is byte-identical to S8: the installed mode, not a rewritten prompt, must control behavior.
Its checker rejects tracker access through commands, file tools, eval, or nested parallel tool calls.
Use the ordinary dry-run path to exercise setup without invoking a model:

```sh
bun tests/loops/run.ts --scenario S21-tracking-none --harness mosaic --model openai-codex/gpt-6-sol --thinking medium --dry-run
```

Scenario `agent` file (e.g. containing `executor`) makes run.ts append `.omp/agents/<name>.md` body (frontmatter stripped) as the system prompt.

## Evaluation protocol

1. run.ts → deterministic checks first (`checks.json`).
2. Evaluators read `transcript.md`, `diff.patch`, `checks.json` against `rubric.md`: the orchestrator session, one GPT `task` critic, optionally `judge_batch` over the rubric (probabilities, threshold stated in the note). Each records a verdict with `score.ts`. Disagreement → human.
3. `scoreboard.ts` rewrites `SCOREBOARD.md`: one row per run with metrics, check summary (`P/F/C`), and verdicts.
