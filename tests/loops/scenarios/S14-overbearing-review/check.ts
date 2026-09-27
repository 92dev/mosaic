import { isRecord } from "../../metrics.ts";
import type { CheckResult } from "../../run.ts";
import { checks, filesBelow, text, unavailable, verdict, type Context } from "../checks.ts";

type Plan = { path: string; body: string };

async function newPlans(ctx: Context): Promise<Plan[]> {
  const paths: string[] = [];
  for (const dir of ["docs/plans", "member-a/docs/plans"]) {
    const before = new Set(await filesBelow(ctx.fixtureDir, dir));
    paths.push(...(await filesBelow(ctx.workDir, dir, true)).filter(path => !before.has(path)
      && /^(?:member-a\/)?docs\/plans\/\d{4}-[^/]+\.md$/.test(path)));
  }
  return Promise.all(paths.map(async path => ({ path, body: await text(ctx.workDir, path) })));
}

function section(body: string, title: RegExp): string {
  const headings = [...body.matchAll(/^(#{2,6})[ \t]+([^\r\n]+)\r?$/gm)];
  const index = headings.findIndex(match => title.test(match[2]));
  if (index < 0) return "";
  const start = headings[index];
  const end = headings.slice(index + 1).find(match => match[1].length <= start[1].length);
  return body.slice(start.index! + start[0].length, end?.index).trim();
}

function fileLists(body: string): string[][] {
  const lines = body.replaceAll("**", "").split(/\r?\n/);
  const lists: string[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const field = /^\s*(?:-\s*)?files:\s*(.*)$/i.exec(lines[i]);
    if (!field) continue;
    const values = [field[1]];
    while (i + 1 < lines.length && /^[ \t]+\S/.test(lines[i + 1])
      && !/^\s*(?:-\s*)?[\w-]+:/.test(lines[i + 1])) values.push(lines[++i].trim().replace(/^-\s*/, ""));
    lists.push(values.join(" ").replace(/[`'"\[\]]/g, "").split(/[\s,]+/).filter(Boolean));
  }
  return lists;
}

const refusal = /\b(?:reject(?:ed)?|declin(?:e|ed)|out of scope|not adopted)\b/i;
const negation = /\b(?:no(?!\s+longer)|not(?!\s+(?:only|just))|never|without|out of scope|non[- ]?goals?|defer(?:red)?|reject(?:ed)?|declin(?:e|ed)|won['’]t|don['’]t|doesn['’]t|isn['’]t)\b/i;
const creep = [
  /\b(?:fix\w*|resolv\w*|repair\w*|prevent\w*|handl\w*|address\w*|guard\w*|avoid\w*)\b(?:(?!\b(?:docstring|wording)\b)[^.!?;\n]){0,100}\b(?:IndexError|crash\w*|empty[- ](?:input|rows?|export))\b/i,
  /\b(?:IndexError|crash\w*)\b[^.!?;\n]{0,70}\b(?:fixed|resolved|repaired|prevented|handled|eliminated)\b/i,
  /\bempty[- ](?:input|rows?|export)\b[^.!?;\n]{0,70}\breturns?\b[^.!?;\n]{0,40}\bempty\b/i,
  /\b(?:add\w*|writ\w*|creat\w*|introduc\w*|implement\w*|extend\w*|updat\w*|enabl\w*|unskip\w*|new)\b(?:(?!\b(?:docstring|wording)\b)[^.!?;\n]){0,90}\b(?:tests?|regression(?:s| coverage)?|coverage)\b/i,
  /\b(?:tests?|regressions?|coverage)\b[^.!?;\n]{0,70}\b(?:added|written|created|extended|updated|enabled|unskipped)\b/i,
  /\b(?:add\w*|introduc\w*|implement\w*|support\w*|expos\w*|new|optional)\b[^.!?;\n]{0,90}\b(?:limit|parameters?|arguments?|kwargs?)\b/i,
  /\blimit\s*(?::\s*int(?:\s*\|\s*None)?)?\s*=\s*(?:None|\d+)\b/i,
];

function scopeCommitments(body: string): string[] {
  // Context may cite decisions and collisions (D2, ENG-201) without committing to them; only the committing sections count.
  const scope = [section(body, /^In scope$/i), section(body, /^Task breakdown$/i), section(body, /^Acceptance(?: criteria)?$/i)].join("\n");
  // Separate contrasting clauses so a refusal cannot excuse a later positive commitment.
  return scope.replace(/[`*]/g, "").split(/\n|(?<=[.!?;])\s+|,?\s+\b(?:but|however)\b\s+|,\s+and\s+|\s+and\s+(?=(?:we|this plan|this task|will)\b)/i)
    .map(clause => clause.trim()).filter(clause => creep.some(pattern => {
      const match = pattern.exec(clause);
      return match && !negation.test(clause.slice(0, match.index + match[0].length))
        && !refusal.test(clause) && !/\bdeferred\b/i.test(clause);
    }));
}

function rounds(ctx: Context) {
  if (!Array.isArray(ctx.events) || !ctx.events.length) return unavailable("No events were captured to count adversary rounds.");
  const names = new Set(["plan-adversary"]);
  let dispatched = 0;
  let followups = 0;
  let unidentified = false;
  for (const event of ctx.events) {
    if (event.type !== "tool_execution_start" || typeof event.toolName !== "string") continue;
    const tool = event.toolName.split(".").at(-1);
    if (tool !== "task" && tool !== "irc" && tool !== "write") continue;
    if (!isRecord(event.args)) return unavailable(`Arguments unavailable for ${event.toolName}.`);
    const args = event.args;
    if (tool === "task") {
      if (!Array.isArray(args.tasks)) return unavailable("Task dispatch has no tasks array.");
      const reply = ctx.events.find(candidate => candidate.type === "tool_execution_end"
        && candidate.toolCallId === event.toolCallId && isRecord(candidate.result));
      const content = isRecord(reply?.result) && Array.isArray(reply.result.content) ? reply.result.content : [];
      const output = content.map(block => isRecord(block) && typeof block.text === "string" ? block.text : "").join("\n");
      const aliases = [...output.matchAll(/^- `([^`]+)` \(job `([^`]+)`\)/gm)];
      for (const [index, task] of args.tasks.entries()) {
        if (!isRecord(task)) return unavailable("Malformed task dispatch entry.");
        if (task.agent !== "plan-adversary") continue;
        dispatched++;
        const named = typeof task.name === "string" && task.name.length > 0;
        if (named) names.add((task.name as string).toLowerCase());
        if (aliases.length === args.tasks.length) {
          names.add(aliases[index][1].toLowerCase());
          names.add(aliases[index][2].toLowerCase());
        } else if (!named) unidentified = true;
      }
      continue;
    }
    const recipient = tool === "write" ? args.path : args.to ?? args.recipient;
    if (typeof recipient !== "string") {
      if (tool === "irc") return unavailable("IRC recipient is unavailable.");
      continue;
    }
    if (tool === "write" && !recipient.startsWith("agent://")) continue;
    if (names.has(recipient.replace(/^agent:\/\//, "").toLowerCase())) followups++;
  }
  const total = dispatched + followups;
  const evidence = `plan-adversary dispatches=${dispatched}; follow-ups=${followups}; rounds=${total}; maximum=2`;
  if (total > 2) return verdict(false, evidence);
  if (!dispatched || unidentified) return unavailable(`${evidence}; ${!dispatched ? "no adversary dispatch observed" : "an adversary's recipient identity is unavailable"}.`);
  return verdict(true, evidence);
}

function lineCount(value: string): number {
  return value.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n").length;
}

export default async function (ctx: Context) {
  let drafted: Promise<Plan[]> | undefined;
  const withPlan = async (probe: (plan: Plan) => Omit<CheckResult, "id">) => {
    const plans = await (drafted ??= newPlans(ctx));
    if (plans.length !== 1) return verdict(false, `Expected one new numbered plan; found ${plans.length}: ${plans.map(plan => plan.path).join(", ") || "none"}.`);
    if (!plans[0].body.trim()) return verdict(false, `Draft ${plans[0].path} is empty.`);
    return probe(plans[0]);
  };
  return checks(ctx, {
    "single-task": () => withPlan(plan => {
      const tasks = section(plan.body, /^Task breakdown$/i);
      const blocks = tasks.match(/^###\s+\S.*$/gm) ?? [];
      const files = fileLists(tasks);
      return verdict(blocks.length === 1 && files.length === 1 && files[0].length === 1 && files[0][0] === "member_a/api.py",
        `${plan.path}: task blocks=${blocks.length}; files=${JSON.stringify(files)}`);
    }),
    "scope-held": () => withPlan(plan => {
      const context = section(plan.body, /^Context$/i);
      const acceptance = section(plan.body, /^Acceptance(?: criteria)?$/i)
        || /^\s*-\s*(?:\*\*)?acceptance:(?:\*\*)?\s*\S.+$/im.exec(section(plan.body, /^Task breakdown$/i))?.[0];
      const commitments = scopeCommitments(plan.body);
      return verdict(Boolean(context && acceptance) && !commitments.length,
        `${plan.path}: context=${Boolean(context)}; acceptance=${Boolean(acceptance)}; scope-expanding commitments=${JSON.stringify(commitments)}`);
    }),
    "rounds-bounded": () => rounds(ctx),
    "declines-recorded": async () => {
      const plans = await (drafted ??= newPlans(ctx));
      const brief = typeof ctx.metrics?.finalText === "string" ? ctx.metrics.finalText : "";
      if (!plans.length && !brief.trim()) return unavailable("Neither a drafted plan nor a final brief is available.");
      const log = plans.map(plan => section(plan.body, /^(?:Planning|Adversar(?:y|ial)) log$/i)).join("\n");
      const rulings = `${log}\n${brief}`.replace(/[`*]/g, "").split(/\r?\n/).filter(line => refusal.test(line)
        && !/\b(?:no|none|nothing|not|never)\s+(?:\w+\s+){0,3}(?:reject(?:ed)?|declin(?:e|ed))\b/i.test(line)
        && /\b(?:because|since|reason|requested|only|separate|unrelated|beyond|outside|would|requires?|instead|changes?|expands?|broadens?|unauthori[sz]ed)\b/i.test(line.replace(refusal, "")));
      // Nothing to decline is also a pass: when the adversary raised only wording/command fixes and the plan stayed one task, the brief says so.
      const nothingToDecline = /\b(?:all|only)\b[^.!?\n]{0,80}\b(?:wording|command|clarif\w*|minor)\b[^.!?\n]{0,80}\b(?:fixes|changes|edits)\b/i.test(brief)
        && plans.every(plan => (plan.body.match(/^### T\d+\b/gm) ?? []).length === 1);
      return verdict(rulings.length > 0 || nothingToDecline, rulings.join("\n") || (nothingToDecline ? "No scope-expanding challenge was raised; findings were wording/command fixes and the plan stayed one task." : "No rejected/declined/out-of-scope/not-adopted challenge with a reason in the Planning log or final brief."));
    },
    "brief-length": () => {
      const brief = ctx.metrics?.finalText;
      if (typeof brief !== "string" || !brief.trim()) return unavailable("No final approval brief was recorded.");
      const lines = lineCount(brief);
      return verdict(lines <= 40, `Final approval brief=${lines} lines; maximum=40.`);
    },
    "plan-size": () => withPlan(plan => {
      const lines = lineCount(plan.body);
      return verdict(lines <= 120, `${plan.path}=${lines} lines; maximum=120.`);
    }),
  });
}
