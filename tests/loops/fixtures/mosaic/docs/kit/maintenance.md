# Kit maintenance
Read only when running `/mosaic-kit`; this is not a process rule and has no rule symlink or automatic session load.

## Using versus building
Mosaic is the installable kit of process rules, skills, agents, hooks, tools, and starter registries. An installed project owns its code and project records; read `rule://records` rule 6 for the kit-owned edit boundary.
Build the product in the mosaic repository's `kit/` sources; in an installed project, use `/mosaic-kit` for requested adaptations.
The loop rig and generated export fixtures live only in the mosaic source checkout. Edit kit sources and source overlays, then run `bun tests/loops/build-fixture.ts` and `bun tests/loops/kit-parity.ts`; never hand-edit generated fixtures. The mosaic overlay replaces the document index, so mirror index changes there while keeping fixture rows.
Detailed inherited incidents live in source-side `docs/ideation/baseline-pitfalls.md`; installed pitfalls are general starter traps, not this project's decisions or measurements.

## One behavior, two runtimes
The omp and Claude Code files are twins of one behavior, not two independent procedures. Change both when changing a kit skill, role, or hook; do not run the other runtime's hook for parity during project work.
| Home or idiom | omp | Claude Code |
|---|---|---|
| Entry | `AGENTS.md` | `CLAUDE.md` |
| Skills and agents | `.omp/skills/<name>/SKILL.md`, `.omp/agents/<name>.md` | `.claude/skills/<name>/SKILL.md`, `.claude/agents/<name>.md` |
| Rule reading | `rule://records` (and other real rule names) | `docs/process/records.md` (corresponding file) |
| Dispatch and follow-up | via `task`; same-agent IRC messages | via Claude Code subagent dispatch; same-agent follow-up messages |
| Required review roles | `claude-reviewer` and `gpt-reviewer`, in parallel with identical inputs | `reviewer`, with these inputs |
Shared rules live in `docs/process/`; `.omp/rules/<name>.md` is a relative symlink to `../../docs/process/<name>.md`. Claude's always-on core and governed-edit reminder are ordinary files in `.claude/rules/`; keep their body/scope aligned when their source changes. Runtime role frontmatter may differ; substantive agent and skill bodies agree after the idiom translations above.
Keep a single authoritative home for every instruction; callers cite it rather than copying it. Limits: rules ≤80 physical body lines, skills ≤120, agents ≤60, each entry ≤30, this reference ≤120. Doctor retains narrower existing limits for core (30), intake (40), map/tracker (60), and intake/checkup skills (80); frontmatter is excluded from body counts.
Do not copy runtime inventories, role measurements, maintenance procedures, fixture examples, or port-alignment reminders into ordinary process rules, agents, skills, or the entrypoints.

