# Using mosaic

## What the kit installs

Mosaic installs an orchestration harness into a project root: a multi-repo link repo or a monorepo.
It supplies shared process rules, omp and Claude Code ports, bounded agents and skills, hooks,
local tools, a starting pitfalls catalog, and empty architecture/product/gap/plan registries; tracker data is installed only for explicitly selected `local` tracking.
The installation roots are `AGENTS.md`, `CLAUDE.md`, `.omp/`, `.claude/`, `docs/`, and `tools/`.
The source installer, this README, checkout-only `../install/` migration references, loop rig, and fake export project are not installed.
Without cutoff, existing project records are reconciled, not replaced with empty registries.

## Installing into a project

Keep a mosaic checkout as the source. You need Bun, Git, and clean target/member worktrees.
In an omp or Claude Code session at maximum effort **in the mosaic checkout**, invoke:

```text
/mosaic-install <target>
```

Supply the target path and any known factual answers; the skill asks only for missing facts or
human rulings, never for a handwritten manifest. It derives the project name and full-sentence
summary, `multi-repo` or `monorepo` topology, default branch from `origin/HEAD`, members or
components, remotes, stacks, test commands and cwd, coverage notes, tracking mode/server/scope,
and observed landing/CI policy. Ambiguous evidence is a question, not permission to assume defaults.

The [migration guide](../install/README.md) and [mapping policy](../install/migration-map.md)
define the full procedure:

1. Survey the target read-only, including existing rules, agents, skills, hooks, docs, and ledgers.
   Dirty files and unresolved safety/merge blockers stop target writes; user changes are never
   stashed, reset, overwritten, or committed by the migration.
2. Create or explicitly resume `mosaic/install`. Generate the manifest as an installation record,
   dry-install to fresh scratch outside the target, and compare every collision before placement.
3. Build a concept-alignment table with stable row IDs, both adapt-kit and restructure-target
   options, a chosen resolution, owner, status, and human rulings; the tracker row and H-tracking
   are mandatory even for `none`. Prefer adapting wording/paths; restructure only for a named
   mechanical requirement or human choice.
4. Write the migration plan and nothing-lost ledger, run the planning adversary at maximum effort,
   and record a ruling on every challenge. Resolve human-owned blockers before affected work.
5. Execute task by task on `mosaic/install`, preserving project safety rules and custom entries.
   Run doctor, governed-record lint, and checkup after each task; retain outputs and fix failures.
6. Account for every edited kit file in the adaptations record, require doctor PASS, then obtain
   independent APPROVE verdicts from both `claude-reviewer` and `gpt-reviewer` on the final snapshot.
   Repairs return through the checks, adaptation gate, and review loop.
7. Run the installed `/mosaic-checkup` in an omp self-check session and stop at the sign-off brief.
   This last check needs the `omp` binary and working model credentials even for a Claude-led
   migration; missing runtime proof is a blocker, not an assumed pass.

During migration, all target writes, including reports, stay on `mosaic/install` under `docs/mosaic-migration/`:

| Record | What it preserves |
|---|---|
| `STATUS.md` | Phase checkpoints and last commit, so interrupted sessions can resume |
| `00-survey.md` | Inventory, value provenance, command evidence/limits, baseline, and conflicts |
| `manifest.json` | Skill-generated input to `kit/install.ts`; a reproducibility record, not runtime config |
| `01-dry-install.md` | Scratch comparison, per-path merge decisions, and external snapshot locations |
| `02-plan.md` | Tasks, adversary rulings, nothing-lost ledger, and execution evidence |
| `03-concept-alignment.md` | Permanent concept-to-kit table and human rulings, using [this template](../install/concept-alignment.md) |
| `kit-adaptations.md` | Each changed kit file's hunk summary, reason, alignment IDs, and verification |

