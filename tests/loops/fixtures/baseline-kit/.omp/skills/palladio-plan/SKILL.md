---
name: palladio-plan
description: Author a new plan doc from the canonical template and refine it through adversarial rounds with the plan-adversary agent (every round reported to the human, blocking only for human-owned calls; auto-end + runaway gate instead of a fixed round cap), homed in the target repo's docs/plans/ (single member repo) or the link-repo docs/plans/ (cross-repo or meta work). Use for any non-trivial change — code, docs, or .claude//.omp itself. Argument (optional): a short description of the change to plan.
thinkingLevel: xhigh
---

# /palladio-plan — Author a plan doc

You are the **orchestrator** authoring a plan. Plans are strict and extensive — all judgment is spent
here so executors need none. Read `docs/workflow.md` first if you haven't this session.

Planning is three phases: **draft** (research + author), **adversarial refinement** (the
plan-adversary attacks, you rule, the human sees every round), **present** (ledger + human
approval). A plan that skipped Phase 2 without a recorded human waiver is not presentable.

## Before you start — is a plan the right vehicle?

Not every request needs a plan. Apply `docs/workflow.md` §2 triage first: a fix inside an active
plan, a refinement to a draft, work already inside an approved plan's scope, a mechanical edit,
data-only ingestion, or a small edit that merely implements a direction already decided in-session
(including workflow/skill edits under §7's meta hatch) are lighter paths, not a plan — say so, point
the human to it, and stop. Honor an explicit human request for a plan on borderline work; otherwise
default to the lightest vehicle that records the decision. Reserve a plan for work whose decision is
still open.

## Phase 1 — Research & draft

1. **Targets & home**: determine which repo(s) the change targets. Apply R1 — exactly one target
   member repo ⇒ the plan is homed in `<that-repo>/docs/plans/`; the target is `link-repo`, or more
   than one repo (cross-repo feature) ⇒ homed in the link-repo's `docs/plans/`.
2. **Reserve the number** (R2, before authoring): fetch the link repo and reset local `main` to
   `origin/main`, take `NNNN` = highest
   master-ledger number + 1, add the plan's row (`draft`, title, target repo(s),
   `task/NNNN-<slug>`) on a short-lived `docs/NNNN-reserve` branch, land it `--ff-only`, and push
   (§3). A rejected push means a concurrent session moved first — re-fetch and retry with a
   recomputed `NNNN`; the push is the atomic arbiter. This claims `NNNN`, so Phase 3 does not re-add
   the row.
3. **Create**: copy the canonical link-repo `docs/plans/TEMPLATE.md` → `<home-repo>/docs/plans/NNNN-<slug>.md`
   (create the `docs/plans/` directory in the home repo if it doesn't exist yet — this is normal the
   first time a plan targets that member repo). Fill frontmatter (`status: draft`, today's date,
   `repo:` = comma-separated target repo(s) — `member-a` | `link-repo`
   (see `docs/workflow.md` §8), `branch: task/NNNN-<slug>`). Member-homed plans reference
   link-repo docs with upward-relative links (e.g. `../../../docs/architecture/...`) per R8.
4. **Research before writing**: for an unfamiliar subsystem, dispatch **`context-scout`** via `task`
   on the relevant area(s) instead of reading them cold — its brief plus the `docs/architecture/`
   decisions (D#) it points to is enough to ground the plan. For the pitfalls-and-gaps check,
   dispatch **`registry-scout`** via `task` with the plan's scope instead of slurping `pitfalls.md`
   and `gaps.md` into your own context (`docs/workflow.md` §10) — it returns the `P-x`/`G-x`/prior
   plans whose triggers intersect. Read each flagged entry in full and act:
   - if the idea trips a flagged **pitfall**, stop and tell the human;
   - every flagged active **gap** must be either addressed by the plan (state `closes G-x`; `/palladio-execute`
     closes it at landing, moved to `docs/gaps-archive.md`) or explicitly deferred in the plan's
     Context with a one-line reason citing `G-x` — silence about a triggered gap is a plan defect.
   Both scouts narrow *what to read*; neither rules — you read each flagged entry and rule on it yourself.
5. **Task breakdown**: executor-sized tasks, each with:
   - `repo:` — only for cross-repo plans, names the repo this task runs in (omit it for single-repo
     plans);
   - `files:`/`reads:` — exact paths, relative to the plan's **home repo root** (R5); design `files:`
     sets to be **disjoint** wherever parallel execution is wanted;
   - `instructions:` — precise, zero-judgment steps;
   - `acceptance:` — observable results.
   Delegate research-heavy subparts to subagents if needed, but the plan text is yours.
6. **Review checklist**: concrete diff checks for the reviewers, citing the relevant P-x.
7. **Verification**: steps an LLM can run in-repo. Then **Verification gaps** — honest: what can't be
   machine-verified, why, and fix/workaround/alternative. The lint hook checks the section exists;
   only you make it truthful. Write each gap so it can be lifted near-verbatim into `docs/gaps.md`
   at plan close (what + why + trigger) — `/palladio-execute`'s close-out promotes the survivors to G-entries.

## Phase 2 — Adversarial refinement

The counterweight is the `plan-adversary` agent — its charter and round output
contract live in `.omp/agents/plan-adversary.md`. You are the final decision maker; the adversary
challenges, panelists advise, the human sees every step and can overrule anyone.

Rule decisively and move: the adversary's job is to doubt, yours is to decide (`docs/workflow.md` §1,
Orchestrator posture). A challenge you have ruled on and shown the human is settled — amend or reject it
and go on; do not re-open it for fresh doubt, and do not treat the adversary finding *something* each
round as a requirement to keep the debate alive past convergence. Likewise, if the draft barely moved
since the last round, that *is* convergence — don't spend another round to confirm it (an **insufficient-delta**
break; §2).

