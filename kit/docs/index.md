# Documentation Index — {{PROJECT_NAME}}
## Document registry
| Document | Purpose | Read when |
|---|---|---|
| [architecture/README.md](architecture/README.md) | Architecture index, decisions, extension rules | Orienting or making a technical proposal |
| [architecture/pitfalls.md](architecture/pitfalls.md) | Known traps | Selected by the procedure in `rule://registries` |
| [architecture/open-questions.md](architecture/open-questions.md) | Undecided product questions | Resolving product scope |
| [product/README.md](product/README.md) | Product flows, maturity, promotion | Product work or information ingestion |
| [gaps.md](gaps.md) | Active conditional obligations | Scoped selection via `rule://registries` |
| [gaps-archive.md](gaps-archive.md) | Closed obligation evidence | Auditing a closed entry |
| [plans/README.md](plans/README.md) | Master ledger for every repo | Reserving a number or locating a plan |
| [plans/TEMPLATE.md](plans/TEMPLATE.md) | Plan schema | Authoring a plan |
{{TRACKING_LOCAL}}| `/mosaic-intake` | Read-only request investigation and human digest | Investigating an external request |
{{/TRACKING_LOCAL}}{{TRACKING_MCP}}| `/mosaic-intake` | Read-only request investigation and human digest | Investigating an external request |
{{/TRACKING_MCP}}| `/mosaic-checkup`, [sweep tool](../tools/checkup.ts) | Deterministic drift sweep and human digest (`bun tools/checkup.ts [--root dir] [--json]`; exits 0 PASS / 1 findings / 2 CANNOT-EVALUATE) | Checking project records |
{{TRACKING_LOCAL}}| `tracker-scout` | Complete active-intent collision report | Planning shared paths or contracts |
| [local tracker inventory](tracker/items.json) | Recorded items, discussion, and managed intent | Following local tracking mode |
{{/TRACKING_LOCAL}}{{TRACKING_MCP}}| Runtime MCP server `{{MCP_SERVER}}` | Live intent, discussion, and intake through runtime tools | Following MCP tracking mode in the [tracker rule](process/tracker.md) |
{{/TRACKING_MCP}}| [Maintaining the kit](kit/maintenance.md) | `/mosaic-kit`: recorded adaptations, project harness additions, model roles, upgrades | Explicitly requested kit maintenance only |
## Process rules
| Rule | Purpose | Read when |
|---|---|---|
| [map](process/map.md) | Roles and lifecycle | Before any change |
| [plan-triage](process/plan-triage.md) | Inline, light, or planned work | Selecting the procedure |
| [intake](process/intake.md) | Request evidence, risk, and proposed dispositions | Investigating an external request |
| [tracker](process/tracker.md) | Installed tracking mode, coordination authority, writer discipline, and operations | Intent, collision checks, intake writeback, lifecycle events |
| [git-flow](process/git-flow.md) | Target-repo branch and landing commands | Branching, committing, landing |
| [dispatch](process/dispatch.md) | Bounded task and parallel ownership | Authoring tasks or dispatching executors |
| [review-loop](process/review-loop.md) | Verdicts and correction cycle | Reviewing tasks or findings |
| [verification](process/verification.md) | Evidence and registry lifecycle | Writing/running verification or interpreting a failure |
| [records](process/records.md) | Doc classes, routing, schemas | Editing a governed file |
| [registries](process/registries.md) | Scope-based reading | Checking records or unfamiliar areas |
| [plan-home](process/plan-home.md) | Homes, numbering, ledgers, paths | Preparing a plan or syncing status |
| [stack](process/stack.md) | {{MULTI_REPO}}Member{{/MULTI_REPO}}{{MONOREPO}}Component{{/MONOREPO}} commands | Selecting a command |
| [human-gates](process/human-gates.md) | Human decision briefs | Approval request, leftovers or intake digest, sign-off |
| [writing-for-the-reader](process/writing-for-the-reader.md) | Explanation defects | Rewriting a human brief |
| [targeted-tests](process/targeted-tests.md) | Execute/review test scope | Executor or reviewer work; role-scoped injection |
| [records-guard](process/records-guard.md) | Governed-edit reminder | Before matching edits/writes; interrupt-scoped |
| [mosaic-core](process/mosaic-core.md) | Integrity, authority, evidence | Always applied |
| [model-notes](process/model-notes.md) | Deferred family prompts | Model configuration; human decides placement |
## Repo map
| Path | Contents |
|---|---|
| Project entry | Current runtime's authority and session instructions |
| `docs/architecture/`, `docs/product/` | Project decisions and product information |
| `docs/plans/`, `docs/gaps.md`, `docs/gaps-archive.md` | Work and obligation records |
| `docs/process/` | Project process rules |
| Installed runtime | Rules, skills, agents, and hooks |
| `tools/` | Deterministic project-facing checks |
{{MEMBERS}}
## Local checks
Run from the link-repo root; read `rule://verification` for evidence handling and gate coverage.
{{TRACKING_LOCAL}}Local inventory and write operations have one command home: the [tracker rule](process/tracker.md).
{{/TRACKING_LOCAL}}{{TRACKING_MCP}}Runtime MCP inventory and writes follow the [tracker rule](process/tracker.md); no local tracker checks are installed.
{{/TRACKING_MCP}}
## Conventions
- Write self-sufficient docs for a reader with zero session context; read `rule://human-gates` at human decisions.
- Source precedence is in the entrypoint.
