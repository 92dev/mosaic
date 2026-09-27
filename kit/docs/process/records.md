---
description: "Classify governed docs, route knowledge to its durable record, and preserve schemas and history."
---
Read when: editing project-owned ledgers, registries, agents, skills, or rules, or another canonical project document; ordinary code and plan prose do not require it.
# Governed records
Scope: project-root and member-repo ledgers where present. Commands below run from the project root.
This file is read at the point of use: every skill step that mutates a governed file says "read `rule://records`" first.
## Doc classes
| Class | Examples | Mutability |
|---|---|---|
| Truth | Architecture decisions (D#), pitfalls (P-x) | Append or amend through a recorded decision; preserve rejected alternatives |
| Process | Project-owned rules, skills, agents | Keep one authoritative project location; select the authorized procedure via `rule://plan-triage` |
| Registry | Plan ledgers, gaps, documentation index tables | Fixed row schema; append rows or change status |
| Archive | `docs/archived/` (read `rule://registries`), `docs/plans/archived/`, `docs/gaps-archive.md`, architecture source records | Frozen once archived; never rewrite or repoint historical records |
## Record routing
| Knowledge | Record | Destination |
|---|---|---|
| Settled ruling with reach beyond the current change | Decision | Next global D# in its [element doc](../architecture/README.md#extension-rules), following Context → Decision → Rejected → Implications; update the decision map. Promote a plan-local D-NNNN-n when it outlives its plan |
| Future engineering duty tied to a checkable condition | Obligation (G-x) | Next global G-number in [gaps.md](../gaps.md), with `Trigger:` (or `when:`) naming a path, glob, plan, or event; explain why it is not actionable now and outside current acceptance |
| Tempting wrong path already ruled out | Pitfall | Next global P-number in [pitfalls.md](../architecture/pitfalls.md), following rule 7 |
| Genuinely undecided question | Open question | [open-questions.md](../architecture/open-questions.md); promotion to G-x requires a cited human ruling |
| Product flow, feature, raw ideation | Product | [product/](../product/README.md); feature docs use its F-number and milestone conventions |
| No lasting decision, duty, trap, question, or product information | No retained record | State the reason in the owning plan's Execution log or light-path commit |
Routing test: settled? → Decision; fires on a future condition? → Obligation; warns against a tempting wrong path? → Pitfall; otherwise Open question, Product, or no retained record with a reason. Defects are repair work, not future obligations.
Before minting an entry, search its destination for an existing record. When subject and trigger match, amend that entry (even when the addition changes how the property is checked); mint a new id only for a different subject or a different trigger, citing the neighbour. Lifecycle and reassessment: read `rule://verification`; close-out defect checks and dispositions: read `skill://mosaic-execute`.
Closure document alignment is `skill://mosaic-execute` step 8.
## Rules
1. Match the existing row, entry, and header schema; count columns before and after. If it cannot express the change, stop for a separately decided schema change.
2. Never compress, summarize, or drop a sole-record row; compression requires a retained link demonstrably containing the full record.
3. Renames and slug changes are reviewed per-file edits; resolve every inbound link after a path change using both R5/R8 frames in `rule://plan-home`. Never run blind text operations across doc trees: a name fragment can also match unrelated agent filenames.
4. Every canonical section states its governing repos or components; commands work from every referring file's frame.
5. Search for the canonical statement before writing; when it exists, add a pointer and a "read when" gate. Accurate copies still drift.
6. Kit-owned files (`docs/process/*`, kit skills, agents, hooks, tools) are not edited from an ordinary project session. Propose a kit change, or use `/mosaic-kit` for explicitly authorized kit maintenance or project adaptations; record adaptations in `docs/mosaic-migration/kit-adaptations.md`. For project-owned additions, follow neighboring project conventions and run the checks applicable to the changed project files.
7. A new project pitfall states the trap and prevention; cite project evidence when available and keep extended evidence in the owning plan or gap.
8. Review governed diffs against the checklist below.
9. Put dates, who-decided, observations, and measurements in the commit or owning run/plan log; docs carry the current rule. Exception: a terse evidence citation needed to prevent reversal of a counterintuitive rule, such as a pitfall.
10. A ruling with reach beyond the diff is recorded only when the same change routes it through the table; a commit is provenance. Choices limited to the change may stay on its branch.
11. Query live state; document how to ask, never the current answer. Registries describe subjects and obligations rather than events.
## Reviewer checklist
Class and mutability respected; schema preserved or explicitly the subject; sole records intact; touched links resolve from their own files; canonical scope explicit.
Do not add new process requirements mid-task; kit-owned changes follow rule 6, not the project work-selection procedure.
