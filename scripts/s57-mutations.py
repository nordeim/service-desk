#!/usr/bin/env python3
"""S57: the mutation battery applier (the s56 lineage) — 7 mutations A-G.
Usage: s57-mutations.py <ID> apply|revert
Each mutation is applied, the bite OBSERVED, then reverse-replaced (never
git checkout — the s53 doctrine)."""
import pathlib
import shutil
import sys

R = pathlib.Path("/home/z/my-project/service-desk")

# The fabricated 8-hex mutation token (constructed, never a real commit; the
# s56 mutation-C lineage — the live s57 event was this exact shape in the
# operator's transcript).
TOKEN = "dead" + "beef"

MUTATIONS = {
    # A: a middle plan renamed away — bites pin 1 (the plan enumeration) +
    #    the plan-status floor (the corpus count).
    "A": {
        "kind": "rename",
        "path": "docs/remediation-plan-session30.md",
        "mut": "docs/remediation-plan-session30.md.mutated",
    },
    # B: a middle log renamed away — bites pin 2 (the hole) + pin 3 (the
    #    session-30 transcript pairing).
    "B": {
        "kind": "rename",
        "path": "docs/session_50.md",
        "mut": "docs/session_50.md.mutated",
    },
    # C: a log's session identification fully mislabeled — bites pin 3 (the
    #    header-identification half). BOTH head references mutated (the
    #    observation pass showed a single-site mislabel does NOT bite: the
    #    numbering note carries a second session-56 reference that still
    #    identifies the doc — the pin's honest multi-reference sensitivity,
    #    documented here).
    "C": {
        "kind": "multi",
        "parts": [
            {
                "kind": "replace",
                "path": "docs/session_101.md",
                "old": "# The session-56 agent's log — briefing for the next session",
                "new": "# The session-55 agent's log — briefing for the next session",
            },
            {
                "kind": "replace",
                "path": "docs/session_101.md",
                "old": "so this session-56 agent's narrative log continues the convention",
                "new": "so this session-55 agent's narrative log continues the convention",
            },
        ],
    },
    # D: the fabricated-token quote re-introduced backticked in a doc —
    #    bites the s56 artifact-existence pin 3 (the live event shape).
    "D": {
        "kind": "append",
        "path": "docs/session_100.md",
        "text": f"\n> (mutation-test line) the fabricated token was quoted as `{TOKEN}` in the transcript\n",
    },
    # E: the README badge revert — bites the s48 corpus family + the s50
    #    BRIDGE (the consistency direction).
    "E": {
        "kind": "replace",
        "path": "README.md",
        "old": "tests-279%20unit",
        "new": "tests-276%20unit",
    },
    # F: the §7.1 row's test-count mutation — bites the s49 pad pin.
    "F": {
        "kind": "replace",
        "path": "Project_Architecture_Document.md",
        "old": "at doc 2N−10) | 1 | 3 | `tests/doc-enumeration-contract.test.ts` | Vitest |",
        "new": "at doc 2N−10) | 1 | 2 | `tests/doc-enumeration-contract.test.ts` | Vitest |",
    },
    # G: the boundary-transition simulation (the paired bump) — bites the
    #    plan-status pin 3 (the s58 plan demanded) + the s57 pins 2+3 (the
    #    session-103/104 docs demanded — the next-session-catch).
    "G": {
        "kind": "multi",
        "parts": [
            {
                "kind": "replace",
                "path": "tests/plan-status-contract.test.ts",
                "old": "const CURRENT_SESSION = 57;",
                "new": "const CURRENT_SESSION = 58;",
            },
            {
                "kind": "replace",
                "path": "tests/doc-enumeration-contract.test.ts",
                "old": "const CURRENT_SESSION = 57;",
                "new": "const CURRENT_SESSION = 58;",
            },
        ],
    },
}


def apply_one(m, revert=False):
    if m["kind"] == "rename":
        src, dst = (R / m["mut"], R / m["path"]) if revert else (R / m["path"], R / m["mut"])
        shutil.move(str(src), str(dst))
        return f"rename {m['path']} <-> {m['mut']}"
    if m["kind"] == "replace":
        p = R / m["path"]
        old, new = (m["new"], m["old"]) if revert else (m["old"], m["new"])
        t = p.read_text()
        if t.count(old) != 1:
            raise SystemExit(f"FATAL: {m['path']}: anchor found {t.count(old)}x")
        p.write_text(t.replace(old, new))
        return f"replace in {m['path']}: {old[:40]!r}"
    if m["kind"] == "append":
        p = R / m["path"]
        if revert:
            t = p.read_text()
            if not t.endswith(m["text"]):
                raise SystemExit("FATAL: append-revert anchor missing")
            p.write_text(t[: -len(m["text"])])
            return f"append reverted in {m['path']}"
        with p.open("a") as f:
            f.write(m["text"])
        return f"append to {m['path']}"
    raise SystemExit(f"unknown kind {m['kind']}")


def main():
    mid, action = sys.argv[1], sys.argv[2]
    if mid not in MUTATIONS:
        raise SystemExit(f"unknown mutation {mid}")
    m = MUTATIONS[mid]
    if m["kind"] == "multi":
        parts = m["parts"] if action == "apply" else reversed(m["parts"])
        for part in parts:
            print(apply_one(part, revert=(action == "revert")))
    else:
        print(apply_one(m, revert=(action == "revert")))
    print(f"mutation {mid} {action} DONE")


if __name__ == "__main__":
    main()
