---
plan: "0001"
title: Scaffold member-a
status: done
created: 2026-09-01
repo: member-a, link-repo
branch: task/0001-scaffold-member-a
---

# Plan 0001 — Scaffold member-a

## Context

Establish an independent Python member under the Fixture link repo and record the [export contract](../../architecture/export.md).

## Scope

Create the package, a non-empty CSV test, local git origins and the link-repo architecture records. Empty-input handling belongs to plan 0002.

## Task breakdown

### T1 — Scaffold the member

- repo: member-a
- files: member-a/member_a/__init__.py, member-a/member_a/api.py, member-a/tests/test_api.py, member-a/pytest.ini
- reads: docs/architecture/export.md
- instructions: Provide `export_rows` using the Python CSV writer and a passing non-empty export test.
- acceptance: A single row exports a header and one data row.

## Review checklist

The default is CSV (D1), and the member remains an independent repository.

## Verification

`uv run pytest tests` from `member-a` runs the non-empty CSV assertion. The scaffold revision is the member's `0001` tag.

### Verification gaps

Empty input remains for plan 0002; second-format semantics are tracked by G-1.

## Planning log

The fixture author approved a bounded scaffold without an adversarial round.

## Execution log

Scaffold landed at `member-a:0001`. G-0 is closed; the archive records the closure.
