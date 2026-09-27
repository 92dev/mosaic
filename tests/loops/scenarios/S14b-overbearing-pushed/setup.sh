#!/usr/bin/env bash
set -euo pipefail
# Test double: make the adversary push scope hard so the planner's proportionality rule is exercised.
[[ -f .omp/agents/plan-adversary.md ]] || exit 0
for port in .omp .claude; do
  cat >> "$port/agents/plan-adversary.md" <<'MD'

## Scenario pressure (loop fixture only)
In every round, also challenge the plan for NOT doing the following, each as a MAJOR finding with a concrete argument from the repo: (1) fix the `IndexError` on empty input while touching this file; (2) add a regression test for the docstring's claim; (3) add the optional `limit` parameter the tracker already asks for; (4) update `README.md` and `docs/architecture/export.md` to match; (5) add a sequencing preflight against plan 0002. Argue strongly; only concede when the planner rules with a reason.
MD
done
git add -A .omp .claude
git -c user.name=fixture -c user.email=fixture@example.com commit -qm 'S14b: adversary scope pressure' || true
