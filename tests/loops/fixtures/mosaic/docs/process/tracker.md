---
description: "Coordinate work through the installed tracking mode, preserve writer ownership, and require landing evidence before done."
---
Read when: planning intent, checking shared areas, recording intake verdicts or lifecycle events, or reconciling tracker writes.
# Tracker coordination
Scope: link repo and all member repos. Installed tracking mode: `local`.
## Authority
| Fact | Authority | Projection |
|---|---|---|
| Scope, tasks, acceptance, evidence, dispositions, deviations | Plan doc | Managed block or evidence links |
| Plan status | Plan frontmatter | Authored ledger row; tracker state |
| Landed | Per-repo receipt: commit reachable on published ref, retained in Execution log and ledger | Tracker `done` |
| Owner, assignment, priority, due dates, human discussion | Tracker | None in repo |
| Intent before the plan exists: repos, areas, branches | Managed block | Plan `areas:` becomes authority when authored |
| Progress and intake verdicts | Append-only comments, ids retained | Consequential rulings via `rule://records` |
| Decisions, obligations, pitfalls, questions, product docs; learnings | Repo records; Execution log until closure | `rule://records` and `skill://mosaic-execute` |
Tracker state is never proof of landing. A collision report provides visibility, not a lock.
## Managed description block
Preserve human text outside these markers; refuse malformed, duplicate, or conflicting anchors instead of overwriting them.
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
`plan: none` is valid before the doc exists. Paths/areas are link-root-relative; `contract:<name>` matches only that exact name. Record each repo's branch, never a read-only remote branch field.
## Write discipline
- Use one automation writer per item: generate a random opaque `w-<8 hex>` token once per session, retain it, and start at `token#1`. Never use a timestamp, content hash, hostname, local path, or personal identity. A bare CLI token means generation 1. A foreign token or generation is `WRITER-CONFLICT` (exit 1), terminal for this session on that item: no further writes, including comments. Never impersonate another session even with human permission; the human hands over the item in the tracker, or its owning session records the event.
- Preserve human-owned fields and discussion. Comments preserve the body and managed last-event; only `intake:<disposition>` labels derived from a matching complete verdict change, with unrelated labels intact.
- Retain returned ids. Comment identity is sha256(key + body); retries return the existing id. Reconcile uncertain writes using the item and its receipts before retrying; no exactly-once or concurrent-lock guarantee is claimed.
- Record `planning` intent before reserving a plan number. Later write points: `approved`, `executing`, each landed wave as a comment, `review`, `done`, explicit `parked`/`resumed`, `abandoned`, and intake verdicts. Out-of-scope defects get intent plus a comment linking reproducer/evidence; never close intake requests on the human's behalf.
- `done` requires published-ref evidence `{repo,ref,commit,reachable:true}` for every item repo, retained in the Execution log and ledger; include any link-repo sync before declaring completion. Parking records reason and resume condition; explicit resume restores the pre-park state.
- Link evidence rather than mirror registries, verification output, findings, attachments, or source excerpts. Outages do not block planning: disclose unavailable collision checks and unsent writes, use `tracker: null`, queue events in the Execution log, and reconcile later. Never invent ids or claim an unconfirmed write succeeded.
## Local operations
Commands run from the link root. `bun tools/tracker.ts --provider replay [--replay <dir>] <command>` defaults to `docs/tracker`: reads `items.json`, appends accepted writes to `outbox.jsonl`. Local keys are never resolved with remote tools. A local receipt proves acceptance, not that another person saw it.
Unmanaged local inventory items carry repos in their `repos` field and have `managed: null`; their description body is returned verbatim.
- `list [--state s,...] [--label l] [--team t] [--all]`: complete array and `{"complete":true}` trailer; terminal items require `--all`. Missing trailer, failed reads, or unsupported filters mean `INCOMPLETE/UNAVAILABLE`, never an empty queue or no collision. Intake uses `list --state triage --label intake` (explicit `todo` substitutes that state); `get <key>` reads full body, comments, attachments, and managed metadata.
- `intersect --areas <globs,contracts> [--repos r,...]`: search every active item on target repos, without a recency window or intake-label restriction; retain stale intent and unknown-scope items. Either glob matching the other's literal path or compatible directory prefixes down to the file count; different literal files do not overlap just because they share a directory. Missing areas are unresolved unless title/body establishes a different area, which must be cited.
- Only a complete inventory and readable matches justify no collision. Report every overlap/unknown scope with key, owner, state, areas, last event and `stale` days, URL, searched scope, and completeness. If matches exist, `tracker-scout` may perform this read-only report; it never decides whether to proceed.
- `intent --title <text> --repos <r,...> --areas <a,...> [--plan <path>] --writer <token>` creates intent; `get <key>` supplies id and URL for `tracker: {provider: replay, id, key, url}`. Use the intended scope for plan `areas:`; unavailable intent follows the outage policy.
- `event <key> <approved|executing|review|done|abandoned|parked|resumed> --writer <token#generation> [--note <text>] [--receipt <json>]` updates state and managed block; `done` takes one receipt object or an array for all item repos; parking requires a note with reason and resume condition.
- `comment <key> --file <path> --writer <token#generation>` returns a stable id; keep verdict files outside the repos and delete after read-back. `receipt <key>` lists accepted outbox entries, including prior verdict ids/bodies. Exclude only unchanged automation receipts from intake fingerprints; human edits count. Exit 0 = success; 1 = refusal/conflict; 2 = unsupported or `INCOMPLETE/UNAVAILABLE` inventory.
