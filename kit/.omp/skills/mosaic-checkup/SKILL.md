---
name: mosaic-checkup
description: Sweep documentation and harness drift, repair mechanical links on a branch, and stop at a human digest.
---
# /mosaic-checkup — Sweep recorded work for drift

1. Read `rule://map`; read `rule://records`; read `rule://plan-triage`.
2. Read `rule://verification`. **Collect findings:** from the link-repo root run `bun tools/checkup.ts --json`.
   The result contains `findings` and `cannotEvaluate`; exits are 0 PASS, 1 findings, 2 CANNOT-EVALUATE. Preserve the output and report missing coverage rather than treating it as a clean sweep; an empty `cannotEvaluate` means every implemented class ran over the discovered repos, not that the whole repository was checked — name the classes and repos covered.
3. **Dispatch by each finding's `fix`:**
   - `mechanical`: Read `rule://records`; read `rule://plan-triage`; read `rule://git-flow`; read `rule://plan-home`. Apply inline on a `docs/checkup-<yyyymmdd>` branch in each affected repo. Repoint stale links to the observed archived plan path, respecting archive mutability per `rule://records` and preserving the referring file's relative frame. If the target is ambiguous, leave it for the human digest rather than choosing a record.
   - `route`: Read `rule://records`. Findings labelled `/mosaic-kit` stay in the digest for explicitly requested maintenance; do not edit process files during checkup. For named G-ids, read `skill://mosaic-gap-audit` and run its scoped evaluation, stopping at proposed verdicts. When unattended, list the ids and evidence for that skill instead. Do not auto-edit a stale Trigger or apply a gap disposition before the human answers.
   - `human`: retain the finding and evidence for the digest only; an orphan-plan finding is informational. Do not invent decisions or records to make references resolve.
4. Read `rule://verification`; read `rule://records`; read `rule://git-flow`. **Verify the mechanical branch:** re-run `bun tools/checkup.ts --json`; it lints every discovered governed record. Compare the before/after findings, inspect the mechanical diff, and commit only those changes on the work branch; retain unresolved findings and CANNOT-EVALUATE results.
5. Read `rule://human-gates`. **Present the digest:** explain what was found, what was fixed mechanically and where, what was routed to gap evaluation or kit maintenance, and what needs a ruling. Include the command results and coverage limits; name the branch for inspection and say what each answer would authorize.
   **Stop at the digest:** do not land or push mechanical changes to {{DEFAULT_BRANCH}} before the human answers. After that answer, read `rule://records`; read `rule://git-flow` and land only the authorized mechanical branch; apply any approved gap dispositions through `skill://mosaic-gap-audit`.
