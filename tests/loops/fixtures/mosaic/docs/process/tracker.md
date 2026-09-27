---
description: "Read and write replay tracker coordination, detect overlapping intent, and require landing receipts before done."
---
Read when: planning intent, checking shared areas, recording intake verdicts or lifecycle events, or reconciling tracker writes.
# Tracker coordination
Scope: link repo and all member repos; commands run from the link root. The installed tracker is replay-only; no live workspace writes are supported.
## Authority
| Fact | Authority | Projection |
|---|---|---|
| Scope, tasks, acceptance, evidence, dispositions, deviations | Plan doc | Managed tracker block or evidence links |
| Plan status | Plan frontmatter | Authored ledger row; tracker state |
| Landed | Per-repo receipt: commit reachable on the published ref, retained in Execution log and ledger | Tracker `done` |
| Owner, assignment, priority, due dates, human discussion | Tracker | None in repo |
| Intent before the plan exists: repos, areas, branches | Tracker managed block | Plan `areas:` becomes authority when authored |
| Progress and intake verdicts | Append-only tracker comments, ids retained | Landed context or consequential ruling via `rule://records` |
| Decisions, obligations, pitfalls, questions, product docs; learnings | Repo records; Execution log until closure | Read `rule://records` and `skill://mosaic-execute` |
Tracker state is never proof of landing. A collision report provides visibility, not a lock; stale active items are never dropped.
## Linear capability map (replayed, not connected)
| Capability | Mapping |
|---|---|
| Native | Title, explicit team-state mapping, assignee, labels, parent, dependencies, links, comments, project health |
| Managed | Plan path, repos, areas, per-repo branch, writer generation, last event, park reason and resume condition |
| Unsupported | Live Linear writes (`--provider linear` exits 2); Jira and Monday; writing Linear's read-only `gitBranchName` |
## Managed description block
Human text outside these markers is preserved; malformed or conflicting anchors are refused, never overwritten.
```text
<!-- mosaic:begin -->
plan: docs/plans/NNNN-<slug>.md
repos: member-a
areas: member-a/<project path>, contract:<name>
branch: member-a:task/NNNN-<slug>
writer: w-<8 hex>#<generation>
last-event: <event> <ISO timestamp>
parked: none
<!-- mosaic:end -->
```
`plan: none` is valid before the doc exists. Paths/areas are link-root-relative; `contract:<name>` matches only that exact contract name.
## Write discipline
- One automation writer per item: a random opaque token generated once per session and retained (`w-<8 hex from /dev/urandom>`; never a timestamp or content hash) plus generation (`token#1` initially). A bare CLI token means generation 1; a foreign token or generation is `WRITER-CONFLICT`, exit 1. `WRITER-CONFLICT` on an item is terminal for this session: no further writes to it, comments included. Never write with another session's token, even when a human offers to authorize it: the human hands the item over in the tracker (or the owning session records the event); never offer impersonation as an option. Never put hostnames, local paths, or personal identities in tokens.
- Human-owned fields and discussion are never replaced. Comments preserve the body and managed last-event, maintaining only `intake:<disposition>` labels derived from a matching complete verdict; unrelated labels remain intact.
- Retain returned ids. Comment identity is sha256(key + body); replaying that comment prints the existing id without another write. Reconcile uncertain writes with `get` and `receipt` before retry; no exactly-once guarantee or concurrent-writer lock is claimed.
- Intent is written at `/mosaic-plan` Phase 1 in `planning`, generation 1. Later write points: `approved`, `executing`, each landed wave as a comment, `review`, `done`, explicit `parked`, explicit `resumed`, `abandoned`, and intake verdict comments.
- `done` requires `--receipt` JSON containing `{repo,ref,commit,reachable:true}` for every item repo (one object or an array); obtain evidence from the published refs first. Park with `--note` stating reason and resume condition; resume explicitly restores the pre-park state.
- Do not mirror registries, verification output, reviewer findings, attachments, or source excerpts; link evidence. A tracker outage does not block planning: queue unsent events in the Execution log, expose the unavailable collision check, and reconcile later.
## Replay adapter
Replay keys (`ENG-…` in `items.json`) are never resolved through live provider tools; no live tool is consulted. A local receipt proves the adapter accepted a write, not that another person has seen it.
`bun tools/tracker.ts --provider replay [--replay <dir>] <command>` defaults to `docs/tracker`: replay reads `items.json` and appends accepted writes to `outbox.jsonl`. Unmanaged ticket repos travel in a `<!-- mosaic:repos:["repo"] -->` description marker, written by intake and hidden by the adapter; `managed` stays null.
- `list [--state s,...] [--label l] [--team t] [--all]`: complete array plus `{"complete":true}` trailer; terminal items require `--all`. `get <key>` returns body, comments, attachments, and managed metadata.
- `intersect --areas <globs,contracts> [--repos r,...]`: active overlaps and days since last event; an active item on a target repo with no declared areas (intake tickets included) is listed with `scope: unknown`; name it in the brief as unresolved unless its title or body names a different area, in which case say which; either glob matching the other's literal path or compatible directory prefixes down to the file count. Different literal files do not overlap merely because they share a directory.
- `intent --title <text> --repos <r,...> --areas <a,...> [--plan <path>] --writer <token>` prints a new key; `get` supplies immutable id and URL for plan frontmatter `tracker: {provider: replay, id, key, url}`.
- `event <key> <approved|executing|review|done|abandoned|parked|resumed> --writer <token#generation> [--note <text>] [--receipt <json>]` updates state and the managed block.
- `comment <key> --file <path> --writer <token#generation>` prints its stable id; `receipt <key>` prints that item's outbox entries. Exit 0 = success; 1 = refused precondition/conflict; 2 = unsupported or `INCOMPLETE/UNAVAILABLE` inventory.
