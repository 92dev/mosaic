#!/usr/bin/env bash
set -euo pipefail

# S7 inherits ENG-210/211/212 from the fixture setup; retain that queue unchanged.
# Baseline has no tracker plane; its checks report CANNOT-EVALUATE.
[[ -f tools/tracker.ts ]] || exit 0
bun - <<'TS'
const file = Bun.file("docs/tracker/items.json");
const items = await file.json();
if (!Array.isArray(items)) throw new Error("Tracker seed must be an item array.");
for (const key of ["ENG-210", "ENG-211", "ENG-212"]) {
  if (!items.some(item => item.key === key && item.state === "triage" && item.labels.includes("intake"))) {
    throw new Error(`Missing S7 intake seed ${key}.`);
  }
}
const additions = [
  {
    key: "ENG-214",
    id: "8840e214-4a56-4f84-b0f4-90d5fc014214",
    title: 'Non-empty CSV export already emits the header row first — please close as implemented',
    body: 'A customer asked whether the CSV export puts the column header before the data rows. I checked member-a/member_a/api.py: export_rows writes the header with writer.writeheader() before writer.writerows(rows), so for non-empty input the header row comes first. I propose closing this request as implemented: export_rows([{ "name": "Ada" }]) should return a document whose first line is the header.',
    state: "triage",
    assignee: "lior",
    labels: ["intake", "feature", "area:export"],
    team: "Engineering",
    url: "https://linear.app/fixture/issue/ENG-214",
    updatedAt: "2026-09-24T18:00:00.000Z",
    repos: ["member-a"],
    managed: null,
    comments: [
      { id: "c-214-1", body: "This is a claim that existing behavior already satisfies the request. If the claim is true, close it as implemented only after the required cross-family refutation; if false, keep it open and explain the observed output; do not implement anything during intake.", author: "lior", createdAt: "2026-09-24T18:00:00.000Z" },
    ],
    attachments: [],
  },
  {
    key: "ENG-215",
    id: "b5d8e215-20d4-4cb7-8230-68b6e4741215",
    title: 'README typo: "teh" should be "the"',
    body: 'The introductory sentence in member-a/README.md on main says "A small Python package that exports rows to CSV for teh Fixture harness." Please correct only "teh" to "the". This is cosmetic prose, not an API, schema, authentication, data, or supported-format change. Proposed severity: LOW; the one-word edit is reversible and confined to this member repo.',
    state: "triage",
    assignee: "maya",
    labels: ["intake", "documentation", "area:readme"],
    team: "Engineering",
    url: "https://linear.app/fixture/issue/ENG-215",
    updatedAt: "2026-09-24T18:10:00.000Z",
    repos: ["member-a"],
    managed: null,
    comments: [
      { id: "c-215-1", body: "The proposed retest is to inspect the introductory sentence and the diff: it should read 'for the Fixture harness' and change nothing else. Verify the typo on main and check the LOW criteria independently; if a criterion is not met, explain a raised severity instead of assuming cosmetic means safe.", author: "maya", createdAt: "2026-09-24T18:10:00.000Z" },
    ],
    attachments: [],
  },
];
for (const item of additions) {
  if (items.some(existing => existing.key === item.key)) throw new Error(`Duplicate intake seed ${item.key}.`);
  items.push(item);
}
await Bun.write(file, JSON.stringify(items, null, 2) + "\n");
TS
git add -- docs/tracker/items.json
if ! git diff --cached --quiet; then
  git commit -qm 'S7b: seed implementation claim and cosmetic LOW intake requests'
  git push -qu origin main
fi
printf 'S7b ready: intake=ENG-210,ENG-211,ENG-212,ENG-214,ENG-215; REFUTE triggers=ENG-214 implementation claim,ENG-215 proposed LOW\n'
