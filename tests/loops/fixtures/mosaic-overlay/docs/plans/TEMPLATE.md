---
plan: NNNN
title: <title>
status: draft        # draft | approved | executing | review | done | abandoned
created: YYYY-MM-DD
repo: member-a       # member-a | link-repo; one member ⇒ home there; link-repo or multiple ⇒ home in link repo
branch: task/NNNN-<slug>
tracker:
  provider: replay
  id: <immutable UUID>
  key: <display key>
  url: <item URL>
areas: []            # link-root-relative path globs and contract:<name>; fill from the intent
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
Read `rule://plan-home` R5 for task paths and R8 for prose links.
Path-frame example: member-homed `reads: ../docs/...` versus prose `../../../docs/...`.

### T1 — <name>

- repo: <only for cross-repo plans: which repo this task runs in; omit otherwise>
- class: <code | docs — default code when omitted>
- files: <exact paths this task may create/modify — the parallelism contract>
- reads: <docs/files the executor needs as context — keep minimal>
- instructions: <precise, no-judgment-needed steps>
- acceptance: <observable result>

## Review checklist

Concrete checks the reviewer runs against the diff, including the relevant pitfalls (P-x) for this change.

## Verification

Read `rule://verification`; list runnable checks and expected evidence.
For negative probes, follow that rule's reject, revert, and rebuild sequence.

### Unverified

Evidence limits and alternatives, per `rule://verification`.

## Planning log

Filled during planning (`/mosaic-plan` Phase 2): one entry per adversarial round — challenges
raised (severity + D#/P#/G-x grounding), the orchestrator's ruling on each (accept/reject +
reasoning), panel input if consulted, human input, the round's checkpoint disposition (blocking,
or informational when nothing human-owned was open), and what changed in the draft. The debate
closes with the leftovers digest — standing rejections, spent contests, and deferrals, each with
the human's disposition. A waived debate records the waiver (who, why) instead. Closed before
`draft → approved`.

## Execution log

Filled during execution: task → agent → result; reviewer verdicts; deviations from plan and why;
final verification output.
Log per `rule://review-loop`: one verdict per task/reviewer/round, followed by its findings.
```text
- <task> R<round> <reviewer>: APPROVE|REVISE (<n> findings)
- <task> R<round> <reviewer>: <S|P> — <finding in ≤ 15 words> → <fixed|rejected: reason|deferred: where>
```
