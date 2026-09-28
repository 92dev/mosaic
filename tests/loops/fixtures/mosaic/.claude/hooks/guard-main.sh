#!/bin/bash
# PreToolUse(Bash) adapter for the shared commit guard; stdin is the unchanged hook payload.
# Shared CLI reads .omp/mosaic.json, checks the resolved target branch, and blocks with exit 2.
# Binds LLM sessions only; landing policy and the human escape live in docs/process/git-flow.md.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
shared="$(CDPATH= cd -- "$(dirname -- "$0")/../../tools" && pwd)/guard-main.ts"
exec bun "$shared" --hook
