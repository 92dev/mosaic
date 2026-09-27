# Baseline pitfall incidents

Maintainer history moved out of the installed starter catalog. These are observations from the source harness and its project, not decisions or measured incidents of a newly installed project. Historical commands, outputs, paths, line numbers, and design advice below describe the recorded implementation, not the current installed interface.

The [baseline catalog](../../tests/loops/fixtures/baseline-overlay/docs/architecture/pitfalls.md) remains unchanged. It supplies the original plan, decision, and gap identifiers that the installed catalog had obscured. P-numbers remain stable because plans and gaps cite them; P-33 and G-141 below are historical references, not new installed entries. The installed catalog retains only the portable starter checks.

## P-23 — The simplest shape is the one nobody tests

Attention went to the interesting cases, leaving the degenerate one — a single-segment run, a loop with no interior vertex, an empty selection — untested. A guard written for the general algorithm (`if (vertices.length < 6) return null`) rejected the smallest valid case outright, so the feature never ran there while the suite stayed green.

**Measured: plan 0049, 2026-07-29.** Seven passing tests exercised at least three vertices; the two-dot line, the first thing the reporter tried, hit the arity guard.

The retained lesson is to enumerate the minimum viable arity N and N+1 and test the minimum first. A guard excluding a valid minimum is a missing branch, not validation: implement it or state why that minimum is impossible.

## P-24 — A long run whose output you discarded is a run you pay for twice

Piping an expensive suite into a filter (`… | tail -20`) left the summary as the only record: fifty minutes bought “19 failed” and nothing else, truncating the stream before the harness could capture the full output as an artifact. Piping was not the problem; losing the evidence was. The full result needed to survive on the filesystem independently of what was printed. The source catalog pointed to `workflow.md` §6 for the JSON reporter, `error-context.md`, and the trap that the latter is cleared on the next run.

**Measured: 2026-08-05, D46.** All 19 “failures” were `browser has been closed`; roughly 90 stray Chromium processes accompanied one infrastructure event. A contiguous tail of identical teardown errors was one crash wearing many costumes, not the same finding as scattered assertion diffs. Those cases required opposite responses, so the error had to be read and classified before believing the count.

**Related: G-67, since closed in the source catalog.** Playwright was not concurrency-safe inside one worktree, and distinct `PW_PORT`s did not provide isolation.

## P-31 — A guard can exit successfully without checking anything

The source `PostToolUse` hook read its target from a JSON payload on stdin. A human or model invoking it intuitively with the path as an argument supplied no stdin; its fall-through `exit 0` reported success without reading a file.

**Measured: 2026-08-21, plans 0086 and 0087.** Plan 0086's session reported “LINT-CLEAN” eight times using the argv form of the then plan-doc linter. Re-running under the stdin contract showed that both 0086 and 0087 did pass, so no record was actually broken. The original evidence was nevertheless vacuous; a real violation could have landed unseen.

### Historical branch-guard probe and interface advice

The catalog recorded the same, higher-consequence shape in the branch-protection guard: `.claude/hooks/guard-main.sh:21-31` read the stdin payload, and line 34 was `[ -z "$cmd" ] && exit 0`. Those line numbers describe the historical file, not the current kit hook.

On a throwaway repository at `/tmp/gm` checked out on `main`, the recorded stdin invocation was:

```sh
printf '{"tool_input":{"command":"git -C /tmp/gm commit -m x","cwd":""}}' | sh .claude/hooks/guard-main.sh
```

It exited **2** with “Direct commits to main are blocked”. The same command passed as argv was:

```sh
sh .claude/hooks/guard-main.sh "git -C /tmp/gm commit -m x"
```

It exited **0** without checking the command. Hand-verifying branch protection in the intuitive form could therefore be presented as proof of protection while exercising nothing.

The baseline catalog recommended `.claude/hooks/lint-ledgers.sh` as the counter-example: it accepted the stdin payload and fell back to `$1`, making the intuitive invocation valid too. The installed catalog later pointed the same comparison at `.omp/hooks/post/lint-ledgers.ts`. The historical design advice was to prefer an interface that matched natural use rather than rely on a footnote competing with existing examples, and to prefer guards that fail on input they cannot understand over guards that silently succeed. This is maintainer history, not an instruction for project sessions to redesign installed hooks.

### Silent success: three sightings on 2026-08-22

The source catalog named the class **SILENT SUCCESS — an operation that reports success while having done nothing** after three sightings in one night. It retained existing numbers because renumbering would break citations from plans and gaps:

1. **P-31:** a guard invoked as its documentation implied exited 0 without checking.
2. **P-33:** a write bracketed to a narrower role matched zero rows under that role's RLS policy, and the caller printed success.
3. **G-141, unnumbered pitfall:** a rollback probe exited 0 having applied and checked nothing. `node --import tsx` received an unresolved `/tmp` path while the runner's CLI guard compared it with `import.meta.url`, which on macOS used `/private/tmp`. The fix made the runner throw unless it produced recognisable output. No new P-number was assigned: this was P-31's rule in another form, and expanding the catalog would obscure the class.

