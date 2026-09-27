---
description: "Find the {{MULTI_REPO}}member{{/MULTI_REPO}}{{MONOREPO}}component{{/MONOREPO}} stack and the repo root used by its test command."
---
Read when: selecting a command for a {{MULTI_REPO}}member{{/MULTI_REPO}}{{MONOREPO}}component{{/MONOREPO}} task or plan verification.
# {{MULTI_REPO}}Member{{/MULTI_REPO}}{{MONOREPO}}Component{{/MONOREPO}} stack
| {{MULTI_REPO}}Repo{{/MULTI_REPO}}{{MONOREPO}}Path{{/MONOREPO}} | Stack | Command and working directory |
|---|---|---|
{{MEMBERS}}
For targeted tests and allowed scope during execution and review, read [targeted-tests](targeted-tests.md) (loaded automatically inside executor and reviewer agents; the main session reads the file); for final verification and durable output, read `rule://verification`.
