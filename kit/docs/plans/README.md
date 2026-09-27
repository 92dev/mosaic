# Plans Ledger

Choose the work procedure via [plan-triage](../process/plan-triage.md); [plan-home](../process/plan-home.md#r1r8) is canonical for numbering, homing, local ledgers, and status truth.
This master ledger indexes every plan in every repo; lifecycle: `draft → approved → executing → review → done`, or `abandoned`.

| # | Title | Status | Target repo | Branch | Landed commit |
|---|---|---|---|---|---|


## Ledger notes
- Numbering, homing, local ledgers, and status truth are canonical in [plan-home](../process/plan-home.md#r1r8) (R1–R8).
- Rows here are one-line abstracts; each plan doc holds its detail. Exception: a row whose plan
  has no doc (light-path work, e.g. a mechanical path migration, or a plan not yet authored) carries its scope in
  the row — there it IS the record.
- New plans use `/mosaic-plan` and [TEMPLATE.md](TEMPLATE.md); governed edits are checked by the installed hooks. Read [verification](../process/verification.md#local-gates) for applicable project checks.
