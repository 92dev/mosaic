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
| Truth | Architecture decisions (D#), pitfalls (P-x), open questions | Amend in place when the text misdescribes what was decided or realized and the ruling stands; supersede with a new D# when the ruling itself changes; append evidence under an open question without rewording it. Preserve rejected alternatives. A decision or pitfall whose subject no longer exists is archived (section to `docs/architecture/archived/<element doc>.md` and its map row to `decisions-archive.md`; pitfall entry to `pitfalls-archive.md`; each under an `**Archived:**` reason) only by a signed-off `skill://mosaic-gap-audit` verdict or the superseding plan, never deleted; a number allocated before ratification is a `Reserved by plan NNNN` map row |
| Process | Project-owned rules, skills, agents | Keep one authoritative project location; select the authorized procedure via `rule://plan-triage` |
| Registry | Plan ledgers, gaps, documentation index tables | Fixed row schema; append rows or change status |
| Archive | `docs/archived/` (read `rule://registries`), `docs/plans/archived/`, `docs/gaps-archive.md`, `docs/architecture/pitfalls-archive.md`, `docs/architecture/decisions-archive.md`, `docs/architecture/archived/`, architecture source records | Frozen once archived; never rewrite or repoint historical records |
## Record routing
| Knowledge | Record | Destination |
|---|---|---|
| Settled ruling with reach beyond the current change | Decision | Next global D# in its [element doc](../architecture/README.md#extension-rules), following Context → Decision → Rejected → Implications; update the decision map. Promote a plan-local D-NNNN-n when it outlives its plan |
| Future engineering duty tied to a checkable condition that fires on its own (a path or glob appears, a plan lands, an event occurs) | Obligation (G-x) | Next global G-number in [gaps.md](../gaps.md), with `Trigger:` (or `when:`) naming that path, glob, plan, or event; explain why it is not actionable now and outside current acceptance; at most four physical lines. Verification the plan could not perform (a procedure nobody ran, an environment nobody had) is not a duty: it stays in the plan's Unverified section, and "when someone first does X" is not a trigger |
| Tempting wrong path already ruled out | Pitfall | Next global P-number in [pitfalls.md](../architecture/pitfalls.md), following rule 7 |
| Genuinely undecided question | Open question | [open-questions.md](../architecture/open-questions.md); promotion to G-x requires a cited human ruling |
| Product flow, feature, raw ideation | Product | [product/](../product/README.md); feature docs use its F-number and milestone conventions |
| No lasting decision, duty, trap, question, or product information | No retained record | State the reason in the owning plan's Execution log or light-path commit |
Routing test: settled? → Decision; fires on a future condition? → Obligation; warns against a tempting wrong path? → Pitfall; otherwise Open question, Product, or no retained record with a reason. Defects are repair work, not future obligations. Whether a trigger truly fires on its own is the author's judgment here and `skill://mosaic-gap-audit`'s REROUTE verdict later; lint checks only the entry's shape.
Reconciliation test (a record disagrees with code or evidence): ruling stands, text wrong → amend the sentence in place and cite the evidence in the owning plan's Execution log; ruling overturned → new superseding D#, old entry stays; ruling's subject gone → archive the decision with the reason; question narrowed → append the evidence, keep the question and its owner; pitfall disproved → amend its trap/prevention with the new measurement; pitfall's subject gone → archive it with the reason. Do not defer a known contradiction to a later decision.
Before minting an entry, search its destination for an existing record. When subject and trigger match, amend that entry (even when the addition changes how the property is checked); mint a new id only for a different subject or a different trigger, citing the neighbour. Lifecycle and reassessment: read `rule://verification`; close-out defect checks and dispositions: read `skill://mosaic-execute`.
Closure document alignment is `skill://mosaic-execute` step 8.
## Rules
1. Match the existing row, entry, and header schema; count columns before and after. If it cannot express the change, stop for a separately decided schema change.
2. Never compress, summarize, or drop a sole-record row; compression requires a retained link demonstrably containing the full record.
3. Renames and slug changes are reviewed per-file edits; resolve every inbound link after a path change using both R5/R8 frames in `rule://plan-home`. Never run blind text operations across doc trees: a name fragment can also match unrelated agent filenames.
4. Every canonical section states its governing repos or components; commands work from every referring file's frame.
5. Search for the canonical statement before writing; when it exists, add a pointer and a "read when" gate. Accurate copies still drift.
6. Rules, skills, agents, hooks, and tools change only as their own planned work, never inside the task that runs under them: note the proposed change in the brief or Execution log and continue under the current text. A project-owned addition (new agent, skill, or rule) follows its neighbours' conventions and the checks in `rule://verification`.
7. A new project pitfall states the trap and prevention in at most four physical lines (checked before approval is sought); its measured cite names the observed attempt and result, not a dated code snapshot, with extended evidence in the owning plan or gap.
8. Review governed diffs against the checklist below.
9. Put dates, who-decided, observations, and measurements in the commit or owning run/plan log; docs carry the current rule. Exception: a terse evidence citation needed to prevent reversal of a counterintuitive rule, such as a pitfall.
10. A ruling with reach beyond the diff is recorded only when the same change routes it through the table; a commit is provenance. Choices limited to the change may stay on its branch.
11. Query live state; document how to ask, never the current answer. Registries describe subjects and obligations rather than events.
## Reviewer checklist
Class and mutability respected; schema preserved or explicitly the subject; sole records intact; touched links resolve from their own files; canonical scope explicit.
Do not add process requirements mid-task; process changes are their own planned work (rule 6).
