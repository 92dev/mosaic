# Round-2 build contract — intake, tracker plane, librarian, scenarios S6–S9

Target: `tests/loops/fixtures/mosaic/` (both ports) and `tests/loops/scenarios/`. Decisions from `2026-09-25-ideation-v2.md` §7 apply: NNNN ids + `tracker:` block; replay adapter only, no live tracker writes; intake stops at a human digest; read-only librarian; learnings inside the sign-off brief; executor opus-5-5 medium. Round-1 rules apply (single home, budgets, `read rule://x` steps, doctor parity, three-outcome checks).

## Slice A — intake

Files: `docs/process/intake.md` (+ symlink `.omp/rules/intake.md`), `.omp/skills/intake/SKILL.md` + `.claude/skills/intake/SKILL.md`, `.omp/agents/ticket-investigator.md` + `.claude/agents/ticket-investigator.md`, `docs/index.md` row.

`rule://intake` (≤ 40 lines, `description:`): the invariant from v2.1 §3 verbatim in substance — read-only investigation first; verdict fields; observable risk criteria (LOW/MEDIUM/HIGH/UNKNOWN); final LOW needs a completed cross-family REFUTE of the same snapshot; risk re-gated on the actual diff before landing; dispositions `inline|light|plan|recommend-close|held`; `held` carries owner, blocking question, resume condition; one profile; invalidation by fingerprint + per-repo revisions; harness never closes a request; **v1: every disposition stops at the human digest — no unattended landing.**

Verdict record (one per item, written through the tracker adapter as a comment, and echoed in the digest):
```
INTAKE VERDICT <key>
reading: <one sentence>
implemented: yes|partial|no — <file:line evidence>
touches: <paths or UNKNOWN>
risk: LOW|MEDIUM|HIGH|UNKNOWN — <reason>
refute: <family> — <upheld|downgraded: reason> | not required
registry: <G-x/P-x/plan ids intersecting, or none>
retest: <human gesture>
questions: <blocking only, or none>
disposition: inline|light|plan|recommend-close|held — <reason>
fingerprint: <sha256 of title+body+comment ids/hashes+attachments>@<repo>:<rev>
```

`skill://intake` (≤ 80 lines): 1 read rules (`intake`, `plan-triage`, `records`, `tracker`); 2 harvest via `bun tools/tracker.ts list --state triage|todo --label intake` (replay mode) and `get <key>` (body + comments + attachments), record fingerprints; 3 skip only items whose fingerprint and code revisions are unchanged since their last verdict (self-authored receipts excluded); 4 dispatch `ticket-investigator` ASSESS per item in parallel (`@balanced`), REFUTE via a second dispatch on the other family for `implemented≠no` or `LOW` (the skill names the family it used); 5 settle verdict + `registry-scout` sweep; 6 write verdict comment through the adapter (`comment <key> --file <verdict>`), add label per disposition; 7 human digest (`read rule://human-gates`): TL;DR, per-item disposition and evidence, blocking questions only; 8 stop — routing into `plan-triage` happens when the human answers.

`ticket-investigator` (≤ 60 lines, `model: "@balanced"`, `tools: read, grep, glob, bash` read-only, `read-summarize: false`): modes ASSESS / REFUTE; REFUTE receives the ASSESS verbatim and may only downgrade; unknown touches ⇒ not LOW; more than one defensible reading of a *small reversible detail* is decided (pick the smallest), not PRODUCT-DECISION; PRODUCT-DECISION only when the readings differ in user-visible behavior or product commitment. Reproduction protocols are project files under `docs/intake/` read on demand (none shipped). Ends with the role line: investigators never edit.

## Slice B — tracker plane

Files: `docs/process/tracker.md` (+ symlink), `tools/tracker.ts`, `.omp/agents/tracker-scout.md` + `.claude/agents/tracker-scout.md`, `fixtures` under the mosaic fixture: `docs/tracker/items.json` (seed inventory, replay mode), plan TEMPLATE frontmatter gains `tracker:` and `areas:`; `/plan` skill Phase 1 gains the intent write and the collision check; `/execute` gains the `done` event after the landing receipt; `docs/index.md` rows.

`rule://tracker` (≤ 60 lines): authority table (v2.1 §2 abridged), adapter capability table for Linear (native / managed / unsupported), the managed block format, write discipline (single writer + generation, human fields never written, ids retained, read-back before retry, no exactly-once), write points, "tracker state is never proof of landing", privacy (opaque writer token, no hostnames/paths), replay mode is the only mode in v1.

Managed block (inside the item description between markers, human text outside preserved):
```
<!-- mosaic:begin -->
plan: docs/plans/0006-export-limit.md   (or none — intent before the doc exists)
repos: member-a
areas: member-a/member_a/api.py, contract:export_rows
branch: member-a:task/0006-export-limit
writer: w-3f9a2c#4
last-event: executing 2026-09-25T10:12Z
parked: none
<!-- mosaic:end -->
```