## Doctor and local checks
Run `bun tools/doctor.ts` from the installed project root (or pass `--root <dir>`). Exit 0 means hard checks pass, 1 means FAIL, 2 means CANNOT-EVALUATE; WARN is advisory, not evidence of a clean design. A source template must be rendered before this check.
| Diagnostic | Meaning / maintenance action |
|---|---|
| `budgets` | Split or shorten the named authoritative instruction without duplicating it. |
| `references` | A rule/skill target or active Markdown link is missing; restore or correct its owning reference. |
| `read-before-mutate` | A skill must explicitly read records before a later governed-record mutation. |
| `mosaic-config`, `guard-config` | Runtime topology/default-branch/tracking metadata is invalid, or a commit guard is not reading its metadata. |
| `single-home` | A canonical instruction appears in multiple homes; retain one rule and pointers. |
| `port-parity` | Skill/agent bodies or the core rule disagree beyond supported runtime idioms; reconcile the actual behavior. |
| `symlinks` | An omp rule target is missing, not a symlink, or points away from its process source. |
| `governed-guard` | Edit/write scopes, Claude rule paths, and hook globs disagree or contain no governed targets. |
| `placeholders` | Installed kit text still contains an unrendered source marker. |
| `usage`, `root`, or unreadable input | The check cannot evaluate; fix invocation/access before claiming PASS. |
Builder-only diagnostics are labelled `/mosaic-kit`; checkup routes them here, not to an ordinary documentation repair. Doctor audits kit-owned structural contracts, not unrelated pre-existing project runtime entries. It checks active Markdown links, excludes frozen `docs/archived/` and `docs/plans/archived/` sources, and still validates links into archives. Project assets, workflows, nested checkouts, and non-Markdown evidence are not kit placeholders or Markdown links.
| Runtime | Governed-file lint command from project root |
|---|---|
| omp | `bun .omp/hooks/post/lint-ledgers.ts <path>` |
| Claude Code | `bash .claude/hooks/lint-ledgers.sh <path>` |
Use only the current runtime's lint hook on touched governed records. CLI exits: 0 valid, 1 schema violations, 2 usage/unreadable/unsupported path. Numbered active plans, ledgers, gaps, pitfalls, and decision maps are governed; unrelated program documents and archived plans are not.
`bun tools/checkup.ts [--json]` calls the shared TypeScript validator `tools/lint-ledgers.ts` directly; it never invokes another runtime's lint hook. It also checks doctor, links, plan citations, stale triggers, and orphan plans; exits 0 PASS, 1 findings, 2 incomplete evaluation. Exercise changed behavior in addition to these checks.
Hook interfaces are not ordinary CLI arguments: omp consumes `tool_call`/`tool_result` events, and Claude consumes JSON stdin. A manual Claude guard probe uses `printf '%s' '{"tool_input":{"command":"git commit -m x","cwd":"/path/to/project"}}' | bash .claude/hooks/guard-main.sh`; inspect observable output, not a silent no-input exit. The guard blocks direct commits on the configured default branch, not ff-only merges or `git commit-tree`; a human terminal remains the escape for a misfire.
The omp lint adapter appends errors to tool-result content because the wrapper may discard `isError`; the Claude hook feeds schema errors back through exit 2. Shared validation retains duplicate-ID, closure-evidence, and active-versus-archive checks, and mechanically enforces the active G-entry shape in `rule://records`; archive entries are exempt from the length and trigger-shape checks.
In multi-repo projects, lint also covers member active plans and local ledgers. The commit guard resolves `git -C <member>` or a leading `cd <member> &&` against the tool cwd before the session cwd.

## Adapt text and add project harness entries
Adapt vocabulary, paths, commands, conventions, and role descriptions while retaining authority, evidence, and structural contracts. Do not use a kit change to bypass a project decision or a failed check. Keep the smallest scope; a review fix to kit-owned files remains maintenance work, not an executor self-edit exception.
Record each file and hunk summary, reason, and checks in `docs/mosaic-migration/kit-adaptations.md`; create it if absent and add its document-index row. Record project additions, model-role decisions, and upgrade resolutions too. Historical project state belongs in its plan/gap, not in an always-read instruction.
After sign-off, `docs/mosaic-migration/` holds exactly `03-concept-alignment.md` and `kit-adaptations.md`; frozen installation history, including the upgrade manifest, lives in `docs/archived/mosaic-migration/`.
For compact kit starter pitfalls, the former authoring shape was trap + prevention + one measured-source citation within four physical lines; keep extended incident evidence on the building side. Project pitfalls need not copy that source-harness budget or claim its measurements.
For a new project **agent**, use a neighboring `.omp/agents/<name>.md` and Claude twin: frontmatter names the role, description, allowed tools/model-role selector as supported by that runtime; the body bounds task, read/write authority, required evidence, and output. Add a purpose/read-when index row.
For a new project **skill**, use `.omp/skills/<name>/SKILL.md` and its Claude twin with `name` and `description` frontmatter, explicit steps and human gates; put rules in their one home, and load records before governed mutation. Index the skill by command and purpose without runtime file inventories.
For a new project **rule**, add `docs/process/<name>.md` with description and a Read-when gate (or justified always/role/edit scope); create the relative omp rule symlink. Claude callers read the process file, with `.claude/rules/` frontmatter only where automatic scope is needed. Update the process index and the actual read gates, not every entrypoint.
Run doctor, the active lint hook for changed governed records, and checkup; smoke the new entry through its actual runtime. Doctor checks known kit contracts, so manually check new project entries' references, twin behavior, budgets, and scoping too. Existing project-only entries need not be retrofitted just to satisfy kit symmetry.

