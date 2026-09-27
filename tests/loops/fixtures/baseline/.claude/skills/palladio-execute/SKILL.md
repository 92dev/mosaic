---
name: palladio-execute
description: Execute an approved plan doc end-to-end - branch in every targeted repo, dispatch executor agents, review with the reviewer agent, verify, merge to main in each targeted repo. Plan docs may live in a member repo (member-homed) or the link repo (link-homed / cross-repo). Argument: path to the plan doc (e.g. docs/plans/0003-export-format-option.md or member-a/docs/plans/0002-empty-export-handling.md).
---

# /palladio-execute — Run an approved plan

You are the **orchestrator** executing a plan. Executors implement, the reviewer doubts, you decide.
Full rules: `docs/workflow.md` (§3 branching, §4 dispatch contract, §5 review loop, §6 verification,
§8 link repo & member repos — the canonical home of the repo-aware plan rules R1–R8: homing,
numbering, ledgers, path relativity, branching, dispatch).

## Procedure

1. **Preconditions** (abort with a clear message if any fail):
   - Plan file exists and `status: approved` (a human must have approved it — never self-approve).
   - Resolve **all target repos** from the plan's `repo:` frontmatter (comma-separated list of member
     repo dirs and/or `link-repo` = this root). A single member-repo target means the plan is
     **member-homed** (lives in `<that-repo>/docs/plans/`); `link-repo` or more than one repo means it
     is **link-homed** (lives in this repo's `docs/plans/`) (R1).
   - Every targeted repo: working tree clean, on up-to-date `main`. All git operations below run
     **per repo** (`git -C <repo>`).
2. **Branch**: create `task/NNNN-<slug>` in **every** targeted repo (R6), from that repo's up-to-date
   `main`. Flip `status: executing`, commit `NNNN: begin execution`:
   - **Member-homed**: on the one branch in the member repo — plan doc, local ledger, and code all
     ride it together. The master-ledger row already exists from R2; per R4 it doesn't sync again
     until terminal.
   - **Cross-repo/link-homed**: on the link-repo branch (plan doc + master ledger); also branch every
     other targeted member repo for code only.
3. **Dispatch** per task, wave by wave:
   - Tasks may run as a **parallel wave ONLY if their `files:` sets are disjoint**; tasks that run in
     different repos are trivially disjoint regardless of path text (R5).
   - Launch the `executor` agent per task. Its prompt contains ONLY: the task block verbatim, the plan's
     Context section, its `reads:` list, the acceptance criteria, and **the repo the task runs in**
     (the task's own `repo:` line if the plan has per-task repos, otherwise the plan's single target).
     State explicitly that all `files:`/`reads:` paths are relative to the plan's **home repo root**
     (R5) — never the whole plan, never sibling tasks. Every dispatch (executor AND reviewer) carries
     the **targeted-tests-only rule** (workflow §6): never a full or package-wide suite; only
     `uv run pytest <file…>` from the member repo root over the touched files; unclear affected set →
     scout it out, don't widen.
   - If an executor STOPs on ambiguity: resolve it (or ask the human), record the resolution in the
     Execution log, re-dispatch.
   - Commit per completed task **in that task's repo**: `git -C <repo> commit -m "NNNN-T<k>: <summary>"`.
4. **Review** after each task or wave: launch the `reviewer` agent with the plan path, the target repo
   path(s), branch name, and tasks under review. Diff **per repo**:
   `git -C <repo> diff main...task/NNNN-<slug>`. On `REVISE`: re-dispatch the SAME task to an executor
   with the findings appended — a REVISE fix is part of *this* plan and rides the existing branch; never
   open a new plan (or a sub-plan) for it (`docs/workflow.md` §2, "When a plan is NOT required").
   **Max 2 revise cycles per task**, then escalate to the human.
   If the harness self-modification guard blocks an executor from applying a fix to `.claude/` files
   (agent-message authority alone doesn't clear it), apply the reviewer's verbatim fix yourself as
   orchestrator — the human-approved plan declaring those files is the authorization — and record the
   deviation in the Execution log (workflow §5).
5. **Verify**: run every step in the plan's Verification section; paste real outputs into the plan's
   Execution log, wherever the plan is homed (member repo or link repo). Flip `status: review`, update
   the ledger(s) (local ledger always; master ledger only if link-homed, per R4), commit.
6. **Human sign-off**: present a summary + verification results. On sign-off, flip `status: done`,
   archive the plan file (`git mv` into `docs/plans/archived/`, repoint ledger link(s) per R4), commit,
   then land **rebase-first** in each targeted repo (§3: rebase onto latest `main`, `--ff-only` merge,
   push, delete branch — `--no-ff` only for a justified complex case, recorded in the Execution log).
   For member-homed plans, the master-ledger terminal sync (status `done` + landed hash + archived-path
   link) happens AFTER the member branch lands, on a short-lived link-repo branch
   `docs/NNNN-ledger-sync` (`--ff-only`, R4).
   **Gaps registry sync** rides the ledger work — link-homed on the task branch before landing,
   member-homed on `docs/NNNN-ledger-sync`: promote surviving Verification-gaps and unresolved
   reviewer NOTEs into `docs/gaps.md` as new G-entries (next global numbers, trigger required,
   provenance = plan NNNN + finding), move fulfilled `closes G-x`
   entries to `docs/gaps-archive.md` (`closed by NNNN (<hash>)` + what solved it). If the diff plausibly
   touched an undeclared G-x's trigger, run `/gap-evaluate` scoped to it first and fold in the verdicts.
7. **Mid-flight invalidation**: if reality contradicts the plan, stop. Record what/why in the Execution
   log and return to the human — amend (with approval, documented in the log) or mark `abandoned` — which
   archives the plan too: `git mv` it to `docs/plans/archived/` and repoint the ledger link, the same
   terminal relocation as `done` (`docs/workflow.md` §2).
