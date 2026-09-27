# {{PROJECT_NAME}} — Architecture Link Repo

{{PROJECT_SUMMARY}}

```text
{{PROJECT_NAME}} (workflow and architecture) → member-a (Python CSV export API)
```

## This directory is the LINK REPO

The cross-repo meta layer — architecture truth, workflow, plans, LLM tooling — containing the
member repos as sibling directories (independent git repos, gitignored here, future submodules):

| Member repo | What it is | Remote |
|---|---|---|
| `member-a/` | Python package `member_a` and pytest tests | `{{MEMBER_REMOTE:member-a}}` |

Each member repo carries its own `CLAUDE.md` and, once needed, its own `docs/` (same conventions).
Skills/agents/hooks live in the **link repo only**; sessions run from here (workflow §8, R7).
Also here: `docs/` — all cross-repo documentation, registry at [docs/index.md](docs/index.md);
`.claude/` + `.omp/` — two harness ports of one workflow, **mirror every change across both**
([AGENTS.md](AGENTS.md)).

## Source-of-truth precedence

Architecture ([docs/architecture/](docs/architecture/README.md)) outranks product
([docs/product/](docs/product/README.md)), which outranks platform spec uploads and design mocks —
on contradiction, the architecture doc wins. Every proposal gets checked against the
[pitfalls catalog](docs/architecture/pitfalls.md) — most "shortcuts" there were already rejected
for recorded reasons. Run the check via `registry-scout` (workflow §10), don't preload the catalog;
challenger agents (plan-adversary, reviewers) read it whole as the backstop. Full precedence and
the D#/P-x citation convention: [docs/index.md](docs/index.md).
The human may always override recorded decisions — surface the conflict when one arises.

## Read first

- [docs/index.md](docs/index.md) — doc registry, repo map, cold-start steps
- [docs/workflow.md](docs/workflow.md) — how work gets done here (**mandatory before making changes**)
- [docs/meta.md](docs/meta.md) — the rules for editing the system's own records (workflow, ledgers,
  registries, `.claude/`/`.omp/`). Read it **before** touching any of those: notably provenance
  belongs in commit messages, not doc bodies (rule 9), and queryable state — what is deployed, which
  migrations are applied — is queried, never recorded (rule 11).

## Recorded gaps

[docs/gaps.md](docs/gaps.md) — gaps registry (G-x): ACTIVE obligations with triggers.
**Never preload it**: `registry-scout` surfaces the intersecting entries during a targeted check
(workflow §10); `/palladio-plan` checks it like pitfalls. Re-assessing or closing entries goes
through `/gap-evaluate` (evidence + human sign-off), never ad-hoc edits.

## Working philosophy (operational, not aspirational)

- **Doc-first**: everything lands as LLM-readable markdown under `docs/`, meant for future LLM work.
  **If it isn't in docs/, it didn't happen.**
- **Plan then execute** (canonical: workflow §2): non-trivial work is a plan doc via `/palladio-plan`
  → **human approval** → `/palladio-execute`. But the §2 triage governs — not every edit is a plan,
  not every plan is a doc (in-memory plans for trivial work; data-only ingestion is exempt);
  over-planning is the anti-pattern. Single-repo plans live in that repo's `docs/plans/`,
  cross-repo/meta plans here (R1).
- **Roles** (full table: workflow §1): the orchestrator decides and dispatches; `plan-adversary`
  attacks drafts; `executor`s implement single bounded tasks — deliberately "stupid", judgment
  lives upstream; reviewers doubt diffs (harness split: [AGENTS.md](AGENTS.md)); scouts keep
  reading cheap; the human approves and signs off.
- **Every plan states how an LLM verifies the result** — the "Verification gaps" section is
  mandatory (workflow §6).
- **Parallel by design**: tasks declare exact `files:` sets; disjoint sets run as parallel waves (§4).
- **Composition over generic**: many small replaceable parts; talking parts have a binding contract.
  Member repos are the coarsest parts — they talk only through contracts (e.g. [export behavior](docs/architecture/export.md)).

## Git flow (canonical: workflow §3)

- Work AND its plan doc happen **in the target repo** (link repo for cross-repo/meta work).
- **Never commit on a `main`** — a hook blocks it. Branch `task/NNNN-<slug>` per plan, in every
  targeted repo; land **rebase-first** then `git merge --ff-only`; push that repo's `main` —
  **including this link repo**. No PRs — review happens in-session (§5).

## Hooks that will act on you

- `guard-main.sh` blocks `git commit` while the targeted repo is on `main` → switch to a task branch.
- `lint-ledgers.sh` validates the repo's ledgers and id registries on save: **active** plan docs
  (frontmatter/sections), the plans ledgers, the gaps registry + archive, the pitfalls catalog and
  the decision map. Its load-bearing check is **id uniqueness** — duplicate `G-x`/`P-x`/`D#`/plan
  numbers, a gap that is closed but still active, or one present in both registry and archive.
  Archived plans (`docs/plans/archived/`) are frozen and exempt. It accepts either the `PostToolUse`
  stdin payload or a plain argv path, so `sh .claude/hooks/lint-ledgers.sh <file>` really lints.
