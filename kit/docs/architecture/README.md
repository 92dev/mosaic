# Architecture — {{PROJECT_NAME}}

Each element doc includes the context and rejected alternatives needed to apply its decisions without session history.

## Scope

Project-level architecture decisions live here; implementation and tests live in their owning repository or component.

## How to read this

- **The element docs state how the system is and why.** Each carries its current rules as prose, keeping a rejected alternative only while it still guards a path; dates, who decided, and measurements live in the commit or the owning plan. **Treat a recorded rule as settled unless new facts invalidate its rationale.** Numbered decisions (`D<n>`, Context → Decision → Rejected → Implications) are a legacy form: a project that carries them keeps citing and amending them, and mints no new number — a new ruling is a sentence in its element doc, and the way later work must adapt to it is a pitfall.
- **Check proposals against the pitfall catalogs** ([pitfalls.md](pitfalls.md) for cross-repo and devops traps{{MULTI_REPO}}; `<member>/docs/pitfalls.md` for a member's own{{/MULTI_REPO}}), selected per `rule://registries`. Starter traps are general checks, not measured incidents of this project; apply them only where current project evidence supports them.
- **[open-questions.md](open-questions.md) records unresolved cross-cutting questions.** Ask the owner when a new material ambiguity is not already settled by a recorded decision; record a durable question if it outlives the work.

## Index

*Area affinity* identifies the document's owner: use `link-repo` for root-owned documents,
an actual member repo where applicable, or `cross-area` for shared truth — see [plan-home](../process/plan-home.md).

| Doc | Scope | Area affinity |
|---|---|---|

## Decision map (legacy numbered decisions)

| Decision | Title | File |
|---|---|---|

Only rulings numbered before this convention are listed; no new row is added. A row `| D<n> | Reserved by plan NNNN — <subject> | — |` marks a number allocated before ratification; never reuse it. Rows of retired decisions that a project archived earlier live in [decisions-archive.md](decisions-archive.md) with their sections under `archived/`, frozen history that no session preloads; a decision retired now is removed, with git history as its archive.

## Pitfall catalogs

**[pitfalls.md](pitfalls.md)** holds the cross-repo and devops traps{{MULTI_REPO}}; each member's own traps live in its `<member>/docs/pitfalls.md`{{/MULTI_REPO}}. Numbers are handles unique across every catalog and never reused; an entry whose trap can no longer be walked into is removed, never archived, and nothing cites a pitfall by number.

## Section map

- Process traps: [pitfalls.md](pitfalls.md).
- Open product decisions: [open-questions.md](open-questions.md).

## Reference stack

See the [project stack](../process/stack.md).

## Extension rules

When extending this record, keep the guardrails intact:

- **New rulings** are sentences in the relevant element doc, routed through the minting gate in `rule://records`: a ruling later work must adapt to also becomes a pitfall in the owning repo's catalog; no new D-number is minted. Keep existing `### D<number> —` headings greppable.
- **Update this README's Decision map** only when a legacy decision is amended, moved, or removed.
- **A rejected alternative stays while it still guards a path** — its recorded failure reason is the guardrail, and the path it rules out is pitfall material. New facts that overturn a ruling amend the sentence in place with the overturn's provenance in the commit or plan (`rule://records` reconciliation).
- **A record whose subject no longer exists is removed, not archived:** the decision section or pitfall entry is deleted and every sentence that pointed at it amended in the same change, by a signed-off audit (`skill://mosaic-gap-audit`) or the plan that removed the subject; git history is the archive.
- **New pitfalls** take the **next unused P-number across every catalog**, appended to the catalog of the repo that owns the subject, greppable as `- **P-<n>`; an entry in the wrong catalog is moved by an audit verdict, number kept.
- Archived plans under `docs/plans/archived/` and, where a project kept them, `archived/` and `decisions-archive.md` are frozen history.
