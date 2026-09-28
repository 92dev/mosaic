# Installing into an existing project

Run this migration skill **from the mosaic checkout**, not from the target project.
Prerequisites: Bun, Git, a clean target branch/worktree (including member repos), and this checkout.
Use omp at maximum effort: start `omp --thinking max`, then enter `/mosaic-install ../target`.
Claude Code equivalent: start `claude` in this checkout, select maximum effort, then enter `/mosaic-install ../target`.
Append known factual answers, for example the link-repo path, an explicit request for local tracking, the runtime MCP tracker server, or `cutoff: yes`; discovery supplies the rest. **The human never writes a manifest or installation config.**
The checkout provides `.omp/skills/mosaic-install/SKILL.md` and `.claude/skills/mosaic-install/SKILL.md`; neither this bootstrap skill nor its root `install/` references are installed into the target.
The procedure reads [migration-map.md](migration-map.md), surveys the project, renders a scratch install, plans both alignment directions, and preserves project-specific rules, agents, skills, hooks, and documents.
All target writes, including migration reports, happen on `mosaic/install`; no default-branch writes, commits, or landing without explicit sign-off.
Dirty files are never stashed, reset, overwritten, or committed; unresolved human-owned choices stop before the affected installation work, and safety/merge blockers stop all target writes.

## What the skill derives and adapts

The survey supplies project name/summary, topology, default branch from `origin/HEAD` (fallback: the sole `main`/`master` on origin), observed landing policy/CI, members or components, remotes, stacks, and real commands/cwd. Follow the observed branch and PR-with-CI policy unless the human overrides; missing or conflicting facts are questions, not a request to author JSON.
The skill generates `docs/mosaic-migration/manifest.json` as an installation record for `kit/install.ts`, which remains a mechanical helper. No root manifest is installed; `.omp/mosaic.json` holds runtime `defaultBranch`, `topology`, `tracking`, and source `kit.commit`. Port/model settings and MCP mounts stay runtime-owned.
Read [placeholders.md](placeholders.md) for each token's rendering and safe hand placement; the helper is not the authority for migration decisions.
Installed kit Markdown may change to the repo's vocabulary, paths, commands, conventions, and project agents, including an agreed ADR home or an additional money-path reviewer. Preserve kit safety/review contracts, doctor budgets, paired ports, symlinks/read gates, no placeholders, and hook configuration.
Default to adapting kit text when only wording/paths differ. Restructure the destination's docs, registries, or ledgers only where named kit mechanics need the shape or the human chooses it; preserve the document corpus and repair every affected link/caller.

## Tracking at install time

The survey inspects `mcpServers` in `~/.omp/agent/mcp.json` and target `.omp/mcp.json`, user/project Claude `.claude/settings.json` and `.mcp.json`, mounted tracker tools, tracker docs, and commit/branch keys matching `[A-Z]+-\d+`. Configuration and ticket keys are evidence, not proof of an active connection; never copy credentials into reports.
**H-tracking** records the evidence and selected mode, and a tracker concept-alignment row is mandatory even for no tracker:

| Mode | When selected | Installed workflow |
|---|---|---|
| `none` | Default with no tracker evidence, or explicit owner ruling | No tracker store or fabricated ticket metadata; ordinary request/plan work remains available. |
| `local` | Only an explicit owner request | Offline replay CLI, local items/outbox, and tracker scouts; never live synchronization. |
| `mcp` | A mounted MCP tracker or one named by the owner | Sessions call the runtime server's tools directly; no installed tracker client or local data. |

MCP requires the exact runtime server name, team when known, and queue state/label inferred from evidence or ruled by the human. Unknown scope or ticket evidence without a tracker choice needs a ruling, never an implicit local fallback; unavailable mounted tools/access remains Unverified. Installation performs **no MCP writes**.
The manifest uses `tracking: { mode: "none" | "local" | "mcp", mcp?: { server: string, team?: string, queue?: string } }`; `mcp` is present only in MCP mode, with `server` required. The renderer omits local-only tool/data/scout paths for `none`/`mcp` and selects the corresponding rules and plan template. See [H-tracking](migration-map.md#tracking-survey-and-h-tracking) and [rendering](placeholders.md).
Later mode changes use `/mosaic-kit`: re-render a fresh scratch baseline, reconcile adaptations, preserve existing plan/ticket records, and archive local data before removing obsolete kit-owned installation paths. This is a reviewed cutover, not a forced overwrite; the [maintenance guide](../kit/docs/kit/maintenance.md) owns the steps.

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
| `kit-adaptations.md` | Kit-owned baseline adaptations with hunk summary/reason, alignment IDs and verification; starter notes are informational under the [Ownership policy](../kit/docs/kit/maintenance.md#ownership) |

The alignment and adaptation records are linked from target `docs/index.md`. Every non-done alignment row is a named plan task or a listed human ruling, never a silent mismatch.
At sign-off approval, for cutoff and non-cutoff migrations alike, keep only those two durable records here; archive the transient reports, status, manifest, and inventory under `docs/archived/mosaic-migration/`. Raw `evidence/` logs are ignored from phase 3 and deleted only after the archived plan/brief records their file list and final gate results. Follow the [migration-state lifecycle](migration-map.md#migration-state-lifecycle) for moves, frozen history, and Migration/History index rows.
After phase 3, the **kit-adaptations gate** accounts for every edited kit file and requires doctor PASS on the adapted tree, including the final log edits; review/self-check repairs repeat the gate.
The phase-6 brief includes **Concept alignment**: resolved rows / rows needing a ruling by ID, exact questions and blocked actions, plus any unfinished plan work; cutoff adds the SHA, archive counts by family, and the rebuild-instructions link. Human sign-off does not substitute for task evidence or reviewer verdicts; at most two correction rounds precede escalation.
The final installed-skill self-check needs the `omp` binary and working model credentials even when you invoke the migration through Claude Code; missing proof is a blocker, not an assumed pass.
Read the rendered tracker rule for the selected mode; local data validation applies only to `local`, and MCP scope/access verification is read-only. Preserve external IDs/history regardless of mode.
After landing, cutoff's first use is `/mosaic-plan docs-rebuild` with `docs/docs-migration-instructions.md`; otherwise start with `/mosaic-intake <request or ticket>` and `/mosaic-plan <approved change>` from the target.
