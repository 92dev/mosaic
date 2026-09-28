---
name: mosaic-kit
description: "Maintain the installed kit: recorded text adaptations, project harness additions, model roles, or upgrades."
---
# Maintain the kit
Invoke `/mosaic-kit <intended change>` only for explicitly requested kit maintenance, not ordinary project implementation.

0. Read `docs/kit/maintenance.md`, then read `rule://records` before any governed edit. This reference is the only installed home for kit-maintenance knowledge; do not preload it during ordinary project work.
1. State the intended change and classify it as **kit text adaptation**, **project harness addition**, **model roles**, or **upgrade**. Identify affected files and preserve the existing project behavior outside that scope. If the request changes authority or scope, obtain the human's ruling first.
2. Create `kit/<slug>` in the repository that owns the installed kit. Keep unrelated work intact; do not commit or land on the default branch.
3. Follow the matching procedure in the reference. Make behavior-equivalent changes in both runtimes using their documented idioms; update the authoritative source rather than a generated copy. Preserve project conventions and existing adaptation records.
4. From the installed project root, run `bun tools/doctor.ts`, the **current runtime's** lint hook from the reference on each touched governed record, and `bun tools/checkup.ts`. Exercise changed behavior. Route unrelated pre-existing findings without expanding the change, and report incomplete evaluation as such. When building mosaic itself, run these against a rendered scratch install and regenerate/check the fixtures as the reference directs.
5. Update the adaptation record under the Ownership policy in `docs/kit/maintenance.md`; for upgrades, verify it using that reference's baseline-diff procedure.
6. Read `rule://human-gates`. Present a brief of at most 20 lines: intended effect, classification and files, checks with observable results, adaptation record, remaining findings, and the exact human decision needed. Stop for the human; do not merge, land, or silently change the requested scope.
