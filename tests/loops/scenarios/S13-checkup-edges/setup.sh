#!/usr/bin/env bash
set -euo pipefail

[[ -f tools/checkup.ts ]] || exit 0
[[ $(git branch --show-current) == main ]]

python3 - <<'PY'
from pathlib import Path

# checkup's required registries include every member's local plan ledger.
ledger = Path("member-a/docs/plans/README.md")
ledger.unlink()
archive = Path("docs/plans/archived/0001-scaffold-member-a.md")
alternative = archive.with_name("0001-scaffold-member-a-old.md")
if alternative.exists():
    raise SystemExit("S13 requires exactly one archived plan 0001 before seeding")
alternative.write_bytes(archive.read_bytes())
roadmap = Path("docs/architecture/roadmap.md")
roadmap.write_text(roadmap.read_text().rstrip() + "\n\nScaffold record: [plan 0001](../plans/0001-scaffold-member-a.md).\n")
PY

git -C member-a add -- docs/plans/README.md
git -C member-a commit -qm 'S13: seed missing member ledger'
git add -- docs/architecture/roadmap.md docs/plans/archived/0001-scaffold-member-a-old.md
git commit -qm 'S13: seed checkup edges'
git push -qu origin main
printf '/.checkup-main-count\n' >> .git/info/exclude
python3 - <<'PY'
from pathlib import Path
import subprocess

count = len(subprocess.check_output(["git", "log", "--oneline", "main"], text=True).splitlines())
Path(".checkup-main-count").write_text(f"{count}\n")
print(f"S13 ready: missing member-a ledger, two archived plan 0001 candidates, stale roadmap link; link main commits={count}")
PY
