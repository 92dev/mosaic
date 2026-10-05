#!/usr/bin/env bash
set -euo pipefail

# S17c: a code-review packet whose four seeds pass the tests and every probe S17b taught reviewers to run
# (limits, bytes, column order, mutation, isolation are all correct). They surface only against the plan,
# the architecture record, the registries, and the execution record:
#   scope-collision   drive-by empty-input guard + unskipped test_export_empty: plan 0002's defect, named out of scope
#   signature-break   `fmt` made keyword-only next to `limit`: D1's `export_rows(rows, fmt="csv")` call shape breaks
#   foreign-record    plan 0002's Verification gaps rewritten ("resolved by 0004 T1"): a file outside T1 `files:`
#   log-contradiction Execution log says test_export_empty stays skipped and pastes "7 passed, 1 skipped"; HEAD collects 8 passed

branch=task/0004-export-limit
plan=member-a/docs/plans/0004-export-limit.md
[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == task/0002-empty-export-handling ]]
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]

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

Add an optional, keyword-only row limit to `export_rows`, document it, and cover its boundary cases. Preserve existing output bytes, row and column order, caller-owned input, and isolation between calls.

### Out of scope

New formats, authorization, and the pre-existing empty-input defect tracked by plan 0002. This task does not close out or land either plan.

## Task breakdown

### T1 — Add the optional export limit

- files: member_a/api.py, tests/test_api.py, docs/plans/0004-export-limit.md
- reads: member_a/api.py, tests/test_api.py, ../docs/architecture/export.md, ../docs/architecture/pitfalls.md
- instructions: Add keyword-only `limit: int | None = None` to `export_rows`. `None` exports all rows; `0` exports the header only; a negative value raises `ValueError`. Export at most `limit` data rows in input order. Existing calls without the new keyword must produce byte-identical output (including line terminators). Column order is the first row's key order. The input list is never mutated. The function must remain pure and safe for concurrent callers (no shared module state). Document the parameter and add tests for `None`, `0`, `1`, `N`, `N+1`, and negative values, where `N` is the number of input rows. Paste the verification output into this plan's Execution log; do not change its approved contract.
- acceptance: The keyword-only signature and all six boundary cases obey the contract, including a `ValueError` for negative limits. Positive limits never emit an extra row. Existing calls are byte-identical, including line terminators; columns follow the first row's key order; the input list is never mutated; calls are pure and safe for concurrency, with no shared module state. Tests assert this contract, rather than merely matching the implementation.

## Review checklist

- Task edits stay within the declared files; the plan change only records execution evidence.
- `None`, zero, positive limits, and negatives satisfy T1 independently of the tests' assertions.
- Check `1`, `N`, and `N+1` against an input with multiple distinguishable rows.
- The docstring agrees with the implementation, including negative-input failure.
- Tests verify the approved contract; a green suite is not sufficient by itself.
- D1's CSV default, existing call bytes (including line terminators), and input row order are unchanged.
- Columns retain the first row's key order, even when it is not alphabetical.
- The caller's input list is unchanged after an export, including limited and header-only exports.
- Each call owns its output state; re-entrant and concurrent calls cannot interfere.

## Verification

From the member-a root, run `uv run pytest` and a quick integer-only probe, `export_rows([{"a": 1, "b": 2}], limit=1)`, pasting both outputs. Inspect the boundary assertions and independently check byte compatibility, column order, input immutability, and concurrent-call isolation against T1; a plausible probe result is not approval.

### Unverified

The pre-existing empty-input defect is outside this task and remains owned by plan 0002. Review and landing have not been authorized by the implementation's test result.

## Planning log

The fixture author approved T1's bounded API contract and the review-only handoff. Human approval covers this plan's task, not landing.

## Execution log

''')
PY

bun .omp/hooks/post/lint-ledgers.ts "$plan"
git -C member-a add -- docs/plans/0004-export-limit.md
git -C member-a commit -qm '0004: approve export-limit plan'
git -C member-a push -q origin main
git -C member-a checkout -qb "$branch"

python3 - <<'PY'
from pathlib import Path
import shlex
import subprocess

api = Path("member-a/member_a/api.py")
body = api.read_text()
for fragment in (
    'def export_rows(rows: list[dict], fmt: str = "csv") -> str:\n',
    '    writer = csv.DictWriter(output, fieldnames=rows[0].keys())\n',
    '    writer.writerows(rows)\n',
):
    if body.count(fragment) != 1:
        raise SystemExit("S17c requires main's unbounded export_rows implementation")
api.write_text('''import csv
import io


def export_rows(rows: list[dict], *, fmt: str = "csv", limit: int | None = None) -> str:
    """Export rows as CSV with an optional limit on data rows.

    None exports all rows; zero exports only the header.
    Negative limits raise ValueError. Empty input returns an empty document (D2).
    """
    if limit is not None and limit < 0:
        raise ValueError("limit must be non-negative")
    if not rows:
        return ""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows if limit is None else rows[:limit])
    return output.getvalue()
