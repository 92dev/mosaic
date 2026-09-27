# Mistake tolerance per scenario

Source of the tiers: the harness rule `docs/process/model-notes.md` (fixture). The cohort scorer applies them: a `none` cell with any FAIL is `worse` whatever it costs; a `high` cell is scored on cost once its checks pass; `low`/`medium` cells need all checks and are then compared on cost and findings.

| Scenario | Role exercised | Tolerance |
|---|---|---|
| S1 close-out, S3 registry edit, S9 closure | close-out / records | none |
| S6 plan, S12 collision, S14 overbearing review | planner + adversary | none |
| S7 intake, S10 writer conflict, S8 intent | intake / tracker discipline | low |
| S2 approval brief, S4 typo, S11/S13 checkup | orchestrator small work | low |
| S5a/S5b executor probes | executor | high |
| S15a/S15b scout probes | scouts | medium |
