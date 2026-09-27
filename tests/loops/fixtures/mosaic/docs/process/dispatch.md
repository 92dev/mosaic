---
description: "Bound each executor to one explicit task and parallelize only independent file ownership."
---
Read when: breaking down work or dispatching executors.
# Who acts in each phase
The role is fixed by the phase, not by the kind of file touched; task class selects review, not who implements.
| Phase | Acts | Never |
|---|---|---|
| Planning (`/mosaic-plan`) | orchestrator drafts; `context-scout`/`registry-scout`/`tracker-scout` read | executor, reviewers |
| Task implementation (`/mosaic-execute` steps 3–4) | `executor` per task (code, tests, or documents alike); reviewers per task class below | orchestrator editing task files |
| REVISE repair | `executor` re-dispatched with the findings, or the orchestrator for a mechanical correction (read `rule://review-loop`) | reviewers editing |
| Close-out (`/mosaic-execute` steps 7–9) | orchestrator writes dispositions, the Execution log, and mechanical corrections; `librarian` proposes doc alignment; both reviewers review the closure packet | `executor` (except a REVISE repair of a plan task) |
| Landing and registry sync (`/mosaic-execute` steps 10–13) | orchestrator | agents |
# Task contract
| Field | Required content |
|---|---|
| `class:` | `code` (default when omitted) or `docs` |
| `files:` | Exact paths the task may create or modify; touching another path fails the task |
| `reads:` | Minimal documents and files needed for context; governed edits include `rule://records` |
| `instructions:` | Precise steps with design decisions settled upstream |
| `acceptance:` | Observable results |
Read `rule://plan-home` R5 for path relativity and per-task `repo:`; tasks use that frame even when dispatched into another target repo.
- For `class: docs`, `acceptance:` is ledger lint, `bun tools/doctor.ts`, and `bun tools/checkup.ts`, plus a source citation (archive or code path) on every new statement. Whole-tree gates follow the join rule below.
- A `docs` task wave gets exactly one reviewer cross-family to the executor's resolved `@templated` model: GPT → `claude-reviewer`; Claude → `gpt-reviewer`. Resolve the role from the project's model settings, not the agent's name. Group review waves by class.
- `code` task waves and every closure packet require both `claude-reviewer` and `gpt-reviewer`, independently, in parallel. In Claude Code, use its `reviewer` body for each reviewer role with the corresponding model; unavailable models follow `rule://review-loop`, never a silent single-reviewer closure.
# Dispatch
- Parallelize only when resolved `files:` sets are disjoint; overlap runs sequentially. Per-task acceptance may not depend on a sibling's output still in flight: whole-tree gates (doctor, checkup, link checks) run once after the wave joins, not inside each parallel task. Files in different repos are distinct even when repo-relative strings match.
- Give the executor only its verbatim task block, the plan's Context, its `reads:`, acceptance criteria, and the repo it runs in. Exclude the whole plan and sibling tasks.
- Every execute/review dispatch must read [targeted-tests](targeted-tests.md) (loaded automatically inside executor and reviewer agents; the main session reads the file); agent loading supplies the same rule automatically where supported.
- Ambiguity, contradiction with observed repo state, or a needed architectural decision → STOP and report the exact conflicting task/rule clause and observation. Routine choices with no observable difference stay with the executor.
- The orchestrator resolves the reported conflict, records the resolution in the Execution log, and re-dispatches; ask the human only under the entrypoint's precedence contract.
- Dispatch through the active runtime's native agent mechanism; send follow-ups to the same agent where supported so it retains context.
