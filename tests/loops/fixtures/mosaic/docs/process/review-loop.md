---
description: "Review task diffs independently, route precise findings back to the task, and escalate unresolved revisions."
---
Read when: a task or parallel wave is ready for review, or a reviewer returns findings.
# Review inputs
- Give each reviewer the plan path (or in-memory task for the light path), target repo paths, branch name, and tasks under review; include the Review checklist and the pitfall catalogs of every touched repo and the link ([pitfalls.md](../architecture/pitfalls.md), `<member>/docs/pitfalls.md`).
- Commit the work under review first: `git diff main...<branch>` excludes uncommitted edits, so an uncommitted task shows the reviewer an empty diff. Then review `git -C <repo> diff main...<branch>` separately in each repo, including untracked additions (`git status --porcelain`); what lands must be the reviewed snapshot.
- Read `rule://registries` for challenger reading and [targeted-tests](targeted-tests.md) (loaded automatically inside executor and reviewer agents; the main session reads the file) for review-time checks.
# Verdict and correction
- Dispatch the independent reviewers required by the active runtime with identical inputs; each must return `APPROVE`.
- Exception: `class: docs` task waves use one cross-family reviewer per `rule://dispatch`; closure packets still require the full pair.
- Each verdict is `APPROVE` or `REVISE`, with numbered actionable findings: S/P, file:line, what, why, the violated rule or trap quoted (a P-number alone is not grounding), and precise fix instruction. S = substantive (would land a wrong record — a misrouted, duplicate, or mis-homed entry included —, false claim, broken landing, or defect); P = procedural. Optional improvements stay `[note]`s.
- In the Execution log, write one verdict line per task/reviewer/round, then one line per finding using these shapes (`closure` names the closure task):
  `- <task> R<round> <reviewer>: APPROVE|REVISE (<n> findings)`
  `- <task> R<round> <reviewer>: <S|P> — <finding in ≤ 15 words> → <fixed|rejected: reason|deferred: where>`
- Keep reviewer names separate, including duplicate findings; never merge attribution as `C9/G6`. Each `REVISE (<n> findings)` must have exactly n matching finding lines later in the log, with that task, round, reviewer, and disposition.
- Any `REVISE` → deduplicate repair instructions without merging the attributed log lines, then repair: re-dispatch the same task with the findings appended (read `rule://dispatch`), or, when every finding is a mechanical correction with no design choice (wrong docstring, stale comment or link, formatting, a rename the finding spells out) inside the task's `files:`, the orchestrator applies it directly and logs which. Either way the changed snapshot goes back to every required reviewer and counts as one correction cycle.
- Max 2 revise cycles per task, then escalate to the human. Corrections stay in the current plan per `rule://plan-triage`.
- Conflicting reviewers → the orchestrator rules and records the ruling in the Execution log; do not silently choose the easier verdict. A recorded ruling does not replace the required final `APPROVE` verdicts: send the ruling and changed snapshot back to every required reviewer for a verdict; only a specific human override waives a standing `REVISE`, and a general sign-off pre-approval is not that override.
- A close-out with missing or unsupported dispositions is `REVISE`; read `rule://records` to check routing. The closure wave reviews only what changed since the last approval: the disposition list with its evidence, the document-alignment diff, and any inline correction; already-approved task diffs are not re-reviewed, and the dispatch says so. Rerun retained verification only when the packet changed what it exercises.
- A reviewer-clean light-path change can land immediately; formal plans retain the human sign-off in `rule://map`. Inline mechanical work follows `rule://plan-triage` without this review dispatch.
# Model availability
Prefer cross-family refutation when models are available; semantic role aliases choose models without changing agent bodies.
On a usage-limit error, switch the affected role to the available family and temporarily suspend cross-family work; record the limitation. The required role verdicts still apply.
For long unattended work, periodically check usage and restore the normal assignments when the limit clears.
