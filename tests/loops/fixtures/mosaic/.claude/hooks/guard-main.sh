#!/bin/bash
# PreToolUse(Bash) hook: block `git commit` on the configured default branch.
# Multi-repo aware (link repo + member repos): resolves the repo from `git -C <dir>`
# or a leading `cd <dir> &&` in the command, both joined against the tool call's `cwd`
# parameter when relative; falls back to that cwd, then the hook's own cwd.
# Binds LLM sessions only — a human terminal is the escape hatch.
# Landing policy lives in docs/process/git-flow.md, not in this commit guard.
#
# Detection scans tokens: `commit` must be git's actual subcommand, the first non-option token after `git`, with git's
# value-taking global options consumed. `git commit-tree` is deliberately NOT matched — it writes an
# object and moves no branch ref.
# Stdin payload: {"tool_input":{"command":"git commit -m x","cwd":"/repo"}}
# Read defaultBranch from the installed root's .omp/mosaic.json; if absent, default to main.

eval "$(python3 -c '
import json, shlex, sys
try:
    data = json.load(sys.stdin)
    tool_input = data.get("tool_input", {})
    print("cmd=" + shlex.quote(tool_input.get("command", "")))
    print("tool_cwd=" + shlex.quote(tool_input.get("cwd", "")))
except Exception:
    print("cmd=")
    print("tool_cwd=")
' 2>/dev/null)"

# Nothing to check
[ -z "$cmd" ] && exit 0

# Resolve target dir; prints SKIP when the command runs no `git commit`
target=$(printf '%s' "$cmd" | BASE_CWD="$tool_cwd" python3 -c '
import os, shlex, sys

VALUE_OPTIONS = {"-C", "-c", "--git-dir", "--work-tree", "--namespace", "--super-prefix",
                 "--config-env"}


def segments(command):
    """Quote-aware token lists, one per `| ; & && ||`-separated segment."""
    result, segment, token, started, quote = [], [], "", False, None

    def end_token():
        nonlocal token, started
        if started:
            segment.append(token)
            token, started = "", False

    def end_segment():
        nonlocal segment
        end_token()
        if segment:
            result.append(segment)
        segment = []

    index = 0
    while index < len(command):
        char = command[index]
        if quote is not None:
            if char == quote:
                quote = None
            else:
                token += char
            index += 1
            continue
        if char in "\"\x27":
            quote, started = char, True
        elif char == "\\" and index + 1 < len(command):
            token += command[index + 1]
            started = True
            index += 1
        elif char.isspace():
            end_token()
        elif char in "|&;":
            end_segment()
            if char != ";" and index + 1 < len(command) and command[index + 1] == char:
                index += 1
        else:
            token += char
            started = True
        index += 1
    end_segment()
    return result


def commit_dir_in(tokens):
    """The `-C` dir of a `git commit` here, "" when it has none, or None when not a git commit."""
    for start, head in enumerate(tokens):
        if head != "git" and not head.endswith("/git"):
            continue
        directory, index = "", start + 1
        while index < len(tokens):
            token = tokens[index]
            if token in VALUE_OPTIONS:
                if token == "-C":
                    directory = tokens[index + 1] if index + 1 < len(tokens) else ""
                index += 2
                continue
            if token.startswith("-C") and len(token) > 2:
                directory = token[2:]
                index += 1
                continue
            if token.startswith("-"):
                index += 1
                continue
            break
        if index < len(tokens) and tokens[index] == "commit":
            return directory
    return None


base = os.environ.get("BASE_CWD") or "."
command = sys.stdin.read()
parsed = segments(command)
for tokens in parsed:
    directory = commit_dir_in(tokens)
    if directory is None:
        continue
    if directory:
        # os.path.join lets an absolute -C dir win over the base.
        print(os.path.join(base, directory))
        break
    first = parsed[0]
    # Leading `cd <dir> && ...` (first cd wins), joined against the tool cwd it runs in.
    print(os.path.join(base, first[1]) if first[0] == "cd" and len(first) > 1 else base)
    break
else:
    print("SKIP")
' 2>/dev/null)

[ -z "$target" ] && exit 0
[ "$target" = "SKIP" ] && exit 0

config_path=".omp/mosaic.json"
default_branch=$(python3 -c '
import json, pathlib, sys
config_path = pathlib.Path(sys.argv[1]).resolve().parents[2] / sys.argv[2]
try:
    config = json.loads(config_path.read_text())
    branch = config.get("defaultBranch")
    if not isinstance(branch, str) or not branch.strip() or any(char in branch for char in "\r\n\0"):
        raise ValueError("defaultBranch must be a nonempty single-line string")
    print(branch)
except FileNotFoundError:
    print("main")
except Exception as error:
    print(f"Cannot read {sys.argv[2]}: {error}", file=sys.stderr)
    sys.exit(1)
' "$0" "$config_path") || exit 2

branch=$(git -C "$target" branch --show-current 2>/dev/null)
if [ "$branch" = "$default_branch" ]; then
  echo "Direct commits to $default_branch are blocked (docs/process/git-flow.md). Create a task branch in the target repo first:" >&2
  echo "  git -C $target checkout -b task/NNNN-<slug>   (branch name = plan filename in docs/plans/)" >&2
  echo "Landing on $default_branch: follow docs/process/git-flow.md after review + human sign-off." >&2
  exit 2
fi

exit 0
