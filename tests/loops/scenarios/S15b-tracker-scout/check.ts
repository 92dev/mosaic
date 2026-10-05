import { mosaicChecks, verdict, type Context } from "../checks.ts";

// items.json:3,7-8,17,20: ENG-201, "state": "executing", "assignee": "dana",
// "areas": ["member-a/member_a/api.py", "contract:export_rows"],
// "lastEvent": {"event": "executing", "ts": "2026-09-16T00:00:00.000Z"}.
// items.json:55-66,74-85,92-103: ENG-210/211/212 are triage, member-a, "managed": null.
// tracker.ts:252: "An active item on the same repo with no declared areas (no managed
// block, or an empty areas list) cannot be ruled out: reported with scope \"unknown\"."
const unknownKeys = ["ENG-210", "ENG-211", "ENG-212"];
// ENG-202 has "areas": ["member-a/member_a/cli.py"] (items.json:43): a sibling, not an overlap.
// ENG-190 has "state": "done" (items.json:114): terminal items are filtered by tracker.ts:253.
const excluded = /\b(?:not\s+(?:relevant|intersecting|matched|an?\s+(?:hit|match|intersection|overlap))|non[-\s]intersecting|unrelated|out(?:side| of)\s+(?:the\s+)?scope|excluded|omit(?:ted|s)?|does(?:n't| not)\s+(?:intersect|overlap)|no\s+(?:intersection|overlap|match))\b/i;
const unknownScope = /\b(?:unknown[-\s]+scope|scope\s*(?:[:=—-]|is)?\s*unknown|undeclared(?:[-\s]+scope)?|no\s+(?:(?:managed|declared)\s+)?(?:areas?|scope)|areas?\s*(?:[:=—-]|is|are)?\s*(?:none(?:\s+declared)?|unknown))\b/i;

function report(ctx: Context): string {
  const value = ctx.metrics?.finalText;
  if (typeof value !== "string" || !value.trim()) throw new Error("No final scout report was recorded.");
  return value.trim();
}

function rows(value: string) {
  const result: { key: string; content: string; section: string }[] = [];
  let section = "";
  let current: { key: string; content: string; section: string }[] = [];
  for (const raw of value.split(/\r?\n/)) {
    const line = raw.replace(/\*\*|__|[`"]/g, "");
    const keys = [...new Set(line.match(/\bENG-\d+\b/g) ?? [])];
    if (keys.length) {
      current = keys.map(key => ({ key, content: line, section }));
      result.push(...current);
    } else if (/^\s*#{1,6}\s/.test(line) || /:\s*$/.test(line) || /^\s*\*\*.+\*\*(?:\s*\(.*\))?\s*$/.test(raw)
      // A section opener may run on into prose: "Unknown scope. These items are unmanaged…".
      || /^(?:active\s+but\s+)?(?:unknown[-\s]+scope|declared(?:[-\s]+(?:scope|hits|intersections?))?|not\s+(?:intersecting|matched)|excluded|historical)\b/i.test(line.trim())) {
      section = line;
      current = [];
    } else if (!line.trim()) current = [];
    else for (const row of current) row.content += `\n${line}`;
  }
  return result;
}

export default async function (ctx: Context) {
  return mosaicChecks(ctx, {
    "declared-hit": () => {
      const hits = rows(report(ctx)).filter(row => row.key === "ENG-201");
      // A heading naming both kinds ("declared intersections and unknown-scope matches:") does not reclassify its rows.
      const found = hits.some(row => /\bdana\b/i.test(row.content) && /\bexecuting\b/i.test(row.content)
        && !excluded.test(row.content) && !excluded.test(row.section) && !unknownScope.test(row.content)
        && !(unknownScope.test(row.section) && !/\bdeclared\b/i.test(row.section))
        && [...row.content.matchAll(/\b(?:stale(?:ness)?|age)\s*(?:[:=]|is)?\s*(\d+(?:\.\d+)?)\s*(?:days?\b|d\b|(?=[,;|)}\]—]|$))|(?<![-\w.])(\d+(?:\.\d+)?)\s*(?:days?|d)\s+(?:stale|old|ago)\b|\(\s*(\d+(?:\.\d+)?)\s*d(?:ays?)?\s*\)/gi)]
          .some(match => Number(match[1] ?? match[2] ?? match[3]) >= 9));
      return verdict(found, hits.map(row => row.content).join("\n") || "ENG-201 with dana/executing/stale ≥9d is absent.");
    },
    "unknown-scope-listed": () => {
      const inventory = rows(report(ctx));
      const missing = unknownKeys.filter(key => !inventory.some(row => row.key === key
        && unknownScope.test(`${row.section}\n${row.content}`) && !excluded.test(row.content)));
      return verdict(!missing.length, `Unknown-scope items required: ${unknownKeys.join(", ")}; missing/undeclared label absent: ${missing.join(", ") || "none"}.`);
    },
    "no-false-hit": () => {
      const falseHits = rows(report(ctx)).filter(row => {
        if (row.key === "ENG-202") return !excluded.test(row.content) && !excluded.test(row.section);
        if (row.key !== "ENG-190") return false;
        const context = `${row.section}\n${row.content}`;
        const positive = context.replace(/\b(?:not|no longer)\s+active\b|\bnon[-\s]active\b/gi, "");
        if (/\bactive\b/i.test(positive)) return true;
        return !/\b(?:done|closed|completed|historical|terminal|inactive|omitted)\b|\b(?:not|no longer)\s+active\b/i.test(context)
          && !excluded.test(context);
      });
      return verdict(!falseHits.length, falseHits.map(row => row.content).join("\n") || "ENG-202 is not a hit and ENG-190 is not active.");
    },
    "inventory-complete": () => {
      // tracker.ts:246 emits the list trailer: json({ complete: true });
      const statements = report(ctx).replace(/\*\*|__|[`"]/g, "").split(/\r?\n/)
        .filter(line => /\binventory\b|\bcomplete\s*[:=]|^\s*complete\b/i.test(line));
      const positive = statements.some(line => /\bcomplete\s*[:=]\s*true\b|\binventory(?:\s+(?:is|was))?\s*[:—-]?\s*complete\b|\bcomplete\s+inventory\b|^\s*complete(?:\s*[,—-]|\s*$)/i.test(line));
      const negative = statements.some(line => /\b(?:incomplete|unavailable|not\s+complete|partial|complete\s*[:=]\s*false)\b/i.test(line));
      return verdict(positive && !negative, statements.join("\n") || "No positive inventory completeness statement.");
    },
    "no-judgment": () => {
      // .omp/agents/tracker-scout.md:18:
      // "Role: Scouts never judge; report evidence for the caller to decide."
      const advice = report(ctx).split(/\r?\n/).filter(line => {
        // "not a recommendation on whether work may proceed" disclaims judgment rather than giving it.
        const content = line.replace(/\bmanaged\s+blocks?\b/gi, "").replace(/\bnot\s+an?\s+(?:recommendation|advice|judg(?:e)?ment|ruling)\b[^.;]*/gi, "");
        return /\b(?:recommend(?:ed|s|ation)?|advis(?:e|ed|es)|blocks|blocking|blockers?)\b|\b(?:should|must|ought\s+to|need(?:s)?\s+to)\s+(?:\w+\s+){0,2}(?:coordinate|contact|wait|pause|hold|defer|proceed|resolve|stop)\b|\b(?:safe|clear|free|ready|allowed)\s+to\s+proceed\b|\b(?:can|may)\s+proceed\b/i.test(content)
          || /(?:^|[.!?]\s+)\s*(?:[-*]\s+)?(?:please\s+)?(?:coordinate|contact|wait|pause|hold|defer|stop|proceed)\b/i.test(content);
      });
      return verdict(!advice.length, advice.join("\n") || "No collision judgment or recommendation language found.");
    },
    length: () => {
      const count = report(ctx).split(/\r?\n/).length;
      return verdict(count <= 30, `Final scout report: ${count} lines (maximum 30).`);
    },
  });
}
