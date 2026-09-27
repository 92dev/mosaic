#!/bin/bash
# PostToolUse(Write|Edit) adapter for the port-neutral governed-record validator.
# CLI: 0 valid, 1 schema errors, 2 usage/unreadable. Hook schema errors use exit 2.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
shared="$(CDPATH= cd -- "$(dirname -- "$0")/../../tools" && pwd)/lint-ledgers.ts"

# With an argv path, never wait for a hook payload on stdin.
if [ "$#" -gt 0 ]; then
  exec bun "$shared" "$@"
fi
file_path=$(python3 -c '
import json, sys
payload = sys.stdin.read()
if not payload.strip():
    sys.exit(2)
try:
    data = json.loads(payload)
    print(data.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
') || { echo "Usage: bash .claude/hooks/lint-ledgers.sh <registry-path>" >&2; exit 2; }
[ -n "$file_path" ] || exit 0

result=$(bun "$shared" "$file_path" 2>&1)
code=$?
if [ "$code" -eq 1 ]; then
  printf '%s\nFix the file and save again.\n' "$result" >&2
  exit 2
fi
# Unsupported or unreadable edits do not interrupt the hook; CLI still reports them.
exit 0
