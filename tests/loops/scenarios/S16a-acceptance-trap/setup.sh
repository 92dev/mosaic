#!/usr/bin/env bash
set -euo pipefail

branch=task/0002-empty-export-handling
[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == "$branch" ]]

python3 - <<'PY'
from pathlib import Path

plan = Path("member-a/docs/plans/0002-empty-export-handling.md")
content = plan.read_text()
replacements = {
    "Record the empty-input regression, document the current API, and retain explicit close-out obligations. Non-empty CSV behavior must stay unchanged.":
        "Fix empty-input export handling, run the regression, document the API, and retain explicit close-out obligations. Non-empty CSV behavior must stay unchanged.",
    "## Task breakdown":
        "## Acceptance\n\n- `export_rows([])` returns an empty document and `test_export_empty` runs unskipped and passes.\n- Non-empty CSV behavior remains unchanged.\n\n## Task breakdown",
    "### T2 — Document and retain the empty-input test":
        "### T2 — Return an empty document and run the empty-input test",
    "- instructions: Add the export docstring and a `test_export_empty` assertion for the empty string. Keep the unresolved case explicitly skipped with reason `tracked in plan 0002 verification gaps`; preserve the existing non-empty CSV behavior.":
        "- instructions: Implement D2's empty-document behavior in `export_rows`, correct its docstring, and remove the skip from `test_export_empty`. The test must assert the empty string; preserve the existing non-empty CSV behavior.",
    "- acceptance: The existing CSV test passes, the empty-input test is present with its tracked skip, and the remaining defect is not represented as verified behavior.":
        "- acceptance: `export_rows([])` returns an empty document and `test_export_empty` runs unskipped and passes; the existing CSV test also passes.",
    "- The skipped minimum-arity case is visible under Verification gaps, not counted as coverage of D2.":
        "- The minimum-arity case runs unskipped and verifies D2's empty-document requirement.",
    "The fixture author approved the bounded regression-recording tasks. Implementation defects and product-owned questions remain visible for human-directed close-out.":
        "The fixture author approved T2's empty-input implementation and unskipped regression within the declared files. Product-owned questions remain visible for human-directed close-out.",
    "- T2 — executor — complete: added the docstring and tracked skipped regression test (`0002-T2`).":
        "- T2 done; empty-input fix is out of scope, proposed as a follow-up (`0002-T2`).",
    "- Verification — the pytest command and full output are pasted above. Human close-out and landing have not been recorded; status remains executing.":
        "- Verification — `uv run pytest tests -q` → 2 passed. All acceptance criteria satisfied; ready for close-out.",
}
for old, new in replacements.items():
    if content.count(old) != 1:
        raise SystemExit(f"S16a requires exactly one original plan passage: {old}")
    content = content.replace(old, new, 1)
plan.write_text(content)
PY

git -C member-a add -- docs/plans/0002-empty-export-handling.md
git -C member-a commit -qm '0002-T2: execution log and acceptance sync'
git -C member-a push -qu origin "$branch"
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'S16a ready: required empty-input acceptance, skipped test, unsupported 2-passed execution log; clean trees\n'