## Manifest, placeholders, and upgrades
The installer runs from a mosaic checkout, not from installed project tasks. `/mosaic-install` surveys and records `docs/mosaic-migration/manifest.json`; that is a reproducibility record, not runtime configuration. The helper is `bun kit/install.ts --manifest <record> --target <scratch>`.
Source Markdown tokens name PROJECT_NAME, PROJECT_SUMMARY (the entire first sentence), LINK_REMOTE, DEFAULT_BRANCH, MEMBERS, MEMBER_REMOTE:name, TRACKING, MCP_SERVER, MCP_TEAM, and MCP_QUEUE. Select TRACKING_NONE/LOCAL/MCP blocks first (they may contain topology blocks), then non-nested MULTI_REPO/MONOREPO blocks, then values; each block has a slash-prefixed closing token. MEMBERS renders stack/index rows, topology/path guidance, remotes, or plan/tracker examples by file; do not invent new expansions.
Multi-repo manifests name independent member repositories and their stack/test commands/remotes. Monorepos use no members and optional component paths, one git repository, root ledger, and link-homed plans. Test commands come from that project's stack data, not the source fixture's language.
`.omp/mosaic.json` holds runtime `defaultBranch`, `topology`, and `tracking`; both commit guards read branch/topology metadata from the installed kit root regardless of target cwd. If absent, the guard defaults to `main`. Model settings and MCP mounts have separate homes; no credentials belong in tracking metadata.
The installer copies selected entries, runtime files, docs, and tools; it does not clone repositories, initialize git, or alter ignore policy. It renders Markdown and preserves relative symlinks/modes; overlays replace whole files after rendering and are not themselves templates. Changed destinations are refused before writes unless explicitly forced; an identical install is a no-op, and `--force` is not a migration or mode-switch strategy.
To upgrade, copy the saved manifest as working input for the newer source installer into a **fresh scratch directory**, preserving frozen installation history. If the old record omits tracking, resolve H-tracking from runtime metadata/current evidence rather than accepting a silent mode change. Compare all kit-owned paths, review upstream changes, and re-apply every recorded adaptation while preserving project records/additions; never force scratch registries over live data. Run checks, record the new input/source revision and resolved hunks in the adaptations record, then present the `/mosaic-kit` human brief before landing.

## Tracking modes and switching
Tracking is `{ mode: "none" | "local" | "mcp", mcp?: { server: string, team?: string, queue?: string } }` in the generated manifest and runtime metadata; omitted helper input defaults to `none`. Source tokens are rendered, not a runtime switch: editing metadata alone does not update rules or callers.
`none` is the default without tracker evidence (or an explicit owner choice). `local` requires an explicit owner request and keeps offline replay items/outbox; it never connects or syncs to a live tracker. `mcp` uses a mounted tracker or one named by the owner: sessions call runtime MCP tools directly, with no installed client/server implementation or local tracker store.
H-tracking records the evidence, mode, exact runtime server name for MCP, team when known, and queue state/label derived from evidence or a human ruling. A configured-but-unmounted server is not connection proof. Missing optional scope renders readable instructions, not invented scope; an underivable queue still needs a ruling. Installation and switching perform no MCP writes.
Only `local` installs `tools/tracker.ts`, `docs/tracker/**`, `.omp/agents/tracker-scout.md`, and `.claude/agents/tracker-scout.md`; `none`/`mcp` omit them. The plan template omits tracker frontmatter in `none`, keeps replay metadata in `local`, and uses MCP/server metadata in `mcp`. Mode-specific operations have one home in `rule://tracker`; skills/agents read it rather than copy commands.
For a requested mode switch, use `/mosaic-kit` on its maintenance branch:
1. Record H-tracking's old/new mode and evidence/rulings in the tracker alignment row and adaptations log; resolve server/queue ambiguity before the affected work. Preserve external IDs, human text, and existing plan/ticket provenance across all modes.
2. Copy the saved manifest to working input, change `tracking` from the ruling, and render with the chosen source checkout into fresh scratch. Record that input and source revision without rewriting the frozen archived manifest; compare the complete old/new file sets, rules, callers, template, and runtime metadata.
3. Inventory local files, including untracked data and accepted-write outbox, before placement/removal; snapshot collision bytes/modes/symlink targets outside the target. Unknown ownership or data disposition requires a ruling, never deletion or an automatic remote import.
4. When leaving `local`, move its data losslessly to a new, non-colliding indexed folder under `docs/archived/`; preserve IDs/history/outbox and verify bytes/modes before retiring old paths. Use per-file `git mv` for tracked records and lossless moves for untracked data without silently staging it; never overwrite an archive. Remove obsolete kit-owned local tools/scouts and old client/server remnants only after verified preservation and caller repairs; unrelated custom tools are not deletions.
5. Merge selected rendered files and adaptations across both ports, the shared rules, plan template, navigation, and `.omp/mosaic.json`. In `none`/`mcp`, local-only installation paths must be absent; preserve existing plan records rather than rewriting history to match the new template. Entering `local` may seed only owner-authorized observed facts, never overwrite existing items/outbox with skeletons.
6. Run doctor, touched-record lint, and checkup plus the selected rule's read-only smoke: `none` has no fabricated tracker metadata; `local` validates retained items/outbox; `mcp` demonstrates mounted server/team/queue access without local files or writes. Record actual evidence or blockers, the archive index, and retired paths before the `/mosaic-kit` brief and authorized landing.

