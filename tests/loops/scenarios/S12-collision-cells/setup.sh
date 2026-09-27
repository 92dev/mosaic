#!/usr/bin/env bash
set -euo pipefail

# Baseline has no tracker plane; its checks report CANNOT-EVALUATE.
[[ -f tools/tracker.ts ]] || exit 0
bun - <<'TS'
const file = Bun.file("docs/tracker/items.json");
const items = await file.json();
if (!Array.isArray(items)) throw new Error("Tracker seed must be an item array.");
if (items.some(item => item.key === "ENG-230")) throw new Error("ENG-230 already exists in the tracker seed.");
const timestamp = "2026-09-24T12:00:00.000Z";
items.push({
  key: "ENG-230",
  id: "2f050be9-41c7-455f-9c35-6f8bdc2de230",
  title: "Clarify member-a package maintenance scope",
  body: "The maintenance request has not been scoped to files or contracts yet. Ask Maya to clarify the affected areas before ruling out overlap.\n\n<!-- mosaic:begin -->\nplan: none\nrepos: member-a\nareas: none\nbranch: none\nwriter: w-maya#1\nlast-event: intent 2026-09-24T12:00:00.000Z\nparked: none\n<!-- mosaic:end -->",
  state: "triage",
  assignee: "maya",
  labels: ["mosaic", "intake"],
  team: "Engineering",
  url: "https://linear.app/fixture/issue/ENG-230",
  updatedAt: timestamp,
  repos: ["member-a"],
  managed: {
    plan: null, repos: ["member-a"], areas: [], branch: {}, writer: "w-maya#1",
    lastEvent: { event: "intent", ts: timestamp }, parked: null,
  },
  comments: [],
  attachments: [],
});
await Bun.write(file, JSON.stringify(items, null, 2) + "\n");
TS
git add -- docs/tracker/items.json
git commit -qm 'S12: seed unknown-scope tracker item'
git push -qu origin main
printf 'S12 ready: ENG-230 state=triage; owner=maya; repos=member-a; areas=[]; existing inventory intact\n'
