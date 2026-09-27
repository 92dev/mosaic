---
name: gap-evaluate
description: Re-assess gaps registry entries (docs/gaps.md) against the current state of the code. Scoped mode evaluates the gaps a given change/diff/plan could have touched; full-audit mode ("all") sweeps every active gap across the whole project (intensive — needs human consent). Verdicts KEEP / UPDATE / ARCHIVE / SPLIT, each with evidence; edits apply only after human sign-off. Argument (optional): gap ids ("G-14 G-24"), a diff/branch/plan path, or "all".
---

# /gap-evaluate — Re-assess the gaps registry

You are the **orchestrator** auditing `docs/gaps.md` (active gaps only; closed history lives in
`docs/gaps-archive.md`). A gap is a conditional obligation with a trigger — decide, per entry,
whether reality has moved: discharged (archive), drifted (update), outgrown its row (split), or
unchanged (keep). Invoked on demand, or by `/palladio-execute` close-out when a landed diff touched
areas whose G-x triggers the plan did not declare.

## Modes

- **Scoped (default)**: from the argument (gap ids, a diff/branch, a plan path) — or, absent one,
  the most recently landed plan — derive the touched area, then select every active gap whose
  trigger or subject intersects it. Evaluate only those.
- **Full audit (`all`)**: every active gap against the whole project. Intensive — state the cost
  (one read-only subagent per gap) and get explicit human consent before running.

## Procedure

1. **Select candidates per the mode.** Scoped: dispatch the `registry-scout` agent with the touched area
   (or use the explicit gap ids if you were handed them) — it returns the intersecting `G-x` so you don't
   read the whole registry into context (`docs/workflow.md` §10). Full audit: read `docs/gaps.md` in full
   — every entry is a candidate.
2. **Evaluate each candidate against the repo, not against memory.** Scoped mode: verify yourself
   (read/grep/diff in the relevant repo(s)). Full audit: dispatch one `context-scout` per gap
   (parallel batches) — each gets the gap's full text and briefs back: current code evidence
   (file:line), whether the trigger has fired, whether the obligation was (partly) discharged and
   by what (plan NNNN / commit). Scouts report; only you adjudicate.
3. **Verdict per gap** — each MUST carry evidence (file:line, plan NNNN, or commit hash; "cannot
   verify" = KEEP with a note, never a guess):
   - `KEEP` — still valid as written.
   - `UPDATE` — obligation stands but the entry drifted (partially discharged, trigger moved, new
     extension): rewrite the entry in place, preserving the `Extended by NNNN` convention.
   - `ARCHIVE` — fully discharged: move the entry to `docs/gaps-archive.md`, appending
     `closed by <plan/commit> (<hash>)` + one line on what solved it. Never renumber, never delete.
   - `SPLIT` — the entry outgrew its row (~15+ lines or 3+ `Extended by` accretions): move the full
     body to `docs/gaps/G-<n>-<slug>.md` (create the folder on first use) and leave a one-line row
     in `docs/gaps.md` — id, one-sentence summary, trigger, link.
4. **Present the verdict table to the human** (gap → verdict → evidence). Apply edits only after
   sign-off — never silently archive an obligation.
5. **Land** as a docs-only change on a `docs/gaps-eval-<yyyymmdd>` branch (never commit on `main`),
   merged `--ff-only` per the git flow; when invoked from `/palladio-execute` close-out, fold the
   edits into that plan's gaps-registry-sync commit instead.
