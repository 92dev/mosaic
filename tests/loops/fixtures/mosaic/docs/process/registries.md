---
description: "Use scoped scouts to select records and code context; challengers retain independent pitfall coverage."
---
Read when: checking a proposal, selecting obligations, reviewing changes, or entering an unfamiliar code/doc area.
# Read only the relevant context
- Never preload gaps (including `docs/gaps/`), pitfalls, ledgers, or plan documents into the main session for safety.
- When a check needs these records, dispatch `registry-scout` with the change's scope; it returns intersecting entries as identifier + one line + where to read the full entry. Exception: for a one- or two-entry registry intake, a bounded direct read of the destination file (grep for the subject, read the hits) replaces the scout; mechanical edits need no check at all (`rule://plan-triage`).
- Read every flagged entry in full and act on it; address or explicitly defer it with a cited reason. The scout filters relevance; the orchestrator makes the decision.
- Check proposals against the architecture entry's recorded decisions and pitfalls; read `skill://mosaic-plan` for handling a flagged trap or obligation during planning.
- For an unfamiliar scoped code/doc area, dispatch `context-scout`; its report explains concepts and quotes the few excerpts needed for the work, with pointers for deeper reads.
- Challenger agents (plan-adversary and reviewers) read the pitfalls catalog whole as an independent backstop; the main session's scoped reading does not replace their check.
- The small orientation set remains the entrypoint, [index](../index.md), and [architecture entry](../architecture/README.md); none requires loading every linked record.
## Frozen project history
Archived history lives under `docs/archived/<original path>`, `docs/plans/archived/`, `docs/gaps-archive.md`, `docs/architecture/pitfalls-archive.md`, `docs/architecture/decisions-archive.md`, and `docs/architecture/archived/` (retired decision sections); its mutability follows `rule://records`, and active links into it remain valid.
On request or when active docs lack a subject, scouts may consult it for old decisions; report historical hits separately as `archived: <path>`, never as current status.
