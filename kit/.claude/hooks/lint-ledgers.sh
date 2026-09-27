#!/bin/bash
# PostToolUse(Write|Edit) hook: validate the schema of the repo's LEDGERS and ID REGISTRIES.
# Exit 2 feeds the errors back to the model, which fixes the file and re-saves.
# CLI argv path: 0 valid, 1 schema errors, 2 usage/unreadable; stdin hook errors remain exit 2.
# Invoke through bash even where `sh` is a different POSIX shell.
[ -n "${BASH_VERSION:-}" ] || exec bash "$0" "$@"
#
# Dispatch is by path; anything not listed here exits 0:
#
#   plan docs       */docs/plans/NNNN-*.md         frontmatter status enum + required sections
#   plans ledgers   */docs/plans/README.md         unique 4-digit plan numbers, a status cell per row
#   gaps registry   */docs/gaps.md                 unique G-ids, per-entry Trigger/From/Status,
#                                                  and no id that is ALSO in the archive
#   split gaps      */docs/gaps/*.md              per-entry checkable Trigger:/when:
#   gaps archive    */docs/gaps-archive.md         unique G-ids, no id that is ALSO active
#   pitfalls        */docs/architecture/pitfalls.md      unique P-ids
#   decision map    */docs/architecture/README.md        unique D-numbers
#
# With an argv path, never wait for a hook payload on stdin.
cli=0
schema_exit=2
if [ "$#" -gt 0 ]; then
  [ "$#" -eq 1 ] || { echo "Usage: sh .claude/hooks/lint-ledgers.sh <registry-path>" >&2; exit 2; }
  file_path=$1
  cli=1
  schema_exit=1
else
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
' 2>/dev/null) || { echo "Usage: sh .claude/hooks/lint-ledgers.sh <registry-path>" >&2; exit 2; }
  [ -n "$file_path" ] || exit 0
fi
unsupported() {
  [ "$cli" -eq 0 ] && exit 0
  echo "Not a supported active registry: $file_path" >&2
  exit 2
}
if [ ! -f "$file_path" ] || [ ! -r "$file_path" ]; then
  [ "$cli" -eq 0 ] && exit 0
  echo "Cannot read $file_path" >&2
  exit 2
fi

norm=${file_path//\\//}
base=${norm##*/}
dir=${norm%/*}

# Archived plans are frozen, terminal records — not schema-gated (they may predate the schema).
case "$norm" in docs/plans/archived/*|*/docs/plans/archived/*) unsupported ;; esac

kind=
case "$norm" in
  docs/gaps.md|*/docs/gaps.md)                             kind=gaps ;;
  docs/gaps-archive.md|*/docs/gaps-archive.md)             kind=gaps_archive ;;
  docs/gaps/*.md|*/docs/gaps/*.md)                       kind=gap_body ;;
  docs/architecture/pitfalls.md|*/docs/architecture/pitfalls.md) kind=pitfalls ;;
  docs/architecture/README.md|*/docs/architecture/README.md)     kind=decisions ;;
  docs/plans/README.md|*/docs/plans/README.md)            kind=ledger ;;
  docs/plans/*.md|*/docs/plans/*.md)
    [ "$base" = "TEMPLATE.md" ] && unsupported
    case "$base" in *-wire.md) unsupported ;; esac   # wire annexes are frozen contracts
    case "$base" in [0-9][0-9][0-9][0-9]-?*.md) ;; *) unsupported ;; esac
    kind=plan ;;
  *) unsupported ;;
esac

STATUS_ENUM='draft|approved|executing|review|done|abandoned'
errors=()
subject="$base"

# --- ids: emit one id per matching entry line ------------------------------------------------
entry_ids() { # $1=file  $2=sed expression
  sed -n "$2" "$1"
}

add_duplicate_errors() { # $1=file  $2=sed expr  $3=label
  local dups
  dups=$(entry_ids "$1" "$2" | sort | uniq -d)
  [ -z "$dups" ] && return 0
  local d
  while IFS= read -r d; do
    [ -z "$d" ] && continue
    errors+=("duplicate $3 id '$d' — ids are never reused; two entries under one id silently hide one of them")
  done <<EOF
$dups
EOF
}

GAP_SED='s/^- \*\*\(G-[0-9]\{1,\}\) ·.*/\1/p'

