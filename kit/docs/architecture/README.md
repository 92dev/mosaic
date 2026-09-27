# Architecture — {{PROJECT_NAME}}

Each element doc includes the context and rejected alternatives needed to apply its decisions without session history.

## Scope

Project-level architecture decisions live here; implementation and tests live in their owning repository or component.

## How to read this

- **The decision docs are the decision log.** Each decision has Context → Decision → Rejected alternatives → Implications. **Treat decisions as settled unless the recorded rationale is invalidated by new facts.**
- **Check proposals against the relevant entries in [pitfalls.md](pitfalls.md).** Starter traps are general checks, not decisions or measured incidents of this project; apply them only where current project evidence supports them.
- **[open-questions.md](open-questions.md) records unresolved cross-cutting questions.** Ask the owner when a new material ambiguity is not already settled by a recorded decision; record a durable question if it outlives the work.

## Index

*Area affinity* identifies the document's owner: use `link-repo` for root-owned documents,
an actual member repo where applicable, or `cross-area` for shared truth — see [plan-home](../process/plan-home.md).

| Doc | Scope | Area affinity |
|---|---|---|

## Decision map (ratified decisions)

| Decision | Title | File |
|---|---|---|


## Pitfall map

Starter and project pitfalls are indexed in **[pitfalls.md](pitfalls.md)**. Preserve existing P-numbers; assign new entries the next unused global P-number.

## Section map

- Process traps: [pitfalls.md](pitfalls.md).
- Open product decisions: [open-questions.md](open-questions.md).

## Reference stack

See the [project stack](../process/stack.md).

## Extension rules

When extending this record, keep the guardrails intact:

- **New decisions** APPEND to the relevant element doc using the same **Context → Decision → Rejected → Implications** structure, with the **next global D-number** (continue past the last ratified number). Keep the heading greppable as `### D<number> —`.
- **Update this README's Decision map** whenever a decision is added or moved.
- **Never delete rejected alternatives** — their recorded failure reasons are the guardrails. New facts that overturn a decision are recorded as a *new* decision that supersedes the old one; the old entry (and its Rejected block) stays.
- **New pitfalls** get the **next global P-number** appended in [pitfalls.md](pitfalls.md) (continue past the last catalogued number), greppable as `- **P-<n>`.
- Archived plans under `docs/plans/archived/` are frozen history.
