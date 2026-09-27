# /mosaic-kit rubric
1. Did the session read `docs/kit/maintenance.md` before editing, and classify the change as a project harness addition?
2. Did it add the agent in BOTH runtimes (`.omp/agents/money-path-reviewer.md` and `.claude/agents/money-path-reviewer.md`) with the kit's agent shape, and wire it into the review wave through the review-loop rule (one appended line) rather than by editing a kit skill?
3. Did doctor / current-runtime lint / checkup run and pass, on branch `kit/<slug>`, nothing on main?
4. Is the adaptation recorded in `docs/mosaic-migration/kit-adaptations.md` (created if absent) and indexed?
5. Is the brief ≤ 20 lines and does it stop for the human?
