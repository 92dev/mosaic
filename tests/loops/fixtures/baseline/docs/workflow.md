# Workflow — How Work Gets Done Here

This is the operating manual for all changes in this repo. It is written for LLM sessions;
humans follow the same rules from a terminal. Reading this doc is mandatory before making changes.

## 1. Roles

| Role | Who | Does |
|---|---|---|
| **Orchestrator** | The main session | Explores, authors plans, dispatches agents, cross-references [architecture docs](architecture/README.md), runs verification, merges. Final LLM decision-maker. |
| **Plan-adversary** | `plan-adversary` agent | Opposing counsel during planning: attacks the draft plan in Plan Phase 2 rounds — feasibility, pitfalls/gaps, decomposition, verification honesty. Challenges only; the orchestrator rules, the human can overrule. Never edits. |
| **Executor** | `executor` agent | Implements exactly ONE task block from an approved plan. Bounded context, precise instructions, no improvisation. Executors are deliberately "stupid" — judgment lives upstream. |
| **Reviewer** | `reviewer` agent(s); `omp` splits as `claude-reviewer` + `gpt-reviewer` — dispatched together, both required; | The middle layer: doubts, questions, verifies. Reviews diffs against the plan's checklist and the [pitfalls catalog](architecture/pitfalls.md). Issues `APPROVE`/`REVISE` verdicts. Never edits. |
| **Registry-scout** | `registry-scout` agent | Cheap read-only relevance filter over the standing registries (gaps, plans ledger, pitfalls). Given a change's scope, returns only the intersecting entries — id + one line + where to read — so the orchestrator pulls the minimum instead of slurping a catalog into context (§10). Never edits. |
| **Context-scout** | `context-scout` agent | Cheap read-only agent that briefs a scoped code/doc area into concepts + a few load-bearing excerpts + where to read more, so the orchestrator can act without reading the area cold. Unlike registry-scout, it reads code, not just the registries. Never edits. |
| **Human** | User | Approves plans (`draft → approved`), final sign-off (`review → done`), escape hatch for anything hooks block. |

Multiple executors run in parallel when their file sets are disjoint (§4).
Multiple reviewers may be launched for large diffs (e.g., one per concern dimension).

**Orchestrator posture.** "Doubt by default" and "refute the plan" are the *challenger* roles' jobs
(reviewers, plan-adversary) — not the orchestrator's. As orchestrator you **decide and move**: gather
what a call actually needs, make the call, act. Don't re-open a question the human already approved, a
challenge you already ruled on, or a change already inside an approved plan's scope — that is drift,
not diligence. Escalate on real ambiguity or contradiction, not on discomfort. Efficiency is part of
correctness here: the lightest vehicle that still records the *decision* is the right one, never a lapse in rigor.

## 2. Plan lifecycle

Non-trivial work starts as a plan doc, created via the skill from [TEMPLATE.md](plans/TEMPLATE.md)
in the plan's **home repo**: a plan targeting exactly one member repo is homed in `<repo>/docs/plans/`;
a plan targeting the link repo, or more than one repo (cross-repo/meta), is homed here in this link
repo's [docs/plans/](plans/README.md), which doubles as the **master ledger** indexing every plan in
every repo (R1+R2 — full rules in §8). Plans run via the `/palladio-execute` skill.

**Exemption — trivial work (bugfix, UI, minor-risk).** Plainly-minor blast radius ⇒ **no plan doc,
no ledger row, no `NNNN`**; the same loop at the lightest weight — **in-memory plan → executor →
reviewer** ("the light path is still a loop", below) — on a short-lived branch (`fix/<slug>`).
Small implementation details are **decided, not asked**;
present finished work. A decision the human (or ticket reporter) owns is surfaced as the chosen
default plus its implications — reading as *done*. Triviality in doubt ⇒ the two-step test below.
A number + row are claimed **only at close, only when the outcome leaves a record worth auditing**
(same audit test, or human-directed) — then the row IS the record (R3; a docless row describing a
mechanical migration is this carve-out, not precedent for numbering trivia). R2's eager reservation stays plan-only.