At sign-off approval, only the alignment and adaptation records remain in `docs/mosaic-migration/`.
Both cutoff and non-cutoff migrations move transient reports, status, manifest, and inventory into
`docs/archived/mosaic-migration/` as frozen history. Evidence logs are ignored from phase 3 and deleted
after the archived plan/brief records their file list and final doctor/lint/checkup exits and reviewer
verdict lines. The document index's Migration rows link the two kept records and the archive, with a
History row for the archive. See [the lifecycle](../install/migration-map.md#migration-state-lifecycle).

Optional **CUTOFF mode** requires explicit `cutoff: yes` input or ruling H0; it is never the default.
It archives all inventoried pre-existing docs and ledgers under each owning repo's
`docs/archived/<original path>`, except owner-named process/runbook exceptions, preserving history,
bytes, modes, and symlink targets. This includes root/component docs and PR documents; entry files and harness
configuration still follow the merge policy. Fresh registries replace old active records, and the
index links archived families and counts. Old gaps and defects are not re-minted. The last task
writes `docs/docs-migration-instructions.md` from [the template](../install/docs-migration-instructions.template.md)
for the first real plan, `/mosaic-plan docs-rebuild` (`0001`); rebuilding current docs is not part of
installation. See [the cutoff boundary](../install/migration-map.md#cutoff-mode).

At the brief, inspect the branch and evidence, answer the exact questions against concept-alignment
row IDs, and decide whether to land. Questions concern missing facts or choices such as conflicting
safety rules, merge/retirement decisions, or a landing-policy override—not JSON fields. The brief
separates resolved rows, rows needing a ruling, unfinished tasks, and Unverified limits, and links
the adaptation record and doctor result. Cutoff adds the archive SHA/counts and rebuild handoff.
No default-branch advance, landing, push, or deployment is authorized by merely running the skill.

After landing, work from the target: read `AGENTS.md` or `CLAUDE.md`, `docs/process/map.md`, and
`docs/index.md`. Normally start with `/mosaic-intake`, then `/mosaic-plan <approved change>`;
`/mosaic-execute <plan-path>` follows plan approval. With cutoff, start instead with
`/mosaic-plan docs-rebuild` and supply `docs/docs-migration-instructions.md`.

## Customizing after install

Run `/mosaic-kit <intended change>` **in the installed project** for requested kit adaptations,
project agents/skills, model-role changes, tracking-mode switches, or upgrades—not ordinary project implementation.
The [maintenance guide](docs/kit/maintenance.md) owns the procedures for paired ports, shared-rule
homes, budgets, checks, and upgrades. The skill works on `kit/<slug>` and stops for a human brief
before landing.

Ownership, adaptation-record authorship, and upgrade reconciliation have one home in the
[maintenance guide](docs/kit/maintenance.md#ownership). Keep the record indexed; use that procedure
rather than treating its old rows as an authoritative change list or overwriting live project docs.

Add project-specific agents and skills alongside kit roles, following neighboring files and their
runtime conventions; preserve existing project-only entries. Configure available models and effort
levels through `modelRoles` in `.omp/config.yml`, keeping agent role references intact. Claude Code
uses its own runtime model settings. Detailed maintenance checks belong in the guide, not in
ordinary project instructions.

## Reference

### Topology and default branch

These are surveyed facts, not choices made to fit a template:

| Topology | Manifest and installed behavior |
|---|---|
| `multi-repo` | A link repo plus at least one independent member git repo; each member has a named remote and its own repo boundary/ledger |
| `monorepo` | One git repo, `members: []`, optional `components` for in-repo packages/deployables, no component remotes or local ledgers |

Monorepo plans live in root `docs/plans/` with `repo: link-repo`; `files:` and `reads:` are
repo-root-relative. Components do not get separate branches or plan homes. The skill derives the
default branch from `origin/HEAD`, falling back only to the sole `main`/`master` branch on origin;
missing or conflicting evidence needs a ruling. Existing PR/CI and deployment policy is preserved
unless the human overrides it. `.omp/mosaic.json` holds runtime `defaultBranch`, `topology`,
`tracking`, and source provenance in `kit.commit`; the generated manifest is an installation
record, not runtime configuration.

### Placeholders and generated manifest schema

The [rendering reference](../install/placeholders.md) defines exact expansions and safe placement.
The skill supplies every value from survey evidence; source Markdown uses these double-brace tokens:

| Token | Value or expansion |
|---|---|
| `PROJECT_NAME` | `project.name`, used in map/index/architecture titles and read gates |
| `PROJECT_SUMMARY` | `project.summary`, the complete first sentence of both entry files |
| `LINK_REMOTE` | `remotes.link`, the root/link remote in git-flow instructions |
| `DEFAULT_BRANCH` | `git.defaultBranch`, used in branch, review, and landing instructions |
| `MEMBERS` | File-specific member/component rows, topology text, remote clauses, or plan/tracker examples |
| `MEMBER_REMOTE:<name>` | Named `remotes.members[name]` lookup |
| `TRACKING` | `tracking.mode`: `none`, `local`, or `mcp`; omitted helper input defaults to `none` |
| `MCP_SERVER` / `MCP_TEAM` / `MCP_QUEUE` | Runtime server and optional scope; absent team/queue render readable instructions, not invented scope |
| `TRACKING_NONE` / `TRACKING_LOCAL` / `TRACKING_MCP` | Mode blocks with slash-prefixed closing tokens; keep only the selected mode; may contain topology blocks |
| `MULTI_REPO` / `MONOREPO` | Non-nested topology blocks selected after tracking blocks; then expand value tokens |

The following examples document the schema consumed by the mechanical helper, not human setup
steps. A multi-repo record has at least one member:

```json
{
  "project": {
    "name": "Atlas",
    "summary": "Atlas is a link repo for the API service."
  },
  "topology": "multi-repo",
  "git": { "defaultBranch": "main" },
  "tracking": { "mode": "none" },
  "remotes": {
    "link": "https://example.invalid/atlas.git",
    "members": { "api": "https://example.invalid/api.git" }
  },
  "members": [{
    "name": "api",
    "path": "api",
    "stack": "TypeScript, Bun",
    "testCommand": "bun test",
    "coverageNote": ""
  }]
}
```

A monorepo record uses components instead; `components` may be omitted or empty:

```json
{
  "project": {
    "name": "Atlas",
    "summary": "Atlas contains the API in one repository."
  },
  "topology": "monorepo",
  "git": { "defaultBranch": "master" },
  "tracking": { "mode": "none" },
  "remotes": { "link": "https://example.invalid/atlas.git" },
  "members": [],
  "components": [{
    "name": "api",
    "path": "apps/api",
    "stack": "TypeScript, Bun",
    "testCommand": "bun test",
    "coverageNote": ""
  }]
}
```

Each member/component requires `name`, root-relative `path`, `stack`, `testCommand`, and
`coverageNote` (which may be empty). Names and paths must be unique within their list; paths cannot
be absolute or contain backslashes, `.` or `..` segments. Names use letters/digits first, then
letters/digits/dot/underscore/hyphen. Manifest strings are single-line and contain no placeholders.
Multi-repo member remotes are keyed by member name; monorepo `remotes.members` may be omitted.
The helper defaults omitted `topology` to `multi-repo`, `git.defaultBranch` to `main`, and
`tracking` to `{ "mode": "none" }`, but the skill records all three explicitly from survey evidence.
Commands render from each entry's path; adapt the stack document when proven cwd differs.
Tracking accepts `{ "mode": "local" }` or `{ "mode": "mcp", "mcp": { "server": "linear", "team": "ENG", "queue": "Triage" } }` instead of `none`. These names are illustrative: MCP `server` is the exact runtime name and required; `team` and `queue` are optional strings supported by H-tracking. Omit `mcp` for other modes.

### Mechanical helper: greenfield/manual path

For a greenfield repo, a human may still supply this schema and call the helper directly from the
mosaic checkout:

```sh
bun kit/install.ts --manifest "/path/to/manifest.json" --target "/path/to/project"
bun kit/tools/doctor.ts --root "/path/to/project"
```

The helper renders Markdown, preserves modes, and creates `.omp/rules/*.md` as relative symlinks
to `../../docs/process/*.md`; Claude rule files are ordinary files. It does not clone members,
initialize git, configure remotes, or edit `.gitignore`. Git, Bash, Python 3 for Claude hooks, and
the project's test runners are needed for the corresponding installed workflows.
Changed destination files are refused before writes unless `--force` is given; identical installs
are no-ops. `--overlay <dir>` replaces same-path files in full after rendering, without merging or
rendering the overlay. Unrelated files are preserved, and symlinked destination directories are
refused. `--force` replaces bytes; it is not an existing-project migration or an upgrade strategy.

### Local tools

Run these from the installed project root:

| Command | Purpose |
|---|---|
| `bun tools/doctor.ts` | Harness structural checks; exit 0 / 1 / 2 means pass / fail / cannot evaluate |
| `bun tools/checkup.ts --json` | Lint, doctor, and document/plan/trigger drift sweep |
| `bun tools/docimpact.ts <plan-path>` | Document-impact candidates to inspect, not automatic edit instructions |
| `tools/tracker.ts` (`local` only) | Offline inventory/intent operations; commands and safety gates live in the [tracker rule](docs/process/tracker.md) |
| `bun .omp/hooks/post/lint-ledgers.ts <path>` | Governed registry/plan lint when using omp |
| `bash .claude/hooks/lint-ledgers.sh <path>` | Governed registry/plan lint when using Claude Code |

Use the current runtime's lint hook. Doctor accepts `--root <dir>`; checkup's `--json` is optional.
For diagnostic details and kit-owned findings, use `/mosaic-kit` and the maintenance guide.

### Skills

| Skill | Purpose |
|---|---|
| `/mosaic-install <target>` | Checkout-only survey, migration, adaptation, and sign-off brief |
| `/mosaic-intake` | Investigate the intake queue and present a human digest |
| `/mosaic-plan <change>` | Scope, reserve, draft, challenge, and present work for human approval |
| `/mosaic-execute <plan-path>` | Execute an approved plan through review, verification, close-out, and landing gates |
| `/mosaic-gap-audit` | Re-check existing gaps against current evidence; apply verdicts only after sign-off |
| `/mosaic-checkup` | Sweep drift and present findings |
| `/mosaic-kit <intended change>` | Maintain the installed kit, project harness additions, model roles, and upgrades |

### Tracking modes

H-tracking records evidence from runtime MCP mounts/configuration, tracker docs, and commit/branch
ticket keys. The survey checks `~/.omp/agent/mcp.json` (`mcpServers`), target `.omp/mcp.json`,
and user/project Claude `.claude/settings.json` and `.mcp.json`; it distinguishes configured
servers from tools actually mounted in the session. Every install records a tracker alignment row.

| Mode | Selection | Runtime behavior |
|---|---|---|
| `none` | Default without tracker evidence, or an explicit owner ruling | No local tracker tool/data/scout or tracker frontmatter in the plan template; no fabricated ticket IDs. |
| `local` | Explicit owner request only | Existing offline replay CLI and local items/outbox; no live connection or synchronization. |
| `mcp` | A mounted MCP tracker or one named by the owner | Sessions call the runtime server's MCP tools directly, with no installed client or local tracker data. |

MCP needs the exact runtime server name, team when known, and a queue state/label inferred from
evidence or resolved by a human ruling. Ticket keys alone do not identify a server or queue;
missing mounted tools/credentials are a verification blocker, not an automatic local fallback.
Installation performs no MCP writes and supplies no MCP client/server implementation.
Only `local` installs `tools/tracker.ts`, `docs/tracker/**`, and both ports' `tracker-scout.md`.
Existing records and external IDs survive migration regardless of the new mode; mode switching
archives local data safely before obsolete kit-owned paths are removed. It never imports local
items into a live workspace as an installation step.
The rendered `docs/process/tracker.md` is the one home for mode-specific commands and safety gates;
skills and agents read it and follow the installed mode. Runtime metadata changes alone do not
re-render rules or callers: use `/mosaic-kit` and the [maintenance guide](docs/kit/maintenance.md).