The shared rule was to decide in advance what output proves the work happened and fail when it is absent. Success is not the absence of an error; a green check needs its invocation as well as its result.

## P-34 — Shared or interpreted context silently claims input you meant literally

**Three sightings in one night, 2026-08-22.** Each tool did something reasonable with input nobody had told it was literal or private:

1. **`git commit` with no pathspec in a worktree shared by seven agents:** the index was shared state, so the commit claimed a sibling's staged files and attributed that work to someone else's message.
2. **A commit message containing backticked CLI examples, passed to double-quoted `-m`:** the shell executed the examples as command substitution. Two clauses vanished from the message, visible only through an unrelated-looking `command not found`.
3. **The migrations directory, discovered by `migrate.ts` through a glob:** anyone running the chain could apply another agent's half-written `.sql` file. A private database offered no protection; the directory, not the database, was the shared mutable state.

The source rules were `git commit -- <paths>`, never bare where a tree or index was shared; `-F <file>` for messages containing backticks; and treating a globbed directory as shared state. A failure naming a file another agent owned was not automatically a regression in one's own change. The general lesson was to ask what the receiver would interpret and consume from ambient state, not merely what was explicitly passed. Related: P-31's silent-success class, because two of these three incidents looked successful while failing.

## P-38 — Evidence you believe exists, and never checked, is not evidence

**Two sightings in one hour; the source entry records no date.**

1. `classifyJobFailure` deliberately withheld an unclassified message and recorded “see handler logs”, but nothing wrote those logs. Every failed job therefore left one useless artefact.
2. `az webapp log tail` kept following the container that a deployment had replaced. It reported `Site … stopped`, followed by seven clean minutes, while the live instance served traffic unobserved. That silence was about to be treated as proof that a bug was fixed.

Before relying on a channel, the source rule required forcing one predictable line through it and confirming arrival; its example was a deliberately bogus request whose refusal logs. Absence means something only after presence has been demonstrated. A diagnostic deferring to another channel also owns proving that the channel is written. Related: P-31.

## Hook incidents retained with the catalog history

These incidents motivated checks whose operational behavior remains useful; their project-specific anecdotes do not belong in installed hook comments. Sources: the historical [ledger hook](../../harness-2026-09-02/.omp/hooks/post/lint-ledgers.ts) and [branch guard](../../harness-2026-09-02/.omp/hooks/pre/guard-main.ts), with the corresponding [shell guard](../../harness-2026-09-02/.claude/hooks/guard-main.sh).

### Duplicate gap IDs — plan 0082, 2026-08-20

Plan 0082's close-out pasted its two new gap entries one number low, overwriting G-127's text with a copy of G-128 and leaving G-128 duplicated. The real obligation — ink-preview normalization — vanished from the registry. Nothing noticed for five days, while every `G-x` citation in the tree silently pointed at the wrong row. This is why ID uniqueness is a load-bearing registry check, not merely formatting.

### Closed gap left active — G-132, closed since 2026-08-23

G-132 remained in the active registry after closure on 2026-08-23. The active list was standing context for every `/palladio-plan` session, so the discharged obligation consumed attention in future work. The preserved invariant is to move a closed entry to the archive without renumbering or deleting it, rather than leave closed history among active obligations.

### A plan slug mistaken for a commit — plan 0057, 2026-08-01

The old branch guard used `/\bgit\b[^|;&]*\bcommit\b/`, which matched the word `commit` anywhere in a git command's arguments. It blocked `git worktree add -b task/0057-ghost-commit-fidelity main` as a commit on main, forcing the plan slug to be renamed around the hook.

The replacement recognized `commit` only as git's actual subcommand: the first non-option token after `git`, consuming value-taking global options. `git commit-tree` was deliberately excluded because it writes an object without moving a branch ref. The incident explains the token-scan requirement; the concrete slug is history, not installed project context.

### Ignored tool cwd — 2026-08-20

Before the recorded fix, the guard ignored the tool call's `cwd` parameter entirely. A branch commit invoked with `cwd: <member>` was resolved against the link repository and falsely blocked. The recorded resolution used `git -C <dir>` or a leading `cd <dir> &&`, resolved relative paths against the tool call's `cwd`, then fell back to that cwd and finally the hook/session cwd. The historical false positive explains why the targeted repository, rather than the orchestration repository alone, determines branch protection.

## Historical record-rule incidents

The installed records rule formerly carried terse incident parentheticals: a ledger gained a renamed and extra column; compressed docless rows lost their scope; a blind regex rename broke both runtime implementations; two repositories cited a command ritual valid in only one; and a settled ruling was headed for gaps and nearly went unrecorded. A grant snapshot became stale in a day, and a migration count was eight behind after dated deployment entries. These inherited anecdotes explain schema preservation, per-file rename checks, evidence-bound recipes, durable decision routing, and querying live state. They are not measurements of an installed project.

An `updated_at` trap was named without a traceable installed citation; it is not retained as a verified incident.
