# Documentation rebuild brief template

The install skill fills this into target `docs/docs-migration-instructions.md` (≤ 120 lines), removes these instructions, and replaces angle-bracket fields with surveyed facts; do not invent counts or status.
Keep the resulting brief indexed. It is input to `/mosaic-plan docs-rebuild`, not an approved plan or a migration execution task.

---
description: "Rebuild the active documentation network from cutoff history."
sources: ["<archive README path>", "<concept-alignment report path>"]
---
# Rebuild current documentation

## Starting point
- Cutoff commit: `<sha>`; archive: `<archive root>`; H0/exceptions: `<ruling link>`.
- Read `<archive README>`, `<survey inventory>`, `<alignment report>`, and `<kit-adaptations record>` first.
- Invoke `/mosaic-plan docs-rebuild` and supply this brief. Reserve plan `0001` under the normal plan/ledger rules; installation did not claim a numbered plan or approve the rebuild.
- Scope: documentation only, reconstructing a maintainable current-state network; no product implementation, history rewriting, or automatic revival of old gaps/defects.

## Archive inventory
| Family | Archive path(s) | Files | What must be assessed |
|---|---|---:|---|
| Architecture / ADRs / diagrams | <paths> | <count> | Current elements, decisions, superseded alternatives |
| Product / PRDs | <paths> | <count> | Features, flows, current maturity and contracts |
| PR-document corpus / plans / ledgers | <paths> | <count> | Decision evidence, never assumed current status |
| Gaps / defects / pitfalls | <paths> | <count> | Evidence and triggers, not a migration backlog |
| Stack / process / runbooks / other docs | <paths> | <count> | Commands, operational constraints, glossary/assets |
Add every surveyed family, including component documentation; reconcile totals with the nothing-lost ledger. Name retained exceptions separately: `<paths and reasons>`.

## Proposed active network
- Architecture map in `docs/architecture/README.md`; element docs with YAML `affinity: [link-repo]` (or actual member names / `cross-area`), next global D-entries, and decision-map links.
- Product F-docs plus registry, with YAML `contracts: [...]` and `repos: [...]`, observed status, inherited decisions, and explicit open questions.
- Stack and process documents with observed commands/cwd, actual default branch/landing policy, safety constraints, and links to retained runbooks.
- `docs/architecture/open-questions.md` for unknown/contradictory status; a complete `docs/index.md` linking the active network and the separate History section.
- Decide exact paths/owners before drafting; add YAML frontmatter and archived-source citations to every rebuilt active doc, including indexes and open-question records.

## Extraction and minting rules
- Every active statement cites `archived: <path>#<heading>` (or line range) and is verified against current code/config/tests or an explicit current ruling. An archived assertion alone is not current truth.
- Superseded material stays archived; preserve rejected alternatives as evidence. Unknown or contradictory status becomes an open question, never a fact or invented approval.
- Mint gaps/pitfalls only when current evidence supports them; search for duplicates first. A gap requires a checkable `when:`, provenance, and why it is not actionable now; a pitfall needs a trap, prevention rule, and measured cite.
- Defects go to the existing tracker with reproducer/evidence, not gaps; do not invent a tracker identity or perform live writes without authorization. No old gap/defect table is copied into an active index.
- New ledgers start with rebuild plan `0001`; retain old IDs/approvals only in the archive. Use normal plan reservation, approval, execution, and review gates.

## Proposed task split
| Task | Family / output | Rough size | Dependencies |
|---|---|---|---|
| T1 | Inventory reconciliation + active architecture map | <files / S-M-L> | none |
| T2 | Architecture element docs + D-entry evidence | <files / S-M-L> | T1 |
| T3 | Product F-docs + contract metadata | <files / S-M-L> | T1; T2 decisions |
| T4 | Stack/process/runbooks + open questions + evidence-only records | <files / S-M-L> | T1; T2/T3 findings |
| T5 | Index/ledger integration + verification | <files / S-M-L> | T2-T4 |
Split large families further; each task names exact `files:`, `reads:`, source families, and observable acceptance.

## Acceptance
- Every archive family is accounted for; the active index is complete, links resolve, and History still includes the PR-document corpus.
- Every rebuilt active doc has valid frontmatter and source citations; architecture `affinity:` and product `contracts:` / `repos:` use the kit schemas.
- `bun tools/doctor.ts`, every governed registry/active-plan lint, and `bun tools/checkup.ts --json` exit 0; retain outputs and actual exit codes.
- `bun tools/docimpact.ts <rebuild-plan-path>` evaluates all six classes with empty `cannotEvaluate`; candidates are reviewed, not assumed obsolete.
- Archive bytes, modes, and symlink targets are unchanged from the cutoff inventory (including its README baseline); verify by hashes/diff, not an assertion.
- Unknowns remain explicit questions, evidence-only records follow their schemas, and the plan/ledgers report only verified status.
