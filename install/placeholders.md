# Survey values, rendering, and hand placement

Read [migration-map.md](migration-map.md) before deriving values or placing files. `kit/install.ts` remains the mechanical renderer/copier; the skill owns survey, decisions, adaptation, and safe placement.
The human never authors a manifest. The skill generates target `docs/mosaic-migration/manifest.json` on `mosaic/install` using the source `kit/README.md` schema, retaining value provenance in `00-survey.md`.
It is a reproducibility record, not runtime configuration; `.omp/mosaic.json` holds only install metadata (`defaultBranch`, `topology`) consumed by the hooks. Port/model settings and tracker configuration retain their existing purposes.

## Derive values, do not guess

| Field | Survey evidence / exact constraint |
|---|---|
| `project.name` | Repository/package identity checked against project docs; resolve disagreement rather than deriving identity from a temporary checkout basename. |
| `project.summary` | One complete first sentence describing the actual project/topology, derived from project docs; the renderer does not prepend the name. |
| `topology` | Observed git boundaries: `monorepo` for one repository, `multi-repo` for a link repo plus independent member repos; directories/workspaces are not evidence of independent git repos. |
| `git.defaultBranch` | Run `git symbolic-ref refs/remotes/origin/HEAD` and strip `refs/remotes/origin/`; fallback to the sole `main`/`master` that exists on origin (`git ls-remote --heads origin refs/heads/main refs/heads/master`). If both/neither exist or evidence conflicts, ask; never use the current feature branch or helper default. A human override wins and is recorded. |
| `remotes.link` | Observed canonical root/link remote. Ask for a ruling when multiple remotes are plausible or none is available; never invent a URL. |
| `members` / `components` | Independent member repos for multi-repo (at least one); monorepo uses `members: []` and optional `components` for in-repo packages/deployables. Components do not get remotes, branches, local ledgers, or separate plan homes. |
| Entry `name` / `path` | Unique name matching letters/digits followed by letters/digits/dot/underscore/hyphen; path is root-relative, nonempty, unique ignoring trailing slashes, with no absolute path, backslash, `.` or `..` segment. |
| Entry `stack` / `testCommand` / `coverageNote` | Manifests/CI plus executed survey evidence: tools, actual invocation/cwd, and coverage limits. `coverageNote` may be empty; the other strings may not. If a needed fact is unavailable, record the missing prerequisite instead of inventing a command or a passing result. |
| `remotes.members[name]` | Observed remote for each independent member; required for multi-repo. Omit or use an empty object for monorepo. |

All manifest strings are single-line, without CR/LF/NUL or template delimiters. Keep explicit topology/default branch: the helper's defaults are compatibility behavior, not survey evidence.
The helper prints each member/component command as running from its path. If a workspace command actually runs from the repo root, adapt `docs/process/stack.md` to the proven cwd and log that hunk; do not silently change the command's meaning.
Derive landing policy from observed CI, repository guidance, and accessible branch protection, retaining evidence and unavailable checks in the survey (H3). Follow the existing policy unless the human chooses otherwise; PR flow with CI into the derived branch is an automatic adaptation, not a reason to adopt the kit's no-PR default.
When it differs from the rendered baseline, edit target `docs/process/git-flow.md` to require PR into that branch and CI, preserve in-session reviews/sign-off and deployment constraints, reconcile every conflicting kit landing instruction/diagnostic, and record each hunk in `kit-adaptations.md`. The manifest has no landing-policy field; the skill adapts Markdown, not the helper schema.
Cutoff is also a recorded survey/ruling choice (`cutoff: yes|no`, H0), not a placeholder or installer flag; use the map's archive-first and rebuild-handoff procedure only for explicit `yes`.

## Placeholder grammar and values

A placeholder is two opening braces, a token name, then two closing braces. This checkout-only reference prints token names without the delimiters; it is not rendered or installed.
Only `.md` regular files are rendered; non-Markdown files and symlink targets retain their bytes, except the separately generated `.omp/mosaic.json` configuration.
First process non-nested `MULTI_REPO` and `MONOREPO` blocks (opening token, body, slash-prefixed closing token): retain the chosen topology's body, discard the other, remove the markers. Then substitute value tokens; unknown tokens, unsupported `MEMBERS` destinations, or leftover opening delimiters are errors.

