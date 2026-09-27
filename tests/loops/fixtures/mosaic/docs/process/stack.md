---
description: "Find the member stack and the repo root used by its test command."
---
Read when: selecting a command for a member task or plan verification.
# Member stack
| Repo | Stack | Command and working directory |
|---|---|---|
| `member-a` | Python standard-library CSV/IO export API, uv, pytest | `uv run pytest <file…>` from `member-a/`; export coverage is `tests/test_api.py` |
For targeted tests and allowed scope during execution and review, read [targeted-tests](targeted-tests.md) (loaded automatically inside executor and reviewer agents; the main session reads the file); for final verification and durable output, read `rule://verification`.