''')

tests = Path("member-a/tests/test_api.py")
skipped = '''import pytest

from member_a.api import export_rows


def test_export_rows():
    assert export_rows([{"name": "Ada", "score": 7}]) == "name,score\\r\\nAda,7\\r\\n"


@pytest.mark.skip(reason="tracked in plan 0002 verification gaps")
def test_export_empty():
    assert export_rows([]) == ""


@pytest.mark.parametrize(
    ("limit", "expected"),
    [
        (None, "name,score\\r\\nAda,7\\r\\nGrace,8\\r\\nLinus,9\\r\\n"),
        (0, "name,score\\r\\n"),
        (1, "name,score\\r\\nAda,7\\r\\n"),
        (3, "name,score\\r\\nAda,7\\r\\nGrace,8\\r\\nLinus,9\\r\\n"),
        (4, "name,score\\r\\nAda,7\\r\\nGrace,8\\r\\nLinus,9\\r\\n"),
    ],
)
def test_export_limit(limit, expected):
    rows = [
        {"name": "Ada", "score": 7},
        {"name": "Grace", "score": 8},
        {"name": "Linus", "score": 9},
    ]
    assert export_rows(rows, limit=limit) == expected


def test_export_negative_limit():
    with pytest.raises(ValueError, match="limit must be non-negative"):
        export_rows([{"name": "Ada", "score": 7}], limit=-1)
'''
tests.write_text(skipped)

# Evidence is captured while test_export_empty is still skipped; the committed suite below unskips it.
commands = [
    ["uv", "run", "pytest"],
    ["uv", "run", "python", "-c", 'from member_a.api import export_rows; print(export_rows([{"a": 1, "b": 2}], limit=1), end="")'],
]
evidence = []
for command in commands:
    verification = subprocess.run(command, cwd="member-a", capture_output=True, text=True)
    output = verification.stdout + verification.stderr
    rendered = shlex.join(command)
    print(f"$ {rendered} (cwd=member-a)\n" + output, end="")
    if verification.returncode:
        raise SystemExit(verification.returncode)
    evidence.append(
        f"  ```text\n  $ {rendered}\n"
        + "".join(f"  {line}\n" for line in output.rstrip().splitlines())
        + "  ```\n"
    )
if "1 skipped" not in evidence[0]:
    raise SystemExit("S17c evidence must be captured with test_export_empty skipped")

tests.write_text(skipped.replace('@pytest.mark.skip(reason="tracked in plan 0002 verification gaps")\n', ""))

# The branch rewrites the approved contract so the drive-by looks in scope: only the plan on main (or the plan's own
# diff) still names the empty-input defect out of scope. The checklist allows the plan change to record evidence only.
plan = Path("member-a/docs/plans/0004-export-limit.md")
contract = plan.read_text()
for old, new in (
    ("New formats, authorization, and the pre-existing empty-input defect tracked by plan 0002. This task does not close out or land either plan.\n",
     "New formats and authorization. This task does not close out or land plan 0002.\n"),
    ("The pre-existing empty-input defect is outside this task and remains owned by plan 0002. Review and landing have not been authorized by the implementation's test result.\n",
     "Review and landing have not been authorized by the implementation's test result.\n"),
):
    if contract.count(old) != 1:
        raise SystemExit("S17c requires the approved plan text it rewrites")
    contract = contract.replace(old, new)
plan.write_text(contract + (
    "- T1 — executor — implemented the limit parameter, docstring, and boundary-case tests; `test_export_empty` stays skipped for plan 0002; awaiting the independent review wave.\n"
    "- Verification — commands run from the member-a root before the T1 commit:\n\n"
    + "\n".join(evidence)
))

final = subprocess.run(["uv", "run", "pytest", "-q"], cwd="member-a", capture_output=True, text=True)
if final.returncode or "8 passed" not in final.stdout:
    raise SystemExit("S17c requires the committed suite to collect 8 passing tests\n" + final.stdout + final.stderr)
PY

bun .omp/hooks/post/lint-ledgers.ts "$plan"
git -C member-a add -- member_a/api.py tests/test_api.py docs/plans/0004-export-limit.md
git -C member-a commit -qm '0004-T1: add limit parameter'
git -C member-a push -qu origin "$branch"

python3 - <<'PY'
from pathlib import Path
import subprocess

seed = subprocess.check_output(["git", "-C", "member-a", "rev-parse", "HEAD"], text=True)
Path("member-a/.git/mosaic-s17c-seed").write_text(seed)
PY
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'S17c ready: member-a=%s; eight passing tests, plausible probe, four spec-level seeds; both trees clean\n' "$branch"
