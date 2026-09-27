# Architecture — Fixture

This directory records the architecture and product decisions for **Fixture**, a tiny link repo used to loop-test the harness. Each element doc includes the context and rejected alternatives needed to apply its decisions without session history.

## Scope

The link repo owns architecture truth; `member-a` owns the Python export implementation and tests.

## How to read this (adapted from source §0)

- **Start with [export.md](export.md). Do not skip it.** CSV defaults and empty-input semantics are settled there; changing either requires a new decision, not an implementation shortcut.
- **The decision docs are the decision log.** Each decision has Context → Decision → Rejected alternatives → Implications. **Treat decisions as settled unless the recorded rationale is invalidated by new facts.**
- **Check [pitfalls.md](pitfalls.md) before proposing anything.** It is a catalog of traps that look like shortcuts; an assistant working on this project should check proposals against that list first.
- **[open-questions.md](open-questions.md) lists the only sanctioned "ask the team" items.** Those are the only places where "it depends" is a valid answer.
- **[export.md](export.md) is the export contract**, including the difference between the intended empty-input behavior and the known implementation defect in plan 0002.

## Index

*Area affinity* names the **member repo** a doc belongs to (`member-a`),
or `cross-area` for shared truth binding several repos — see [plan-home](../process/plan-home.md).

| Doc | Scope | Area affinity |
|---|---|---|
| [export.md](export.md) | Default format and empty-input behavior | member-a |
| [open-questions.md](open-questions.md) | Undecided cross-cutting product questions | cross-area |
| [roadmap.md](roadmap.md) | Delivery sequence and glossary | cross-area |

## Decision map (ratified decisions)

| Decision | Title | File |
|---|---|---|
| D1 | CSV is the default export format | [export.md](export.md#d1--csv-is-the-default-export-format) |
| D2 | Exports never raise on empty input; return an empty document | [export.md](export.md#d2--empty-input-returns-an-empty-document) |


## Pitfall map (P-1..P-n)

All pitfalls live in **[pitfalls.md](pitfalls.md)** (source §10). P-1..P-n, one catalog, greppable as `- **P-1`.

## Section map

- Export semantics: [export.md](export.md).
- Process traps: [pitfalls.md](pitfalls.md).
- Open product decisions: [open-questions.md](open-questions.md).

## Reference stack

Python standard library `csv` and `io`; pytest for executable behavior checks.

## Extension rules

When extending this record, keep the guardrails intact:

- **New decisions** APPEND to the relevant element doc using the same **Context → Decision → Rejected → Implications** structure, with the **next global D-number** (continue past the last ratified number). Keep the heading greppable as `### D<number> —`.
- **Update this README's Decision map** whenever a decision is added or moved.
- **Never delete rejected alternatives** — their recorded failure reasons are the guardrails. New facts that overturn a decision are recorded as a *new* decision that supersedes the old one; the old entry (and its Rejected block) stays.
- **New pitfalls** get the **next global P-number** appended in [pitfalls.md](pitfalls.md) (continue past the last catalogued number), greppable as `- **P-<n>`.
- Archived plans are frozen under `docs/plans/archived/`; no source archive is seeded here.
