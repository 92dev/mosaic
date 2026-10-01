---
description: "Classify governed docs, route knowledge to its durable record through one minting gate, and preserve schemas and history."
---
Read when: editing project-owned ledgers, registries, catalogs, agents, skills, or rules, or another canonical project document; ordinary code and plan prose do not require it.
# Governed records
Scope: project-root and member-repo ledgers and pitfall catalogs where present. Commands below run from the project root.
This file is read at the point of use: every skill step that mutates a governed file says "read `rule://records`" first.
## Doc classes
| Class | Examples | Mutability |
|---|---|---|
| Truth | Architecture element docs (current-state prose; legacy numbered decisions D#), pitfall catalogs (P-x), open questions | Amend in place when the text no longer matches what was decided or realized; an overturned ruling is amended the same way, its provenance in the commit or plan, never a new number. Keep a rejected alternative only while it still guards a path. An entry whose subject no longer exists is removed by a signed-off `skill://mosaic-gap-audit` verdict or the plan that removed the subject, and the same change amends every sentence that still pointed at it; git history is the only archive |
| Process | Project-owned rules, skills, agents | Keep one authoritative project location; select the authorized procedure via `rule://plan-triage` |
| Registry | Plan ledgers, gaps, documentation index tables | Fixed row schema; append rows or change status |
| Archive | `docs/archived/` (read `rule://registries`), `docs/plans/archived/`, `docs/gaps-archive.md`, architecture source records | Frozen once archived; never rewrite or repoint historical records |
## Record routing
| Knowledge | Record | Destination |
|---|---|---|
| Future engineering duty tied to a checkable condition that fires on its own (a path or glob appears, a plan lands, an event occurs) | Obligation (G-x) | Next global G-number in [gaps.md](../gaps.md), with `Trigger:` (or `when:`) naming that path, glob, plan, or event; explain why it is not actionable now and outside current acceptance; at most four physical lines. Verification the plan could not perform (a procedure nobody ran, an environment nobody had) is not a duty: it stays in the plan's Unverified section, and "when someone first does X" is not a trigger |
| A way the next change gets it wrong: a tempting path already ruled out, or a ruling later work must adapt to (a check that lives elsewhere than expected, a default that differs from the obvious one, an edit that is incomplete without its sibling) | Pitfall | The catalog of the repo that owns the subject, following rule 7 and the Pitfalls section below{{MULTI_REPO}}: one member's own trap → `<member>/docs/pitfalls.md`; a cross-repo or devops trap → the link catalog{{/MULTI_REPO}} [pitfalls.md](../architecture/pitfalls.md). Next unused P-number across every catalog |
| Settled ruling nobody has to adapt to (a technology choice, how a subsystem is shaped, a fact of the system) | Current-state prose | The sentence in the owning element doc; the commit or plan is its provenance. No numbered record is minted: `D#` is a legacy form kept citable for rulings already numbered, and a plan-local `D-NNNN-n` that outlives its plan passes through the gate below like any other candidate |
| Genuinely undecided question | Open question | [open-questions.md](../architecture/open-questions.md); promotion to G-x requires a cited human ruling |
| Product flow, feature, raw ideation | Product | [product/](../product/README.md); feature docs use its F-number and milestone conventions |
| No lasting duty, trap, ruling, question, or product information | No retained record | State the reason in the owning plan's Execution log or light-path commit |
## Minting gate
Every candidate tagged record — obligation, pitfall, or a change to a legacy decision — passes one gate, written out with the candidate (its disposition line and the closure packet) and re-derived by its reviewers:
1. **Route:** fires on a future condition? → Obligation; a way to get it wrong? → Pitfall; a fact nobody adapts to? → prose; otherwise Open question, Product, or no retained record with a reason. Defects are repair work, not future obligations. A painful moment with no lesson is a log line, not a record.
2. **Existing record:** search every destination the subject could already have — the catalogs of the touched repos, [gaps.md](../gaps.md), the owning element doc. Same subject and trigger → amend that entry (even when the addition changes how the property is checked); a new id only for a different subject or trigger, citing the neighbour.
3. **Home:** the repo whose code or runbook the prevention changes, and the file in it; a trap met while operating the system (deploying, reading the database, CI, releasing) is devops and belongs to the link.
4. **Shape:** rule 7 for a pitfall; the four-line `Trigger:` shape for an obligation; one sentence for prose.
Record the result as `gate: <Obligation|Pitfall|prose|question|none> — existing: <id or none; where searched> — home: <catalog or doc> — shape: <ok|unchanged|n/a>` (`unchanged`: an existing record already carries the lesson and is kept as is), or `gate: rejected at <step> — <reason>` for a candidate that fails a step; a rejected candidate is not a candidate. One ruling can yield two records — the current-state sentence and the pitfall that tells later work how to adapt — each with its own gate line. Whether a trigger truly fires on its own is the author's judgment here and `skill://mosaic-gap-audit`'s REROUTE verdict later; lint checks only the entry's shape.
Reconciliation (a record disagrees with code or evidence): ruling stands, text wrong → amend the sentence in place and cite the evidence in the owning plan's Execution log; ruling overturned → amend the prose (a legacy D# in place) with the overturn's provenance, and add a pitfall only if someone will be tempted back; subject gone → remove the entry and amend the sentences that pointed at it (a sentence with nothing left to say is deleted); question narrowed → append the evidence, keep the question and its owner; pitfall disproved → amend its trap and prevention with the new measurement. Do not defer a known contradiction to a later decision.
Lifecycle and reassessment: read `rule://verification`; close-out defect checks and dispositions: read `skill://mosaic-execute`. Closure document alignment is `skill://mosaic-execute` step 8.
## Pitfalls
- A pitfall is a lesson and how to avoid it, kept only while the trap can be walked into: removed when its subject goes, never archived, never summarized into a retired list.
- Nothing cites a pitfall: no element doc, plan Context, checklist, decision, or gap names a P-number — prose outlives entries. A plan that intends to produce one states its trap and prevention and no number; a review check restates the trap as the check itself. Numbers are handles for scouts, reviewers, audits, gate lines (log provenance, never prose), and a catalog entry naming its neighbour — unique across every catalog, never reused. A citation written before this rule stays until its sentence is next amended or its entry removed; checkup reports one that dangles.
- {{MULTI_REPO}}Each member keeps its own catalog at `<member>/docs/pitfalls.md` (its own traps, edited on its own branches); the link catalog holds cross-repo and devops traps; an entry in the wrong catalog is moved by an audit verdict. {{/MULTI_REPO}}Scouts search every catalog of the repos in scope and name the catalog in each hit (read `rule://registries`).
## Rules
1. Match the existing row, entry, and header schema; count columns before and after. If it cannot express the change, stop for a separately decided schema change.
2. Never compress, summarize, or drop a sole-record row; compression requires a retained link demonstrably containing the full record.
3. Renames and slug changes are reviewed per-file edits; resolve every inbound link after a path change using both R5/R8 frames in `rule://plan-home`. Never run blind text operations across doc trees: a name fragment can also match unrelated agent filenames.
4. Every canonical section states its governing repos or components; commands work from every referring file's frame.
5. Search for the canonical statement before writing; when it exists, add a pointer and a "read when" gate. Accurate copies still drift.
6. Rules, skills, agents, hooks, and tools change only as their own planned work, never inside the task that runs under them: note the proposed change in the brief or Execution log and continue under the current text. A project-owned addition (new agent, skill, or rule) follows its neighbours' conventions and the checks in `rule://verification`.
7. A new pitfall states the trap and prevention in at most four physical lines (checked before approval is sought); its measured cite names the observed attempt and result, not a dated code snapshot, with extended evidence in the owning plan or gap.
8. Review governed diffs against the checklist below.
9. Put dates, who-decided, observations, and measurements in the commit or owning run/plan log; docs carry the current rule. Exception: a terse evidence citation needed to prevent reversal of a counterintuitive rule, such as a pitfall.
10. A ruling with reach beyond the diff is recorded only when the same change routes it through the gate; a commit is provenance. Choices limited to the change may stay on its branch.
11. Query live state; document how to ask, never the current answer. Registries describe subjects and obligations rather than events.
## Reviewer checklist
Class and mutability respected; schema preserved or explicitly the subject; sole records intact; touched links resolve from their own files; canonical scope explicit; every proposed record carries its gate line and the reviewer re-derives all four steps rather than checking shape alone.
Do not add process requirements mid-task; process changes are their own planned work (rule 6).