| Token | Exact expansion |
|---|---|
| `PROJECT_NAME` | Verbatim `project.name` in the map read gate, docs index title, and architecture title. |
| `PROJECT_SUMMARY` | Verbatim `project.summary` as the first sentence of `AGENTS.md` and `CLAUDE.md`. |
| `LINK_REMOTE` | Verbatim `remotes.link` in `docs/process/git-flow.md`; remote strings are documentation, not shell commands. |
| `DEFAULT_BRANCH` | Verbatim `git.defaultBranch` in Markdown branch/review/landing instructions; also write the same value to the hooks config. |
| `MEMBER_REMOTE:<name>` | Verbatim `remotes.members[name]`; the name is an exact key, and a missing key is an error. |
| `MEMBERS` | Destination-specific expansion below, not a universal list or a substitute for topology discovery. |

For member/component paths, remove trailing slashes then add one `/`. Table-cell rendering escapes each pipe as backslash-pipe; other characters are not escaped by the helper. Check the resulting Markdown/links when a real value contains markup characters.

## `MEMBERS` by destination

| Destination | Multi-repo | Monorepo |
|---|---|---|
| `docs/process/stack.md` | One table row per member: code-spanned name; stack; code-spanned test command followed by ` from ` and the code-spanned normalized path, then `; ` + coverage note when nonempty. Escape pipes in stack, command, path, and coverage note. | Same row shape using each component's code-spanned normalized path instead of a member name. Empty components produce no rows. |
| `docs/index.md` | One row per member: code-spanned normalized path and stack, both pipe-escaped. | Same rows for components; no rows for an empty list. |
| `docs/process/plan-home.md` | Project name + ` is the link repo; ` + comma-separated code-spanned normalized paths + ` is an independent, gitignored member repo.` for one member, otherwise ` are independent, gitignored member repos.` | Project name + ` is a single repository; components live under their paths and every plan is link-homed (` + code-spanned `repo: link-repo` + `); ` + code-spanned `files:` + ` are repo-root-relative.` |
| `docs/process/git-flow.md` | For one member, `the member remote is ` + code-spanned remote; otherwise `the ` + member name + ` remote is ` + code-spanned remote for each member, joined with `; `. | `components share this repository and remote` |
| `docs/process/tracker.md`, `docs/plans/TEMPLATE.md` | The first configured member's name (illustrative examples, not seeded records). | `link-repo` |

Hand-rendering keeps table delimiters and file context from the template; the table above defines cell/body values. Members/components stay in manifest order. No `MEMBERS` expansion is defined for other destinations.

## Manual placement without a new config

1. Complete the branch/cleanliness, snapshots, per-file dry comparison, alignment/ruling, and plan gates in the skill; hand placement is not a bypass around them.
2. Prefer a fresh helper-rendered scratch tree from the generated manifest as the baseline. When rendering by hand, select topology blocks and substitute every token above in the same order, then compare with that scratch output; planned adaptations may differ only as recorded hunks.
3. Place only planned files under `AGENTS.md`, `CLAUDE.md`, `.omp/`, `.claude/`, `docs/`, and `tools/`. The source installer, source README, and checkout `install/` references are not installed. Never traverse a destination directory symlink, replace a directory with a file, or overwrite an unexplained collision; preserve target-only files.
4. Preserve file modes (including executable hooks/tools). Keep `.omp/rules/*.md` as relative file symlinks to `../../docs/process/*.md`; the two `.claude/rules/` files are ordinary files. Shared rules are edited at their home, with required port core/guard parity.
5. Generate `.omp/mosaic.json` with the observed `defaultBranch` and `topology` exactly as the helper does; merge `.omp/config.yml` and `.claude/settings.json` safely so registered hooks and project permissions remain effective. Do not add a root manifest/config copy.
6. Merge/adapt installed Markdown, including core/rules/skills/agents and routing to selected project homes; record every deviation from the rendered baseline in `kit-adaptations.md` with file, hunk summary, reason, and alignment IDs. Repair all callers and file-relative links, preserving both ports and all doctor budgets.
7. Reconcile the alignment and nothing-lost ledgers and run the task checks plus kit-adaptations gate. Do not write raw template delimiter examples into installed reports/logs: refer to token names, and keep full raw comparison evidence outside the checked tree if necessary.

Overlay files are full replacements after kit rendering, not template fragments, appended sections, or merged rows; overlay Markdown is not rendered. If the skill uses an overlay, it must already be fully rendered/adapted and included in the same collision and adaptation records.
No helper command clones members, initializes git, sets remotes, or edits `.gitignore`; do not infer authorization for a repo split or topology change from this placement reference.
