# Installing into an existing project

Run this migration skill **from the mosaic checkout**, not from the target project.
Prerequisites: Bun, Git, a clean target branch/worktree (including member repos), and this checkout.
Use omp at maximum effort: start `omp --thinking max`, then enter `/mosaic-install ../target`.
Claude Code equivalent: start `claude` in this checkout, select maximum effort, then enter `/mosaic-install ../target`.
Append known factual answers, for example the link-repo path, `tracker=replay`, or `cutoff: yes`; discovery supplies the rest. **The human never writes a manifest or installation config.**
The checkout provides `.omp/skills/mosaic-install/SKILL.md` and `.claude/skills/mosaic-install/SKILL.md`; neither this bootstrap skill nor its root `install/` references are installed into the target.
The procedure reads [migration-map.md](migration-map.md), surveys the project, renders a scratch install, plans both alignment directions, and preserves project-specific rules, agents, skills, hooks, and documents.
All target writes, including migration reports, happen on `mosaic/install`; no default-branch writes, commits, or landing without explicit sign-off.
Dirty files are never stashed, reset, overwritten, or committed; unresolved human-owned choices stop before the affected installation work, and safety/merge blockers stop all target writes.

## What the skill derives and adapts

The survey supplies project name/summary, topology, default branch from `origin/HEAD` (fallback: the sole `main`/`master` on origin), observed landing policy/CI, members or components, remotes, stacks, and real commands/cwd. Follow the observed branch and PR-with-CI policy unless the human overrides; missing or conflicting facts are questions, not a request to author JSON.
The skill generates `docs/mosaic-migration/manifest.json` as an installation record for `kit/install.ts`, which remains a mechanical helper. No root manifest is installed; `.omp/mosaic.json` alone holds runtime installation metadata for hooks (ordinary port/model/tracker settings keep their own purposes).
Read [placeholders.md](placeholders.md) for each token's rendering and safe hand placement; the helper is not the authority for migration decisions.
Installed kit Markdown may change to the repo's vocabulary, paths, commands, conventions, and project agents, including an agreed ADR home or an additional money-path reviewer. Preserve kit safety/review contracts, doctor budgets, paired ports, symlinks/read gates, no placeholders, and hook configuration.
Default to adapting kit text when only wording/paths differ. Restructure the destination's docs, registries, or ledgers only where named kit mechanics need the shape or the human chooses it; preserve the document corpus and repair every affected link/caller.

## Owner-chosen cutoff

For a mixed historical corpus, choose `cutoff: yes` in phase 0 (ruling H0); when the human is unavailable, the default is **no cutoff**. See [Cutoff mode](migration-map.md#cutoff-mode) for the archive boundary and owner-named process/runbook exceptions.
The first task moves inventoried pre-existing docs/ledgers with `git mv` into `docs/archived/<original path>`, preserves hashes/history, and records the cutoff commit and family counts. Fresh kit registries replace old active indexes; gaps/defect tables and the PR-document corpus stay archived, not re-minted.
`docs/index.md` keeps a History section linked by family, including PR docs. Non-kit omp/Claude files remain unchanged; kit-path collisions still follow the merge/safety rules.
The last migration task fills [the rebuild brief template](docs-migration-instructions.template.md) into `docs/docs-migration-instructions.md` (≤ 120 lines). After migration, `/mosaic-plan docs-rebuild` uses it for the first real plan (`0001`): rebuild current architecture/product/process docs from cited history and current evidence, not from assumed old status.

## Records to inspect before sign-off

All paths below are under target `docs/mosaic-migration/`; `STATUS.md` records phase/commit checkpoints so interrupted sessions resume without repeating completed work.

| Record | Purpose |
|---|---|
| `00-survey.md` | Complete inventory, observed facts and command evidence/limits, baseline, conflicts and value provenance |
| `manifest.json` | Skill-generated helper input and reproducibility record, never human-maintained runtime config |
| `01-dry-install.md` | Scratch comparison, each new/identical/overwrite/blocker path, merge decision, external snapshots |
| `02-plan.md` | Tn tasks, adversary challenges/rulings, nothing-lost ledger, command/exit/output evidence and Execution log |
| `03-concept-alignment.md` | Permanent concept/doc-family/agent/skill/hook/registry ↔ kit map; chosen direction, exact resolution, owner, status and evidence, using [the template](concept-alignment.md) |
| `kit-adaptations.md` | Every edited kit file's hunk summary/reason, alignment IDs and verification; used to re-apply or retire adaptations on future upgrades |

The alignment and adaptation records are linked from target `docs/index.md`. Every non-done alignment row is a named plan task or a listed human ruling, never a silent mismatch.
At sign-off approval, for cutoff and non-cutoff migrations alike, keep only those two durable records here; archive the transient reports, status, manifest, and inventory under `docs/archived/mosaic-migration/`. Raw `evidence/` logs are ignored from phase 3 and deleted only after the archived plan/brief records their file list and final gate results. Follow the [migration-state lifecycle](migration-map.md#migration-state-lifecycle) for moves, frozen history, and Migration/History index rows.
After phase 3, the **kit-adaptations gate** accounts for every edited kit file and requires doctor PASS on the adapted tree, including the final log edits; review/self-check repairs repeat the gate.
The phase-6 brief includes **Concept alignment**: resolved rows / rows needing a ruling by ID, exact questions and blocked actions, plus any unfinished plan work; cutoff adds the SHA, archive counts by family, and the rebuild-instructions link. Human sign-off does not substitute for task evidence or reviewer verdicts; at most two correction rounds precede escalation.
The final installed-skill self-check needs the `omp` binary and working model credentials even when you invoke the migration through Claude Code; missing proof is a blocker, not an assumed pass.
Tracker defaults to local replay; opt into the local MCP mock only on request. Live Linear is not supplied by this kit.
After landing, cutoff's first use is `/mosaic-plan docs-rebuild` with `docs/docs-migration-instructions.md`; otherwise start with `/mosaic-intake <request or ticket>` and `/mosaic-plan <approved change>` from the target.
