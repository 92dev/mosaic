---
affinity: member-a
contracts: [export_rows]
---
# Export API

Area affinity: member-a. Implementation: `member-a/member_a/api.py`.

### D1 — CSV is the default export format

**Context:** Existing callers pass rows without specifying a format and consume a CSV document.

**Decision:** `export_rows(rows, fmt="csv")` defaults to CSV. Non-empty CSV uses the first row's key order for the header and Python's CSV quoting rules.

**Rejected:** Changing the default to a new format would silently change existing callers' documents. Requiring an explicit format would break their call signature.

**Implications:** A second format must be opt-in; tests must keep proving that an omitted `fmt` still produces CSV.

### D2 — Empty input returns an empty document

**Context:** An empty row set is a valid export, including a request with an empty body. There is no row from which to infer column names.

**Decision:** Exports never raise on empty input; return an empty document. For CSV, `export_rows([])` returns `""`.

**Rejected:** Indexing the first row before checking emptiness causes an `IndexError` instead of an export. Inventing a header fabricates a schema the caller did not supply.

**Implications:** The minimum-arity case needs an unskipped test. The current first-row lookup violates this decision; [plan 0002](../../member-a/docs/plans/0002-empty-export-handling.md) records the unresolved defect.
