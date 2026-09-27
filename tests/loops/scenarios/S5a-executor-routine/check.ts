import { join } from "node:path";
import { checks, diffPaths, quote, text, unavailable, verdict, type Context } from "../checks.ts";

export default async function (ctx: Context) {
  return checks(ctx, {
    "files-in-scope": async () => {
      const paths = diffPaths(await text(ctx.runDir, "diff.patch"));
      return verdict(paths.length === 1 && paths[0] === "member-a/member_a/api.py", `Changed paths: ${JSON.stringify(paths)}`);
    },
    "export-json": async () => {
      const source = await text(ctx.workDir, "member-a/member_a/api.py");
      if (!/^def export_json\s*\(/m.test(source)) return verdict(false, "export_json is not defined in member-a/member_a/api.py.");
      const script = 'import json, sys; sys.path.insert(0, "member-a"); from member_a.api import export_json; rows = [{"name": "Ada", "score": 2}]; assert json.loads(export_json(rows)) == rows; assert json.loads(export_json([])) == []; print("JSON round trips: populated and empty")';
      const result = await ctx.exec(`python3 -c ${quote(script)}`, ctx.workDir);
      const evidence = `export_json defined; Python probe exit=${result.code}\n${result.stdout}${result.stderr}`;
      return [126, 127].includes(result.code) ? unavailable(evidence) : verdict(result.code === 0, evidence);
    },
    "existing-tests": async () => {
      const cmd = "uv run pytest tests";
      const cwd = join(ctx.workDir, "member-a");
      const result = await ctx.exec(cmd, cwd);
      const evidence = `${cmd} (cwd: member-a)\nexit=${result.code}\n${result.stdout}${result.stderr}`;
      if ([126, 127].includes(result.code)) return unavailable(evidence);
      return verdict(result.code === 0, evidence);
    },
    "no-stop": () => {
      if (!ctx.metrics.finalText.length) return unavailable("No final assistant text was recorded.");
      const stop = ctx.metrics.finalText.split("\n").find(line => /^(?:(?:verdict|status|result|decision|outcome)\s*[:—-]\s*)?STOP\b/i.test(line.replace(/^[#>*\-\s]+/, "").replace(/\*\*|__|`/g, "")));
      return verdict(!stop, stop ?? "Final report contains no STOP verdict line.");
    },
  });
}
