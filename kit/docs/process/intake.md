---
description: "Investigate external requests, settle evidenced risk, and stop every proposed disposition at a human digest."
---
Read when: investigating an external request in the project root or a member repo.
# Intake
- Investigate every external request read-only before selecting a work procedure. There is one profile; additive checks cannot lower settled risk, remove implementation reviewers, or widen Inline eligibility.
## Risk
| Risk | Observable criteria |
|---|---|
| LOW | Known touches, one target repo (or one scoped component in a monorepo), no contract/schema/auth/data change, reversible, covered by a targeted test — or a docs/comment-only change whose correctness is checked by reading |
| MEDIUM | Touches known, but another LOW criterion is unmet or unknown, or callers can observe a behavior change; no HIGH criterion applies |
| HIGH | Contract, schema, auth, data, or deploy change |
| UNKNOWN | Touches are unknown; unknown scope is never LOW |
- The orchestrator settles risk after ASSESS, REFUTE, and the registry sweep. Publishing final LOW or `implemented: yes|partial` requires a completed cross-family REFUTE of the same request snapshot and per-repo code revisions, with checks and outcome rather than just an approval word. Missing, failed, unavailable, or stale REFUTE means hold the item rather than publish either claim.
- Re-gate risk on the actual per-item diff before landing. A later safer ruling cannot bypass the gate.
## Dispositions and invalidation
- `inline`, `light`, and `plan` select the existing procedures in `rule://plan-triage`; `recommend-close` proposes closure of a false, stale, or duplicate request with evidence. The harness never closes a request.
- `held` includes owner, blocking question, and resume condition in `disposition`; revisit at the next intake without re-asking unchanged questions.
- Bind each verdict to the request fingerprint (title, body, comment ids and hashes, attachments) and code revisions for every touched repo. A human change or in-scope code movement requires investigation again; unchanged harness comment receipts are excluded. Unknown scope always requires investigation again.
- V1: every disposition stops at the human digest. No disposition executes before the human answers; no unattended landing. Verdict comments and disposition labels record proposals, not approval.
## Verdict record
Write one tracker comment per item and echo the same block in the digest; fields and order are fixed. For multiple repos, list every `repo:rev` after `@`, comma-separated.
```text
INTAKE VERDICT <key>
reading: <one sentence>
implemented: yes|partial|no — <file:line evidence>
touches: <paths or UNKNOWN>
risk: LOW|MEDIUM|HIGH|UNKNOWN — <reason>
refute: <family> — <upheld|downgraded: reason> | not required
registry: <G-x/P-x/plan ids intersecting, or none>
retest: <human gesture>
questions: <blocking only, or none>
disposition: inline|light|plan|recommend-close|held — <reason>
fingerprint: <sha256 of title+body+comment ids/hashes+attachments>@<repo>:<rev>
```
Keep verdicts in tracker comments, not a markdown ticket ledger. Durable no-code rulings follow `rule://records` after the human answers.