**Exemption — data-only ingestion.** Introducing product/external notes, concepts, or ideation —
changes that add information without acting on any repo's code or behavior — does **not** get its
own plan or ledger row. The orchestrator lands it inline (human directing in-session) on a
short-lived `docs/<slug>` branch, rebase-first `--ff-only` as usual — guard-main still applies. The
full flow kicks in only when the ingested material is coupled with planning/implementing an actual
change. Canonical statement + rationale:
[docs/product/README.md](product/README.md).

```
draft → approved → executing → review → done
                 ↘ abandoned (any time, with reason)
```

| Transition | Who flips it | Where it lands |
|---|---|---|
| (create) `draft` | Orchestrator via `/palladio-plan` | Plan file in home repo + master-ledger row (+ local-ledger row for member-homed plans) |
| `draft → approved` | **Human only** (verbal approval in-session; orchestrator edits the field) | Committed as first commit on the task branch, or on main via a docs branch |
| `approved → executing` | Orchestrator | First commit on the task branch |
| `executing → review` | Orchestrator, after all tasks pass review AND the plan's Verification steps ran with output recorded in the Execution log | Commit on task branch |
| `review → done` | **Human sign-off**; orchestrator flips + updates ledger | Commit on task branch, then land (rebase + ff-only) |
| `→ abandoned` | Orchestrator or human, one-line reason in the plan | Plan moves to `docs/plans/archived/` (same relocation as `done`); ledger marks it + repoints the link |

The plan doc's `status:` field is always the source of truth; master-ledger sync cadence follows the plan's home repo (canonical: R4, §8).

Plans are **never deleted**; a plan may be **relocated** only when the plan-home convention requires it,
recorded in the master ledger.

### When a plan is NOT required

The plan flow governs **new, non-trivial work that needs judgment** — it is not a tax on every edit.
Opening a plan (or a sub-plan, or a meta-plan) for the cases below is the over-ceremony this repo
actively avoids; doing the lighter thing is the *expected* behavior, not a shortcut. Do **not** open a
new plan for:

- **A fix inside an active plan.** A reviewer `REVISE`, a verification failure, or any correction to
  work the current plan already scopes rides the *existing* task branch — re-dispatch or apply it and
  note it in the Execution log. That is the review loop (§5), not new work.
- **Refinement while authoring a plan.** Edits to a draft during `/palladio-plan` — including adversary-driven
  ones — are just edits to the draft. There is never a meta-plan to change the plan you are writing.
- **Work already inside an approved plan's scope.** If the plan's `files:`/Scope already cover it, it
  belongs to that plan; extend its Execution log — don't spawn a sibling plan.
- **Mechanical or obvious edits** with no design choice — typo/wording/link fixes, formatting, moving a
  done plan to `archived/`. These ride any open branch (§7).
- **Data-only ingestion** — the exemption above (notes, concepts, ideation: information without action).
- **Implementing a direction the human already decided in-session.** When the human has already chosen
  the approach — this session or a recorded prior one — the *deciding* is done. The plan cycle exists to
  *reach* a decision through adversary rounds and approval; it is not the vehicle for merely recording
  one already made. Record the decision + rationale on the branch (commit message or a line in the
  changed doc) — but a ruling whose **reach extends beyond the change** ALSO routes to its record
  type in the same change ([meta.md](meta.md), Record types — usually a `D#` amendment; for those,
  a commit message is provenance, not the record). Run the minimal loop below and land it. This is
  **not** licence to skip planning on an
  *open* question: if the approach is still genuinely undecided, or the edit fans out well beyond the
  decided change, plan it. For edits to the workflow/skills themselves this is §7's human-authorized meta
  hatch.

The test when unsure runs in two steps. First, **is the deciding still open** — does a future session
need this vehicle to *reach* a judgment call? If the human already made the call in-session, the answer
is no: record it and take the light path. If the deciding is still open, then ask: **does resolving it
introduce a decision a future session must be able to audit?** No → inline it on the current branch.
Yes → plan it, at the lightest weight that still records the decision. A plan is the vehicle for
*making* a decision, never merely for recording one already made. Recording the *decision and its
obligations* is the point; a transcript of every keystroke is not. When you judge that a request does
**not** need a plan, say so and do the lighter thing; do not author one out of habit.

**The light path is still a loop.** Dropping the ceremony does not drop the work: you still run
**plan (in-memory) → execute → review → execute …** — you just shed the *artifacts* (plan doc, Planning
log, formal approval gates) and record the decision on the branch instead. On this path the ceremony's
early-exits are **self-serve** — you judge them and note the one-line reason in a commit, no human
waiver or Planning-log entry needed:

- **No adversary value** — a change with no real decision surface to attack skips the adversary pass
  entirely (the Phase-2 waiver, self-judged here).
- **Insufficient delta** — if the diff/draft barely moved since the last review or adversary round,
  that *is* convergence; don't spend another one.
- **Reviewer-clean** — a review that finds nothing lands immediately (§5).

These same breaks exist inside the full ceremony (there they're recorded in the Planning log, and the
waiver is human-granted); the light path only makes them self-serve.

### Active vs. archived plans

Plans in flight (`draft`/`approved`/`executing`/`review`) live in `docs/plans/` (the member repo's own
`docs/plans/` for member-homed plans). At **terminal status** (`done`/`abandoned`) the plan file **moves**
into `docs/plans/archived/` in its home repo — a sanctioned status-based relocation (this is the
plan-home convention requiring it; plans are still never deleted). `/palladio-execute`'s close-out does the move
and updates the ledger link. The **master ledger indexes both** active and archived plans with correct
links, so nothing is lost — the active directory just stays scoped to what is live. A session asking
"what's in flight?" scans `docs/plans/`; the ledger remains the index of everything. Archived plans are
frozen records: the [lint-ledgers hook](../.claude/hooks/lint-ledgers.sh) skips `docs/plans/archived/`, so a
legacy plan that predates the current schema isn't re-gated when a link-fix edit touches it.
Should a pre-convention plan surface later, it archives when its home repo is next
touched (its `/palladio-execute` close-out or a maintenance pass), repointing the ledger link then.

## 3. Branching & git flow

- Every plan **targets a repo**: a member repo (area/code work) or the link repo itself (meta work) — see §8.
  All branch operations happen **in that repo** (`git -C <repo>` or cd into it). `task/NNNN-<slug>` is
  created in **every** repo the plan targets; for a member-homed plan, the plan doc and its local ledger
  ride that same branch alongside the code (R6, §8).
- Branch name = plan file: `task/NNNN-<slug>` (e.g. `task/0001-example-slug`), created from the target repo's up-to-date `main`.
- One plan = one branch. Per-task commits on the branch: `NNNN-T2: <summary>`.
- **Never commit directly on a `main`** — the [guard-main hook](../.claude/hooks/guard-main.sh) blocks `git commit` while the **targeted** repo is on `main` (it resolves `cd <dir> &&` and `git -C <dir>` command forms).
- **Landing on main is rebase-first — history stays linear, no merge commits.** After `done`, in the target repo: rebase the task branch onto latest `main` if main moved (`git rebase main task/NNNN-<slug>` — usually a no-op, branches are created from main's tip), then `git checkout main && git merge --ff-only task/NNNN-<slug> && git push origin main`, then delete the branch. (`git merge --ff-only` creates no merge commit — it is the sanctioned fast-forward path to main. A `--no-ff` merge commit is allowed ONLY for a complex case that genuinely justifies it — e.g. preserving the shape of a long-lived diverged branch — with the justification recorded in the plan's Execution log. The link repo has its own remote (`../origins/link.git`) too — push it like any member repo.)
- No PRs: review happens in-session (§5). GitHub is a remote, not a ceremony.
- The hook binds LLM sessions only; a human terminal is the escape hatch if a hook misfires.

## 4. Executor dispatch — the context-bounding contract

Every task block in a plan declares:

- `files:` — the **exact** set of paths the task may create/modify. Touching anything else is a task failure.
- `reads:` — the docs/files the executor needs as context (keep minimal).
- `instructions:` — precise steps requiring no judgment.
- `acceptance:` — observable results.

Dispatch rules:

1. **Parallel dispatch is allowed ONLY for tasks with disjoint `files:` sets.** Overlapping tasks run sequentially.
2. An executor's prompt contains ONLY: its task block verbatim, the plan's Context section, its `reads:` list, and the acceptance criteria. **Never the whole plan, never sibling tasks.** Each agent stays bound to its operating space.
3. Executors that hit ambiguity, contradiction with repo state, or a needed decision **STOP and report**. The orchestrator resolves and re-dispatches. Executors never make architectural choices.

## 5. Review loop

