---
description: "Create and commit on target branches, then rebase, fast-forward, push, and remove the branch."
---
Read when: creating a branch, committing, or landing any change.
# Git flow
- Run operations in the targeted repo (`git -C <repo>`); read `rule://plan-home` for repo selection and plan ownership.
- One plan has `task/NNNN-<slug>`, matching its filename, created from up-to-date `{{DEFAULT_BRANCH}}` in every targeted repo; R6 in `rule://plan-home` assigns the artifacts to those branches.
- Commit each completed task in its own repo as `NNNN-T<k>: <summary>`.
- Never commit on {{DEFAULT_BRANCH}}. The `guard-main` hook blocks the targeted repo's commit, including `git -C <repo>`, `cd <repo> &&` anywhere in the command, `bash -c`, `$(…)`, and heredoc scripts; git aliases and scripts on disk are not inspected.
- After sign-off and terminal recording, refresh {{DEFAULT_BRANCH}}, rebase the branch onto its latest tip if it moved (`git rebase {{DEFAULT_BRANCH}} task/NNNN-<slug>`), then `git checkout {{DEFAULT_BRANCH}} && git merge --ff-only task/NNNN-<slug> && git push origin {{DEFAULT_BRANCH}}`; delete the landed branch.
- The same rebase-first and `--ff-only` sequence lands short-lived inline/docs branches; read `rule://plan-triage` for their names and authorization.
- A `--no-ff` merge is allowed only for a genuinely complex case, such as preserving a long-lived diverged branch, with the justification recorded in the plan's Execution log.
- Push every target, including the link repo with remote `{{LINK_REMOTE}}`; {{MEMBERS}}.
- No PRs; review is in-session via `rule://review-loop`.
- Hooks constrain LLM sessions; a human terminal is the escape if one misfires.
