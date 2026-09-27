---
description: "Create and commit on target branches, then rebase, fast-forward, push, and remove the branch."
---
Read when: creating a branch, committing, or landing any change.
# Git flow
- Run operations in the targeted repo (`git -C <repo>`); read `rule://plan-home` for repo selection and plan ownership.
- One plan has `task/NNNN-<slug>`, matching its filename, created from up-to-date `main` in every targeted repo; R6 in `rule://plan-home` assigns the artifacts to those branches.
- Commit each completed task in its own repo as `NNNN-T<k>: <summary>`.
- Never commit on main. The `guard-main` hook blocks the targeted repo's commit, including `git -C <repo>` and `cd <repo> &&` forms.
- After sign-off and terminal recording, refresh main, rebase the branch onto its latest tip if it moved (`git rebase main task/NNNN-<slug>`), then `git checkout main && git merge --ff-only task/NNNN-<slug> && git push origin main`; delete the landed branch.
- The same rebase-first and `--ff-only` sequence lands short-lived inline/docs branches; read `rule://plan-triage` for their names and authorization.
- A `--no-ff` merge is allowed only for a genuinely complex case, such as preserving a long-lived diverged branch, with the justification recorded in the plan's Execution log.
- Push every target, including the link repo with remote `../origins/link.git`; the member remote is `../origins/member-a.git`.
- No PRs; review is in-session via `rule://review-loop`.
- Hooks constrain LLM sessions; a human terminal is the escape if one misfires.
