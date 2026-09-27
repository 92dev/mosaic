#!/bin/bash
# PostToolUse(Write|Edit) hook: validate the schema of the repo's LEDGERS and ID REGISTRIES.
# Exit 2 feeds the errors back to the model, which fixes the file and re-saves.
#
# Dispatch is by path; anything not listed here exits 0:
#
#   plan docs       */docs/plans/*.md              frontmatter status enum + required sections
#   plans ledgers   */docs/plans/README.md         unique 4-digit plan numbers, a status cell per row
#   gaps registry   */docs/gaps.md                 unique G-ids, per-entry Trigger/From/Status,
#                                                  and no id that is ALSO in the archive
#   gaps archive    */docs/gaps-archive.md         unique G-ids, no id that is ALSO active
#   pitfalls        */docs/architecture/pitfalls.md      unique P-ids
#   decision map    */docs/architecture/README.md        unique D-numbers
#
# WHY id uniqueness is the load-bearing check: on 2026-08-20 plan 0082's close-out pasted its two
# new gap entries one number low, overwriting G-127's text with a copy of G-128 and leaving G-128
# duplicated. A real obligation (ink-preview normalization) vanished from the registry and nothing
# noticed for five days — every `G-x` citation in the tree silently pointed at the wrong row.
#
# The path is read from the PostToolUse JSON payload on stdin, and an argv path is ALSO accepted, so
#   sh .claude/hooks/lint-ledgers.sh <file>
# really lints. Both forms are supported deliberately (P-31): a guard whose natural invocation reads
# nothing and exits 0 reports greens that mean nothing.

file_path=$(python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    print(data.get("tool_input", {}).get("file_path", ""))
except Exception:
    pass
' 2>/dev/null)

# argv fallback (P-31): no/unparseable payload -> take the path from the command line.
[ -z "$file_path" ] && file_path="$1"
[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

norm=${file_path//\\//}
base=${norm##*/}
dir=${norm%/*}

# Archived plans are frozen, terminal records — not schema-gated (they may predate the schema).
case "$norm" in */docs/plans/archived/*) exit 0 ;; esac

kind=
case "$norm" in
  docs/gaps.md|*/docs/gaps.md)                             kind=gaps ;;
  docs/gaps-archive.md|*/docs/gaps-archive.md)             kind=gaps_archive ;;
  docs/architecture/pitfalls.md|*/docs/architecture/pitfalls.md) kind=pitfalls ;;
  docs/architecture/README.md|*/docs/architecture/README.md)     kind=decisions ;;
  docs/plans/README.md|*/docs/plans/README.md)            kind=ledger ;;
  docs/plans/*.md|*/docs/plans/*.md)
    [ "$base" = "TEMPLATE.md" ] && exit 0
    case "$base" in *-wire.md) exit 0 ;; esac   # wire annexes are frozen contracts, not lifecycle docs
    kind=plan ;;
  *) exit 0 ;;
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
    for h in "## Context" "## Scope" "## Task breakdown" "## Review checklist" "## Verification" "### Verification gaps" "## Planning log" "## Execution log"; do
      grep -qF "$h" "$norm" || errors+=("missing required section: '$h'")
    done
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

  gaps|gaps_archive)
    if [ "$kind" = gaps ]; then
      subject="Gaps registry '$base'"; counterpart="$dir/gaps-archive.md"; other="the archive"
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
$(awk -v mode="$kind" '
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
    # A CLOSED entry sitting in the open registry is the defect this catches most cheaply: the
    # active list is standing context for every /palladio-plan, so a discharged obligation left in
    # it costs every future session real attention. (Measured: G-132 sat here closed since
    # 2026-08-23.)
    if (buf ~ /\*\*Status:\*\* *closed/) {
      printf "%s is **Status:** closed but still in the ACTIVE registry — move it to gaps-archive.md (never renumber, never delete)\n", id
      return
    }
    # Both spellings are load-bearing in the live registry: 111 `**Trigger:**` alongside qualified
    # forms (`**Trigger (owed|narrowed|armed):**`), and provenance is written 72x `**From:**` /
    # 40x `**Provenance:**`. The fence is "the field EXISTS", not "the field is spelled my way" —
    # a linter that flags 60 correct entries gets switched off, and then guards nothing.
    if (buf !~ /\*\*Trigger[^*]*:\*\*/)            miss = miss " **Trigger:**"
    if (buf !~ /\*\*Status:\*\*/)                  miss = miss " **Status:**"
    # SPLIT rows (`/gap-evaluate` step 3) hold only id + summary + trigger + link here; the full
    # body — including provenance — lives in docs/gaps/G-<n>-<slug>.md. Requiring provenance on the
    # row would punish entries for being correctly split.
    if (buf !~ /\*\*Detail:\*\*/ && buf !~ /\*\*(From|Provenance)[^*]*:\*\*/)
      miss = miss " **From:** (or **Provenance:**, or a **Detail:** pointer to a split dossier)"
    if (miss != "") printf "%s is missing:%s — every gap is a conditional obligation, so it needs a trigger, a provenance and a status\n", id, miss
  }
  /^- \*\*G-[0-9]+ ·/ {
    flush()
    id = $0; sub(/^- \*\*/, "", id); sub(/ ·.*/, "", id)
    buf = $0
    next
  }
  /^- \*\*/ { flush(); id = ""; buf = ""; next }
  id != "" { buf = buf "\n" $0 }
  END { flush() }
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
  exit 2
fi

exit 0
