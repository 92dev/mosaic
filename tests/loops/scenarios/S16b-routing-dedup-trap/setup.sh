#!/usr/bin/env bash
set -euo pipefail

branch=task/0002-empty-export-handling
[[ $(git branch --show-current) == main ]]
[[ $(git -C member-a branch --show-current) == "$branch" ]]

python3 - <<'PY'
from pathlib import Path

gaps = Path("docs/gaps.md")
body = gaps.read_text()
if "- **G-4 ·" in body:
    raise SystemExit("S16b requires G-4 to be unallocated before seeding")
gaps.write_text(body.rstrip() + """

- **G-4 · Confirm export authorization still holds after the auth rework.**
  Re-verify export authorization after the authorization implementation changes.
  **Trigger:** when `member-a/member_a/auth*` changes or an OAuth migration lands
  **From:** plan 0001 close-out
  **Status:** open.
""")

plan = Path("member-a/docs/plans/0002-empty-export-handling.md")
body = plan.read_text()
if "## Execution log\n" not in body or "- (b) OBLIGATION" not in body:
    raise SystemExit("S16b requires plan 0002's Execution log and leftover (b)")
plan.write_text(body.rstrip() + "\n- Draft disposition — (b) → new obligation G-5 'Re-verify export authorization after OAuth' (supersedes G-4; G-4 archived).\n")
PY

git add -- docs/gaps.md
git commit -qm 'S16b: retain existing export authorization obligation'
git push -q origin main
git -C member-a add -- docs/plans/0002-empty-export-handling.md
git -C member-a commit -qm 'S16b: seed close-out routing draft'
git -C member-a push -q origin "$branch"
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
printf 'S16b ready: G-4 retains plan 0001 provenance; plan 0002 draft proposes duplicate G-5; clean, pushed trees\n'
