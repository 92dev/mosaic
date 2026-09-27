---
description: "Start here for roles, status transitions, work selection, and the rules to read at each step."
---
Read when: starting any change in Fixture.
# Process map
Read [the documentation index](../index.md) for project documents and [the architecture entry](../architecture/README.md) for proposal checks; read `rule://registries` before selecting registry entries.
## Roles
| Role | Work |
|---|---|
| Orchestrator | Main session: researches, authors plans, dispatches, rules, verifies, and lands changes |
| plan-adversary | Attacks draft feasibility, decomposition, decisions, and verification; challenges only |
| executor | Implements one authorized task block |
| Reviewers | Independently check the diff and return verdicts as required by the active runtime's review procedure |
| registry-scout | Filters standing records by scope; returns identifiers and pointers |
| context-scout | Briefs a code/doc area with concepts, excerpts, and pointers |
| Human | Approves plans, signs off results, owns overrides and hook escape decisions |
## Lifecycle
`draft → approved → executing → review → done / abandoned`
| Transition | Who flips | Where it lands |
|---|---|---|
| Create `draft` | Orchestrator via `/mosaic-plan` | Home plan + reserved master row; member plans also get a local row |
| `draft → approved` | Human only; orchestrator records verbal approval | First task-branch commit, or a docs branch landed on main |
| `approved → executing` | Orchestrator | First task-branch commit |
| `executing → review` | Orchestrator after task approvals and recorded Verification output | Task-branch commit |
| `review → done` | Human sign-off; orchestrator records it | Task-branch commit and archive, then land; ledger sync per `rule://plan-home` |
| Any status `→ abandoned` | Orchestrator or human; one-line reason | Archive in the home repo; mark and repoint ledger rows |
## Work selection
Read `rule://plan-triage` to choose inline mechanical work, the light path, or a numbered plan.
The light path is still a loop: in-memory plan → executor → commit → reviewer (base..head) → corrections → re-review → land.
It omits the plan doc and formal planning approvals; read `rule://plan-triage` for recording and early exits.
## Read at the step
| Need | Read |
|---|---|
| Decide whether a plan is needed | `rule://plan-triage` |
| Branch, commit, land | `rule://git-flow` |
| Bound executor work and parallel waves | `rule://dispatch` |
| Review inputs, verdicts, retries, conflicts | `rule://review-loop` |
| Verification, Unverified, durable evidence | `rule://verification` |
| Route knowledge or change governed files | `rule://records` |
| Find relevant registries or code context | `rule://registries` |
| Plan home, numbering, ledgers, paths | `rule://plan-home` |
| Project commands | `rule://stack` |
| Approval request, leftovers digest, sign-off brief | `rule://human-gates` |
| Repair an explanation for its reader | `rule://writing-for-the-reader` |
A citation loads nothing: read the named rule before the dependent action. Load it using the active runtime's rule-reading mechanism.
## Orchestrator decisions
Decide and move: gather what the call needs, rule, and act.
Do not reopen an approved question, a ruled challenge, or authorized scope without new contradictory evidence or a human override.
Escalate on a real ambiguity or contradiction; discomfort alone does not reopen the decision.
