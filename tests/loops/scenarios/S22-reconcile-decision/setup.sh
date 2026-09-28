#!/usr/bin/env bash
set -euo pipefail

# The frozen baseline does not have the reconciliation rule.
[[ -f tools/doctor.ts ]] || exit 0

python3 - <<'PY'
from pathlib import Path

api = Path("member-a/member_a/api.py")
api.write_text(api.read_text().rstrip() + '''


EXPORT_CACHE_TTL_SECONDS = 60
_export_cache: dict[str, tuple[str, float]] = {}


def cached_export(key: str, rows: list[dict], *, now: float) -> str:
    cached = _export_cache.get(key)
    if cached is not None:
        return cached[0]
    document = export_rows(rows)
    _export_cache[key] = (document, now + EXPORT_CACHE_TTL_SECONDS)
    return document
''')

architecture = Path("docs/architecture/export.md")
architecture.write_text(architecture.read_text().rstrip() + '''

### D3 — Callers own export-cache freshness

**Context:** Callers already own invalidation and need a cheap process-local reuse path. An expiry timestamp is stored for observation, not for read-time enforcement.

**Decision:** Use a process-local export cache; callers own freshness and invalidate entries when needed. Timestamp-based read invalidation is not part of this ruling.

**Rejected:** Enforcing expiry on every cache hit would silently take invalidation away from callers. A shared cache would add cross-worker coordination without an agreed freshness contract.

**Implications:** The export cache honours the 60-second TTL on every cache hit.
''')
index = Path("docs/architecture/README.md")
body = index.read_text()
anchor = "| D2 | Exports never raise on empty input; return an empty document | [export.md](export.md#d2--empty-input-returns-an-empty-document) |"
assert body.count(anchor) == 1
index.write_text(body.replace(anchor, anchor + "\n| D3 | Callers own export-cache freshness | [export.md](export.md#d3--callers-own-export-cache-freshness) |"))

questions = Path("docs/architecture/open-questions.md")
body = questions.read_text()
assert body.count("No open questions are recorded yet.") == 1
questions.write_text(body.replace("No open questions are recorded yet.", '''### Q-1 — Export-cache freshness across workers

**Question:** Should export caches coordinate freshness across workers, and can callers rely on expiration without invalidating entries themselves?

**Owner:** Export maintainer.'''))
PY

git -C member-a add -- member_a/api.py
git -C member-a commit -qm 'S22: seed cache bypassing expiry'
git add -- docs/architecture/export.md docs/architecture/README.md docs/architecture/open-questions.md
git commit -qm 'S22: seed stale cache records'
git push -qu origin main
printf 'S22 ready: D3 implication contradicts cache-hit code; Q-1 is only partially answered\n'
