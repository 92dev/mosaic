#!/usr/bin/env bash
set -euo pipefail

[[ -f tools/checkup.ts ]] || exit 0
[[ $(git branch --show-current) == main ]]

python3 - <<'PY'
from pathlib import Path
import re

roadmap = Path("docs/architecture/roadmap.md")
roadmap.write_text(roadmap.read_text().rstrip() + "\n\nScaffold record: [plan 0001](../plans/0001-scaffold-member-a.md).\n")
gaps = Path("docs/gaps.md")
content = gaps.read_text()
entry = re.search(r"(?ms)^- \*\*G-3 ·.*?(?=^- \*\*|\Z)", content)
if entry is None:
    raise SystemExit("S11 requires the existing G-3 entry")
body, count = re.subn(r"(?m)^(  \*\*Trigger:\*\*) when a second member repo is added\.$", r"\1 when `member-b/docs/**` is added.", entry.group())
if count != 1:
    raise SystemExit("S11 requires G-3's original Trigger")
gaps.write_text(content[:entry.start()] + body + content[entry.end():])
product = Path("docs/product/F-1-export-flow.md")
product.write_text(product.read_text().rstrip() + "\n\nThe remaining export contract is described by [D9](../architecture/export.md#d9).\n")
PY

git add -- docs/architecture/roadmap.md docs/gaps.md docs/product/F-1-export-flow.md
git commit -qm 'S11: seed checkup drift'
git push -qu origin main
printf '/.checkup-main-count\n' >> .git/info/exclude
python3 - <<'PY'
from pathlib import Path
import subprocess

count = len(subprocess.check_output(["git", "log", "--oneline", "main"], text=True).splitlines())
Path(".checkup-main-count").write_text(f"{count}\n")
print(f"S11 ready: stale plan 0001 link, stale G-3 Trigger, dangling D9; link main commits={count}")
PY
