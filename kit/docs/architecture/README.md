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

A number allocated before ratification gets a row `| D<n> | Reserved by plan NNNN — <subject> | — |` until the plan lands; never reuse it.
Retired decisions are not listed here: their rows live in [decisions-archive.md](decisions-archive.md) and their sections under `archived/`, frozen history that no session preloads.

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
- **Never delete rejected alternatives** — their recorded failure reasons are the guardrails. New facts that overturn a decision are recorded as a *new* decision that supersedes the old one; the old entry (and its Rejected block) stays. Text corrections that leave the ruling intact are amended in place (`rule://records` reconciliation test).
- **A decision whose subject no longer exists is archived, not deleted:** its section moves verbatim to `archived/<element doc>.md` under an `**Archived:**` line naming the superseding decision or the landed plan that removed the subject, and its map row moves from this README to [decisions-archive.md](decisions-archive.md). Only a signed-off audit (`skill://mosaic-gap-audit`) or the plan that supersedes it does this.
- **New pitfalls** get the **next global P-number** appended in [pitfalls.md](pitfalls.md) (continue past the last catalogued number), greppable as `- **P-<n>`; retired pitfalls move to [pitfalls-archive.md](pitfalls-archive.md) the same way.
- Archived plans under `docs/plans/archived/`, `archived/`, `decisions-archive.md`, and `pitfalls-archive.md` are frozen history.
