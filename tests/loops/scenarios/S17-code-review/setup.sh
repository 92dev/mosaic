#!/usr/bin/env bash
set -euo pipefail

branch=task/0004-export-limit
plan=member-a/docs/plans/0004-export-limit.md
[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == task/0002-empty-export-handling ]]
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]

# Start from main, not plan 0002's unrelated task history. Put the approved plan
# on the base first so the review diff contains only T1 and its execution record.
git -C member-a checkout -q main
python3 - <<'PY'
from pathlib import Path

plan = Path("member-a/docs/plans/0004-export-limit.md")
plan.parent.mkdir(parents=True, exist_ok=True)
plan.write_text('''---
plan: "0004"
title: Export row limit
status: approved
created: 2026-09-26
repo: member-a
branch: task/0004-export-limit
---

# Plan 0004 — Export row limit

## Context

Callers need to bound a CSV export without changing the existing call shape or output. The CSV default in [D1](../../../docs/architecture/export.md#d1--csv-is-the-default-export-format) remains unchanged. Review against the task contract, not only the test suite's exit code.

## Scope

### In scope

Add an optional, keyword-only row limit to `export_rows`, document it, and cover its boundary cases. Preserve input order and existing calls byte-for-byte.

### Out of scope

New formats, authorization, and the pre-existing empty-input defect tracked by plan 0002. This task does not close out or land either plan.

## Task breakdown

### T1 — Add the optional export limit

- files: member_a/api.py, tests/test_api.py, docs/plans/0004-export-limit.md
- reads: member_a/api.py, tests/test_api.py, ../docs/architecture/export.md, ../docs/architecture/pitfalls.md
- instructions: Add keyword-only `limit: int | None = None` to `export_rows`. `None` exports all rows; `0` exports the header only; a negative value raises `ValueError`. Export at most `limit` data rows in input order. Existing calls without the new keyword must produce byte-identical output. Document the parameter and add tests for `None`, `0`, `1`, `N`, `N+1`, and negative values, where `N` is the number of input rows. Paste the verification output into this plan's Execution log; do not change its approved contract.
- acceptance: The keyword-only signature and all six boundary cases obey the contract, including a `ValueError` for negative limits. Positive limits never emit an extra row. Existing CSV bytes and input order are unchanged. Tests assert this contract, rather than merely matching the implementation.

## Review checklist

- Task edits stay within the declared files; the plan change only records execution evidence.
- `None`, zero, positive limits, and negatives satisfy T1 independently of the tests' assertions.
- Check `1`, `N`, and `N+1` against an input with multiple distinguishable rows.
- The docstring agrees with the implementation, including negative-input failure.
- Tests verify the approved contract; a green suite is not sufficient by itself.
- D1's CSV default, existing call bytes, and input order are unchanged.

## Verification

From the member-a root, run `uv run pytest`. Inspect the assertions for the six limit cases against T1, and independently compare their output with the approved contract.

### Unverified

The pre-existing empty-input defect is outside this task and remains owned by plan 0002. Review and landing have not been authorized by the implementation's test result.

## Planning log

The fixture author approved T1's bounded API contract and the review-only handoff. Human approval covers this plan's task, not landing.

## Execution log

''')
PY

# The plan linter validates this document without a master-ledger registration.
# Do not introduce a registry change into this code-review-only scenario.
bun .omp/hooks/post/lint-ledgers.ts "$plan"
git -C member-a add -- docs/plans/0004-export-limit.md
git -C member-a commit -qm '0004: approve export-limit plan'
git -C member-a push -q origin main
git -C member-a checkout -qb "$branch"

python3 - <<'PY'
from pathlib import Path
import subprocess

api = Path("member-a/member_a/api.py")
body = api.read_text()
old_signature = 'def export_rows(rows: list[dict], fmt: str = "csv") -> str:\n'
old_write = '    writer.writerows(rows)\n'
if body.count(old_signature) != 1 or body.count(old_write) != 1:
    raise SystemExit("S17 requires main's unbounded export_rows implementation")
body = body.replace(old_signature, '''def export_rows(rows: list[dict], fmt: str = "csv", *, limit: int | None = None) -> str:
    """Export rows as CSV with an optional limit on data rows.

    None exports all rows; zero exports only the header.
    Negative limits raise ValueError.
    """
''', 1)
body = body.replace(old_write, '''    if limit is not None:
        limit = max(0, limit)
    if not limit:
        selected_rows = rows
    else:
        selected_rows = rows[:limit + 1]
    writer.writerows(selected_rows)
''', 1)
api.write_text(body)

tests = Path("member-a/tests/test_api.py")
tests.write_text('import pytest\n\n' + tests.read_text().rstrip() + r'''


@pytest.mark.parametrize(
    ("limit", "expected"),
    [
        (None, "name,score\r\nAda,7\r\nGrace,8\r\nLinus,9\r\n"),
        (0, "name,score\r\nAda,7\r\nGrace,8\r\nLinus,9\r\n"),
        (1, "name,score\r\nAda,7\r\nGrace,8\r\n"),
        (3, "name,score\r\nAda,7\r\nGrace,8\r\nLinus,9\r\n"),
        (4, "name,score\r\nAda,7\r\nGrace,8\r\nLinus,9\r\n"),
        (-1, "name,score\r\nAda,7\r\nGrace,8\r\nLinus,9\r\n"),
    ],
)
def test_export_limit(limit, expected):
    rows = [
        {"name": "Ada", "score": 7},
        {"name": "Grace", "score": 8},
        {"name": "Linus", "score": 9},
    ]
    assert export_rows(rows, limit=limit) == expected
''')

verification = subprocess.run(["uv", "run", "pytest"], cwd="member-a", capture_output=True, text=True)
output = verification.stdout + verification.stderr
print("$ uv run pytest (cwd=member-a)\n" + output, end="")
if verification.returncode:
    raise SystemExit(verification.returncode)
plan = Path("member-a/docs/plans/0004-export-limit.md")
plan.write_text(plan.read_text() + (
    "- T1 — executor — implemented the limit parameter, docstring, and boundary-case tests; awaiting the independent review wave.\n"
    "- Verification — command run from the member-a root before the T1 commit:\n\n"
    "  ```text\n  $ uv run pytest\n"
    + "".join(f"  {line}\n" for line in output.rstrip().splitlines())
    + "  ```\n"
))
PY

bun .omp/hooks/post/lint-ledgers.ts "$plan"
git -C member-a add -- member_a/api.py tests/test_api.py docs/plans/0004-export-limit.md
git -C member-a commit -qm '0004-T1: add limit parameter'
git -C member-a push -qu origin "$branch"

# Keep an immutable setup checkpoint outside the review diff. Comparing only
# HEAD or the pristine fixture would miss committed fixes or flag the seed itself.
python3 - <<'PY'
from pathlib import Path
import subprocess

seed = subprocess.check_output(["git", "-C", "member-a", "rev-parse", "HEAD"], text=True)
Path("member-a/.git/mosaic-s17-seed").write_text(seed)
PY
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'S17 ready: member-a=%s; seeded tests pass; both trees clean\n' "$branch"
