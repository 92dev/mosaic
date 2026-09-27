# Meta Docs — Editing the System's Own Records

> **Read when** editing `docs/workflow.md`, ledgers, registries (gaps / pitfalls),
> harness ports (`.claude/`, `.omp/`), or any doc another doc calls canonical. Not needed for
> code work or for writing ordinary plan/architecture content.

The repo runs on markdown consumed by LLM sessions; these files are load-bearing state, not
prose. Every rule below was earned by a real defect that passed casual reading. Canonical
process stays in
[workflow.md](workflow.md) (§2 frozen archives, §7 meta changes + port mirroring, §8 R1–R8
plan/ledger rules, §10 reading discipline) — this file adds only what lives nowhere else.

## Doc classes — name the class before editing

| Class | Examples | Mutability |
|---|---|---|
| Truth | `architecture/*.md` (D#), `pitfalls.md` (P-x) | Append/amend via recorded decision; never delete rejected alternatives |
| Process | `workflow.md`, skills, agents | Single-homed rules; edits are §7 meta changes, mirrored across ports |
| Registry | plans ledgers, `gaps.md`, `index.md` tables | Fixed row schema; append rows, flip statuses |
| Archive | `plans/archived/`, `gaps-archive.md`, `architecture/source/` | FROZEN — never edited, never repointed (§2) |

## Record types — route before you write

The class table says how a *file* may change; this table says *where a new piece of knowledge
goes*. Misrouting is the classic defect — a settled ruling filed as a "gap" waits forever for a
plan to decide what is already decided.

| You are holding | It is a | Record it as |
|---|---|---|
| A ruling already made (human, or converged debate) — architecture or product | **Decision** | `D#` appended to its element doc, Context → Decision → Rejected → Implications ([extension rules](architecture/README.md)); a plan-local `D-NNNN-n` promotes here when it outlives its plan |
| An obligation with a trigger — "when X happens, do/verify Y", waiting for a future plan | **Gap** | `G-x` in [gaps.md](gaps.md) (promoted at plan close — workflow §6) |
| A trap that looks like a shortcut, plus the reasoning that already closed it | **Pitfall** | `P-x` in [pitfalls.md](architecture/pitfalls.md), terse per rule 7 |
| A genuinely undecided question someone must answer | **Open question** | [open-questions.md](architecture/open-questions.md) |
| A product flow, feature, or raw ideation | **F-doc / product note** | [product/](product/README.md) (data-only ingestion is plan-exempt) |

The routing test: **is it settled?** → Decision. **Does it fire later on a trigger?** → Gap.
**Does it warn off a tempting wrong path?** → Pitfall. None of those → open question or product.
Before appending, grep the target registry — the entry may already exist (rule 5): amend or cite
it instead of minting a duplicate number.

## Rules (each earned by a defect)

1. **Never invent schema.** Match the existing row/entry/header shape exactly; count columns
   before and after. If the shape cannot hold your change, stop — a schema change is its own
   decided change, never a side effect. *(Defect: a ledger edit renamed a column and added
   another.)*
2. **A sole-record row is content, not index.** A row that is the only record of its work
   (docless light-path rows — §8 R3) is never compressed, summarized, or dropped; compression is
   legal only when the full record demonstrably lives at a link the row keeps. *(Defect: docless
   ledger rows lost irrecoverable scope.)*
3. **No blind text-ops across doc trees.** Renames and slug swaps are per-file, reviewed edits;
   after any path change, resolve every inbound link (mind R8's two relative frames). Word
   boundaries lie: `/plan` matches inside `plan-adversary.md`. *(Defect: a regex rename broke the
   adversary charter path in both ports.)*
4. **Canonical sections declare their scope.** A section other files point at states which
   repo(s) and port(s) it governs, and its commands must be correct from every pointing file's
   frame. *(Defect: a "canonical" ritual was written for one repo while two pointed at it.)*
5. **Single-home before writing.** Search for an existing canonical statement first; if it
   exists, add a pointer with a read gate ("read when X") — a second copy is a defect even when
   accurate, because copies drift (§8: "canonical here; other docs summarize and link").
6. **Ports change as a pair.** Any `.claude/` edit lands with its `.omp/` twin in the same change
   (idiom deltas per [AGENTS.md](../AGENTS.md); pairing is by role — `.claude` `reviewer` ↔
   `.omp` `claude-reviewer` + `gpt-reviewer`). Diff the pair before finishing (§7).
7. **Pitfall entries stay terse.** A new P-x is trap + rule + one-line measured cite; extended
   evidence lives in the citing plan/gap, not in the catalog challengers re-read every plan.
8. **Meta-diff review checklist** — for reviewers of any diff touching the classes above:
   class and mutability respected · schema unchanged (or its change is the declared subject) ·
   sole-records intact · every touched link resolves from its own file · ports paired ·
   canonical scope stated.
9. **Provenance lives in commits, not doc bodies.** Dates, who-decided, when-observed, and
   measurement evidence go in the commit message (or the owning run/plan log) — a future session
   cannot act on "when this column appeared"; it only pays for it. Docs carry the current rule;
   git carries its history. Narrow exception: a terse measured cite that stops an LLM from
   "fixing" a counterintuitive rule (the pitfalls pattern, the `updated_at` trap).
10. **A ruling is not recorded until it is routed.** When something with reach beyond the current
    diff gets settled — an in-session human ruling, adversary convergence, a panel verdict — the
    SAME change lands it per the Record-types table above (usually a `D#` amendment). A commit
    message is provenance (rule 9), never the record for a ruling with reach; workflow §2's
    record-on-the-branch covers only choices whose reach ends with that change. *(Defect: a
    session-settled ruling was headed for the gaps registry, and would not have been recorded at
    all without the human intervening.)*
11. **Queryable state is queried, never recorded.** If a fact can be read from the running system —
    what build is deployed, which migrations are applied, who holds a grant, what a live endpoint
    answers — a doc records **how to ask**, never the answer. A recorded answer is stale from the
    next change onward, and it is worse than absent because it reads as current. This is rule 9's
    sibling: 9 keeps *history* out of doc bodies, 11 keeps *present state* out. Registries describe
    their subject (the target, the obligation, the rule); they do not log events against it.
    *(Defects: a grants snapshot in the environment registry went stale within a day of being
    written; the same file's applied-migration figure then sat eight migrations behind reality
    because each deploy appended a dated "X is LIVE" paragraph instead of pointing at the journal.)*

Rule changes to THIS file are themselves §7 meta changes — human-authorized, never accreted
mid-task.
