---
id: F-1
status: live
repos: [member-a]
contracts: [export_rows]
---
# F-1 — CSV export flow

Actors: a caller supplying rows, and the `member-a` export API returning a document.

## Flow

1. The caller supplies row dictionaries to `member_a.api.export_rows` in `member-a`.
2. The API returns a CSV document for non-empty input; the caller saves or sends that document.
3. Empty input currently raises `IndexError` instead of completing the export flow.

## Decisions inherited

[D1 and D2](../architecture/export.md) govern the default format and the required empty-input result. The empty-input correction is pending; no plan has been drafted for it yet.
