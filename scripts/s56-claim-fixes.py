#!/usr/bin/env python3
"""S56 GREEN: the four claim fixes (the existence claims made honest).
Each replacement count-verified exactly-once; never git checkout (the s53 doctrine).
"""
import sys

REPO = "/home/z/my-project/service-desk"
FIXES = [
    # (file, old, new)
    (
        "docs/session_69.md",
        "applied via the persisted `scripts/s40-apply-stubs.py`",
        "applied via `scripts/s40-apply-stubs.py` (the session-40 workspace copy — pre-convention, not in git; the script-commit convention begins s42)",
    ),
    (
        "docs/session_71.md",
        "applied via the persisted `scripts/s41-apply-single-source.py`",
        "applied via `scripts/s41-apply-single-source.py` (the session-41 workspace copy — pre-convention, not in git)",
    ),
    (
        "docs/session_71.md",
        "via the persisted `scripts/s41-standing-rerun.sh`",
        "via `scripts/s41-standing-rerun.sh` (the session-41 workspace copy — pre-convention, not in git; the s42+ descendants are in git)",
    ),
    (
        "docs/how-to-git-push-using-ssh-wrapper_SKILL.md",
        "pushed `0ab29dc..f932360` to `main` from a",
        "pushed `0ab29dc..f932360` (pre-import history — predates the repo's GitHub web-upload import; unreachable in the current repository) to `main` from a",
    ),
]

for path, old, new in FIXES:
    full = f"{REPO}/{path}"
    text = open(full, encoding="utf-8").read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {path}: expected exactly 1 occurrence of the old text, found {n}")
        sys.exit(1)
    open(full, "w", encoding="utf-8").write(text.replace(old, new, 1))
    print(f"OK {path}: 1 replacement")

print("all four claim fixes landed")
