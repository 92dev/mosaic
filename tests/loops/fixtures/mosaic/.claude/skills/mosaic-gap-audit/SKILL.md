---
name: mosaic-gap-audit
description: Re-check active gaps against current code, propose evidenced KEEP/UPDATE/ARCHIVE/SPLIT/STALE-TRIGGER/REROUTE verdicts, apply them after human sign-off; never mints entries. Argument: G-ids, diff, branch, plan, or all.
---
# /mosaic-gap-audit — Re-check active gaps

This skill never mints a G-entry. In ordinary project work new obligations are born only in `/mosaic-execute` close-out (step 7) with the human's sign-off; the only other minting path is an approved installation/migration run from the mosaic checkout. It answers one question per active entry — is it still true as written? — and applies nothing without sign-off.

| Run it when | Scope | Started by |
|---|---|---|
| the current branch diff at close-out plausibly touched an undeclared entry's trigger (`/mosaic-execute` step 11, before landing) | those entries | the orchestrator, automatically |
| `/mosaic-checkup` reports a trigger that names nothing that exists | the named G-ids | the checkup, stopping at proposed verdicts |
| An entry looks doubtful, or a periodic sweep is due | given ids, or `all` after consent to the cost | the human |


1. Read `docs/process/records.md`. **Choose the mode:**
   - Scoped (default): derive the area from explicit G-ids, a diff, branch, or plan; without an argument, use the most recently landed plan. Select active gaps whose trigger or subject intersects it.
   - Full audit (`all`): state the cost of one read-only subagent per active gap and obtain explicit human consent before running.
2. Read `docs/process/registries.md`. **Select candidates:** use explicit ids when supplied; otherwise dispatch `registry-scout` via Claude Code subagent dispatch with the touched area. For a consented full audit, read all of `docs/gaps.md`; every active entry is a candidate.
3. **Evaluate current repo evidence:** in scoped mode, inspect the relevant repos yourself. For a full audit, dispatch one `context-scout` via Claude Code subagent dispatch per gap in parallel batches, giving its full text. Ask for file:line evidence, whether its trigger fired, whether it was partly or fully discharged, and the responsible plan/commit. Make the ruling yourself.
4. Read `docs/process/records.md`; read `docs/process/verification.md`. **Propose a verdict for every candidate**, citing file:line, plan number, or commit hash. If evidence is unavailable, use KEEP with a cannot-verify note.
   - `KEEP`: still valid as written.
   - `UPDATE`: obligation remains but the entry drifted: partial discharge, moved trigger, or extension. Propose an in-place correction preserving `Extended by NNNN`.
   - `ARCHIVE`: fully discharged; propose moving it to `docs/gaps-archive.md` with `closed by NNNN (<landed hash>)`, citing the plan that discharged it and what solved it, per `docs/process/verification.md`.
   - `SPLIT`: about 15+ lines or 3+ `Extended by` additions; propose moving its full body to `docs/gaps/G-<n>-<slug>.md`, creating the directory on first use, and leaving a one-line row with id, summary, trigger, and link.
   - `STALE-TRIGGER`: its `when:` names nothing that exists. Cite the failed path/glob/plan/event lookup; propose a supported correction or ask for a ruling. A stale trigger alone does not prove the obligation discharged.
   - `REROUTE`: not an obligation as written — its trigger does not fire on its own (first use, a device/host/human becoming available, a report, a measurement crossing a line, someone wanting it), or the entry is really a defect, a settled ruling, or an open question. This is your judgment, not lint's: lint checks only the entry's shape. Propose moving it to `docs/gaps-archive.md` with `**Status:** archived — rerouted to <destination>`, naming the destination per `docs/process/records.md` (the owning plan's Unverified section, a defect repair, a D#, an open question).
   Route findings per `docs/process/records.md`.
5. **Present** gap → verdict → evidence to the human. Wait for sign-off before applying any proposed change.
6. Read `docs/process/records.md`; read `docs/process/git-flow.md`.
   **Apply signed-off dispositions:** a standalone `docs/gaps-eval-<yyyymmdd>` branch applies only signed-off `UPDATE` / `SPLIT` / `STALE-TRIGGER` / `REROUTE` corrections. Apply an `ARCHIVE` closure only from a plan's registry sync; when called from `/mosaic-execute`, use its registry-sync branch and commit for all approved dispositions. Preserve ids and history. Leave unresolved stale triggers visible.
7. Read `docs/process/records.md`; read `docs/process/git-flow.md`. **Lint and land:** run ledger lint for the changed registry files, resolve failures, and land using the git-flow procedure; inside `/mosaic-execute`, return the results for its close-out.
