# mosaic

Modular Orchestration System A.I. Context: an installable assistant harness and a separate rig for
building and evaluating it.

## Using mosaic

Run `/mosaic-install <target>` from an assistant session in this checkout to install and adapt mosaic
to a project. The skill surveys the target, derives its settings, records the migration on
`mosaic/install`, and stops for human sign-off. See [`kit/README.md`](kit/README.md) for prerequisites,
cutoff mode, first use, and later customization with `/mosaic-kit`.

## Building mosaic

[`tests/loops/`](tests/loops/README.md) is the loop rig: scenarios, deterministic checks, rubrics,
fixture setup, and run evidence. `run.ts` copies `fixtures/<harness>/` and runs its setup.
Both `fixtures/mosaic/` and `fixtures/baseline/` are **checked-in generated output**, never
authoring locations:

- Edit `kit/` for product harness changes. `tests/loops/fixtures/baseline-kit/` preserves the
  frozen harness-2026-09-02 baseline, not a second product.
- Edit `tests/loops/fixtures/<harness>.manifest.json` for fixture identity, members, or remotes.
- Edit `tests/loops/fixtures/<harness>-overlay/` for its fake Python member, seeded plans and
  registries, product/architecture examples, and local git setup. Same-path overlay files win
  in full; account for them when changing a kit template they replace.

```sh
bun tests/loops/build-fixture.ts
bun tests/loops/kit-parity.ts
bun tests/kit/tooling-smoke.ts
bun tests/kit/tracker-mcp-smoke.ts
bun tests/loops/run.ts --scenario S1-closeout-triage --harness mosaic \
  --model claude-opus-5-5 --thinking medium --dry-run
bun tests/loops/scoreboard.ts
```

The builder and parity guard select both harnesses by default; use `--harness baseline` or
`--harness mosaic` to select one. The common installer accepts `--kit <dir>` (default `kit/`).
The builder renders into staging and checks the result with mosaic's doctor or the baseline's
own registry linter before replacing the generated fixture. The parity guard rebuilds
independently and rejects byte or symlink-target drift. Dry-runs exercise local setups and
print the model command without starting a model.

The `tests/kit/*` smokes exercise installed-tool boundaries and local replay/MCP tracker behavior
in disposable roots, without model calls. Scenarios under `tests/loops/scenarios/` define prompts,
deterministic checks, and evaluation rubrics; run evidence is kept under `tests/loops/runs/`.
[`SCOREBOARD.md`](tests/loops/SCOREBOARD.md) is generated from those evidence packets by
`scoreboard.ts`, not maintained by hand. See the [rig guide](tests/loops/README.md) for running and
scoring scenarios.

[`docs/ideation/`](docs/ideation/) contains design and experiment records, including the historical
[draft contract](docs/ideation/mosaic-draft-contract.md) and
[real-project migration proof](docs/ideation/2026-09-27-migration-proof.md). The archived harness
directories are reference material, not the product installation source.

## Layout

```text
kit/                         Installable harness and mechanical installer
.omp/skills/mosaic-install/   Checkout-only migration skill; .claude/ has its twin
tests/
  kit/                       Deterministic tooling and tracker smokes
  loops/
    fixtures/                Generated fixtures, source manifests, and overlays
    scenarios/               Prompts, checks, and rubrics
    runs/                    Run evidence (gitignored)
    SCOREBOARD.md            Generated results
docs/ideation/               Design, experiment, and migration records
```
