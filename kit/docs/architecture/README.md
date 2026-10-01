# Architecture — {{PROJECT_NAME}}

Each element doc includes the context and rejected alternatives needed to apply its decisions without session history.

## Scope

Project-level architecture decisions live here; implementation and tests live in their owning repository or component.

## How to read this

- **The element docs state how the system is and why.** Each carries its current rules as prose, keeping a rejected alternative only while it still guards a path; dates, who decided, and measurements live in the commit or the owning plan. **Treat a recorded rule as settled unless new facts invalidate its rationale.** Rulings are recorded through the minting gate in `rule://records` (prose, and a pitfall where later work must adapt); numbered decisions (`D<n>`) are a legacy form with no new numbers.
- **Check proposals against the pitfall catalogs** ([pitfalls.md](pitfalls.md) for cross-repo and devops traps{{MULTI_REPO}}; `<member>/docs/pitfalls.md` for a member's own{{/MULTI_REPO}}), selected per `rule://registries`. Starter traps are general checks, not measured incidents of this project; apply them only where current project evidence supports them.
- **[open-questions.md](open-questions.md) records unresolved cross-cutting questions.** Ask the owner when a new material ambiguity is not already settled by a recorded decision; record a durable question if it outlives the work.

## Index

*Area affinity* identifies the document's owner: use `link-repo` for root-owned documents,
an actual member repo where applicable, or `cross-area` for shared truth — see [plan-home](../process/plan-home.md).

| Doc | Scope | Area affinity |
|---|---|---|

## Pitfall catalogs

**[pitfalls.md](pitfalls.md)** holds the cross-repo and devops traps{{MULTI_REPO}}; each member's own traps live in its `<member>/docs/pitfalls.md`{{/MULTI_REPO}}. Numbering, removal and the no-citation rule: `rule://records`; selection: `rule://registries`.

## Section map

- Process traps: [pitfalls.md](pitfalls.md).
- Open product decisions: [open-questions.md](open-questions.md).

## Reference stack

See the [project stack](../process/stack.md).

## Extension rules

When extending this record, keep the guardrails intact:

- **New rulings** are sentences in the relevant element doc, routed through the minting gate in `rule://records`; no new D-number. Keep existing `### D<number> —` headings greppable.
- **A project with numbered decisions** (`D<n>`) keeps their map frozen in `decisions-archive.md` and their `### D<number> —` sections in the element docs; the map gains no rows.
- **A rejected alternative stays while it still guards a path** — its recorded failure reason is the guardrail; overturns and removals follow `rule://records` (reconciliation).
- **New pitfalls** are appended to the catalog of the repo that owns the subject, greppable as `- **P-<n>`, numbered per `rule://records`.
- Archived plans under `docs/plans/archived/` and, where a project kept them, `archived/` (retired sections) and `decisions-archive.md` (the legacy map) are frozen history.
