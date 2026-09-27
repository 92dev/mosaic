---
plan: NNNN
title: <title>
status: draft        # draft | approved | executing | review | done | abandoned
created: YYYY-MM-DD
repo: {{MEMBERS}}       # {{MEMBERS}} | link-repo; one member ⇒ home there; link-repo or multiple ⇒ home in link repo
branch: task/NNNN-<slug>
---

# Plan NNNN — <title>

## Context

Why now. Cite the [architecture docs](../architecture/README.md) sections/decisions this builds on
and any prior plans it depends on.

## Scope

### In scope

### Out of scope

Explicit non-goals. Check [export.md](../architecture/export.md) and
[pitfalls.md](../architecture/pitfalls.md) for things to fence out.

## Task breakdown

One block per executor task. Design `files:` sets to be disjoint wherever parallel execution is wanted.
Paths in `files:`/`reads:` are relative to the plan's home repo root; cross-repo plans prefix member
paths (`{{MEMBERS}}/...`). **Two path frames — don't mix them**: `files:`/`reads:` use the
home-repo-ROOT frame (R5), while markdown links in the plan's prose are relative to THIS FILE like
any doc link (R8 for upward links). A member-homed plan reads link-repo docs as `../docs/...` in
`reads:` but links them as `../../../docs/...` in prose.

### T1 — <name>

- repo: <only for cross-repo plans: which repo this task runs in; omit otherwise>
- files: <exact paths this task may create/modify — the parallelism contract>
- reads: <docs/files the executor needs as context — keep minimal>
- instructions: <precise, no-judgment-needed steps>
- acceptance: <observable result>

## Review checklist

Concrete checks the reviewer runs against the diff, including the relevant pitfalls (P-x) for this change.

## Verification

Commands/steps an LLM can execute in-repo to prove the result works (builds, tests, greps, probes).
Negative-probe steps (inject a failure, confirm gates fail, revert) must **rebuild affected
artifacts after the revert** before any later step consumes build output — compilers may emit on
error, leaving stale probe code in `dist/`.

### Verification gaps

MANDATORY. What cannot be machine-verified, why, and the fix/workaround/alternative
(e.g. "requires human eyeball on rendering", "needs real ACC credentials — defer to pilot").
Write "None" only if truly none.

## Planning log

Filled during planning (`/palladio-plan` Phase 2): one entry per adversarial round — challenges
raised (severity + D#/P#/G-x grounding), the orchestrator's ruling on each (accept/reject +
reasoning), panel input if consulted, human input, the round's checkpoint disposition (blocking,
or informational when nothing human-owned was open), and what changed in the draft. The debate
closes with the leftovers digest — standing rejections, spent contests, and deferrals, each with
the human's disposition. A waived debate records the waiver (who, why) instead. Closed before
`draft → approved`.

## Execution log

Filled during execution: task → agent → result; reviewer verdicts; deviations from plan and why;
final verification output.
