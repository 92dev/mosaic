---
description: "Coordinate work through the installed tracking mode, preserve writer ownership, and require landing evidence before done."
---
Read when: planning intent, checking shared areas, recording intake verdicts or lifecycle events, or reconciling tracker writes.
# Tracker coordination
Scope: link repo{{MULTI_REPO}} and all member repos{{/MULTI_REPO}}{{MONOREPO}} and its component paths; use `link-repo` as the only repo target{{/MONOREPO}}. Installed tracking mode: `{{TRACKING}}`.
{{TRACKING_NONE}}
## No tracker
- This project does not track work in an external tracker; plans and ledgers are the record. Skip every tracker step: no tracker reads, intent, queue harvest, scout dispatch, events, comments, or tracker frontmatter.
- Before reserving a plan number, inspect the master ledger, applicable local ledgers, and active plans for overlapping repos/areas, and run `git branch -r` in each target repo for competing branches. Retain searched scope, overlaps, and unresolved branches in the plan and approval brief; stale/unavailable refs or unreadable records are limitations, not proof of no collision.
- Retain evidence and per-repo landing receipts in the Execution log and ledger. Record out-of-scope defects with reproducer/evidence under `## Open defects` in the Execution log.
- `/mosaic-intake` states `No tracker is configured` and stops. Do not invent an intake queue or a markdown ticket ledger.
{{/TRACKING_NONE}}
{{TRACKING_LOCAL}}
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
repos: {{MEMBERS}}
areas: {{MULTI_REPO}}{{MEMBERS}}/<project path>{{/MULTI_REPO}}{{MONOREPO}}<project path>{{/MONOREPO}}, contract:<name>
branch: {{MEMBERS}}:task/NNNN-<slug>
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
{{/TRACKING_LOCAL}}
{{TRACKING_MCP}}
## Runtime connection
Server: `{{MCP_SERVER}}`; team: {{MCP_TEAM}}; intake queue: {{MCP_QUEUE}}.
Call this named server's MCP tools directly through the active runtime; no installed tracker client, local inventory, outbox, or scout is used. Read mounted tool schemas before calling; do not substitute another server or invent tool support. Resolve an unset team from existing issue/session evidence or H-tracking before creating intent; an unset queue requires the H-tracking ruling before intake.
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
Preserve human text outside these markers byte-for-byte; refuse malformed, duplicate, or conflicting anchors instead of overwriting them.
```text
<!-- mosaic:begin -->
plan: docs/plans/NNNN-<slug>.md
repos: {{MEMBERS}}
areas: {{MULTI_REPO}}{{MEMBERS}}/<project path>{{/MULTI_REPO}}{{MONOREPO}}<project path>{{/MONOREPO}}, contract:<name>
branch: {{MEMBERS}}:task/NNNN-<slug>
writer: w-<8 hex>#<generation>
last-event: <event> <ISO timestamp>
parked: none
<!-- mosaic:end -->
```
`plan: none` is valid before the doc exists. Paths/areas are link-root-relative; `contract:<name>` matches only that exact name. Record each repo's branch in this block, never in a read-only remote branch field.
## Complete reads and intake
- For collisions, call `list_issues` with configured `team` and one native `state` string per query, covering every active state including triage/backlog and parked work; never pass an array or comma-list as `state`. If team is unset, search all teams. Do not restrict by queue, label, assignee, or recency. Follow the returned cursor on every query until `hasNextPage` is false; merge/deduplicate ids. A missing/repeated cursor while more pages remain, failed page, unsupported scope, or unknown completeness is `INCOMPLETE/UNAVAILABLE`, never no collision.
- Call `get_issue` for each candidate's full description, identity, owner, state, and attachments; list summaries are not full scope. Compare managed repos/areas to the intended scope: exact `contract:` names, globs against literal paths, or compatible directory prefixes down to the file count. Different literal files do not overlap merely because they share a directory.
- Retain all stale active intent and unknown-scope items; absent repos/areas cannot clear a candidate unless full description/title establishes a different scope with cited evidence. Report each overlap/unresolved item with id/key, owner, state, areas, last-event age in days (unknown if absent), URL, searched scope, and completeness. Only a complete inventory with readable candidates justifies no collision; no tracker-scout dispatch.
- Intake uses `list_issues` with the resolved `team`. Resolve whether the configured queue names a state or a label: a state queue selects that `state` (explicit `todo` replaces it); a label queue selects that `label` plus requested `state` (`triage` by default, `todo` when requested), mapped to the team's workflow. Do not combine conflicting states or guess team/queue semantics. Paginate to `hasNextPage: false`; use `get_issue` for full source and attachments and `list_comments` with `issueId` for all discussion/prior verdicts, following every comments cursor too. Inspect attachments or disclose unreadable evidence.
## Writer ownership and mutation
- Generate one random opaque `w-<8 hex>` token once per session, retain it, and initially claim an unowned item at `token#1`. Never derive it from timestamps, content, hostnames, local paths, or identities. Re-fetch before every write and require the same managed `token#generation`; malformed/conflicting blocks or a foreign token/generation refuse the write. `WRITER-CONFLICT` is terminal for this session on the item: no further writes, including comments.
- Never impersonate another writer, even with human permission. The human hands the item over in the tracker, recording the new session's token and an incremented generation, or the owning session records the event. This discipline is not an atomic lock; disclose races rather than claim exactly-once writes.
- Resolve an explicit team-native state mapping before mutation (use `list_issue_statuses` when needed); unsupported/unresolved states are unsent events, never guessed. Use `save_issue` without `id`, with `team`, `title`, mapped planning `state`, and a managed `description` containing repos/areas, `plan: none`, and writer generation 1 to record intent before reserving a number. Retain returned id/key/URL for `tracker: {provider: mcp, server: {{MCP_SERVER}}, id, key, url}`; plan `areas:` follows intended scope.
- Once the plan is authored, use `save_issue` with `id` to bind its path/branches and project managed description, writer, last-event, and mapped state. Preserve all human-owned fields and text. After a fresh `get_issue`, prefer the named server's atomic `patch` with unique `old_string`/`new_string` for the block when supported; otherwise send the fresh full description with only that block changed and all outside text intact. Claim an unmanaged intake item only by appending one valid block without changing human text; unknown scope stays unknown. If claiming changes a fingerprinted description, refresh the source and investigate that snapshot before publishing a verdict.
- Lifecycle writes occur at `approved`, `executing`, each landed wave as a comment, `review`, `done`, explicit `parked`/`resumed`, and `abandoned`. Parking records reason, resume condition, and pre-park state; explicit resume restores that state. Out-of-scope defects get new intent plus a comment linking reproducer/evidence. Never close an intake request without the human's decision.
- Before `done`, prove `{repo,ref,commit,reachable:true}` for every item repo on its published ref, including required link-repo sync; retain those receipts in the Execution log and ledger and link them in the completion event. Local commits, task completion, approval, or tracker state alone are not landing evidence.
## Append-only comments and reconciliation
- Before a verdict or progress comment, read `get_issue` for writer ownership and `list_comments` for prior records. Use `save_comment` with `issueId` and `body`, never an existing comment `id`; preserve discussion and managed last-event. Verdict bodies use `rule://intake`'s exact block followed by `<!-- mosaic:comment sha256=<sha256(key + verdict body)> writer=<token#generation> -->`, hashing the exact body without the marker; use the same marker scheme for progress comments.
- A matching marker and exact body is an existing receipt: retain its comment id, do not repost. A changed body or human edit is source evidence, not an unchanged receipt; exclude only verified unchanged automation records from fingerprints. After a confirmed complete verdict, `save_issue` may replace only managed `intake:<disposition>` labels, preserving every unrelated label, description, and last-event; no label or state implies human approval.
- Retain returned issue/comment ids. Reconcile uncertain writes using fresh `get_issue` and complete `list_comments` before retrying; uncertain creation requires a complete intent search for this writer/scope before creating again. Do not claim an unconfirmed write succeeded or reuse another writer's token.
- Link evidence, do not mirror registries, verification output, reviewer findings, attachments, or source excerpts. Outages do not block planning: disclose unavailable collision checks and unsent writes, use `tracker: null` until intent is confirmed, queue events in the Execution log, and reconcile later. Incomplete intake is a limitation, never an empty queue.
{{/TRACKING_MCP}}
