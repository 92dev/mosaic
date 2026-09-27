---
description: "Write runnable verification, disclose what remains unproven, and retain evidence for the result."
---
Read when: writing a plan's checks, running final verification, or interpreting failures.
# Plan sections
- Every plan needs `## Verification` with in-repo steps an LLM can run: commands, searches, builds, or probes.
- Every plan also needs `### Unverified`: what cannot be proven, why, and a fix, workaround, or alternative (for example a human visual check or unavailable real credentials). State none with evidence when nothing remains.
- Unverified records evidence limits; it is never a draft registry entry. Planning does not author obligations for later promotion; close-out triage belongs to `skill://mosaic-execute` and routing to `rule://records`.
- The lint hook enforces section presence; the author must make the contents truthful.
- The orchestrator runs all Verification steps and records outputs in the Execution log before the `review` transition in `rule://map`.
- Whole-repo builds and typechecks run once per loop at this final phase, by the orchestrator; for test selection and whole-suite timing, read [targeted-tests](targeted-tests.md) (loaded automatically inside executor and reviewer agents; the main session reads the file) and `rule://stack`.
# Evidence handling
- Evidence must outlive the command: use a supported JSON/`--reporter` output file, a saved log, or a tool artifact retaining the complete output. A filter may display it but must never be its only sink.
- Preserve useful per-failure files such as `error-context.md` before another run clears them; later questions should use the saved evidence.
- Negative probes: inject the failure, observe the gate reject it, revert the injection, then rebuild before relying on the clean result; a stale build proves the wrong state.
- Classify errors before fixing: one crashed run with repeated teardown errors is one infrastructure failure; scattered assertion mismatches can be separate regressions. Inspect the error evidence before trusting a count.
- Evidence required for claims and reruns is defined by `rule://mosaic-core`.
# Registry lifecycle
- To evaluate a suspected obligation, route via `rule://records`; close-out applies the approved dispositions in `skill://mosaic-execute`.
- An obligation is discharged against its literal duty: a run-and-record duty closes when the run happened and its result is recorded, even if that result is a failure; route any defect it exposes per `rule://records` without reopening the discharged duty.
- G-entries are closed by plans, never deleted; move a fulfilled entry to [gaps-archive.md](../gaps-archive.md), newest first, with `closed by NNNN (<landed hash>)` and how it was solved. Numbers are never reused.
- For oversized entries and scoped reassessment or a human-consented full audit, read `skill://mosaic-gap-audit`.
# Local gates
- Run the applicable CLI in [the index's local checks](../index.md#local-checks) from the link root when changing a governed file.
- Lint covers active plan frontmatter/sections, ledgers, gaps and archive, pitfalls, and the decision map: IDs must be unique, status cells valid, and closed gaps absent from the active registry.
- Archived plans are skipped so legacy schema does not re-gate a frozen record; mutability follows `rule://records`.
- When changing project-owned agents, skills, or rules, run the applicable project checks; for the kit-owned edit boundary, read `rule://records` rule 6.
- `bun tools/checkup.ts [--json]` checks governed records, cited IDs, archived-plan links, gap triggers, orphaned archives, and installation integrity; run `skill://mosaic-checkup` for repair routing and the digest.