case "$kind" in

  plan)
    subject="Plan doc '$base'"
    status=$(awk '/^---$/{n++; next} n==1 && /^status:/{print $2; exit}' "$norm")
    case "$status" in
      draft|approved|executing|review|done|abandoned) ;;
      "") errors+=("missing frontmatter 'status:' (expected one of: $STATUS_ENUM)") ;;
      *)  errors+=("invalid status '$status' (expected one of: $STATUS_ENUM)") ;;
    esac
    for h in "## Context" "## Scope" "## Task breakdown" "## Review checklist" "## Verification" "## Planning log" "## Execution log"; do
      grep -qF "$h" "$norm" || errors+=("missing required section: '$h'")
    done
    grep -qF "### Unverified" "$norm" || grep -qF "### Verification gaps" "$norm" \
      || errors+=("missing required section: '### Unverified' (or legacy '### Verification gaps')")
    ;;

  ledger)
    subject="Plans ledger '$base'"
    dups=$(sed -n 's/^| *\[\{0,1\}\([0-9]\{4\}\)\]\{0,1\}.*/\1/p' "$norm" | sort | uniq -d)
    while IFS= read -r d; do
      [ -z "$d" ] && continue
      errors+=("duplicate plan number '$d' — one row per plan; a second row makes the ledger ambiguous about status and landed commit")
    done <<EOF
$dups
EOF
    while IFS= read -r line; do
      num=$(printf '%s' "$line" | sed -n 's/^| *\[\{0,1\}\([0-9]\{4\}\)\]\{0,1\}.*/\1/p')
      [ -z "$num" ] && continue
      printf '%s' "$line" | grep -qE "\| *($STATUS_ENUM) *\|" \
        || errors+=("ledger row '$num' has no recognizable status cell (expected one of: $STATUS_ENUM)")
    done < "$norm"
    ;;

  gaps|gaps_archive|gap_body)
    if [ "$kind" = gaps ]; then
      subject="Gaps registry '$base'"; counterpart="$dir/gaps-archive.md"; other="the archive"
    elif [ "$kind" = gap_body ]; then
      subject="Split gap '$base'"; counterpart=""
    else
      subject="Gaps archive '$base'"; counterpart="$dir/gaps.md"; other="the active registry"
    fi
    add_duplicate_errors "$norm" "$GAP_SED" "gap"

    # Required fields per entry. An entry runs from its `- **G-n ·` line to the next one.
    #
    # The two files guarantee DIFFERENT things, so they are linted differently:
    #   active  — a gap is a conditional obligation, so it needs a trigger, a provenance, a status.
    #   archive — the trigger has already fired or been discharged; what a closed entry owes instead
    #             is EVIDENCE of what closed it ("closed by NNNN (<hash>)"), per the archive header.
    #             Demanding a live trigger here would flag 30 correctly-closed entries.
    while IFS= read -r miss; do
      [ -z "$miss" ] && continue
      errors+=("$miss")
    done <<EOF
