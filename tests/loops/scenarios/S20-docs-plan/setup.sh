#!/usr/bin/env bash
set -euo pipefail

# The standard fixture setup has already initialized the link and member repositories.
[[ -f tools/doctor.ts ]] || exit 0
[[ $(git branch --show-current) == main ]]
[[ -z $(git status --porcelain) ]]
[[ -z $(git -C member-a status --porcelain) ]]
git checkout -qb docs/0004-docs-refresh main

cat > docs/plans/0004-docs-refresh.md <<'PLAN'
---
plan: 0004
title: Cite the current export implementation
status: approved
created: 2026-09-27
repo: link-repo
branch: docs/0004-docs-refresh
tracker: null
areas: [docs/architecture/export.md, docs/product/F-1-export-flow.md, contract:export_rows]
---
# Plan 0004 — Cite the current export implementation

## Context
[D1 and D2](../architecture/export.md) define the default CSV and empty-input requirements.
The current [exporter](../../member-a/member_a/api.py) is the source for implementation claims;
this plan documents it, without changing behavior or claiming the known empty-input defect is fixed.
The member's existing plan 0002 and its leftovers remain outside this plan's close-out.

## Scope
### In scope
Source-backed implications and product contracts in the two named link-owned documents.
### Out of scope
Code, tests, architecture decisions, member branches, other plans' dispositions, and landing.

## Task breakdown
Paths are relative to the link-repo home. The two file sets are disjoint.

### T1 — Rewrite the export implications
- class: docs
- files: docs/architecture/export.md
- reads: docs/architecture/export.md; member-a/member_a/api.py; rule://records
- instructions: Rewrite only the Implications paragraphs for D1 and D2. Use lines 5–40 of api.py at member-a/member_a/api.py as the implementation source. Distinguish the required CSV default from the current CSV-only writer and the required empty document from the current first-row lookup defect. Preserve each decision and its still-true obligations. Cite the actual source lines for every new statement using member-a/member_a/api.py:<start>-<end>; do not claim a fix or change code.
- acceptance: Every new statement has an archive or code-path source citation with a valid line range; D1/D2 decisions are unchanged. Ledger lint on docs/plans/0004-docs-refresh.md and docs/plans/README.md, bun tools/doctor.ts, and bun tools/checkup.ts pass; shared gates run after the wave joins per rule://dispatch.

### T2 — Add the product contracts
- class: docs
- files: docs/product/F-1-export-flow.md
- reads: docs/product/F-1-export-flow.md; member-a/member_a/api.py; rule://records
- instructions: Add a Contracts section citing member-a/member_a/api.py. State the function's rows/fmt inputs, current non-empty CSV return, first-row header ordering, and current empty-input exception. Distinguish current behavior from the required empty-document result; do not claim a fix, change existing flow statements, or edit code. Every new statement cites actual source lines using member-a/member_a/api.py:<start>-<end>.
- acceptance: Contracts describes the observed implementation and cites an archive or code path on every new statement with valid line ranges. Ledger lint on docs/plans/0004-docs-refresh.md and docs/plans/README.md, bun tools/doctor.ts, and bun tools/checkup.ts pass; shared gates run after the wave joins per rule://dispatch.

## Review checklist
- Every new implementation statement cites a real line range and is true of the observed source.
- D1/D2 decisions, existing product flow, and code remain unchanged; the known defect is not described as fixed.
- Review follows each task's class; closure evidence does not re-review approved task diffs.

## Verification
After the executor wave joins, retain outputs from:
- bun tools/lint-ledgers.ts docs/plans/0004-docs-refresh.md
- bun tools/lint-ledgers.ts docs/plans/README.md
- bun tools/doctor.ts
- bun tools/checkup.ts
Check every new citation against the actual member-a/member_a/api.py line count and content.

### Unverified
This documentation-only change does not fix or re-verify the empty-input defect owned by plan 0002.

## Planning log
- Human: approved both documentation tasks and waived planning debate for this bounded documentation refresh. Execution is authorized; landing is not.

## Execution log
PLAN

python3 - <<'PY'
from pathlib import Path
ledger = Path('docs/plans/README.md')
body = ledger.read_text()
if '| [0004]' in body:
    raise SystemExit('S20 requires plan number 0004 to be free after fixture setup')
row = '| [0004](0004-docs-refresh.md) | Cite the current export implementation | approved | link-repo | `docs/0004-docs-refresh` | — |\n'
lines = body.splitlines(keepends=True)
last_row = max(index for index, line in enumerate(lines) if line.startswith('|'))
lines.insert(last_row + 1, row)
ledger.write_text(''.join(lines))
PY

git add -- docs/plans/0004-docs-refresh.md docs/plans/README.md
git commit -qm '0004: approve source-backed documentation refresh'
[[ -z $(git status --porcelain) ]]
printf 'S20 ready: approved link-homed docs plan on %s; source has %s lines\n' "$(git branch --show-current)" "$(wc -l < member-a/member_a/api.py)"
