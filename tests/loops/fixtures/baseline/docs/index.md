# Documentation Index — Fixture (Link Repo)

The hub for all cross-repo documentation.
Docs here are written **for LLM sessions first** — self-sufficient, precise, link-rich.
If it isn't in `docs/`, it didn't happen.

## Cold start (new session, 3 steps)

1. Read this file (you are here) and the repo map below.
2. Follow [architecture/README.md's How to read this](architecture/README.md#how-to-read-this-adapted-from-source-0).
3. Read [workflow.md](workflow.md) — mandatory before making any change.

## Source-of-truth precedence

1. **[docs/architecture/](architecture/README.md)** — authoritative for ALL architecture and product decisions.
   Apply [architecture/README.md's proposal checks](architecture/README.md#how-to-read-this-adapted-from-source-0) through the [workflow §10](workflow.md#10-reading-discipline--pull-the-minimum) mechanism.
2. **[docs/product/](product/README.md)** — product/feature layer: cross-repo flows, MVP scope, ideation
   with maturity states. Below architecture (a contradiction means the architecture doc needs amending,
   never a fork); above the spec uploads and mocks.
3. External notes and design mocks are background / UX intent only; none are seeded in this fixture.
   When one contradicts an architecture doc, **the architecture doc wins**.

## Document registry

| Doc | Purpose | Read when |
|---|---|---|
| [workflow.md](workflow.md) | How work gets done: roles, plan lifecycle, branching, executor dispatch, review loop, verification discipline, link-repo & member-repos convention | Before making ANY change (mandatory) |
| [meta.md](meta.md) | Doc classes + the earned rules for editing the system's own records (workflow, ledgers, registries, harness ports); reviewer checklist for meta diffs | Editing workflow / ledgers / registries / `.claude/` / `.omp/` |
| [architecture/README.md](architecture/README.md) | Architecture index: per-element docs, decision map (D#), pitfall map (P-x), reference stack | Cold start step 2; before any technical proposal |
| [product/README.md](product/README.md) | Product/feature layer: F-numbered cross-repo flow docs, status lifecycle, promotion rules, **data-only ingestion exemption** | Product/feature work; ingestion questions |
| [gaps.md](gaps.md) | **Gaps registry** (G-x): ACTIVE engineering obligations with triggers, promoted from landed plans' gaps/review NOTEs; checked by `/palladio-plan` like pitfalls; re-assessed by `/gap-evaluate` | Via `registry-scout` during a check — never preload (§10) |
| [gaps-archive.md](gaps-archive.md) | Closed G-entries, moved out of the registry at close — what closed each gap (plan + hash) and how | Auditing a closed gap |
| [plans/README.md](plans/README.md) | **Master** plans ledger — indexes every plan across all repos; single-repo plans live in the member repo's own `docs/plans/` | Reserving a number (R2); locating any plan |
| [plans/TEMPLATE.md](plans/TEMPLATE.md) | Plan-doc template (schema enforced by the lint-ledgers hook) | Authoring a plan doc |
| [architecture/export.md](architecture/export.md) | CSV export contract: D1 default format, D2 empty-input behavior | Changing `member_a/api.py` or export tests |

## Repo map

This directory is the **link repo** — cross-repo meta layer + the member repos as siblings
(independent git repos today, **git submodules in the near future**; see [workflow.md §8](workflow.md)).

| Path | What lives there |
|---|---|
| `CLAUDE.md` | Session entrypoint: product one-pager, precedence rule, philosophy, git flow |
| `AGENTS.md` | omp/GPT-port entrypoint: points to `CLAUDE.md` as canonical + lists only the `.omp` idiom deltas |
| `docs/` | All cross-repo documentation (this hub) |
| `.claude/agents/` | `executor` (one bounded task), `reviewer` (adversarial, read-only), `plan-adversary` (draft-plan challenges), `registry-scout` (gaps/plans/pitfalls filter), `context-scout` (scoped code/doc briefing). The `.omp/` port splits `reviewer` into `claude-reviewer` + `gpt-reviewer`, dispatched together; both must `APPROVE` |
| `.claude/skills/` | `/palladio-plan` (author a plan), `/palladio-execute` (run an approved plan), `/gap-evaluate` (re-assess gaps against code) |
| `.claude/hooks/` | `guard-main.sh` (blocks `git commit` on a main, multi-repo aware), `lint-ledgers.sh` (validates every ledger/id registry: plan docs, plans ledgers, gaps + archive, pitfalls, decision map — id uniqueness is the load-bearing check) |
| `.omp/` | Parallel harness port of `.claude/` — the same agents/skills/hooks in the omp env's idiom (dual reviewers, `task`/`irc` orchestration, TS hooks). Mirror every `.claude/` workflow change here ([workflow.md §7](workflow.md)) |
| `member-a/` | Independent member repo: Python package `member_a`, CSV export API, pytest tests and local plan ledger |

## Conventions

- Docs are LLM-audience: assume the reader has zero session context beyond `CLAUDE.md`.
- **Route new knowledge before writing it** — settled ruling vs triggered obligation vs trap vs
  open question land in different records: the Record-types table in [meta.md](meta.md).
- **Relative links only** — links must resolve inside this directory tree (member repos included).
  Per **R8**, member-repo docs referencing link-repo docs use upward-relative paths (e.g.
  `../../../docs/...`), which resolve inside the composed tree today.
- New architecture **decisions are appended to the relevant element doc** in `docs/architecture/` using the
  Context → Decision → Rejected alternatives → Implications format with the **next global D-number**,
  and the decision map in [architecture/README.md](architecture/README.md) is updated. Never delete rejected alternatives.
- New cross-cutting traps get the next P-number in [architecture/pitfalls.md](architecture/pitfalls.md).
- Surviving gaps/NOTEs from a landed plan get the next G-number in [gaps.md](gaps.md) (promoted at
  plan close; checked at plan birth; closed by plans, never deleted).
- New product flows/features get the next F-number in [product/](product/README.md), homed under the
  milestone that scoped them. **Data-only ingestion (notes, concepts, ideation — information without
  action) is exempt from the plan flow** — see the exemption in [product/README.md](product/README.md).
- Non-trivial changes (code, docs, `.claude/`/`.omp/` itself) go through a plan ([workflow.md](workflow.md)) —
  but **not every edit is a plan**: fixes inside an active plan, work already in an approved plan's scope,
  and mechanical edits are inlined per the §2 triage ("When a plan is NOT required"). Reading discipline:
  don't slurp the gaps/plans/pitfalls registries — use `registry-scout` (workflow §10).
  Plans are **repo-aware**: single-repo plans live in that member repo's `docs/plans/`; cross-repo
  or meta plans live here in link-repo `docs/plans/`. Terminal (`done`/`abandoned`) plans move to
  `docs/plans/archived/`; the master ledger still indexes them (workflow §2).
