# Existing-project migration map

Read from the mosaic checkout's root `install/` before `/mosaic-install` surveys a target. These references are never installed; this is a migration, not a reset.
Read `kit/docs/process/records.md` before applying mappings; read `kit/docs/process/plan-home.md` for ownership and links.
Preserve source meaning, evidence, IDs, safety constraints, and history. A missing answer is not permission to invent one.

## Concept alignment and resolution

Create target `docs/mosaic-migration/03-concept-alignment.md` using [concept-alignment.md](concept-alignment.md); link it from target `docs/index.md` and retain it after landing.
Give each existing concept/doc family/agent/skill/hook/registry a stable row ID and an explicit source path or name ↔ kit concept/home; add rows for genuinely new kit concepts. Family rows must point to their complete per-file inventory.
Each row carries `alignment` (`same`, `rename`, `merge`, `split`, `keep-as-project`, `archive`, `retire`, `new`), `direction` (`adapt-kit`, `restructure-target`, `both`, `none`), `resolution` (exact action, cutoff's `rebuild plan`, or `human ruling: <question>`), `owner` (`mechanical`, `plan task Tn`, `human`), and `status` (`proposed`, `in-progress`, `blocked`, `done`).
Weigh both directions per row: what installed kit text would change, what target structure would change, and why one wins. Adapt kit text when only vocabulary, paths, commands, or conventions differ; restructure target docs/registries/ledgers only where lint, doctor, checkup, tracker, or plan-ledger mechanics require a named shape, or the human explicitly chooses it.
Every non-`done` row belongs to an actual plan task or the report's Human rulings list; `mechanical` is only for already verified `done` rows. Cite row IDs in task acceptance, evidence, and the brief's **Concept alignment** section (resolved / needing a ruling).
A human-owned choice is not resolved by taking a conservative guess. Record the question and affected actions, stop those actions, retain the supplied answer, then assign its implementation to a plan task; mark done only with evidence.

## Tracking survey and H-tracking

Inspect `mcpServers` in `~/.omp/agent/mcp.json` and target `.omp/mcp.json`, plus user/project Claude `.claude/settings.json` and `.mcp.json`. Distinguish a configured server from tracker tools mounted in the session; retain runtime server names and access evidence, never credentials.
Search commit messages and branch names for `[A-Z]+-\d+`; inspect tracker docs, ticket links, and retained local data. Keys are evidence of tracker use, not proof of a server, team, queue, or current item status.
Always record **H-tracking** in the survey and concept-alignment report, including evidence or its absence, chosen mode and provenance, any blocked question, and the implementing task. A tracker alignment row is mandatory even when the project has no tracker.

| Mode | Selection and installed behavior |
|---|---|
| `none` | Default only when there is no tracker evidence, or an explicit owner ruling disables integration. Do not create a tracker store or fabricate ticket IDs; preserve existing references and surface defects as evidenced findings under the tracker rule, never as gaps. |
| `local` | Only an explicit owner request selects the offline replay workflow. Preserve local items/outbox and external provenance; seed observed facts only without cutoff. Local records and accepted writes are not a live tracker connection or remote synchronization. |
| `mcp` | Select a mounted MCP tracker or the tracker the owner names. Require its exact runtime server name, record the team when known, and derive the intake queue state/label from docs or read-only tools; otherwise obtain a human queue ruling, including an explicit no-dedicated-queue decision if applicable. Sessions use that server's tools directly, not an installed client or local store. |

Ticket/doc evidence without a selected usable tracker, competing servers, unknown runtime names, or an underivable queue needs a human ruling; never silently fall back to `local`. A named but unmounted server may establish the intended mode, but missing tools/credentials remain an explicit verification blocker, not a claimed connection.
Generate manifest `tracking` as `{ "mode": "none" }`, `{ "mode": "local" }`, or `{ "mode": "mcp", "mcp": { "server": "<runtime name>", "team": "<known team>", "queue": "<state or label>" } }`; only `server` is structurally required within `mcp`. Omit unknown optional values rather than inventing them; a readable rendering fallback does not resolve H-tracking.
The helper defaults omitted `tracking` to `none`; the skill records its choice explicitly. Runtime `.omp/mosaic.json` carries the same `tracking` alongside `defaultBranch` and `topology`. MCP mount configuration remains runtime-owned; installation makes no MCP writes and installs no MCP client/server implementation.
Only `local` installs `tools/tracker.ts`, `docs/tracker/**`, and both ports' `tracker-scout.md`; `none` and `mcp` omit them. The plan template has no tracker frontmatter in `none`, local replay metadata in `local`, and MCP/server metadata in `mcp`. Mode-specific operations live in the rendered tracker rule; skills and agents read it rather than copy commands.
Pre-existing project tracker records are not expendable because a mode omits their installation paths. Preserve/index records at their non-conflicting homes; archive data from omitted local installation paths with verified bytes and a recorded disposition before retiring those paths. Never delete project data by forcing a fresh render. Later mode changes use `/mosaic-kit` and the [maintenance procedure](../kit/docs/kit/maintenance.md).

## Migration-state lifecycle

During migration, keep all reports, the generated manifest, inventory, and raw evidence under target `docs/mosaic-migration/` on `mosaic/install`; do not close them out before explicit sign-off approval. This lifecycle applies with or without cutoff.
In phase 3, add `/docs/mosaic-migration/evidence/` to the target's `.gitignore`, preserving existing entries; never force-add logs. Ignoring does not untrack logs already committed by an older session.
After approval and any rebase/check/review required by the landing flow, close out on `mosaic/install` before landing:
1. Keep `docs/mosaic-migration/03-concept-alignment.md` and `docs/mosaic-migration/kit-adaptations.md` as the only durable records in that directory; `/mosaic-kit upgrade` still reads the latter.
2. In `02-plan.md` and `06-sign-off-brief.md`, record the sign-off, the complete relative file list under `evidence/`, and the final gate summary: exact doctor, each registry lint, and checkup commands/cwd/exit codes plus both reviewers' verbatim verdict lines and reviewed commit. Keep these summaries, not copies of the raw logs.
3. Use per-file `git mv -- docs/mosaic-migration/<name> docs/archived/mosaic-migration/<name>` for `00-survey.md`, `01-dry-install.md`, `02-plan.md`, `06-sign-off-brief.md`, every other `0[0-9]-*.md` except `03-concept-alignment.md`, `STATUS.md`, `manifest.json`, and `inventory-pre-install.tsv` when present. Create the destination directory; never overwrite existing history. Complete the final STATUS checkpoint before moving it.
4. After the evidence inventory and gate summary are recorded in the archived plan/brief, delete `docs/mosaic-migration/evidence/`, including tracked logs with `git rm`; do not archive raw logs. Preserve unrelated user files and stop for a disposition if unexpected migration files would prevent the two-record end state.
5. In target `docs/index.md`, the **Migration** rows link `mosaic-migration/03-concept-alignment.md`, `mosaic-migration/kit-adaptations.md`, and `archived/mosaic-migration/`; add a **History** row for that frozen migration folder without changing cutoff-history rows. Repair active inbound links, including durable-record manifest/evidence pointers and the rebuild brief: use the archived manifest and retained plan/brief summaries, not deleted logs.
6. Run final doctor, registry lint, and checkup on the closed-out tree; if repairs change reviewed content, repeat the required review loop. Record actual final exits/verdict lines and any additional evidence filenames in the archived plan/brief before freezing, then remove any new raw logs. Commit the closeout on `mosaic/install` and land only per the authorized flow.
Read `kit/docs/process/registries.md` (`rule://registries` in the target): the completed `docs/archived/mosaic-migration/` is frozen history, not current status. Do not rewrite it or an existing cutoff archive on upgrades; repair active callers rather than historical links.

## Cutoff mode

Phase 0 records `cutoff: yes|no` from the owner's input or an explicit H0 ruling in the alignment report. Ask when the documentation is a mixed historical corpus rather than a current-status network; without the human, default to `no`, never infer approval from disorder or permission to choose conservatively.
H0 names every process/runbook exception and the archive boundary. Survey all pre-existing `docs/**`, root files classified as documentation, and member/component documentation and ledgers; preserve original repo-relative paths. Entry files and harness configuration are not documentation to sweep away.
With `cutoff: yes`, this section overrides the documentation/registry merge defaults below; entry files and kit agents/skills/hooks/settings still use the per-file merge rules. Target-only omp/Claude files remain unchanged (H7): no new twins, splits, normalization, or extra project-harness work.

1. In phase 1, classify each source as `archive` or an owner-named exception; record per-file hashes, family counts, exact destinations, inbound callers, and how fresh kit paths replace archived collisions. Never include this migration's new reports or recursively archive `docs/archived/`; a pre-existing archive needs an explicit H0 disposition, not an overwrite.
2. The first phase-3 task uses `git mv -- <original path> docs/archived/<original path>` for every inventoried pre-existing documentation/ledger path except the named process/runbook exceptions. Include gaps/defect tables and the PR-document corpus (H5/H8), assets, root docs, and component docs. For independent member repos, move within that repo's `docs/archived/`, preserve its history, and link its archive from the root index; never copy across git boundaries and claim a rename.
3. Verify every moved file's bytes/mode/symlink target against the survey and commit the moves as the cutoff commit on the installation branch. Then write `docs/archived/README.md` once: cutoff commit SHA (per repo where needed), family inventory/counts and original paths, how to cite `archived: <path>`, and the frozen-history rule. Historical links/IDs remain as recorded; repair active inbound links, never rewrite archived sources. Subsequent tasks must leave archive bytes unchanged.
4. Install the kit's fresh skeleton registries/ledgers rather than merging old rows. Archive all old gap and defect entries; the migration mints no replacement G-entries, project pitfalls, D/F records, tracker items, or numbered plans from them. The first real plan is the rebuild, numbered `0001`; old ledgers and approvals remain history, not current status.
5. In fresh `docs/index.md`, add `History (archived at cutoff <sha>)` with one linked row per archived family and counts, including an explicit PR-document-corpus row. Keep retained process/runbook exceptions, project roles, and migration records navigable; historical links are evidence, not active registries.
6. Documentation-family alignment rows use `alignment: archive`, `direction: restructure-target`, and `resolution: rebuild plan` (H0). Their implementing migration task verifies the move, counts, index, and handoff; `done` means that handoff is complete, never that current documentation has been rebuilt.
7. The last migration task writes and indexes `docs/docs-migration-instructions.md` (≤ 120 lines), filling [the brief template](docs-migration-instructions.template.md) with actual counts, paths, provenance, rough task sizes, and acceptance. Do not run the rebuild during installation; sign-off names it as the first `/mosaic-plan docs-rebuild`, which reads that brief.

The brief must inventory archive families with counts; propose architecture map/element docs with `affinity:` and D-entries, product F-docs with `contracts:` and `repos:`, stack/process docs, and open questions. Every active claim cites its archived source and is checked against current evidence; superseded material stays archived, and unknown status becomes an open question, not a fact.
Mint new gaps/pitfalls only from current evidence: obligations need a checkable `when:`, traps need a measured cite and prevention rule; defects follow the installed tracking mode, never gaps or invented ticket IDs. Start the new ledgers with rebuild plan `0001`, following normal reservation/approval gates. Acceptance covers a complete index, frontmatter and source citations on every rebuilt active doc, doctor/lint/checkup exit 0, unchanged archive, and all docimpact classes evaluable.
Scouts and drift tools follow the single frozen-history convention in `kit/docs/process/registries.md`; do not patch namespaces or retrofit frontmatter into archived documents (H6/H9).

## Concept → kit home (defaults, not mandatory relocations)

| Existing concept | Kit home and migration decision |
|---|---|
| PRDs, feature specs, product flows | Default `docs/product/F-<n>-<slug>.md` plus the product index; preserve milestones/source links. Existing naming can remain with adapted routing; do not mint F-numbers or duplicate records without a justified mapping. |
| Architecture, ADRs, settled decisions | Default `docs/architecture/*.md`, global D-entries, and the decision map in `docs/architecture/README.md`. An agreed ADR home may stay canonical via adapted rules; retain required mechanical indexes/definitions, ADR context, rejected alternatives, implications, and provenance. Keep frozen source records indexed. |
| Gaps, TODOs, known issues: defects | Defect-first: preserve reproducer, evidence, owner, and source reference under the selected tracking mode. Retain existing tickets; with `none`, surface an evidenced finding without inventing an ID. Installation never creates or changes remote items; never disguise a defect as a future obligation. |
| Gaps, TODOs, known issues: future duties | `docs/gaps.md` with a checkable `when:` and why it is not actionable now; reuse a matching subject/trigger, otherwise allocate the next G-number. Preserve closed history in `docs/gaps-archive.md`. |
| Gaps, TODOs, known issues: undecided questions | `docs/architecture/open-questions.md`; do not manufacture a duty, decision, or approval. Split mixed source entries across destinations with cross-links. |
| Postmortems and known traps | Durable trap + prevention rule in `docs/architecture/pitfalls.md`; retain the full postmortem indexed as evidence, and preserve existing P-numbers. |
| Runbooks, command catalogs, CI recipes | Observed stack/test commands and cwd in `docs/process/stack.md`; link detailed runbooks from there and `docs/index.md`. Keep operational warnings; a command listed in docs is not execution evidence. |
| Git conventions, remotes, repository topology | `docs/process/git-flow.md` and `docs/process/plan-home.md` describe the actual repositories and landing policy. Monorepo packages are not independent repos; do not create repos, ignore tracked members, rename default branches, or change deployment policy to fit a template. |
| Sticky rules: entrypoints, `.omp/AGENTS.md`, `.omp/RULES.md`, coding standards | Kit core first in `AGENTS.md`/`CLAUDE.md` (each ≤ 30 lines); preserve project safety/invariant text verbatim. Move excess intact behind a mandatory read gate to a project rule or document, preserving the original link frame. Retire duplicate authority with pointers, not lost rules. |
| Project agents, including money-path reviewers and migrators | Keep target-only roles unchanged alongside kit agents and list scope/invocation in `docs/index.md`; retain required project safety reviews. For a kit same-name collision, preserve the distinct project role and repair callers or record an explicit duplicate ruling; never create new project-role twins merely to match the kit. |
| Existing skills | Keep target-only skills unchanged; merge only kit-path collisions, preserving project-only requirements and mapping affected callers. Do not split or twin unrelated project skills; kit-owned merged entries retain budgets and paired-port parity. |
| Plans, tickets, approval and execution history | Active kit plans use `docs/plans/TEMPLATE.md` and the ledgers without invented status/approval. A colliding project plan corpus can move losslessly to a distinct indexed home with caller repairs; completed history stays frozen. Tickets retain external IDs/URLs and human-owned fields; seed observed facts only for explicitly chosen `local` without cutoff. |
| Tracker integration or its absence (mandatory row) | H-tracking maps evidence to `none`, explicit `local`, or runtime `mcp`; identify server/team/queue scope, record/data preservation, selected and omitted installation paths, and read-only verification. No tracker evidence still requires a row recording `none`, not an implicit local store. |
| Other docs, API contracts, diagrams, assets, glossaries | Keep at the appropriate current home or move with inbound-link repairs; every pre-existing document, including non-Markdown and component docs, has an index link or a reasoned retirement ledger row. |

## Per-file conflict and merge policy

`--force` replaces bytes; it never performs these merges. Before using it, snapshot every conflicting file outside the target, including modes and symlink targets, and record the original commit.
The dry-install report lists each path individually: new, identical, overwrite, or file/directory/symlink blocker, plus its merge decision. Target-only files are not deletions.
Use `diff -r` for content and compare entry types, symlink targets, and modes too: the installer treats these differences as conflicts even when dereferenced content matches.

| Kit destination | Required resolution |
|---|---|
| `AGENTS.md`, `CLAUDE.md` | Merge kit core first with project safety/invariant text kept verbatim, never summarize it away. Keep both entry files ≤ 30 lines; excess moves intact behind an immediate read gate, retaining valid links. Replace an import wrapper only with a deliberate equivalent port entry. |
| `.omp/config.yml` | Merge project model/tool/discovery settings with kit roles; do not discard working local settings or embed credentials. Resolve incompatible settings explicitly. |
| `.omp/mosaic.json` | Render observed `defaultBranch`, `topology`, H-tracking's `tracking`, and source `kit.commit`. This is runtime install metadata, not the generated manifest; preserve compatible project settings and record any conflict. |
| `.claude/settings.json` | Merge JSON keys and hook arrays; preserve existing hooks, permissions, and non-conflicting settings. Add each kit hook once; do not broaden permissions to make checks pass. |
| `.omp/hooks/**`, `.claude/hooks/**` | Keep project hooks and install kit guards/lint; compose or rename same-path custom hooks and repair registrations. Never silently disable an existing guard. |
| `.omp/rules/*`, `.claude/rules/*`, `docs/process/*.md` | Shared process text has one home with required port twins/symlinks. Adapt vocabulary, paths, commands, and conventions in that home; preserve doctor budgets/read gates and mirror core changes to `.claude/rules/mosaic-core.md`. Conflicting safety/landing rules need a human ruling. |
| `.omp/agents/*`, `.claude/agents/*` | Kit roles retain their contracts and ≤ 60 body-line budget; preserve custom roles unchanged and update callers only for an approved same-name collision. Extended merged kit-role guidance moves losslessly into an indexed reference with a required read gate, not an abridgment. |
| `.omp/skills/*/SKILL.md`, `.claude/skills/*/SKILL.md` | Preserve project-only skills unchanged. Kit-owned entries, including approved collision merges, retain paired-port parity and ≤ 120 lines (or a stricter skill cap); move lengthy merged guidance intact into an indexed read-gated reference. Duplicate retirements are recorded decisions. |
| `docs/index.md` | Union kit navigation with retained project docs/agents/skills; keep existing indexes linked and ownership explicit. Link the permanent alignment/adaptations reports; the index is a map, not a replacement for source detail. |
| `docs/gaps.md`, `docs/gaps-archive.md` | Route each old row defect-first; merge genuine obligations into kit schema and preserve closed history, source evidence, and IDs. Never overwrite with the empty skeleton. |
| `docs/architecture/README.md`, `pitfalls.md`, `open-questions.md` under `docs/architecture/` | Merge decisions, pitfalls, and questions into their own schemas; retain source records and avoid ID collisions. No sole-record compression. Adapt pointers to chosen project homes without breaking required mechanical indexes. |
| `docs/product/README.md`, `docs/plans/README.md`, `docs/plans/TEMPLATE.md` | Merge registry rows and project requirements with kit structure; maintain links/status truth and preserve historical plans. Bootstrap reports are indexed separately, not fake numbered plans. |
| `docs/tracker/**`, `tools/tracker.ts`, both ports' `tracker-scout.md` | Installed only for explicit `local`; preserve existing items, IDs, discussion, and outbox before merging local seeds. In `none`/`mcp`, do not copy these paths; inventory any pre-existing files and preserve/archive records before retiring obsolete kit-owned paths with caller repairs. |
| `tools/**`, any remaining kit path | Inspect every collision; preserve unrelated custom tooling/docs under a decided name and update callers. Copy new files; leave identical files unchanged. Never overwrite an unexplained collision. |

Read the rendered target `docs/process/tracker.md` for the selected mode's read-only verification: validate preserved/seeded items only in `local`; verify server/team/queue access through mounted tools in `mcp`; confirm `none` has no installed local tracker paths or template metadata. Do not invent validation commands or MCP capabilities.
Installation performs no MCP writes. Existing external tickets stay authoritative; a configured or owner-named server without mounted tools is Unverified until read access is demonstrated. Never seed a live workspace as an installation check.
If topology or contradictory/unknown default-branch, landing/deploy, or safety constraints cannot be represented honestly, stop under `kit/docs/process/human-gates.md`; migration does not authorize a repository split or policy redesign. Observed PR-with-CI policy is an automatic kit-text adaptation, not itself a conflict needing permission (H3); a human may choose otherwise.

## Installed-kit adaptations and gate

The installed Markdown is adaptable, not immutable: rules, skills, agents, and AGENTS/CLAUDE core may match project language, paths, commands, conventions, and specialist roles. Do not edit the source checkout or weaken authority, safety, required reviews, hooks, or structural checks.
Keep target `docs/mosaic-migration/kit-adaptations.md`, indexed from `docs/index.md`: record source revision/hash, generated manifest, and rendered scratch baseline; use `file | hunk summary | reason | alignment row IDs | verification/status`, one row per edited kit file (separate rows for changed twins).
Classify deviations using [Ownership](../kit/docs/kit/maintenance.md#ownership): only kit-owned files belong in the re-application list; seeded registries and navigation are informational install-time starter adaptations, not upgrade inputs. Ordinary placeholder substitution is not an adaptation. Note symlink exposure of shared rules; record `none` if no re-application entries exist.
After phase 3 and after any later repair, reconcile all kit-owned paths against the baseline so no edited file lacks a reason, then require doctor PASS (exit 0, no fail/cannot-evaluate) after the final log edits; retain actual command/exit/output in the Execution log and gate state in `STATUS.md`.
Keep line budgets, paired ports, single-home rules, symlinks/read gates, no placeholders, and `.omp/mosaic.json` hook configuration intact. A tooling incompatibility is a blocker to resolve explicitly, not permission to mute a check or claim text adaptation fixed it.
Future upgrades use `/mosaic-kit` and the [baseline-diff procedure](../kit/docs/kit/maintenance.md#manifest-placeholders-and-upgrades), deriving adaptations from the previous rendered revision rather than trusting old rows. Project-owned records are never overwritten or re-applied from starter notes.

## Derivation, placeholders, and manual placement

The human supplies a target and factual answers, never a manifest/config. Derive all values from the survey; the skill generates `docs/mosaic-migration/manifest.json` as a record for `kit/install.ts`. `.omp/mosaic.json` is the only runtime installation-metadata config (`defaultBranch`, `topology`, `tracking`, source `kit.commit`); port settings and MCP mounts keep their separate purposes.
Token names below mean the name enclosed by two opening and two closing braces. Read [placeholders.md](placeholders.md) for exact per-file expansion, mode/topology blocks, escaping, file modes/symlinks, and hand-placement steps.

| Token | Survey-derived value and rendering |
|---|---|
| `PROJECT_NAME` | Project name from repository/package/docs identity → process-map read gate, documentation-index and architecture titles. |
| `PROJECT_SUMMARY` | Full first sentence derived from project docs → both entry files; it is not appended to the name. |
| `LINK_REMOTE` | Observed link/root remote → `git-flow.md` push instruction; documentation, not executable shell input. |
| `DEFAULT_BRANCH` | `git symbolic-ref refs/remotes/origin/HEAD`, otherwise the sole `main`/`master` branch present on origin; explicit human override wins. Record ambiguous/missing evidence, never infer from the feature branch; use the result in Markdown and `.omp/mosaic.json`. |
| `MEMBERS` | Multi-repo members or monorepo components → stack/index rows; topology sentence in `plan-home.md`; remote clauses in `git-flow.md`; first member name or `link-repo` in tracker/plan examples. |
| `MEMBER_REMOTE:<name>` | Observed `remotes.members[name]` → named remote lookup; missing names are errors. |
| `TRACKING` | H-tracking's selected `tracking.mode`: `none`, `local`, or `mcp`; omitted helper input defaults to `none`, not an inferred survey result. |
| `MCP_SERVER`, `MCP_TEAM`, `MCP_QUEUE` | Runtime server name and optional known scope; missing optional values render readable instructions, not fabricated team/queue names. |
| `TRACKING_NONE` / `TRACKING_LOCAL` / `TRACKING_MCP` and closing tokens | Keep the selected mode's body, remove markers; these blocks may contain topology conditionals. |
| `MULTI_REPO` / `MONOREPO` and their slash-prefixed closing tokens | Non-nested topology blocks: keep only the selected topology's body after mode selection; remove markers before value expansion. |

Derive landing policy from CI configuration, repository guidance, and observable branch protection. When the target lands by PR into the derived branch with CI, render that policy in `docs/process/git-flow.md` instead of the kit's no-PR/ff-only default, retaining required reviews, sign-off, safety, and deployment constraints. Reconcile all contradictory kit landing instructions/callers and hook diagnostic text; record each deviation in `kit-adaptations.md`. Cite inaccessible protection data as unavailable rather than invented; ask only if the evidence conflicts or cannot establish a policy.

## Worked choices

- **A1 — monorepo with `docs/adr` as its chosen decision home:** alignment `keep-as-project`; adapt-kit: change installed `docs/process/records.md` to route decisions to `docs/adr/NNNN-*.md` and repair the other routing/index pointers; restructure-target: **none**. Direction `adapt-kit`, owner `plan task T1`; log the edited kit files and verify their links/doctor. Keep required mechanical indexes/definitions; any ADR↔D namespace ambiguity or checkup limitation is a separate human ruling/blocker, not an implicit renumbering or assumed PASS.
- **A2 — free-form `docs/gaps.md`:** alignment `split` when it mixes defects, duties, and questions; adapt-kit wording alone cannot supply lint's entry contract. Restructure-target: convert genuine obligations to `- **G-<n> · title**` entries with checkable `**Trigger:** when …`, `**From:**` provenance and `**Status:** open`; retain each source field/ID and route defects/questions separately. Direction `restructure-target`, owner `plan task T2`; no kit-text change is needed. Lint needs the G-entry shape; retain per-entry reconciliation and `bun .omp/hooks/post/lint-ledgers.ts docs/gaps.md` PASS evidence before marking done.

## Nothing-lost ledger

Keep this table in `docs/mosaic-migration/02-plan.md`, seeded from the complete pre-install inventory; alignment rows choose meaning/direction, this ledger proves per-file preservation.
Use one row per pre-existing document/file being migrated; split rows for multi-destination records. Include custom harness files and non-Markdown documentation.

| Original path + pre-install hash | Concept | Disposition | Destination + `docs/index.md` link | Preserved content or retirement reason | Verification evidence |
|---|---|---|---|---|---|

`Disposition` is `moved`, `linked`, or `retired`. For `linked`, the original stays canonical; for `moved`, verify content and inbound links; for `retired`, record why, retained history, and any required human ruling.
Do not call a row complete until its destination/index link resolves and content/evidence is accounted for. A backup alone is not a final destination.
Reconcile inventory against the ledger: no missing source paths, unexplained deletions, lost assets, orphaned records, or pending dispositions at sign-off.

## Migration review checklist

- Every pre-existing document is moved, linked from `docs/index.md`, or retired with a reason; full records, IDs, diagrams, and source evidence survive.
- Alignment covers every concept/family/role/hook/registry; every non-done row names a task or listed human ruling. The brief cites resolved/ruling IDs; both durable reports are indexed.
- The mandatory tracker row and H-tracking agree with manifest/runtime metadata and rendered mode; `local` has explicit owner provenance, `mcp` has a runtime server and queue ruling/read-only scope evidence, `none` has no fabricated tracker. Local-only paths are absent in `none`/`mcp`; pre-existing records are preserved, not overwritten or deleted.
- Every overwrite has a recorded merge decision; user changes were untouched; all work stays on `mosaic/install` until explicit landing approval.
- Kit core precedes project guidance; safety/invariant text survives verbatim with mandatory read gates. `AGENTS.md` and `CLAUDE.md` are each ≤ 30 lines.
- Every edited kit file has an adaptation reason; skill/rule/agent budgets, paired ports, single-home rules, symlinks, hook configuration, and no placeholders pass doctor after adaptations.
- With cutoff, H0/exceptions, archive counts/hashes, cutoff commits, family links (including PR docs), fresh registries, and the indexed rebuild brief agree; no old gaps/defects are re-minted, no archive bytes changed, and rebuild work remains explicitly pending.
- Every rule cites real target paths; links resolve from their own files; monorepo packages are not falsely described as independent repos. Retained project roles/skills/hooks/permissions and specialized safety reviews remain effective.
- Stack commands were executed with cwd, actual exit status, and retained output; unavailable proof is Unverified, not passing. Defects stay defects, obligations have `when:`, questions stay undecided; registry/tracker validation preserves external references.
- Doctor, each registry lint, and checkup exit 0; both migration reviewers APPROVE the final committed snapshot after at most two correction rounds.
- The target's `/mosaic-checkup` loads and produces a digest with zero mechanical findings (human-only decisions may be surfaced, never suppressed).
- At sign-off approval, both cutoff modes leave exactly the alignment/adaptations records active, transient state in indexed frozen history, and no evidence directory; the archived plan/brief retains the evidence file list and final gate summary.
