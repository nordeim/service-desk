#!/usr/bin/env python3
"""S56: the mutation battery applier (apply X | revert X | status).
Each mutation is a set of exact (file, old, new) replacements, count-verified.
Never git checkout (the s53 doctrine)."""
import sys, os

REPO = "/home/z/my-project/service-desk"

def f(path):
    return os.path.join(REPO, path)

# ---------------------------------------------------------------- mutations
MUTATIONS = {
    # A: the persistence claim re-introduced (the s40 shape A return)
    "A": [
        ("docs/session_69.md",
         "applied via `scripts/s40-apply-stubs.py` (the session-40 workspace copy",
         "applied via the persisted `scripts/s40-apply-stubs.py` (the session-40 workspace copy"),
    ],
    # B: the pre-import annotation stripped (the how-to range bare again)
    "B": [
        ("docs/how-to-git-push-using-ssh-wrapper_SKILL.md",
         "pushed `0ab29dc..f932360` (pre-import history — predates the repo's GitHub web-upload import; unreachable in the current repository) to `main` from a",
         "pushed `0ab29dc..f932360` to `main` from a"),
    ],
    # C: a fresh dangling bare-hash citation (the fabricated token, backticked)
    "C": [
        ("docs/session_71.md",
         "**Next session's probes:** the standing ledger re-check",
         "**Next session's probes:** (Mutation-C token: the fabricated citation `deadbeef` — not a real commit.) the standing ledger re-check"),
    ],
    # D: the PNG magic de-backticked EVERYWHERE (the needed-ness guard's bite)
    "D": [
        ("docs/remediation-plan-session18.md", "`89504e470d0a1a0a`", "89504e470d0a1a0a", "ALL"),
        ("docs/remediation-plan-session56.md", "`89504e470d0a1a0a`", "89504e470d0a1a0a", "ALL"),
        ("docs/session_25.md", "`89504e470d0a1a0a`", "89504e470d0a1a0a", "ALL"),
    ],
    # E: the README badge revert 276 -> 273
    "E": [
        ("README.md",
         "![Tests](https://img.shields.io/badge/tests-276%20unit%20%2B%20198%20E2E-brightgreen)",
         "![Tests](https://img.shields.io/badge/tests-273%20unit%20%2B%20198%20E2E-brightgreen)"),
    ],
    # F: the §7.1 s56 row's test-count mutation 3 -> 2
    "F": [
        ("Project_Architecture_Document.md",
         "exclusion set + the needed-ness guard) | 1 | 3 |",
         "exclusion set + the needed-ness guard) | 1 | 2 |"),
    ],
    # G: the boundary-transition simulation (the s57 constant bump)
    "G": [
        ("tests/plan-status-contract.test.ts",
         "const CURRENT_SESSION = 56;",
         "const CURRENT_SESSION = 57;"),
    ],
}

def apply_mutation(name):
    for entry in MUTATIONS[name]:
        path, old, new = entry[0], entry[1], entry[2]
        mode = entry[3] if len(entry) > 3 else "ONE"
        full = f(path)
        text = open(full, encoding="utf-8").read()
        n = text.count(old)
        if mode == "ALL":
            if n == 0:
                print(f"FATAL apply {name}: {path}: pattern not found: {old[:60]}")
                sys.exit(1)
            open(full, "w", encoding="utf-8").write(text.replace(old, new))
            print(f"applied {name}: {path}: {n} occurrences")
        else:
            if n != 1:
                print(f"FATAL apply {name}: {path}: expected 1, found {n}: {old[:60]}")
                sys.exit(1)
            open(full, "w", encoding="utf-8").write(text.replace(old, new, 1))
            print(f"applied {name}: {path}: 1 occurrence")

def revert_mutation(name):
    for entry in MUTATIONS[name]:
        path, old, new = entry[0], entry[1], entry[2]
        mode = entry[3] if len(entry) > 3 else "ONE"
        full = f(path)
        text = open(full, encoding="utf-8").read()
        n = text.count(new)
        if mode == "ALL":
            if n == 0:
                print(f"FATAL revert {name}: {path}: pattern not found: {new[:60]}")
                sys.exit(1)
            open(full, "w", encoding="utf-8").write(text.replace(new, old))
            print(f"reverted {name}: {path}: {n} occurrences")
        else:
            if n != 1:
                print(f"FATAL revert {name}: {path}: expected 1, found {n}: {new[:60]}")
                sys.exit(1)
            open(full, "w", encoding="utf-8").write(text.replace(new, old, 1))
            print(f"reverted {name}: {path}: 1 occurrence")

if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in {*(f"apply-{m}" for m in MUTATIONS), *(f"revert-{m}" for m in MUTATIONS)}:
        print("usage: s56-mutations.py apply-X | revert-X   (X in A..G)")
        sys.exit(2)
    cmd, name = sys.argv[1].split("-", 1)
    (apply_mutation if cmd == "apply" else revert_mutation)(name)
