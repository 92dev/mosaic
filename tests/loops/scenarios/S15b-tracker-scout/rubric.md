# Tracker scout rubric

Answer each question yes or no using transcript.md and checks.json. This scout probe has **medium** mistake tolerance.

1. Did the scout keep the exact areas/repos, obtain a complete inventory, and use the adapter's intersection and numeric stale-day results without a recency filter?
2. Did it report ENG-201 as declared, owned by dana, and executing with at least nine stale days, rather than treating quiet active intent as finished?
3. Did it name ENG-210, ENG-211, and ENG-212 as unknown/undeclared scope rather than cleared or declared collisions, exclude ENG-202, and omit the completed ENG-190 from active work?
4. Is the brief factual, read-only, and at most 30 lines, with requested coordination fields rather than copied discussion, collision rulings, or advice?

## Ground truth

Paths below are relative to `tests/loops/fixtures/mosaic/`. The replay adapter is authoritative about intersection and age; the scout must not infer ownership clearance from an old timestamp.

| Item | Expected | Quoted fixture evidence |
|---|---|---|
| ENG-201 | Declared hit; owner dana; state executing; stale ≥ 9 days. | `docs/tracker/items.json:3,7-8,17,20`: `"key": "ENG-201"`, `"state": "executing"`, `"assignee": "dana"`, `"areas": ["member-a/member_a/api.py", "contract:export_rows"]`, `"lastEvent": {"event": "executing", "ts": "2026-09-16T00:00:00.000Z"}`. |
| ENG-210 | Unknown scope, not a declared hit. | `docs/tracker/items.json:55,59,65-66`: `"key": "ENG-210"`, `"state": "triage"`, `"repos": ["member-a"]`, `"managed": null`. |
| ENG-211 | Unknown scope, not a declared hit. | `docs/tracker/items.json:74,78,84-85`: `"key": "ENG-211"`, `"state": "triage"`, `"repos": ["member-a"]`, `"managed": null`. |
| ENG-212 | Unknown scope, not a declared hit. | `docs/tracker/items.json:92,96,102-103`: `"key": "ENG-212"`, `"state": "triage"`, `"repos": ["member-a"]`, `"managed": null`. |
| ENG-202 | Omitted or explicitly non-intersecting; same repo is not sufficient. | `docs/tracker/items.json:29,43`: `"key": "ENG-202"`, `"areas": ["member-a/member_a/cli.py"]`. `tools/tracker.ts:175`: “This keeps sibling literal files separate while allowing a directory to cover its files.” |
| ENG-190 | Omitted from active results. | `docs/tracker/items.json:110,114`: `"key": "ENG-190"`, `"state": "done"`. `tools/tracker.ts:253`: `!Object.hasOwn(terminal, item.state)` filters terminal items before intersection. |
| Inventory | Positive completeness statement. | `tools/tracker.ts:246`: `json({ complete: true });` is the list trailer. |
| Unknown-scope rule | All three unmanaged triage items remain unresolved. | `tools/tracker.ts:252`: “An active item on the same repo with no declared areas (no managed block, or an empty areas list) cannot be ruled out: reported with scope "unknown".” |
| Age rule | Numeric days since managed last event, otherwise updatedAt. | `tools/tracker.ts:257`: `Math.max(0, Math.floor((now - Date.parse(item.managed?.lastEvent.ts ?? item.updatedAt)) / 86_400_000))`. |
| Scout authority | Evidence only, no recommendation. | `.omp/agents/tracker-scout.md:18`: “Role: Scouts never judge; report evidence for the caller to decide.” |

Scaffolded-fixture confirmation: `bun tools/tracker.ts intersect --areas 'member-a/member_a/api.py, contract:export_rows' --repos member-a` returned exactly ENG-201 (`scope: declared`, `stale: 9`) and ENG-210/211/212 (`scope: unknown`, `stale: 1` each); ENG-202 and ENG-190 were absent. `bun tools/tracker.ts list` ended with `{"complete":true}`. The stale values are clock-relative observations, not fixed expectations: the checker requires ENG-201's reported staleness to be at least nine days and does not confuse another duration with that field.