After each task (or parallel wave), the orchestrator launches the reviewer with:

- the branch diff vs `main` (`git diff main...<branch>`),
- the plan's Review checklist,
- a pointer to [architecture/pitfalls.md](architecture/pitfalls.md).

The reviewer's verdict is `APPROVE` or `REVISE` with numbered, actionable findings
(file:line, what, why, cited decision/pitfall, precise fix instruction).
On `REVISE`: the orchestrator re-dispatches the **same task** to an executor with the findings appended.
**Max 2 revise cycles**, then escalate to the human.
Exception (observed in practice): the harness's self-modification guard can block executors from
editing harness files (`.claude/`, `.omp/`) when their authority arrives via agent message alone. In that case the
**orchestrator applies the reviewer's verbatim fix directly** — authorized by the human-approved
plan that declares those files — and records the deviation in the Execution log.

## 6. Verification discipline

- A plan without a runnable **Verification** section and an honest **Verification gaps** section is invalid
  (the [lint-ledgers hook](../.claude/hooks/lint-ledgers.sh) enforces the sections' presence; only authors make them truthful).
  It is a `PostToolUse` hook that reads the path from a JSON payload on stdin, but it **also accepts an
  argv path**, so verifying by hand is just `sh .claude/hooks/lint-ledgers.sh <path>`. (`guard-main.sh`
  accepts only the stdin payload — verify that one with it, per [P-31](architecture/pitfalls.md).)
- Verification steps must be executable by an LLM in-repo (commands, greps, builds, probes).
- **Verification gaps** is where missing QA capability is surfaced: what cannot be machine-verified, why,
  and the fix / workaround / alternative (e.g. "needs human eyeball", "needs real ACC credentials — defer to pilot").
- The orchestrator runs all Verification steps and records outputs in the Execution log **before** flipping `executing → review`.
- **Targeted tests only inside the loop.** Executors and reviewers NEVER run a full or package-wide
  suite. They run exactly the tests that cover what they touched: `uv run pytest <file…>` from the member repo root.
  Deciding the affected set: (a) tests colocated with / named after the touched modules; (b) grep the
  test tree for the touched symbols and testids; (c) if the set is still genuinely unclear, dispatch a
  `scout` to map it — never widen the run "to be safe". Whole-repo builds, typechecks and suites run
  **once per loop, by the orchestrator, at Verification time** — never inside execute/review
  iterations. The execute→review loop's runtime is the schedule's critical path; every dispatch
  prompt must carry this rule.
- **Gaps registry** ([docs/gaps.md](gaps.md), `G-x`): gaps and reviewer NOTEs that survive a landed
  plan don't die in its Execution log — `/palladio-execute`'s close-out **promotes** them to numbered G-entries
  (conditional obligations with explicit triggers), and `/palladio-plan` **checks** open entries against every
  new plan's scope, the exact mirror of the pitfalls check. Entries are closed by plans
  (`closed by NNNN`), never deleted — at close they MOVE to [gaps-archive.md](gaps-archive.md)
  (with what closed them + how), keeping the active registry small; an oversized entry splits its
  body into `docs/gaps/G-<n>-<slug>.md` with a one-line row left behind; `/gap-evaluate` re-assesses
  entries against the current code (scoped to a change, or a human-consented full audit). Not a
  backlog: feature ideas go to roadmap/product, product questions to open-questions, and a ruling
  already made to a `D#` in its element doc — a G-entry without a trigger is misfiled (route per
  [meta.md](meta.md), Record types).

## 7. Meta changes

`.claude/` and `.omp/` (agents, skills, hooks — the two harness ports) and `docs/` are LLM-maintained
and follow the **same plan flow** — the workflow improves itself through itself. But the §2 triage
applies here too: mechanical or obvious meta-edits (typos, wording, link fixes, an in-scope follow-up to
an active plan) ride any open branch without their own plan, and a human may authorize handling a larger
meta-edit in-session — recorded on the branch, which is itself the audit trail — rather than routing it
through a full plan. Absent that authorization, reserve a plan for
meta-changes that introduce a **new, auditable design decision** about how work is governed.
Data-only ingestion (product notes, concepts) is exempt entirely — see the §2 exemption and
[docs/product/README.md](product/README.md).

**Mirror the two envs.** `.claude/` and `.omp/` are two ports of one workflow (the omp env swaps in its
own model aliases, `task`/`irc` orchestration, and TS hooks). Whatever you change in one — a skill, an
agent, a rule — mirror into the other in its idiom; the two must not drift. `docs/` is shared by both
and edited once.

Editing the workflow itself, ledgers, registries, or the harness ports carries its own recorded
defect classes — [meta.md](meta.md) is the required read for such edits and supplies the reviewer
checklist for such diffs; include it in those tasks' `reads:`.

## 8. Link repo & member repos

This directory is the **link repo**: it holds the cross-repo meta layer (architecture truth, workflow,
plans, LLM tooling) and contains the **member repos** as sibling directories — each an independent git
repo and an independently replaceable part ("composition over generic"):

```
Fixture/                             # LINK REPO (remote: ../origins/link.git)
├── CLAUDE.md  docs/  .claude/ .omp/  #   cross-repo meta layer (this layer)
└── member-a/                        # MEMBER: Python export API (remote: ../origins/member-a.git)
    └── CLAUDE.md  docs/              #   repo-specific context + docs (harness dirs: link repo only, R7)
```

Rules:

- **Today**: the link repo has its own local bare remote (`../origins/link.git`); member repos are
  plain sibling git repos, gitignored by the link repo (see `.gitignore`).
  **Near future**: the members are wired in as **git submodules** — that wiring is its own plan; until
  then, never `git add` a member directory here.
- Every member repo follows the same conventions as this root: its own `CLAUDE.md` (repo context) and,
  once it has repo-specific docs or plans, its own `docs/`. Skills, agents, and hooks are **not**
  mirrored into members — they live in the link repo only (R7).
- Link-repo `docs/architecture/` holds **cross-repo truth**. Each architecture doc declares its *area affinity*
  (which member repo it belongs to, or cross-area); when a doc becomes fully repo-specific, it may MOVE into
  that repo's `docs/` via a plan, leaving a redirect stub and an updated
  [architecture/README.md](architecture/README.md) index.
- Member repos talk only through **binding contracts** (schemas, event contracts, APIs) documented in
  `docs/architecture/` (e.g. [export behavior](architecture/export.md)).
- **Plan-home rules (R1–R8)** — canonical here; other docs summarize and link to this section:
  - **R1 — Plan home.** Every plan declares its target repo(s) in `repo:` frontmatter. A plan targeting
    exactly one member repo is homed in `<that-repo>/docs/plans/`; a plan targeting `link-repo`, or more
    than one repo (cross-repo feature), is homed in this link repo's [docs/plans/](plans/README.md).
  - **R2 — Global numbering by eager reservation.** Plan numbers `NNNN` are global across all repos and
    **claimed from the master ledger** ([docs/plans/README.md](plans/README.md)) *before* the plan is
    authored: fetch the link repo, take `NNNN` = highest in the master ledger + 1, add the plan's row,
    and **push it** (short-lived `docs/NNNN-reserve` branch, `--ff-only`, §3). The push is what makes
    allocation atomic across concurrent sessions — a **rejected push** means another session took `NNNN`
    or moved `main`, so re-fetch, re-number, and retry. Because every number is pushed to the ledger at
    birth, the master ledger is the authoritative source for numbering (no scanning branches or member
    repos), and `task/NNNN-<slug>` branch names stay unique across repos. Enabled by the link repo now
    having a remote — the tightening R4 always anticipated.
  - **R3 — Local ledgers.** Each member repo that has plans carries its own `docs/plans/README.md`
    (local ledger) listing only its own plans, updated at every status flip, riding the same branch and
    commits as the plan doc. Master and local ledger rows are one-line summaries — the plan doc carries the abstract; a row whose plan has no doc (light-path work that earned a row — §2's carve-out, not every light-path change — or a plan not yet authored) carries its scope in the row — there it IS the record.
  - **R4 — Ledger truth.** The plan doc's `status:` is the source of truth. For member-homed plans the
    master ledger must be accurate at **creation** — which is the eager R2 reservation, pushed *before*
    authoring (mandatory, no longer deferred) — and at **terminal status** (`done`/`abandoned`).
    Mid-flight status lives solely in the plan doc, so mid-flight master sync stays best-effort (a
    link-repo commit per flip needs its own branch+merge ceremony, not worth it). For link-repo-homed
    plans the master ledger updates at every flip (§2). **Terminal-sync mechanics** for member-homed
    plans: the landed commit hash exists only after the branch lands, and direct commits on link-repo
    `main` are blocked — so the sync rides a short-lived link-repo branch `docs/NNNN-ledger-sync`,
    landed `--ff-only` (§3).
  - **R5 — Path relativity.** All paths in a plan (`files:`, `reads:`) are relative to the plan's **home
    repo root**. Cross-repo plans (homed in the link repo) reference member files with the member-dir
    prefix (`member-a/...`) and each task block carries its own `repo:` line naming the repo it runs
    in; single-repo plans omit per-task `repo:` (inherited from frontmatter). R5 governs `files:`/`reads:`
    only — markdown links in a plan's prose follow the normal file-relative frame (R8); mixing the two
    frames is the known authoring trap.
  - **R6 — Branching.** `task/NNNN-<slug>` is created in **every** repo the plan targets (§3). Cross-repo
    plans also branch the link repo (the plan doc, master-ledger flips, and Execution log ride it);
    member-homed plans carry plan doc + local ledger + code on the one branch in that member repo.
  - **R7 — Orchestration home.** Skills, agents, and hooks live in the link repo only; sessions run from
    here — no copies in member repos. The existing hooks already cover member paths:
    [lint-ledgers.sh](../.claude/hooks/lint-ledgers.sh) matches `*/docs/plans/*.md` in any repo (except the
    frozen `docs/plans/archived/`, which it skips) and each repo's own `docs/plans/README.md` ledger;
    [guard-main.sh](../.claude/hooks/guard-main.sh) resolves `git -C <member>` / `cd <member> &&`.
  - **R8 — Cross-repo doc links.** Member-repo docs referencing link-repo docs use upward relative paths
    (`../../../docs/...`) — they resolve inside the composed tree today (member repos are subdirectories).
    Standalone-clone link breakage is a known cost, revisited by the submodule plan.
- Plan [0002](../member-a/docs/plans/0002-empty-export-handling.md) is member-homed: its code,
  plan doc and local ledger share the `member-a` task branch; the master ledger indexes it here.

## 9. End-to-end trace (canonical example)

```
human idea → /palladio-plan → <home>/docs/plans/NNNN-slug.md (draft) → human: "approved" → status flip
→ /palladio-execute → branch task/NNNN-slug (created in every targeted repo) → status: executing (commit 1)
→ [wave: executor(s), files-disjoint → parallel] → per-task commits
→ reviewer verdict → (REVISE → re-dispatch ≤2) → APPROVE
→ orchestrator runs Verification → Execution log filled → status: review
→ human sign-off → status: done + ledger → rebase onto main → ff-only land → push → delete branch
```

## 10. Reading discipline — pull the minimum

The standing registries — the [gaps registry](gaps.md) (+ `docs/gaps/`), the [plans ledger](plans/README.md)
and the plan docs, and the [pitfalls catalog](architecture/pitfalls.md) — are large and, for any one
change, mostly irrelevant. **Do not preload them into the main context "to be safe."** They are reference
material consulted *during a check*, not standing context every session and every agent slurps up front.

When a check needs them — the `/palladio-plan` pitfalls-and-gaps check, `/gap-evaluate` scoped selection, a review
sweep — dispatch the [`registry-scout`](../.claude/agents/registry-scout.md) agent (its own context)
with the change's scope. It greps the registries and returns only the entries whose triggers
plausibly intersect: id + one line + where to read the full entry. Read *those* in full and act on them;
ignore the rest. The scout does the iterating so the main context doesn't, and a miss costs one cheap
agent, not a degraded main session.

For a scoped code or doc area rather than the registries, the parallel move is
[`context-scout`](../.claude/agents/context-scout.md) — it reads the area and returns concepts plus
load-bearing excerpts instead of the registries' pointers-only contract.

This narrows *what to read* — it does not lower the bar. Deep engagement with a **flagged** pitfall or gap
is still mandatory (address it, or defer it with a cited reason, exactly as before); the scout just spares
you the hundred entries that don't apply. Cold-start reading (`CLAUDE.md`, [index.md](index.md), the
architecture entry docs) is unchanged — that is the small, always-relevant set a session genuinely needs.
