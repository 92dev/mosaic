#!/usr/bin/env bash
# Registry CLI: bun .omp/hooks/post/lint-ledgers.ts docs/gaps.md
# Exit codes: 0 valid, 1 schema violation, 2 usage/read error; no stdin payload is needed.
set -euo pipefail

origins="$(dirname "$PWD")/origins"
branch=task/0002-empty-export-handling
if [[ ${MOSAIC_S9:-0} == 1 ]]; then branch=task/0004-empty-export-fix; fi
mkdir -p "$origins"

# Plan 0004 (status review) exists only for the S9 closure scenario; outside it the fixture must not carry a plan that claims an unlanded fix.
# S9 mode rewrites the roadmap/product seeds to name plan 0004 so docimpact's roadmap/product classes have something to find.
if [[ ${MOSAIC_S9:-0} == 1 ]]; then
  python3 - <<'PY'
from pathlib import Path
subs = {
    "docs/architecture/roadmap.md": ("(pending; no plan drafted yet).", "(0004, pending landing)."),
    "docs/product/README.md": ("empty-input correction is pending (no plan drafted yet).", "empty-input correction is pending in plan 0004."),
    "docs/product/F-1-export-flow.md": ("The empty-input correction is pending; no plan has been drafted for it yet.", "[Plan 0004](../../member-a/docs/plans/0004-empty-export-fix.md) fixes the empty-input path; it has not landed yet."),
}
for name, (old, new) in subs.items():
    path = Path(name)
    path.write_text(path.read_text().replace(old, new, 1))
PY
fi
if [[ ${MOSAIC_S9:-0} != 1 ]]; then
  rm -f member-a/docs/plans/0004-empty-export-fix.md
  python3 - <<'PY'
from pathlib import Path
for ledger in ("docs/plans/README.md", "member-a/docs/plans/README.md"):
    p = Path(ledger)
    if p.exists():
        p.write_text("".join(line for line in p.read_text().splitlines(keepends=True) if not line.startswith("| [0004]")))
PY
fi

init_repo() {
  local repo=$1 origin=$2
  if [[ ! -d "$repo/.git" ]]; then git init -q -b main "$repo"; fi
  git -C "$repo" config user.name 'Fixture Author'
  git -C "$repo" config user.email 'fixture@example.invalid'
  git -C "$repo" config commit.gpgsign false
  if [[ ! -d "$origin" ]]; then git init -q --bare -b main "$origin"; fi
  if ! git -C "$repo" remote get-url origin >/dev/null 2>&1; then
    git -C "$repo" remote add origin "$origin"
  fi
}

init_repo . "$origins/link.git"
git check-ignore -q member-a/
if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
  git add -- .
  git commit -qm '0001: scaffold Fixture link repo'
fi
git push -qu origin main

init_repo member-a "$origins/member-a.git"
if ! git -C member-a rev-parse --verify HEAD >/dev/null 2>&1; then
  git -C member-a add -- .gitignore CLAUDE.md README.md pyproject.toml uv.lock pytest.ini member_a tests
  # Stage the pre-task blobs without disturbing the final fixture working files.
  python3 - <<'PY'
from pathlib import Path
import subprocess

root = Path("member-a")
api = (root / "member_a/api.py").read_text()
api = api.replace('    """Export rows as CSV; always returns at least the header row."""\n', '', 1)
tests = (root / "tests/test_api.py").read_text().split('\n\n@pytest.mark.skip', 1)[0] + '\n'
tests = tests.replace('import pytest\n\n', '', 1)
for name, body in (("member_a/api.py", api), ("tests/test_api.py", tests)):
    blob = subprocess.check_output(["git", "-C", str(root), "hash-object", "-w", "--stdin"], input=body.encode()).decode().strip()
    subprocess.run(["git", "-C", str(root), "update-index", "--cacheinfo", f"100644,{blob},{name}"], check=True)
PY
  git -C member-a commit -qm '0001: scaffold member-a CSV export'
  git -C member-a tag 0001
  git -C member-a checkout -qb task/0002-empty-export-handling
  if [[ ${MOSAIC_S9:-0} == 1 ]]; then
    git -C member-a add -- docs/plans/0002-empty-export-handling.md docs/plans/README.md
    # Keep 0004's review record out of the earlier plan's commit.
    python3 - <<'PY'
from pathlib import Path
import subprocess

name = "docs/plans/README.md"
body = "".join(line for line in (Path("member-a") / name).read_text().splitlines(keepends=True) if not line.startswith("| [0004]"))
blob = subprocess.check_output(["git", "-C", "member-a", "hash-object", "-w", "--stdin"], input=body.encode()).decode().strip()
subprocess.run(["git", "-C", "member-a", "update-index", "--cacheinfo", f"100644,{blob},{name}"], check=True)
PY
  else
    git -C member-a add -- docs/plans
  fi
  git -C member-a commit -qm '0002-T1: record empty-export plan and local ledger'
  git -C member-a add -- member_a/api.py tests/test_api.py
  git -C member-a commit -qm '0002-T2: document export and retain skipped empty-input regression'
  if [[ ${MOSAIC_S9:-0} == 1 ]]; then
    git -C member-a checkout -qb "$branch"
    python3 - <<'PY'
from pathlib import Path

api = Path("member-a/member_a/api.py")
api.write_text(api.read_text().replace(
    '    """Export rows as CSV; always returns at least the header row."""\n',
    '    """Export rows as CSV; return an empty string for empty input."""\n    if not rows:\n        return ""\n',
    1,
))
tests = Path("member-a/tests/test_api.py")
tests.write_text(tests.read_text().replace('import pytest\n\n', '', 1).replace(
    '@pytest.mark.skip(reason="tracked in plan 0002 verification gaps")\n', '', 1,
))
PY
    git -C member-a add -- member_a/api.py tests/test_api.py
    git -C member-a commit -qm '0004-T1: return empty document for empty input'
    git -C member-a add -- docs/plans/0004-empty-export-fix.md docs/plans/README.md
    git -C member-a commit -qm '0004: enter review'
  fi
fi
git -C member-a push -qu origin main
git -C member-a push -q origin refs/tags/0001

[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == "$branch" ]]
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'Fixture ready: link=main, member-a=%s; clean trees\n' "$branch"
