Please record both of these texts in the registries, following this repo's rules:

Gap: when member-a adds a second output format, add a round-trip test that parses the emitted document.

P-39: `uv run --project member-a pytest tests` run from the link-repo root reports "file or directory not found: tests" — `uv --project` selects the project but does not change directory, so a test command that looks right silently runs nothing or fails on the wrong path. Always run pytest with the member repo as the working directory (`cd member-a && uv run pytest tests`). Measured 2026-09-24 while wiring the loop rig.

Report where each text was recorded.