`tools/tracker.ts` (bun, no deps). Global flags: `--replay <dir>` (default `docs/tracker`, relative to cwd) — reads `items.json` and appends every write as a JSON line to `outbox.jsonl` in the same dir, applying it to an in-memory copy so later reads see it; `--provider linear` prints `unsupported in v1` and exits 2. Subcommands:
- `list [--state s,...] [--label l] [--team t] [--all]` → JSON array of items `{key,id,title,state,assignee,labels,url,updatedAt,managed:{...}|null}`; `--all` includes terminal states. Always complete (no window); prints `{"complete":true}` trailer or exits 2 with `INCOMPLETE/UNAVAILABLE`.
- `get <key>` → full item + comments.
- `intersect --areas <globs,contracts> [--repos r]` → items whose managed `areas` intersect (path glob overlap or same contract name), each with `stale: <days since last-event>`; deterministic, no model.
- `intent --title --repos --areas [--plan] --writer <token>` → creates item in state `planning`, generation 1; prints key.
- `event <key> <approved|executing|review|done|abandoned|parked|resumed> --writer <token> [--note <text>] [--receipt <json>]` → checks writer generation (foreign generation ⇒ exit 1 `WRITER-CONFLICT`), updates state and managed block; `done` requires `--receipt` with `{repo, ref, commit, reachable:true}` per target repo, else exit 1.
- `comment <key> --file <path> --writer <token>` → appends a comment with a stable event id (sha256 of key+body); duplicate event id ⇒ no-op, prints existing id.
- `receipt <key>` → prints the outbox entries for the key.
Exit codes: 0 ok, 1 refused (conflict/precondition), 2 unavailable/unsupported.

Seed `docs/tracker/items.json` (replay inventory): ENG-201 "Add a `limit` parameter to export_rows" owner `dana`, state `executing`, areas `member-a/member_a/api.py, contract:export_rows`, writer `w-dana#2`, last-event 9 days ago (stale); ENG-202 "Backoffice export button" owner `lior`, state `planning`, areas `member-a/member_a/cli.py`; ENG-210 (intake queue, state `triage`, label `intake`) "CSV export crashes on empty list" with two comments; ENG-211 (triage) "export_rows should accept fmt='json'"; ENG-212 (triage) "Do we need Parquet exports?" from product; ENG-190 state `done`. Comments carry ids and bodies.

`tracker-scout` (`@smol`, `tools: read, bash` — bash only for `bun tools/tracker.ts list|intersect|get`): input = scope (paths/areas/repos); runs `intersect`; reads the intersecting items' managed blocks and last comment; returns lines `key — owner — state — areas — last event (stale Nd) — url` or `COMPLETE, NO MATCH — searched: <areas>` or `INCOMPLETE/UNAVAILABLE — <reason>`; never judges.

`/plan` Phase 1 additions: after targets/home and before the number reservation: "Read `rule://tracker`; dispatch `tracker-scout` with the plan's areas; write the intent item (`tools/tracker.ts intent …`) and record its key in the plan frontmatter `tracker:`; any intersecting item is named in the approval brief with owner, state and staleness." `/execute` step 11/12: after each repo's landing receipt, `tools/tracker.ts event <key> done --receipt …`.

## Slice C — librarian and learnings

Files: `tools/docimpact.ts`, `.omp/agents/librarian.md` + `.claude/agents/librarian.md`, `/execute` skill closure step (both ports), `docs/process/human-gates.md` (learnings section), `docs/process/records.md` (one line: closure alignment is `skill://execute` step N), fixture seeds: `docs/architecture/export.md` frontmatter `affinity: member-a` + `contracts: [export_rows]`; new `docs/product/F-1-export-flow.md` (F-doc naming `export_rows`, `member-a`, status `live`) listed in `docs/product/README.md`; `docs/architecture/roadmap.md` item naming plan 0004; new plan `member-a/docs/plans/0004-empty-export-fix.md` in `status: review` on branch `task/0004-empty-export-fix` (setup.sh creates it): T1 changed `export_rows([])` to return `""`, unskipped the test, docstring updated; Verification run pasted; both reviewers APPROVE; Unverified: none; Execution log deviations: "Interpretation: empty CSV means empty string, not header-only (D2)"; "Tradeoff: kept csv module instead of manual join". Ledger rows for 0004 (member + master).

`tools/docimpact.ts <plan-path> [--root dir]` → JSON `{candidates:[{doc, class: cites-plan|affinity|decision|product-contract|roadmap|consumer-search, why}], cannotEvaluate:[{class, reason}]}`: cites-plan = grep for the plan id; affinity = architecture docs whose frontmatter `affinity` is a touched member repo or `cross-area`; decision = D# cited in the plan; product-contract = product docs whose frontmatter `contracts` intersect the plan's `areas` contract names; roadmap = roadmap lines naming the plan; consumer-search = files under docs/ mentioning changed public symbols (from the plan's `areas` contracts). Missing frontmatter for a class ⇒ cannotEvaluate entry. Exit 0 always unless the plan path is unreadable (2).

