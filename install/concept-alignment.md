# Concept-alignment report template

Use this shape for target `docs/mosaic-migration/03-concept-alignment.md`; read [migration-map.md](migration-map.md) and the records rule before filling it.
This is a permanent migration record, not another runtime configuration or a replacement for the plan's per-file nothing-lost ledger.
Link it from target `docs/index.md` with destination `mosaic-migration/03-concept-alignment.md`; link the adaptations record with destination `mosaic-migration/kit-adaptations.md`.

## Report header

Record the surveyed target/root, observed topology/default branch and landing-policy evidence, `tracking` and H-tracking evidence/scope, `cutoff: yes|no`, H0/exceptions, baseline commit, kit revision or source hash, and links to `00-survey.md`, `01-dry-install.md`, `02-plan.md`, `kit-adaptations.md`, and `STATUS.md` from the report's own directory.
At sign-off closeout, repair this active report's links to moved files under `../archived/mosaic-migration/` and replace raw-evidence links with the archived plan/brief summaries; this report and `kit-adaptations.md` stay here.
Use prose/code paths until a referenced file exists; reports must not introduce broken example links or literal unrendered template delimiters.

## Alignment table

Assign stable IDs `A1`, `A2`, …; never reuse an ID when a ruling changes. One row covers one existing concept, doc family, agent, skill, hook, or registry (path or name) ↔ its kit concept.
A doc-family row cites its complete source-file inventory/ledger rows, including component docs and non-Markdown assets; enumerate roles, skills, hooks, and registries individually. Add `new` rows for genuinely absent kit concepts with source `none`.
Split mixed concepts across rows where their directions/actions differ; cite shared source paths and cross-link the rows so no original content is lost.
Always include a **tracker** row, including when no tracker exists: source evidence or `none` ↔ the rendered `docs/process/tracker.md` and runtime `tracking` metadata. Cite H-tracking, server/team/queue scope, selected/omitted files, local-data preservation/archive destinations, and read-only verification. `none` is a recorded mode, not permission to skip alignment.

| ID | Existing concept / path or name / inventory evidence | Kit concept / home | alignment | Adapt-kit option | Restructure-target option | direction + rationale | resolution | owner | status + evidence |
|---|---|---|---|---|---|---|---|---|---|

- `alignment`: `same` (already equivalent), `rename` (name/path change), `merge` (combine without loss), `split` (separate meanings), `keep-as-project` (retain project authority/capability), `archive` (H0 cutoff history with a rebuild handoff), `retire` (reason and retained history), or `new` (kit concept absent).
- `direction`: `adapt-kit`, `restructure-target`, `both`, or `none`. Describe both options, even when rejected, and the selected direction's reason; an unresolved proposed direction does not authorize execution.
- Prefer `adapt-kit` for wording/path/command/convention differences. Select `restructure-target` only for a named lint/doctor/checkup/tracker/plan-ledger requirement or an explicit human choice; preserve required mechanical interfaces when changing the canonical doc home.
- `resolution`: exact files/actions, caller/link repairs, retained authority and verification; for cutoff documentation families use `rebuild plan`, citing the archive inventory and `docs/docs-migration-instructions.md`; otherwise unresolved choices use `human ruling:` plus the precise question, not an assumed answer.
- `owner`: `mechanical`, `plan task Tn`, or `human`. `mechanical` is only for an already verified `done` row; all outstanding implementation belongs to an existing Tn task, never an unassigned intention.
- `status`: `proposed`, `in-progress`, `blocked`, or `done`, plus an evidence pointer. `done` means the action/retention and its index links have been verified, not merely selected or approved.

## Human rulings

List every human-owned non-done row here; preserve the question and later answer with its source/date. A human answer changes the resolution into an exact action and its owner into the implementing `plan task Tn` (or verified done `mechanical`); keep the original question/answer in this list.
Always record **H0 — Cutoff mode?** with `yes|no`, provenance, and owner-named process/runbook exceptions. Only explicit owner input/ruling authorizes `yes`; absent human input means `no` (cutoff not authorized), never an inferred conservative reset. For `yes`, family rows use `archive` / `restructure-target` / `rebuild plan`; their migration task owns preservation and handoff, not the later rebuild.
H3 records the remote-default-branch derivation and observed landing policy (PR into that branch with CI when supported), or the explicit human override; observed policy alone is not an unresolved ruling.
Always record **H-tracking — Which tracking mode and scope?** with survey evidence and provenance: default `none` without tracker evidence; `local` only for an explicit owner request; `mcp` for a mounted MCP tracker or one named by the owner. Record the exact runtime server name, known team, and queue state/label inferred from evidence or ruled by the human; no dedicated queue is itself an explicit ruling. Ticket keys/docs alone do not authorize a local store, and configured-but-unmounted tools are not connection proof.
Unknown server names, competing trackers, or an underivable queue remain exact blocked questions; link the tracker row and implementing task. A resolved evidence-based H-tracking choice need not ask again. Record omitted optional values and access limits honestly; installation makes no MCP writes.

| Alignment IDs | Exact question / choices | Why the agent cannot decide | Blocked action | Human answer / provenance | Implementing task / verification |
|---|---|---|---|---|---|

No answer means no affected action. Safety, overwrite/retirement, authority, landing/deploy, and ambiguous ID mappings cannot be settled by a conservative guess. Unrelated work may proceed only within the skill's safety boundary.
For example, an ADR↔D namespace question or a decision whether to renumber PRDs is a ruling, not a reason to invent IDs or call the alignment done.

## Reconciliation gate

- Every surveyed concept/family/agent/skill/hook/registry maps to a row; each family inventory accounts for all source files through the nothing-lost ledger.
- The tracker row is present even for `none`; H-tracking agrees with manifest and runtime metadata, mode-specific rendering, and data preservation. `none`/`mcp` omit the local CLI, data tree, and tracker scouts; MCP read access is demonstrated or explicitly blocked, never inferred from configuration.
- Every non-`done` row names a real Tn task in `02-plan.md` or appears in Human rulings with owner `human` and an exact question; no mechanical-owned open rows.
- Each task cites its alignment IDs in instructions and acceptance; each `done` row cites executed evidence, its preserved/moved/retired source disposition, and resolving index links.
- All installed-kit adaptations cite these IDs and are recorded per file in `kit-adaptations.md`; doctor still passes after the final edits to both records.
- `docs/index.md` links this report and the adaptations log; retain them after landing and use them to re-apply or retire adaptations on upgrades.

## Concept alignment — brief excerpt

In phase 6, present this named section rather than making the human infer alignment from the file diff:
- **Rows resolved:** list each `done` ID, its short resolution and evidence/report link; state `none` when empty.
- **Rows needing a ruling:** list each human-owned ID, its exact question, choices and blocked action; state `none` when empty.
- **Unfinished plan work:** list any remaining Tn-owned IDs/tasks and their blocker; do not hide them among resolved rows or claim installation complete.
- **Tracking:** state H-tracking's mode and evidence, MCP runtime server/team/queue when relevant, retained local/history records, and any unresolved scope/access prerequisite; installation performed no MCP writes.
- **Cutoff handoff:** state `no` or the cutoff SHA, archive counts by family (including PR docs), exceptions, and link to `docs/docs-migration-instructions.md`; the first real plan is `/mosaic-plan docs-rebuild` and current-state reconstruction is still pending.
Record supplied answers above, execute/verify affected tasks and repeat the adaptation/review gates before authorized landing; sign-off alone is not evidence that a row was implemented.