1. **Waiver**: for a genuinely trivial plan, ask the human to waive the debate. Record the granted
   waiver (who, why) in the Planning log, then go to Phase 3 — a Phase 2 skipped without one is not
   presentable (`docs/workflow.md` §2; on the light path this break is self-serve instead).
2. **Spawn** the adversary once via `task` (agent: `plan-adversary`) with: the plan doc path, the
   plan's Context section, and the target repo(s). It reads the repo itself — do not summarize the
   repo on its behalf. Its reply is Round 1.
3. **Rule** on every challenge, one by one:
   - `ACCEPT` — amend the plan accordingly;
   - `REJECT` — with recorded reasoning (grounded in docs/repo evidence, never bare disagreement);
   - `INVESTIGATE` — for a contested, non-obvious point, consult a panel: dispatch `context-scout`
     via `task` for a brief on the disputed area, or `oracle` for a second opinion. Panelists
     propose; **you decide**.
4. **Log the round**: append to the plan doc's `## Planning log` — challenges (severity +
   grounding), your ruling on each, panel input if any, what changed in the draft, and the round's
   checkpoint disposition (blocking or informational, per step 5).
5. **Round report**: report every round to the human — challenges, rulings, what changed. The
   report itself is unconditional: the human sees every round and may interject at any time (steer,
   overrule a ruling, end the debate; an overrule reopens that ruling, not the whole debate). It
   **blocks** — wait for the human before opening the next round — only when the round leaves a
   call that isn't yours to make:
   - a human-owned decision surfaced or moved: product semantics/UX, material scope growth or a
     direction change since the human last saw the draft, spend/credentials/deploy, or a flagged
     P-x/G-x whose recorded resolution is a human ruling;
   - you would REJECT a challenge grounded in recorded truth (D#/P-x) — overriding a recorded
     decision is the human's call, never yours;
   - a standing BLOCKER that no amendment you are authorized to make can resolve.
   None open → log `Checkpoint: informational — nothing human-owned open` and continue without
   waiting. Unattended sessions run the same rule: a blocking condition is never self-served —
   record the decision OPEN in the Planning log and surface it at the next human contact, unless
   the human explicitly pre-delegated that class of decision.
6. **End or continue** — decided BEFORE any dispatch, on substance, not a round count; there is
   no fixed cap:
   - **convergence**: the adversary declared `NO FURTHER CHALLENGES` with no standing CONTEST
     → step 7;
   - **auto-end**: the round left nothing critical or decisive for the human — every challenge
     ruled (amendments applied), nothing human-owned open — and the draft barely moved (§2's
     insufficient-delta break) → step 7. You end it yourself; don't keep the debate alive just
     so the adversary can bless the ending;
   - **runaway gate**: the next round would be round 6 (default threshold 5; the human may set a
     different one up front) → block for the human — what is still standing, why it hasn't
     converged, continue/amend/stop;
   - otherwise **open the next round**: DM the adversary over irc (`op: send`, `await: true`)
     with your rulings and a note that the draft is revised — it re-reads the plan from disk and
     keeps its own context across rounds (idle/parked peers wake on DM). Back to step 3.
7. **Leftovers**: at debate end, digest everything standing that the draft does NOT incorporate —
   rejected challenges (with your reasoning), challenges the adversary contested after your
   REJECT, deferred MINORs, open questions — each with a suggested disposition and its
   implications, and ask the human: amend / another round / something else. The answer loops back
   into this phase or proceeds. Nothing standing → go straight to Phase 3; its presentation is
   the ask.

## Phase 3 — Ledger & present

1. **Ledger**: the master-ledger row was already added by the R2 reservation (Phase 1) — do NOT re-add
   it; just confirm it is present with the right title/status. For member-homed plans, ALSO seed or update that repo's local ledger
   `<repo>/docs/plans/README.md`. If it doesn't exist yet, create it with: an H1
   `# Plans Ledger — <repo>`; one sentence pointing to the master ledger and `docs/workflow.md` in the
   link repo (upward-relative links per R8); and the same table columns as the master ledger minus
   the "Target repo" column (that's implicit — it's this repo).
2. **Present** the plan to the human for approval, including a summary of the Planning log (rounds,
   standing rejections, human rulings) so approval sees the debate, not just its outcome.
   **Only a human flips `draft → approved`.** Do not begin execution in this invocation.
