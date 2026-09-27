#!/usr/bin/env bash
set -euo pipefail

# run.ts loads env before the fixture setup, which creates the review branch.
export MOSAIC_S9=1
[[ -f tools/docimpact.ts ]] || exit 0
branch=$(git -C member-a branch --show-current)
[[ "$branch" == task/0004-empty-export-fix ]] || {
  printf 'S9 requires task/0004-empty-export-fix; found %s\n' "$branch" >&2
  exit 1
}
printf 'S9 ready: member-a=%s\n' "$branch"