$(awk -v mode="$kind" -v filename="$base" '
  function check_trigger(    n, lines, i, text, field) {
    n = split(buf, lines, "\n")
    for (i = 1; i <= n; i++) {
      text = tolower(lines[i])
      field = "^[ \t]*([-*][ \t]+)?(\\*\\*)?(trigger[^*:\r\n]*|when):(\\*\\*)?[ \t]*"
      if (text !~ field) continue
      sub(field, "", text)
      if (text ~ /[\/\*]/ || text ~ /\.(py|md)([^a-z0-9_]|$)/ ||
          text ~ /(^|[^a-z0-9_])[0-9][0-9][0-9][0-9]([^a-z0-9_]|$)/ ||
          text ~ /(^|[^a-z0-9_])(lands|added|merges|migrates|moves[ \t]+to|gains|changes)([^a-z0-9_]|$)/)
        return
    }
    printf "%s has no checkable Trigger:/when: — name a path/glob, plan NNNN, or event (lands, added, merges, migrates, moves to, gains, changes)\n", id
  }
  function flush() {
    if (id == "") return
    miss = ""
    if (mode == "gaps_archive") {
      # Closure is written several ways in the live archive and all of them are legitimate:
      # `closed by NNNN (<hash>)`, `**CLOSED by 0054 T6**` (upper case), `**Overtaken by ...**` for
      # an entry a refactor made moot, and `**Status:** archived as overtaken`. Case-fold and accept
      # the family; the fence is that SOMETHING says what discharged it, not the house style.
      up = toupper(buf)
      if (up !~ /CLOSED BY/ && up !~ /OVERTAKEN BY/ && up !~ /\*\*STATUS:\*\* *(CLOSED|ARCHIVED)/)
        printf "%s records no evidence of what closed it — an archived gap documents that the check happened and what discharged it (closed by NNNN (<hash>))\n", id
      return
    }
    if (mode == "gap_body") { check_trigger(); return }
    # A closed entry must not remain in the active registry, which sessions read as open work.
    if (buf ~ /\*\*Status:\*\* *closed/) {
      printf "%s is **Status:** closed but still in the ACTIVE registry — move it to gaps-archive.md (never renumber, never delete)\n", id
      return
    }
    check_trigger()
    # Qualified Trigger and plain/bold when fields share the same check.
    if (buf !~ /\*\*Status:\*\*/)                  miss = miss " **Status:**"
    # SPLIT rows (`/mosaic-gap-audit` step 3) hold only id + summary + trigger + link here; the full
    # body — including provenance — lives in docs/gaps/G-<n>-<slug>.md. Requiring provenance on the
    # row would punish entries for being correctly split.
    if (buf !~ /\*\*Detail:\*\*/ && buf !~ /\*\*(From|Provenance)[^*]*:\*\*/)
      miss = miss " **From:** (or **Provenance:**, or a **Detail:** pointer to a split dossier)"
    if (miss != "") printf "%s is missing:%s — every gap is a conditional obligation, so it needs a trigger, a provenance and a status\n", id, miss
  }
  {
    sub(/\r$/, "")
    fullbuf = fullbuf "\n" $0
    if (mode == "gap_body" && heading_id == "" && $0 ~ /^#+[ \t]+(\*\*)?G-[0-9]+/) {
      heading_id = $0; sub(/^#+[ \t]+(\*\*)?/, "", heading_id); sub(/[^0-9G-].*/, "", heading_id)
    }
  }
  /^- \*\*G-[0-9]+ ·/ {
    flush()
    saw_entry = 1
    id = $0; sub(/^- \*\*/, "", id); sub(/ ·.*/, "", id)
    buf = $0
    next
  }
  /^- \*\*/ { flush(); id = ""; buf = ""; next }
  id != "" { buf = buf "\n" $0 }
  END {
    if (mode == "gap_body" && !saw_entry) {
      id = heading_id
      if (id == "" && match(filename, /G-[0-9]+/)) id = substr(filename, RSTART, RLENGTH)
      buf = fullbuf
    }
    flush()
  }
' "$norm")
EOF

    # An id must live in exactly one of the two files.
    # NOTE: no `< <(...)` process substitution anywhere in this script — every reference invokes it
    # as `sh lint-ledgers.sh`, and under POSIX sh that is a syntax error, which would make the hook
    # die on EVERY ledger edit instead of linting it.
    if [ -f "$counterpart" ]; then
      mine=$(mktemp); theirs=$(mktemp); both=$(mktemp)
      entry_ids "$norm" "$GAP_SED" | sort -u > "$mine"
      entry_ids "$counterpart" "$GAP_SED" | sort -u > "$theirs"
      comm -12 "$mine" "$theirs" > "$both"
      while IFS= read -r d; do
        [ -z "$d" ] && continue
        errors+=("gap '$d' is present here AND in $other — a gap is either open or closed, never both")
      done < "$both"
      rm -f "$mine" "$theirs" "$both"
    fi
    ;;

  pitfalls)
    subject="Pitfalls catalog '$base'"
    add_duplicate_errors "$norm" 's/^- \*\*\(P-[0-9]\{1,\}\) ·.*/\1/p' "pitfall"
    ;;

  decisions)
    subject="Decision map '$base'"
    add_duplicate_errors "$norm" 's/^| *\(D[0-9]\{1,\}\) *|.*/\1/p' "decision"
    ;;
esac

if [ ${#errors[@]} -gt 0 ]; then
  echo "$subject violates the ledger schema:" >&2
  for e in "${errors[@]}"; do echo "  - $e" >&2; done
  echo "Fix the file and save again." >&2
  exit "$schema_exit"
fi

[ "$cli" -eq 0 ] || echo "PASS $file_path"
exit 0
