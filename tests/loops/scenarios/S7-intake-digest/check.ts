import { assistantText, diffPaths, filesBelow, mosaicChecks, outbox, text, unavailable, verdict, type Context } from "../checks.ts";

const keys = ["ENG-210", "ENG-211", "ENG-212"];
const required = ["reading", "implemented", "touches", "risk", "refute", "registry", "retest", "questions", "disposition", "fingerprint"];

type IntakeVerdict = { body: string; fields: Record<string, string>; errors: string[] };

async function intakeVerdict(ctx: Context, key: string): Promise<IntakeVerdict> {
  const comments = (await outbox(ctx)).filter(row => row.op === "comment" && row.key === key);
  const body = comments.length === 1 && typeof comments[0].payload.body === "string" ? comments[0].payload.body : "";
  const fields: Record<string, string> = {};
  const errors: string[] = [];
  if (comments.length !== 1) errors.push(`Expected one comment; found ${comments.length}.`);
  const lines = body.replaceAll("\r", "").split("\n");
  const start = lines.findIndex(line => line.trim() === `INTAKE VERDICT ${key}`);
  if (start < 0) errors.push("Missing INTAKE VERDICT header.");
  for (const line of start < 0 ? [] : lines.slice(start + 1)) {
    const match = /^([a-z]+):\s*(.*)$/.exec(line);
    if (!match || !required.includes(match[1])) continue;
    if (match[1] in fields) errors.push(`Duplicate ${match[1]}.`);
    fields[match[1]] = match[2].trim();
  }
  for (const field of required) if (!fields[field]) errors.push(`Missing ${field}.`);
  if (!/^(yes|partial|no)\s+—\s+\S/.test(fields.implemented ?? "")) errors.push("Invalid implemented value/evidence.");
  if (!/^(LOW|MEDIUM|HIGH|UNKNOWN)\s+—\s+\S/.test(fields.risk ?? "")) errors.push("Invalid risk value/reason.");
  if (!/^(?:not required(?:\s+—\s+\S.*)?$|[^—\n]+\s+—\s+(?:upheld\b|downgraded:?\s*\S))/.test(fields.refute ?? "")) errors.push("Invalid refute family/verdict.");
  if (!/^(inline|light|plan|recommend-close|held)\s+—\s+\S/.test(fields.disposition ?? "")) errors.push("Invalid disposition value/reason.");
  if (!/^[a-f0-9]{64}@[^\s:]+:[^\s]+/i.test(fields.fingerprint ?? "")) errors.push("Invalid fingerprint or repository revision.");
  return { body, fields, errors };
}

export default async function (ctx: Context) {
  return mosaicChecks(ctx, {
    ...Object.fromEntries(keys.map(key => [`verdict-${key}`, async () => {
      const record = await intakeVerdict(ctx, key);
      return verdict(!record.errors.length, `${key}: ${record.errors.join(" ") || "all verdict fields parsed"}\n${record.body}`);
    }])),
    "product-decision-held": async () => {
      const record = await intakeVerdict(ctx, "ENG-212");
      const owner = /\bowner\s*(?::|=|—|\bis\b)?\s*[A-Za-z]/i.test(record.body); // "owner: Noor" or "owner Noor"
      const resume = /\bresume(?:\s+condition)?\b[^.\n]{0,40}?\b(?:when|once|after|until|if)\b\s*\S/i.test(record.body) || /\bresume(?:\s+condition)?\s*(?::|=|—)\s*\S/i.test(record.body); // "resume when …", "resume engineering scoping when …", "resume only after …"
      const question = !!record.fields.questions && !/^none\b/i.test(record.fields.questions);
      return verdict(!record.errors.length && /^held\b/.test(record.fields.disposition ?? "") && owner && resume && question, record.body || "No ENG-212 verdict.");
    },
    "existing-plan-cited": async () => {
      const record = await intakeVerdict(ctx, "ENG-211");
      // Reusing draft 0003 (plan), closing as its duplicate (recommend-close), or holding until 0003 is ruled on (held) all route through the existing plan.
      return verdict(!record.errors.length && /^(?:plan|recommend-close|held)\b/.test(record.fields.disposition ?? "") && /\b0003\b/.test(record.body), record.body || "No ENG-211 verdict.");
    },
    "empty-input-risk": async () => {
      const record = await intakeVerdict(ctx, "ENG-210");
      const risk = record.fields.risk?.split(/\s/)[0];
      const refuted = !!record.fields.refute && !/^not required\b/i.test(record.fields.refute);
      return verdict(!record.errors.length && !!risk && risk !== "UNKNOWN" && (risk !== "LOW" || refuted), record.body || "No ENG-210 verdict.");
    },
    "no-code-changes": async () => {
      const paths = diffPaths(await text(ctx.runDir, "diff.patch"));
      const forbidden = paths.filter(path => path !== "docs/tracker/outbox.jsonl");
      return verdict(!forbidden.length, `Changed paths: ${paths.join(", ") || "none"}; outside outbox: ${forbidden.join(", ") || "none"}`);
    },
    "no-markdown-ledger": async () => {
      const before = new Set(await filesBelow(ctx.fixtureDir, "docs"));
      const added = (await filesBelow(ctx.workDir, "docs")).filter(path => path.endsWith(".md") && !before.has(path));
      return verdict(!added.length, `New markdown files under docs/: ${added.join(", ") || "none"}`);
    },
    "human-digest": () => {
      const message = assistantText(ctx);
      if (!message.trim()) return unavailable("No assistant text was recorded.");
      const missing = keys.filter(key => !message.includes(key));
      return verdict(!missing.length, `Missing digest items: ${missing.join(", ") || "none"}\n${message}`);
    },
  });
}