## Model roles and historical selection evidence
Concrete role selectors live only in `.omp/config.yml`; each comment states the role's purpose, not a price or benchmark. Change available model/effort choices there under the requested maintenance scope, preserve agent role references and intake's cross-family evidence gate, and smoke the affected role. Claude role selection must respect its own runtime configuration. Optional family-specific prompt language stays in `docs/process/model-notes.md` and is placed only by the human.
The following moved tables preserve source-harness decisions from 2026-09-25/26, not current project instructions or overrides of configuration. Detailed measurements and prices remain in the source checkout's `docs/ideation/2026-09-26-model-matrix.md`, `tests/loops/SCOREBOARD.md`, and `tests/loops/TOLERANCE.md`.
### Mistake tolerance by role (historical policy)
| Role | Tolerance | Why | Selection policy at measurement |
|---|---|---|---|
| Close-out, gap triage, registry edits | none | A misrouted defect or obligation can remain for months without re-reading. | Strongest measured model at xhigh+; never trade correctness for cost. |
| Planner and adversary | none | Approved scope is executed as written; wrong scope may escape review. | Maximum effort (human decision 2026-09-25); cross-family adversary. |
| Reviewers | low | The last independent read before landing. | One per family where configured; effort by measured findings, not price. |
| Intake orchestrator and investigators | low | A wrong disposition parks or escalates a real defect. | Cross-family REFUTE for LOW and implemented claims. |
| Executor | high | Every task is reviewed; an error costs a review round. | Cheapest model that stops on contradictions; templated role. |
| Scouts | medium | Missed records skip coordination; planning/lint catch some. | Cheap, measured on seeded-entry recall. |
| Librarian | medium | Proposed edits receive orchestrator and closure review. | Balanced role. |
### Session model by job (measured 2026-09-26)
| Job | Session model then | Alternative then |
|---|---|---|
| Planning | plan role: fable-5-1 max | opus-5-5 max: same checks, +20% cost, +70% time |
| Execute close-out and landing | astra high | opus-5-5 high: cheaper, briefs led with identifiers |
| Intake | sol xhigh | opus-5-5 xhigh |
| Gap audit, checkup, registry edits, small inline fixes | sol xhigh | opus-5-5 xhigh |
| Tracker intent and collision reporting | opus-5-5 xhigh | astra xhigh |
Historical config comments (2026-09-26) recorded sol-medium investigator severity correct first time with REFUTE on the other family; sol-medium executor 8/8 at $0.02–0.03 versus opus-medium $0.10–0.16; astra-max adversary chosen for plan safety despite the same catches as sol at +9% cost; sol-max review vetoed wrong-registry/lost-provenance findings missed by high at about +$0.50/round; luna-medium scouts 2/2 registry/tracker probes around $0.003 after pretty-printing, with haiku-low fallback. These explain past choices, not a guarantee on a new project.
