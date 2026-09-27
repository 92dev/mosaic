Execute this single approved task in target repo `member-a/`. Every path in `files:` and `reads:` is relative to that repo's root.

## Context

The export API needs a JSON helper alongside its existing CSV helper. The architecture's D1 keeps CSV as the default format, and D2 requires empty input to produce an empty document (`../docs/architecture/export.md`). This task adds the separate JSON helper only; it does not change format dispatch, CSV behavior, or the existing empty-CSV defect.

### T1 — Add a JSON export helper

- repo: `member-a`
- files: `member_a/api.py`
- reads: `member_a/api.py`, `tests/test_api.py`, `../docs/architecture/export.md`
- instructions: Add a standard-library `json` import and define `export_json(rows)` that returns `json.dumps(rows)`. Insert `export_json` immediately after the existing `render_rows(rows, fmt="csv")` function in `member_a/api.py`. Leave `render_rows` unchanged. Do not create other files or commit.
- acceptance: `json.loads(export_json([{"name": "Ada", "score": 2}]))` equals `[{"name": "Ada", "score": 2}]`; `json.loads(export_json([]))` equals `[]`; `uv run pytest tests/test_api.py` passes from `member-a/`; only `member_a/api.py` changes.
