# Product Layer — Features, Flows, Ideation

> One-line scope: the project-level **product/feature layer** — user-facing flows and concepts with
> maturity states, sitting between raw notes and settled architecture.
>
> Precedence: [architecture decisions](../architecture/README.md) take precedence; rank other
> project source materials according to the project's [indexed sources](../index.md).

Architecture docs record
**settled decisions** (D-numbers, rejected alternatives); this layer holds **flows and features that
are still maturing** — with TBDs, open questions, and a status field — until their load-bearing
choices harden into D-numbers.

## Registry

| Doc | What it is |
|---|---|

## The unit: feature docs (F-numbers)

One doc per **flow or feature**, numbered `F-NN` (greppable as `F-01`). Record project-spanning
features here regardless of topology; use an agreed milestone directory when applicable, but no
milestone is required to start a feature doc. Skeleton:

- **Header block**: Status · Actors · Areas touched (repositories or components)
- **Flow** — numbered steps across actors and areas
- **Decisions inherited** — links to the D-numbers this flow builds on
- **Feature-scoped decisions** — small-caliber choices that don't warrant a D-number
- **Open questions** — hoisted to [open-questions.md](../architecture/open-questions.md) when cross-cutting
- **MVP boundary** — explicitly in / out / suspended

### Status lifecycle

```
idea → concept → specced → planned (→ plan NNNN) → shipped
                          ↘ suspended (any time, with reason)
```

- **idea** — named, roughly described, semantics largely undefined
- **concept** — flow drafted end-to-end; open questions enumerated
- **specced** — flow + decisions firm enough to plan against
- **planned** — a plan doc exists; the feature doc links it
- **shipped** — landed; the doc stays as product truth until superseded

## Rules (keep the layers from bleeding)

1. **Architecture wins.** If a feature doc contradicts an architecture doc, that is a signal to
   amend the architecture doc through its normal append-a-decision flow ([extension
   rules](../architecture/README.md)) — never a fork of truth. Record pending contradictions as
   explicit [open questions](../architecture/open-questions.md) until resolved through an architecture decision.
2. **No restating core-behavior rules.** Core behavior lives in the [architecture docs](../architecture/README.md) only. Feature docs
   describe **flows between actors and areas** and *link* into it.
3. **Promotion.** When a feature-level choice constrains other features, append it as the next
   global D-number in the relevant element doc and link it from the feature doc.
   The feature doc keeps the product framing; the element doc keeps the decision.
4. **Homing** mirrors the plans convention ([plan-home](../process/plan-home.md)): project-spanning
   features live here regardless of topology. A member-only product doc may live in that member's
   `docs/product/` with a pointer row in this registry.

## Ingestion exemption — data without action needs no plan

**Introducing product/external notes, concepts, or ideation — changes that add information without
acting on any repo's code or behavior — does NOT constitute its own plan/execution.** The full
plan → approve → execute → review flow applies only when ingestion is **coupled with planning or
implementing an actual change** in a repo.

- **Why:** running the full flow for data-only changes wastes time and money and bloats the master
  ledger without changing code or behavior.
- **How exempt changes land:** still never on `{{DEFAULT_BRANCH}}` (the guard-main hook applies) — use a
  short-lived `docs/<slug>` branch, land rebase-first `--ff-only` as usual. No plan doc, no ledger
  row, no executor/reviewer dispatch; the orchestrator does the work inline with the human directing
  in-session.
- **The line:** the moment ingested material implies *action* (code, automation, or project configuration),
  that action goes through the normal plan flow — referencing the feature doc as context.

Read [plan-triage](../process/plan-triage.md#data-only-ingestion) when selecting the procedure for ingestion or a coupled change.
