---
description: "Read the record rules before a governed edit and preserve schema, records, triggers, and provenance."
scope: "tool:edit(docs/gaps.md), tool:write(docs/gaps.md), tool:edit(docs/gaps/**), tool:write(docs/gaps/**), tool:edit(docs/gaps-archive.md), tool:write(docs/gaps-archive.md), tool:edit(**/docs/plans/README.md), tool:write(**/docs/plans/README.md), tool:edit(docs/architecture/pitfalls.md), tool:write(docs/architecture/pitfalls.md), tool:edit(**/docs/pitfalls.md), tool:write(**/docs/pitfalls.md), tool:edit(docs/architecture/README.md), tool:edit(docs/architecture/decisions-archive.md), tool:write(docs/architecture/decisions-archive.md), tool:edit(.omp/**), tool:write(.omp/**), tool:edit(.claude/**), tool:write(.claude/**), tool:edit(docs/process/**), tool:write(docs/process/**)"
condition: ".*"
interruptMode: tool-only
---
Read when: editing a governed record.
You are editing a governed record. Before continuing:
- Read `rule://records` if you have not this session; apply its schema, sole-record, condition, provenance, and reconciliation rules; a process file (rule, skill, agent, hook, tool) is edited only as its own planned work (rule 6).
