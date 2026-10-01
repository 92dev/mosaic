#!/usr/bin/env bash
set -euo pipefail

project_dir=${CLAUDE_PROJECT_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)}
project_dir=${project_dir%/}
if command -v jq >/dev/null 2>&1; then
  json_tool=jq
  file_path=$(jq -r '.tool_input.file_path // empty') || exit 0
else
  json_tool=python3
  file_path=$(python3 -c 'import json, sys; print(json.load(sys.stdin).get("tool_input", {}).get("file_path") or "")') || exit 0
fi

file_path=${file_path#"$project_dir"/}
[[ $file_path != /* ]] || exit 0
while [[ $file_path == ./* ]]; do file_path=${file_path#./}; done

governed_globs=(
  "docs/gaps.md"
  "docs/gaps/**"
  "docs/gaps-archive.md"
  "**/docs/plans/README.md"
  "docs/architecture/pitfalls.md"
  "**/docs/pitfalls.md"
  "docs/architecture/README.md"
  ".omp/**"
  ".claude/**"
  "docs/process/**"
)
for pattern in "${governed_globs[@]}"; do
  if [[ $file_path == $pattern || ( $pattern == '**/'* && $file_path == ${pattern#'**/'} ) ]]; then
    guard_file="$project_dir/.claude/rules/records-guard.md"
    if [[ $json_tool == jq ]]; then
      exec jq -cn --rawfile guard "$guard_file" '{hookSpecificOutput: {hookEventName: "PreToolUse", additionalContext: ($guard | sub("^---\n.*?\n---\n"; ""; "ms"))}}'
    fi
    exec python3 -c 'import json, pathlib, sys; body = pathlib.Path(sys.argv[1]).read_text().split("---\n", 2)[2]; print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "additionalContext": body}}))' "$guard_file"
  fi
done
exit 0
