---
name: mosaic-gap-audit
description: Re-check active gaps, pitfalls, and decisions against current code, propose evidenced KEEP/UPDATE/ARCHIVE/SPLIT/STALE-TRIGGER/REROUTE verdicts, apply them after human sign-off; never mints entries. Argument: G-/P-/D ids, diff, branch, plan, or all / pitfalls / decisions.
---
# /mosaic-gap-audit — Re-check active gaps, pitfalls, and decisions

This skill never mints a G-entry, P-entry, or D#. In ordinary project work new obligations are born only in `/mosaic-execute` close-out (step 7) with the human's sign-off; the only other minting path is an approved installation/migration run from the mosaic checkout. It answers one question per active entry — is it still true as written? — and applies nothing without sign-off. Pitfalls (`P-x`) and decisions (`D#`) join the same loop with the verdicts marked for them below.

| Run it when | Scope | Started by |
|---|---|---|
| the current branch diff at close-out plausibly touched an undeclared entry's trigger (`/mosaic-execute` step 11, before landing) | those entries | the orchestrator, automatically |
| `/mosaic-checkup` reports a trigger that names nothing that exists | the named G-ids | the checkup, stopping at proposed verdicts |
| An entry looks doubtful, or a periodic sweep is due | given ids, or `all` / `pitfalls` / `decisions` after consent to the cost | the human |


1. Read `docs/process/records.md`. **Choose the mode:**
   - Scoped (default): derive the area from explicit G-/P-/D ids, a diff, branch, or plan; without an argument, use the most recently landed plan. Select active entries whose trigger or subject intersects it.
   - Full audit (`all`, `pitfalls`, or `decisions`): state the cost of one read-only subagent per active entry and obtain explicit human consent before running.
2. Read `docs/process/registries.md`. **Select candidates:** use explicit ids when supplied; otherwise dispatch `registry-scout` via Claude Code subagent dispatch with the touched area. For a consented full audit, read all of `docs/gaps.md`, `docs/architecture/pitfalls.md`, or the decision map in `docs/architecture/README.md`; every active entry is a candidate.
3. **Evaluate current repo evidence:** in scoped mode, inspect the relevant repos yourself. For a full audit, dispatch one `context-scout` via Claude Code subagent dispatch per entry in parallel batches, giving its full text. Ask for file:line evidence, whether its trigger fired, whether it was partly or fully discharged, and the responsible plan/commit; for a pitfall, whether the trap can still be walked into; for a decision, whether its subject still exists and whether a later decision supersedes it. Make the ruling yourself.
4. Read `docs/process/records.md`; read `docs/process/verification.md`. **Propose a verdict for every candidate**, citing file:line, plan number, or commit hash. If evidence is unavailable, use KEEP with a cannot-verify note.
   - `KEEP`: still valid as written.
   - `UPDATE`: obligation remains but the entry drifted: partial discharge, moved trigger, or extension. Propose an in-place correction preserving `Extended by NNNN`.
   - `ARCHIVE`: fully discharged; propose moving it to `docs/gaps-archive.md` with `closed by NNNN (<landed hash>)`, citing the plan that discharged it and what solved it, per `docs/process/verification.md`.
   - `SPLIT`: about 15+ lines or 3+ `Extended by` additions; propose moving its full body to `docs/gaps/G-<n>-<slug>.md`, creating the directory on first use, and leaving a one-line row with id, summary, trigger, and link.
   - `STALE-TRIGGER`: its `when:` names nothing that exists. Cite the failed path/glob/plan/event lookup; propose a supported correction or ask for a ruling. A stale trigger alone does not prove the obligation discharged.
   - `REROUTE`: not an obligation as written — its trigger does not fire on its own (first use, a device/host/human becoming available, a report, a measurement crossing a line, someone wanting it), or the entry is really a defect, a settled ruling, or an open question. This is your judgment, not lint's: lint checks only the entry's shape. Propose moving it to `docs/gaps-archive.md` with `**Status:** archived — rerouted to <destination>`, naming the destination per `docs/process/records.md` (the owning plan's Unverified section, a defect repair, a D#, an open question).
   - For a pitfall: `KEEP`; `UPDATE` (trap or prevention text drifted; amend in place with the new measurement); `ARCHIVE` (the trap can no longer be walked into — its subject was removed by a landed plan, or a later decision or pitfall supersedes it; propose moving the entry verbatim to `docs/architecture/pitfalls-archive.md` under `**Archived:** <reason>`).
   - For a decision: `KEEP`; `UPDATE` (text misdescribes what was decided, ruling stands; amend in place); `ARCHIVE` (its subject no longer exists or a recorded later D# supersedes it; propose moving its section verbatim to `docs/architecture/archived/<element doc>.md` under `**Archived:** <reason>` and its map row to `docs/architecture/decisions-archive.md`). A ruling you disagree with is not archivable: that is a new superseding D# through a plan, never an audit verdict.
   Route findings per `docs/process/records.md`.
5. **Present** entry → verdict → evidence to the human. Wait for sign-off before applying any proposed change.
6. Read `docs/process/records.md`; read `docs/process/git-flow.md`.
   **Apply signed-off dispositions:** a standalone `docs/gaps-eval-<yyyymmdd>` branch applies only signed-off `UPDATE` / `SPLIT` / `STALE-TRIGGER` / `REROUTE` corrections and pitfall/decision `ARCHIVE` moves (verbatim text, `**Archived:**` reason, map row moved; create `docs/architecture/archived/` on first use). Apply a gap `ARCHIVE` closure only from a plan's registry sync; when called from `/mosaic-execute`, use its registry-sync branch and commit for all approved dispositions. Preserve ids and history. Leave unresolved stale triggers visible.
7. Read `docs/process/records.md`; read `docs/process/git-flow.md`. **Lint and land:** run ledger lint for the changed registry files, resolve failures, and land using the git-flow procedure; inside `/mosaic-execute`, return the results for its close-out.
