# Pitfalls Catalog

> One-line scope: the catalog of traps that look like shortcuts (P-1..P-n).
>
> Covers: §10
> Area affinity: cross-area
> Part of [Architecture docs](README.md)

> **Check every proposal against this list before suggesting it.** These are the traps that look like shortcuts; each names the decision that already closed it. New pitfalls get the next global P-number here (see the extension rules in the [README](README.md#extension-rules)) and stay terse — trap + rule + one-line measured cite, per [meta.md rule 7](../meta.md).

---

## 10. Pitfalls catalog (check every proposal against this list)

- **P-23 · The simplest shape is the one nobody tests.** Attention goes to the interesting cases, so
  the degenerate one — a single-segment run, a loop with no interior vertex, an empty selection —
  becomes the untested path; worse, a guard written for the *general* algorithm often rejects it
  outright (`if (vertices.length < 6) return null`), so the feature never runs there while the suite
  stays green. **Rule:** for any feature keyed to a sequence, enumerate the arity boundary (minimum
  viable N, then N+1) and test the minimum FIRST; a guard excluding the minimum is a missing branch,
  not a validation — write the branch or state in code why the minimum is impossible. *Measured:
  plan 0049 (2026-07-29) — seven passing ≥3-vertex tests; the two-dot line, the first thing the
  reporter tried, hit the arity guard.*

- **P-24 · A long run whose output you discarded is a run you pay for twice.** Piping an expensive
  suite into a filter (`… | tail -20`) leaves the summary as the only record — fifty minutes buys
  "19 failed" and nothing else — and it truncates before the harness can capture the full output as
  an artifact. **Piping is fine — losing the evidence is not**: the full result must survive on the
  filesystem independently of what you print; the mechanics (JSON reporter, `error-context.md` and
  its cleared-on-next-run trap) are canonical in [workflow.md §6](../workflow.md). **Read the error
  before believing the count**: a contiguous tail of identical teardown errors is ONE crash wearing
  N costumes, scattered assertion diffs are regressions — classify first, the responses are
  opposite. *Measured: 2026-08-05 (D46) — 19 "failures", all `browser has been closed`, ~90 stray
  Chromium processes: one infrastructure event.* Related: [G-67](../gaps.md) — Playwright is not
  concurrency-safe inside one worktree, and distinct `PW_PORT`s are not isolation.

- **P-31 · A guard invoked the way its docs imply exits 0 without checking anything.**
  A `PostToolUse` hook reads its target from a **JSON payload on stdin**. Handed nothing — which is
  what happens when a human or an LLM runs it the intuitive way, with the path as an argument — a
  hook that falls through to `exit 0` reports success having read no file at all. *Measured
  2026-08-21 on the then plan-doc linter: plan 0086's session reported "LINT-CLEAN" eight times from
  the argv form; re-run under the stdin contract both 0086 and 0087 did pass, so nothing was actually
  broken — but the evidence had been vacuous the whole time and a real violation would have landed
  unseen.*
  **`guard-main.sh` still has this shape, and it is the higher-consequence one** — it is the
  branch-protection guard. `.claude/hooks/guard-main.sh:21-31` reads the stdin payload and line 34 is
  `[ -z "$cmd" ] && exit 0`. *Measured on a throwaway repo checked out on `main`:
  `printf '{"tool_input":{"command":"git -C /tmp/gm commit -m x","cwd":""}}' | sh
  .claude/hooks/guard-main.sh` exits **2** with "Direct commits to main are blocked", while
  `sh .claude/hooks/guard-main.sh "git -C /tmp/gm commit -m x"` exits **0** on the same command.* So
  hand-verifying branch protection the natural way reports "blocked" having checked nothing.
  [`lint-ledgers.sh`](../../.claude/hooks/lint-ledgers.sh) is the counter-example to copy: it takes
  the stdin payload **and** falls back to `$1`, so its intuitive invocation is also its correct one.
  Prefer that shape — a footnote telling people not to use the natural form competes with every
  reference that already does.
  **Rule:** a check whose failure mode is silent success is not evidence. Invoke a hook through its
  real contract, and prefer guards that exit non-zero when handed input they cannot understand over
  guards that shrug. When citing a green check, cite the invocation too.
  **THE CLASS, named here because three sightings landed in one night (2026-08-22) and a class is
  cheaper to remember than three entries: SILENT SUCCESS — an operation that reports success while
  having done nothing.** The entries stay separate and keep their numbers, because they are cited
  from plans and gaps and renumbering would break that; this is the index. (1) **P-31**, this entry:
  a guard invoked as its docs imply exits 0 without checking. (2) **P-33**: a write bracketed to a
  narrower role matches zero rows under that role's RLS policy and the caller prints success.
  (3) **Unnumbered, recorded in [G-141](../gaps.md)**: a rollback probe exited 0 having applied and
  checked nothing, because `node --import tsx` got an unresolved `/tmp` path while the runner's CLI
  guard compares against `import.meta.url`, which on macOS is `/private/tmp`; fixed by making the
  runner throw unless it produced recognisable output. No new number for that one — it is this
  entry's rule met in a new costume, and inflating the catalog would make the class harder to see,
  not easier. **The shared rule:** decide in advance what OUTPUT proves the work happened, and fail
  when it is absent. Success is not the absence of an error.

- **P-34 · Shared or interpreted context silently claims input you meant literally.** Three
  sightings in one night (2026-08-22), same shape each time: a tool did something entirely reasonable
  with input nobody had told it was literal or private. (1) **`git commit` with no pathspec** in a
  worktree seven agents share: the index is shared state, so the commit claimed a sibling's staged
  files and attributed their work to someone else's message. (2) **A commit message containing
  backticked CLI examples**, passed to a double-quoted `-m`: the shell executed them as command
  substitution and two clauses vanished from the message, visibly only as an unrelated-looking
  `command not found`. (3) **The migrations directory**, which `migrate.ts` discovers by glob: a
  half-written `.sql` from another agent is applied by anyone who runs the chain, so a private
  database gives no protection at all — the directory, not the database, is the shared mutable state.
  **Rules:** `git commit -- <paths>`, never bare, wherever a tree or index is shared; `-F <file>` for
  any message containing backticks; and treat a globbed directory as shared state, so a failure
  naming a file another agent owns is theirs, not a regression of yours. **The generalisation worth
  keeping:** before trusting an invocation, ask what the receiver will INTERPRET and what it will
  take from AMBIENT state — not only what you passed it. Related: **P-31**'s silent-success class,
  since two of these three failed while looking successful.

- **P-38 · Evidence you believe exists, and never checked, is not evidence.** Two sightings, one
  hour. (1) `classifyJobFailure` withholds an unclassified message on purpose and records "see
  handler logs" — and NOTHING wrote those logs, so every failed job left one useless artefact.
  (2) `az webapp log tail` kept following the container a deploy replaced: it reported `Site … stopped`
  then seven clean minutes while the live instance served traffic unobserved, and that silence was
  about to be read as proof a bug was fixed. **Rule:** before treating a channel as evidence, FORCE
  one line through it that you can predict and confirm it arrives — a deliberately-bogus request
  whose refusal logs. Absence only means something once presence is demonstrated; and a diagnostic
  that defers to another channel owns proving that channel is written. Related: **P-31**.

