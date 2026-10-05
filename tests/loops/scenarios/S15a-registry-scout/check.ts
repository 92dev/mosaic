import { checks, entries, text, verdict, type Context } from "../checks.ts";

// docs/gaps.md:26 — "**Trigger:** when `member_a/api.py` gains a second output format."
// G-1 matches the export/API subject even though a row limit does not fire this trigger.
// docs/gaps.md:32 — "**Trigger:** when plan 0002 lands."
// G-2's subject is the skipped test_export_empty in the member-a test file being touched.
const expectedGaps = ["G-1", "G-2"];
// G-3 is excluded: docs/gaps.md:38 — "**Trigger:** when a second member repo is added."
// Neither that trigger nor its cross-repo documentation-link subject intersects the scope.
// pitfalls.md:19-21 — "enumerate the arity boundary (minimum viable N, then N+1)
// and test the minimum FIRST" (P-23).
// pitfalls.md:28-29 — "the full result must survive on the filesystem independently
// of what you print" (P-24). P-31/P-34/P-38 concern other subjects.
const expectedPitfalls = ["P-23"]; // P-24 (evidence capture) is a general verification pitfall, not scope-specific; not required.
const expected = [...expectedGaps, ...expectedPitfalls];
const ids = (value: string) => [...new Set(value.match(/\b[GP]-\d+\b/g) ?? [])];
const plain = (value: string) => value.replace(/[*`_]/g, "");
const excluded = /\b(?:not\s+(?:relevant|intersecting|applicable|matched|an?\s+(?:hit|match|intersection|overlap))|non[-\s]intersecting|unrelated|irrelevant|out(?:side| of)\s+(?:the\s+)?scope|excluded|omit(?:ted|s)?|does(?:n't| not)\s+(?:intersect|apply|overlap)|no\s+(?:intersection|overlap|match|connection)|no\s+named\s+(?:file|area|contract))\b/i;
// "- Plan 0001 — prior art; G-1 and G-3 originate here": ids inside a plan row are provenance, not entries presented as hits.
const mention = (row: { content: string; block: string }) => /^\s*[-*]?\s*Plan\s+\d{4}\b/i.test(plain(row.block)) && !/^\s*[-*]?\s*[GP]-\d+\b/.test(plain(row.content));
const heading = (line: string) => /^\s*#{1,6}\s/.test(line) || /:\s*$/.test(plain(line))
  || /^(?:RELEVANT|NOT INTERSECTING|NOT RELEVANT|EXCLUDED)\s*$/i.test(plain(line).trim());

function report(ctx: Context): string {
  const value = ctx.metrics?.finalText;
  if (typeof value !== "string" || !value.trim()) throw new Error("No final scout report was recorded.");
  return value.trim();
}

function rows(value: string) {
  const lines = value.split(/\r?\n/);
  const result: { ids: string[]; content: string; block: string; section: string; line: number }[] = [];
  let section = "";
  for (let i = 0; i < lines.length; i++) {
    if (!ids(lines[i]).length) {
      if (heading(lines[i])) section = lines[i];
      continue;
    }
    let end = i + 1;
    while (end < lines.length && lines[end].trim() && !ids(lines[end]).length && !heading(lines[end])) end++;
    const block = lines.slice(i, end).join("\n");
    const prefix = lines[i].slice(0, lines[i].search(/\b[GP]-\d+\b/));
    // A rejection of one id must not excuse a different hit later on the same line.
    // Bare ids ("…exist. P-24, P-31, P-34 and P-38 name no file…") share the predicate of the clause that ends their list;
    // bareness is judged on the id's own sentence, so an earlier sentence in the clause keeps its own row.
    const push = (clauseIds: string[], clause: string) => result.push({ ids: clauseIds, content: [clause, ...lines.slice(i + 1, end)].join("\n"),
      block, section: excluded.test(plain(prefix)) ? prefix : section, line: i + 1 });
    let bare: string[] = [];
    let bareText: string[] = [];
    for (const clause of lines[i].split(/(?:;|,)\s*(?=(?:\*\*|`)?[GP]-\d+)/)) {
      const clauseIds = ids(clause);
      if (!clauseIds.length) continue;
      const lastId = clause.search(/\b[GP]-\d+\b(?![\s\S]*\b[GP]-\d+\b)/);
      const boundary = Math.max(...[". ", "! ", "? ", ": "].map(separator => clause.lastIndexOf(separator, lastId)));
      const head = boundary >= 0 ? clause.slice(0, boundary + 1) : "";
      const tail = boundary >= 0 ? clause.slice(boundary + 2) : clause;
      // "The other pitfalls (P-24, P-31, …) have no named file": the words opening a parenthesised list carry no predicate.
      if (!plain(tail).replace(/^[^()]*\((?=\s*[GP]-\d+)/, "").replace(/\b[GP]-\d+\b|\band\b|[\s.()]+/g, "")) {
        if (ids(head).length) push([...new Set([...bare, ...ids(head)])], [...bareText, head].join(", "));
        bare = ids(tail); bareText = [tail];
        continue;
      }
      push([...new Set([...bare, ...clauseIds])], [...bareText, clause].join(", "));
      bare = []; bareText = [];
    }
    if (bare.length) push([...new Set(bare)], bareText.join(", "));
  }
  return result;
}

