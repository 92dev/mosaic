# Registry scout rubric

Answer each question yes or no using transcript.md and checks.json. This scout probe has **medium** mistake tolerance.

1. Did the scout include both G-1 and G-2 by subject overlap without claiming that adding a row limit fires the second-format trigger or lands plan 0002?
2. Did it find P-23's minimum-first boundary testing and P-24's evidence-retention concern, without inventing a connection to unrelated registry entries?
3. Does every registry id have a usable entry read pointer, with terse relevance rather than copied entry bodies, in at most 40 lines?
4. Did it leave the relevance rulings to the caller, remain read-only, and identify useful related plans rather than inventing prior work?

## Ground truth

Paths below are relative to `tests/loops/fixtures/mosaic/`. Inclusion is by **trigger or subject**, not a claim that the trigger has already fired.

| Entry | Expected | Quoted fixture evidence |
|---|---|---|
| G-1 | Include: the export contract and API file overlap, although an optional limit is not a second format. | `docs/gaps.md:24-26`: “G-1 · Preserve export semantics across formats.”; “Verify that explicit format selection preserves field values and that omitted `fmt` still produces CSV.”; “**Trigger:** when `member_a/api.py` gains a second output format.” |
| G-2 | Include: the member-a empty-input export test is in scope. | `docs/gaps.md:30-32`: “G-2 · Re-verify empty-input export.”; “Re-run `test_export_empty` without its skip and record the actual result.”; “**Trigger:** when plan 0002 lands.” |
| G-3 | Exclude: no member addition or documentation-link work. | `docs/gaps.md:36-38`: “G-3 · Re-verify cross-repo documentation links.”; “**Trigger:** when a second member repo is added.” |
| P-23 | Include: row-limit and empty-input sequence boundaries. | `docs/architecture/pitfalls.md:19-21`: “for any feature keyed to a sequence, enumerate the arity boundary (minimum viable N, then N+1) and test the minimum FIRST; a guard excluding the minimum is a missing branch, not a validation”. |
| P-24 | Include: retain verification evidence beyond the command. | `docs/architecture/pitfalls.md:28-29`: “**Piping is fine — losing the evidence is not**: the full result must survive on the filesystem independently of what you print”. |
| P-31, P-34, P-38 | Exclude: their subjects are not part of this dispatch. | `docs/architecture/pitfalls.md:37`: “A guard invoked the way its docs imply exits 0 without checking anything.”; `:73`: “Shared or interpreted context silently claims input you meant literally.”; `:90`: “Evidence you believe exists, and never checked, is not evidence.” |

The deterministic expected sets are G-1/G-2 and P-23/P-24. Explicitly non-intersecting mentions are allowed; listing an excluded id as a hit is not. The copy check compares the report against the pristine registry entries and rejects any four consecutive copied source lines, including Markdown-stripped or reflowed copies.

Read pointers may use a single line, an inclusive line range, a line-count window, or a named registry section/entry. A line range must reach the cited entry; a bare filename or an unrelated line is not enough.
