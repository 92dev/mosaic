---
description: "Run only tests covering the changed files during execution and review."
alwaysApply: true
agents: [executor, "*-reviewer", reviewer]
---
Read when: executing a task or reviewing its changes.
# Targeted tests
- Never run a full or package-wide suite inside the execute/review loop.
- Read `rule://stack` for the applicable command and working directory, then run only the tests covering the touched files.
- Find the affected set from colocated or module-named tests, then search the test tree for touched symbols and testids; use `context-scout` if it remains unclear.
- If coverage remains unclear, name the unresolved set in the report; do not widen the run.
- Whole-suite verification belongs to the orchestrator once at the end.
