#!/usr/bin/env bash
set -euo pipefail

# Baseline has no tracker plane; its checks report CANNOT-EVALUATE.
[[ -f tools/tracker.ts ]] || exit 0
bun - <<'TS'
const file = Bun.file("docs/tracker/items.json");
const items = await file.json();
if (!Array.isArray(items)) throw new Error("Tracker seed must be an item array.");
const item = items.find(item => item.key === "ENG-201");
if (!item?.managed || typeof item.body !== "string") throw new Error("Missing managed ENG-201 seed.");
item.managed.writer = "w-dana#7";
item.body = item.body.replace(/(^writer: )[^\n]+/m, "$1w-dana#7");
await Bun.write(file, JSON.stringify(items, null, 2) + "\n");
TS
git add -- docs/tracker/items.json
if ! git diff --cached --quiet; then
  git commit -qm 'S8: seed foreign tracker writer generation'
  git push -qu origin main
fi
printf 'S8 ready: ENG-201 writer=w-dana#7; owner=dana; state=executing\n'
# MCP variant: seed the mock store from the (possibly mutated) replay seed so both providers see the same inventory.
bun tools/mcp/linear-mock.ts --seed-from docs/tracker/items.json --store docs/tracker/linear-mock.json
git add -A docs/tracker && git -c user.name=fixture -c user.email=fixture@example.com commit -qm 'S10m: seed mock tracker store' && git push -q origin main
