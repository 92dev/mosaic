# Plans Ledger

Every non-trivial change starts as a plan doc; [workflow.md §8](../workflow.md#8-link-repo--member-repos) is canonical for numbering, homing, local ledgers, and status truth.
This master ledger indexes every plan in every repo; lifecycle: `draft → approved → executing → review → done`, or `abandoned`.

| # | Title | Status | Target repo | Branch | Landed commit |
|---|---|---|---|---|---|
| [0001](archived/0001-scaffold-member-a.md) | Scaffold member-a | done | member-a, link-repo | `task/0001-scaffold-member-a` | `member-a:0001` |
| [0002](../../member-a/docs/plans/0002-empty-export-handling.md) | Empty export handling | executing | member-a | `task/0002-empty-export-handling` | — |
| [0003](0003-export-format-option.md) | Export format option | draft | member-a, link-repo | `task/0003-export-format-option` | — |


## Ledger notes
- Numbering, homing, local ledgers, and status truth are canonical in [workflow.md §8](../workflow.md#8-link-repo--member-repos) (R1–R8).
- Rows here are one-line abstracts; each plan doc holds its detail. Exception: a row whose plan
  has no doc (light-path work, e.g. a mechanical path migration, or a plan not yet authored) carries its scope in
  the row — there it IS the record.
- New plans use `/palladio-plan` from [TEMPLATE.md](TEMPLATE.md); the [lint-ledgers hook](../../.claude/hooks/lint-ledgers.sh) rejects schema mismatches and skips archived records. It also lints **this ledger** (duplicate plan numbers, a row with no status cell) and the gaps/pitfalls/decision registries — id uniqueness being the load-bearing check. It takes the path from a `PostToolUse` JSON payload on stdin **or from argv**, so verifying by hand is just `sh .claude/hooks/lint-ledgers.sh <path>`.
