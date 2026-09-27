# Migration proof — installing the kit into an existing project (2026-09-27)

Overnight work per the owner's instructions: prove the full kit on a real repository, add a concept-alignment record with a resolution path, let the installer adapt the kit's own Markdown to the target and consider restructuring the target, and make the install skill produce every "templated" value itself (no human-written JSON).

## What was built

- Skills renamed to `/mosaic-plan`, `/mosaic-execute`, `/mosaic-intake`, `/mosaic-gap-evaluate`, `/mosaic-checkup` (no collision with built-ins); verified live (sol xhigh read `mosaic-plan`/`mosaic-checkup`/`mosaic-gap-evaluate`; S4/S8/S11 clean).
- Kit topologies: `multi-repo` (link + member repos) and `monorepo` (components in one repo, `members: []`), any default branch (`{{DEFAULT_BRANCH}}`, hooks read `.omp/mosaic.json`); fresh installs of both pass doctor; fixtures unchanged (parity PASS).
- `/mosaic-install` (mosaic-checkout skill, both ports, 101 lines) + `kit/docs/install/{README,migration-map,concept-alignment,placeholders}.md`: survey → derived manifest (skill-generated record under `docs/mosaic-migration/`, never human input) + dry install into scratch → `03-concept-alignment.md` (one row per existing concept: alignment same/rename/merge/split/keep/retire/new, direction adapt-kit/restructure-target/both, resolution, owner, status; non-done rows must be a plan task or a listed human ruling) → migration plan with adversary rounds → execute on `mosaic/install` with doctor/lint/checkup loops → `kit-adaptations.md` gate (every edited kit file with reason, for future upgrades) → both reviewers until APPROVE → self-check (`omp -p … /mosaic-checkup` in the target) → sign-off brief with a Concept alignment section; resumable across sessions via `STATUS.md`.

## Proof 1 — mb-platform copy 1 (first skill version)

Target: a copy of `brandlight-ai/mb-platform` (monorepo, `master` with CD, 80-line `AGENTS.md`, `.omp/RULES.md`, 6 project agents, 8 Claude skills, `docs/{adr,architecture,prd,gaps.md,plans}` with 282 docs). Three sessions (fable max orchestrator, astra max adversary, opus medium + sol max reviewers): $30.5 + $22.3 + $17.6 ≈ **$70, 2.6 h**. Result on branch `mosaic/install`: kit installed, entry files merged (safety text verbatim), 163 PR docs relocated to `docs/pr-plans/` with 30 link repairs, 8 project skills twinned for omp, registries routed (defects → replay tracker items, duties → G-1…G-27), doctor/lint/checkup 0, reviewers REVISE once (6 findings) then APPROVE, self-check digest PASS, 27-line brief with 5 delegated rulings (base branch, PR landing policy, no D/F minting, replay tracker, tool patches). Not landed.

## Proof 2 — mb-platform copy 2 (upgraded skill)

Four sessions: $22.8 + $22.1 + $26.3 + $26.2 ≈ **$97, 3.4 h** (each session capped at 60 min; two ended mid-step and resumed cleanly from `STATUS.md`). Result: 25 commits, 190 files; `03-concept-alignment.md` with 46 rows (A1–A46, all `done` except A46 waiting on ruling H9) and 9 human rulings with delegated defaults (H1 base commit, H2 remote, H3 PR landing vs ff-only, H4 defect seeding, H5 plan corpus placement, H6 checkup namespaces, H7 agent twins, …); `kit-adaptations.md` with 36 edited kit files each with a reason (e.g. `records.md` routes decisions to `docs/adr/` by slug, the review wave adds the money-path reviewer, `git-flow.md` states the PR flow); direction choices: adapt-kit for ADR/PRD homes, restructure-target only where lint needs the G-entry shape; 3 review rounds (two REVISE, then both APPROVE); self-check `findings: []`; 19-line brief. Final gates in the target: doctor 0/0/0, five registry lints PASS, checkup PASS. Not landed — waiting for the owner's answers to H1–H9.

## What the proofs taught (and what changed because of it)

1. Both migrations found the same kit tool defects and patched their installed copies: doctor's placeholder scan hit fonts/PNG/JSX/workflows (400+ false FAILs); checkup exited 2 on monorepos ("no member repos"), read every four-digit token as a plan id (528 ADR citations) and every `D<n>` as a decision; `human-gates.md` example cited plan `0003`; docimpact threw on docs without kit frontmatter; guard messages said `main`. All fixed in the kit source (`tests/kit/tooling-smoke.ts` covers them); S11/S13 seeds produce identical findings before/after; a raw install into a third copy now shows zero false positives and only genuine project findings (four over-budget project skills, missing omp twins, one dead link) — exactly what the migration resolves.
2. Time: an adversary round at max on a 400-row migration plan takes 15–20 min; the 60-min session cap forced the resume mechanism into existence and proved it (four resumes, no lost work).
3. Cost: ≈ $70–100 per full migration of a 282-doc repo at max effort; planning/adversary is ~half.
4. Not proven: landing (withheld by design), the Claude Code port at runtime, project test suites (listed, not executed), live Linear.

## For the owner

- Both branches exist: `/tmp/mb-platform-copy/mosaic/install` and `/tmp/mb-platform-copy2/mosaic/install` (copy 2 is the reference). Nothing touched `../mb-platform` itself.
- Answer H1–H9 in `/tmp/mb-platform-copy2/docs/mosaic-migration/03-concept-alignment.md` when you want the real migration; the same procedure then runs against `../mb-platform` on a branch.
- Scoreboard 271 rows; kit parity PASS for both fixtures; doctor PASS.