`librarian` (`@balanced`, `tools: read, grep, glob`, read-only, ≤ 60 lines): input = candidate JSON + the plan's Context/Scope + `git diff` of changed public contracts; output contract:
```
DOC ALIGNMENT <plan id>
- <doc> — amend — "<statement now false>" → "<replacement>" — evidence: <diff hunk/file:line>
- <doc> — append — D<next> <one-line ruling> — evidence
- <doc> — repoint — <old> → <new>
- <doc> — no change — <negative-coverage evidence>
CANNOT-EVALUATE: <class — reason> (or none)
```
Never edits; archives are never amended (append a superseding D# instead).

`/execute` closure step (after dispositions, before sign-off brief): "Read `rule://records`. Run `bun tools/docimpact.ts <plan>`; dispatch `librarian` with its output; apply `amend/append/repoint` (orchestrator), log `no change` lines; send the doc diff through the same review wave as the dispositions." Sign-off brief gains a **Learnings** section: every Deviation/Interpretation/Tradeoff line from the Execution log verbatim, each with `keep as <pitfall|rule proposal|none> — reason`; the human approves by exception; zero candidates ⇒ section omitted. `human-gates.md` documents the section (≤ 6 added lines).

## Slice D — scenarios S6–S9 (`tests/loops/scenarios/`)

All follow the README contract (prompt.md, rubric.md ≤ 6 questions, check.ts three-outcome; optional setup.sh, agent file). Checks must work for `--harness mosaic`; for `baseline` they return CANNOT-EVALUATE with the reason "no intake/tracker/librarian in baseline" except S6, which runs on both.

- S6 `/plan` with adversary rounds: prompt "Plan adding an optional `limit: int | None` parameter to `export_rows` (return at most `limit` rows). Run the plan skill end to end; when a human ruling is needed choose the conservative option and record it; stop at presentation (do not approve)." Checks: a new plan file `docs/plans/000N-*.md` or `member-a/docs/plans/…` exists with all required sections and `### Unverified`; Planning log has ≥ 1 adversary round with rulings; master ledger has the reserved row (and origin received the reserve push: `git log origin/main` in the link repo contains a reserve commit); no new G-entries in `docs/gaps.md`; `metrics` shows ≥ 1 `task` dispatch; mosaic only: `tracker:` present in frontmatter and `docs/tracker/outbox.jsonl` has an `intent` line, brief names ENG-201 as a collision (rubric).
- S7 intake: prompt "Run the intake skill over the tracker's intake queue. Stop at the digest." Checks: `outbox.jsonl` has one `comment` per triage item (ENG-210/211/212) whose body parses as an INTAKE VERDICT with all fields; ENG-212 disposition `held` with owner + resume condition; ENG-211 disposition `plan` or `recommend-close` citing plan 0003; ENG-210 risk ≠ UNKNOWN and `refute:` is not `not required` when risk is LOW; no code changes (diff.patch empty except `docs/tracker/outbox.jsonl`); no new markdown ledger under `docs/` (compare file list vs fixture); digest present (assistantTexts).
- S8 tracker intent + collision: prompt = S6's first phase only: "Start planning the `limit` parameter change: determine targets, check the tracker for collisions, write the intent item, reserve the number, and stop before drafting tasks. Report the collision check result." Checks: outbox has an `intent` entry with areas containing `member_a/api.py`; the report/brief names ENG-201 with owner `dana`, state `executing`, staleness ≥ 9 days; second part via setup.sh: seed `items.json` so ENG-201's writer generation is foreign to the run's token — check that a `tools/tracker.ts event ENG-201 executing --writer <other>` attempt (if the model tries) is refused — CANNOT-EVALUATE if never attempted; `tracker-scout` dispatched (task count ≥ 1).
- S9 closure librarian: setup.sh checks out `member-a` on `task/0004-empty-export-fix` (plan 0004 in `review`, sign-off pre-approved in the prompt as in S1 v2). Prompt: S1's v2 prompt adapted to plan 0004. Checks: `docs/architecture/export.md` no longer states that the first-row lookup violates D2 (grep the seeded sentence is gone or amended) and a superseding/updated Implications line exists; `docs/product/F-1-export-flow.md` mentions the empty-input behavior as landed; `docs/architecture/roadmap.md` row for 0004 flipped; G-entries unchanged except none new; sign-off brief contains a Learnings section listing both seeded lines verbatim with a keep/drop; both repos landed (as S1 checks); `librarian` dispatched (task count ≥ 1) — CANNOT-EVALUATE otherwise.

## Acceptance for the round

`bun tools/doctor.ts` PASS (extend doctor for new rule names, symlinks, agents parity incl. tracker-scout/librarian/ticket-investigator, skills parity incl. intake); lint PASS on all registries incl. plan 0004 and F-1; `bash setup.sh` in a copy leaves member-a on `task/0004-empty-export-fix` **only when** `MOSAIC_S9=1` is set (S9's own setup.sh exports it), else on `task/0002-…` as today; `bun tools/tracker.ts list --all` prints the seed; `bun tools/docimpact.ts member-a/docs/plans/0004-empty-export-fix.md` lists export.md (affinity + decision), F-1 (product-contract), roadmap; S6–S9 `--dry-run` succeed for `--harness mosaic`.