const normalizeCopy = (value: string) => plain(value)
  .replace(/^\s*(?:>\s*)+|^\s*[-+]\s+/gm, "").replace(/\s+/g, " ").trim();
const slug = (value: string) => plain(value).toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

export default async function (ctx: Context) {
  return checks(ctx, {
    "recall-gaps": () => {
      const found = new Set(ids(report(ctx)));
      const missing = expectedGaps.filter(id => !found.has(id));
      return verdict(!missing.length, `Expected ${expectedGaps.join(", ")}; missing: ${missing.join(", ") || "none"}.`);
    },
    "recall-pitfalls": () => {
      const found = new Set(ids(report(ctx)));
      const missing = expectedPitfalls.filter(id => !found.has(id));
      return verdict(!missing.length, `Expected ${expectedPitfalls.join(", ")}; missing: ${missing.join(", ") || "none"}.`);
    },
    "no-false-hits": () => {
      const falseHits = rows(report(ctx)).flatMap(row => row.ids
        .filter(id => !expected.includes(id) && id !== "P-24" && !excluded.test(plain(row.content)) && !excluded.test(plain(row.section)) && !mention(row)) // P-24 is general (evidence capture): neither required nor false
        .map(id => `${id} at report line ${row.line}: ${row.content}`));
      return verdict(!falseHits.length, falseHits.join("\n") || "No unexpected G/P id is presented as intersecting.");
    },
    "pointers-only": async () => {
      const value = report(ctx);
      const sources = await Promise.all([
        ["docs/gaps.md", "G"], ["docs/architecture/pitfalls.md", "P"],
      ].map(async ([file, prefix]) => ({ file, prefix: prefix as "G" | "P", content: await text(ctx.fixtureDir, file) })));
      const registry = sources.flatMap(source => entries(source.content, source.prefix).map(entry => {
        const start = source.content.slice(0, source.content.indexOf(entry.body)).split("\n").length;
        const lines = entry.body.split(/\r?\n/);
        const headings = source.content.split(/\r?\n/).flatMap(line => /^#{1,6}\s+(.+)$/.exec(line)?.slice(1) ?? []).map(slug);
        return { ...entry, file: source.file, start, end: start + lines.length - 1, lines, headings };
      }));
      if (!sources.every(source => registry.some(entry => entry.file === source.file))) {
        throw new Error("Fixture registry entries are unavailable or unrecognizable.");
      }
      // One read pointer per id anywhere in the report satisfies the agent contract; a second mention (e.g. "plan 0003 declares G-1") need not repeat it.
      // An id named only to say it does not intersect is not a read target, so it needs no pointer.
      const missing: string[] = [];
      const reported = rows(value);
      const pointed = new Set<string>();
      for (const row of reported) {
        for (const id of row.ids) {
          if (pointed.has(id)) continue;
          const entry = registry.find(entry => entry.id === id);
          const pointer = plain(`${row.section}\n${row.block}`);
          const file = entry && entry.file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const linePointer = entry && [...pointer.matchAll(new RegExp(`${file}(?::|#L)(\\d+)(?:([-+])L?(\\d+))?`, "g"))]
            .some(match => {
              const start = Number(match[1]);
              const end = match[3] ? (match[2] === "+" ? start + Number(match[3]) - 1 : Number(match[3])) : start;
              return end >= start && start <= entry.end && end >= entry.start;
            });
          const anchorPointer = entry && [...pointer.matchAll(new RegExp(`${file}#([\\w-]+)`, "gi"))]
            .some(match => match[1].toLowerCase() === id.toLowerCase() || match[1].toLowerCase().startsWith(`${id.toLowerCase()}-`)
              || entry.headings.includes(match[1].toLowerCase()));
          // `docs/gaps.md — “G-1 · …”`, `docs/gaps.md, "Open" → "G-2 · …"`, `docs/gaps.md:23 (G-1, Open section)`:
          // the first registry id named after the file reference is the entry the pointer designates.
          const namedPointer = entry && [...pointer.matchAll(new RegExp(`${file}(?::\\d+(?:-\\d+)?)?(.{0,60})`, "g"))]
            .some(match => /\b[GP]-\d+\b/.exec(match[1])?.[0] === id);
          if (linePointer || anchorPointer || namedPointer) pointed.add(id);
        }
      }
      const presented = new Set(reported.filter(row => !excluded.test(plain(row.content)) && !excluded.test(plain(row.section)) && !mention(row)).flatMap(row => row.ids));
      for (const id of presented) if (!pointed.has(id) && registry.some(entry => entry.id === id)) missing.push(id);
      const normalizedReport = normalizeCopy(value);
      const copied = registry.flatMap(entry => {
        for (let i = 0; i <= entry.lines.length - 4; i++) {
          const sequence = normalizeCopy(entry.lines.slice(i, i + 4).join("\n"));
          if (sequence && normalizedReport.includes(sequence)) return [`${entry.id}: ${entry.file}:${entry.start + i}-${entry.start + i + 3}`];
        }
        return [];
      });
      return verdict(reported.length > 0 && !missing.length && !copied.length,
        `Missing entry pointers (excluded ids exempt): ${missing.join(", ") || (reported.length ? "none" : "no registry ids")}; copied four-line sequences: ${copied.join(", ") || "none"}.`);
    },
    length: () => {
      const count = report(ctx).split(/\r?\n/).length;
      return verdict(count <= 40, `Final scout report: ${count} lines (maximum 40).`);
    },
  });
}
