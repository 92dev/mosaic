# Plans Ledger

Choose the work procedure via [plan-triage](../process/plan-triage.md); [plan-home](../process/plan-home.md#r1r8) is canonical for numbering, homing, local ledgers, and status truth.
This master ledger indexes every plan in every repo; lifecycle: `draft → approved → executing → review → done`, or `abandoned`.

| # | Title | Status | Target repo | Branch | Landed commit |
|---|---|---|---|---|---|
| [0001](archived/0001-scaffold-member-a.md) | Scaffold member-a | done | member-a, link-repo | `task/0001-scaffold-member-a` | `member-a:0001` |
| [0002](../../member-a/docs/plans/0002-empty-export-handling.md) | Empty export handling | executing | member-a | `task/0002-empty-export-handling` | — |
| [0003](0003-export-format-option.md) | Export format option | draft | member-a, link-repo | `task/0003-export-format-option` | — |
| [0004](../../member-a/docs/plans/0004-empty-export-fix.md) | Empty export fix | review | member-a | `task/0004-empty-export-fix` | — |


## Ledger notes
- Numbering, homing, local ledgers, and status truth are canonical in [plan-home](../process/plan-home.md#r1r8) (R1–R8).
- Rows here are one-line abstracts; each plan doc holds its detail. Exception: a row whose plan
  has no doc (light-path work, e.g. a mechanical path migration, or a plan not yet authored) carries its scope in
  the row — there it IS the record.
- New plans use `/mosaic-plan` from [TEMPLATE.md](TEMPLATE.md); the [ledger lint](../../.omp/hooks/post/lint-ledgers.ts) rejects schema mismatches and skips archived records. Read [verification](../process/verification.md#local-gates) when invoking it on this ledger or an id registry.
