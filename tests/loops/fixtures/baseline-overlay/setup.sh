#!/usr/bin/env bash
# Registry CLI: bun .omp/hooks/post/lint-ledgers.ts docs/gaps.md
# Exit codes: 0 valid, 1 schema violation, 2 usage/read error; no stdin payload is needed.
set -euo pipefail

origins="$(dirname "$PWD")/origins"
branch=task/0002-empty-export-handling
mkdir -p "$origins"

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
  git -C member-a checkout -qb "$branch"
  git -C member-a add -- docs/plans
  git -C member-a commit -qm '0002-T1: record empty-export plan and local ledger'
  git -C member-a add -- member_a/api.py tests/test_api.py
  git -C member-a commit -qm '0002-T2: document export and retain skipped empty-input regression'
fi
git -C member-a push -qu origin main
git -C member-a push -q origin refs/tags/0001

[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == "$branch" ]]
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'Fixture ready: link=main, member-a=%s; clean trees\n' "$branch"
