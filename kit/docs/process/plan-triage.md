---
description: "Choose direct mechanical work, a light execution loop, or a plan for an open auditable decision."
---
Read when: choosing how a project request, including project-owned documentation changes, should be carried out.{{MONOREPO}} In this monorepo, target `link-repo`; member iteration and local-ledger steps are empty, not prerequisites.{{/MONOREPO}}
# Choose the work procedure
| Procedure | When | Work and records |
|---|---|---|
| Inline | Mechanical or obvious edit with no design choice: typo, wording, link fix, formatting, relocating a completed plan | Orchestrator edits directly on an open or short-lived branch, checks the diff and the affected test if code changes, then lands per `rule://git-flow`; no executor, reviewer, scout, registry or architecture check, plan doc, or number |
| Light path | Trivial but real work: small bugfix, minor UI change, minor-risk implementation, or a direction already decided | Use the loop in `rule://map`; a short-lived `fix/<slug>` branch when no applicable branch is open |
| Plan | Open judgment whose resolution needs an auditable decision | Read `skill://mosaic-plan`; honor an explicit human request for a plan on borderline work |
## Six cases that do not need a new plan
1. A fix inside an active plan: reviewer findings, verification failures, and scoped corrections stay on its branch and in its Execution log; read `rule://review-loop`.
2. Refining a draft, including adversary-driven changes: edit that draft; no plan to change the plan being authored.
3. Work already covered by an approved plan's Scope and `files:`: use that plan and extend its Execution log.
4. Mechanical or obvious edits: use Inline above; an existing open branch is allowed.
5. Data-only ingestion: use the exemption below.
6. Implementing a direction the human already chose in this session or a recorded prior one: record the decision and rationale on the branch and use Inline or Light path as appropriate. Read `rule://records` for any ruling that extends beyond this change. An unresolved approach or work expanding beyond the decided change still needs triage.
## Two-step test when unsure
1. Is a decision still open? If the human already decided, record that decision and use Inline for mechanical work or Light path for real implementation.
2. If open, must a future session be able to audit its resolution? Yes → Plan. No → resolve the routine choice on the current branch, using the light loop when implementation needs it.
Say which lighter procedure applies; do not author a plan from habit. Small implementation choices are decided without asking.
## Light-path records and early exits
- Present finished work. For a choice owned by the human or ticket reporter, state the chosen default and its implications.
- No plan doc, Planning log, formal approval ceremony, ledger row, or number by default; record the decision on the branch.
- Claim a number and row only at close if the outcome leaves a decision worth auditing or the human directs it; the docless row carries the full scope. Read `rule://plan-home` for the ledger contract; eager reservation applies only to authored plans.
- Early exits are self-serve: note the one-line reason in the commit, without a human waiver or Planning-log entry.
- No decision surface to challenge → skip the adversary; negligible change since the last review or challenge round → convergence; reviewer-clean → land immediately per `rule://review-loop`.
- Full planning uses its own recorded breaks and human-granted waiver; read `skill://mosaic-plan`.
## Data-only ingestion
Information added without acting on code or behavior—product/external notes, concepts, ideation—gets no plan, ledger row, or agent dispatch.
The orchestrator handles it inline with the human directing in-session, on `docs/<slug>`; read `rule://git-flow` for landing.
When the material is coupled to a real change, triage that change and reference the ingested material as context.
