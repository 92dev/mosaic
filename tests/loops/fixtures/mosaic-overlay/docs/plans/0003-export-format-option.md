---
plan: "0003"
title: Export format option
status: draft
created: 2026-09-03
repo: member-a, link-repo
branch: task/0003-export-format-option
---

# Plan 0003 — Export format option

## Context

Callers need an explicit JSON export option without changing existing CSV calls. [D1](../architecture/export.md#d1--csv-is-the-default-export-format) keeps CSV as the default; [D2](../architecture/export.md#d2--empty-input-returns-an-empty-document) requires empty-input handling. [G-1](../gaps.md) intersects this second-format change. Plan 0002 must resolve its empty-input defect before this implementation lands.

## Scope

### In scope

Add opt-in `fmt="json"`, reject unsupported formats with `ValueError`, preserve default CSV behavior, and document the accepted format contract.

### Out of scope

Parquet, authorization changes, a generic plugin system, and changing the default format. Product has not decided whether Parquet is required.

## Task breakdown

### T1 — Add explicit JSON selection

- repo: member-a
- files: member-a/member_a/api.py, member-a/tests/test_api.py
- reads: docs/architecture/export.md, docs/gaps.md, member-a/member_a/api.py, member-a/tests/test_api.py
- instructions: Keep `fmt="csv"` as the default. Use the current CSV path for CSV; use `json.dumps(rows)` for JSON. Reject unsupported names with `ValueError` naming the unsupported format before reading rows. Test omitted fmt, explicit CSV, JSON field values, empty inputs and unsupported names.
- acceptance: Default and explicit CSV agree; parsed JSON preserves the input rows; JSON empty input is `[]`; CSV empty input is an empty string; unsupported formats raise `ValueError`, not `IndexError`.

### T2 — Record the format contract

- repo: link-repo
- files: docs/architecture/export.md, docs/architecture/README.md
- reads: docs/process/records.md, docs/architecture/export.md, docs/architecture/README.md
- instructions: Append the next D-number for explicit JSON and unsupported-format behavior, recording rejected alternatives and preserving D1/D2. Add its decision-map row.
- acceptance: The map points to the new decision; D1 still names CSV as the default.

## Review checklist

- D1 remains true for callers omitting fmt; no format is inferred from input shape.
- P-23: minimum arity is covered for each supported format.
- G-1: values survive format selection, and the default remains CSV.
- Unsupported formats fail deliberately, including on empty input.

## Verification

Run `uv run pytest tests/test_api.py` from `member-a` and paste its output after implementation.
Run `bun .omp/hooks/post/lint-ledgers.ts docs/architecture/README.md` for the decision-map edit.

### Verification gaps

Product must decide whether Parquet is required; no Parquet implementation or promise is included.

## Planning log

### Round 1 — CHALLENGES

- C1 [MAJOR] accepted: unsupported-format error handling was unspecified; T1 now requires `ValueError` before row access and an empty-input rejection test.
- C2 [MAJOR] rejected: making JSON the default contradicts D1 and silently changes existing CSV callers. CSV stays the default; JSON is explicit.
- C3 [MINOR] deferred: Parquet is product-owned and out of scope. G-1 is the intersecting second-format obligation, not a decision that Parquet is required.
- Checkpoint: informational; the draft now separates the JSON implementation from the unresolved product question.

### Round 2 — NO FURTHER CHALLENGES

- Checkpoint: informational. No further challenges after the C1 revision.
- Leftovers digest: C2 standing rejection (D1 protects existing CSV callers); C3 deferral (product decides Parquet, outside this plan).
- Approval has not been recorded. Present this draft and the leftovers to the human before execution.

## Execution log

Not started; awaiting human approval.
