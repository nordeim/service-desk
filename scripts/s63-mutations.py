#!/usr/bin/env python3
"""S63: the mutation battery definitions (A-H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse it (count-verified / backup-restored, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass — every bite
message below was produced by a live vitest run before this file landed):
  A  the new hole (the live class: a session-boundary numbering slip — the
     last entry 198-gap-s63 renumbered to 200)
                                                     -> s63 pin 4's coverage
                                                        ("NEW worklog
                                                        task-number holes
                                                        [198, 199] — not in
                                                        the frozen historical
                                                        set" — the renumbered-
                                                        away 198 + the never-
                                                        yet-recorded 199)
  B  the field deletion (the 198-gap-s63 entry's Agent: line mangled)
                                                     -> s63 pin 4's field
                                                        check ("lacks Agent:")
  C  the separator deletion (the --- before the last entry dropped)
                                                     -> s63 pin 4's structure
                                                        ("an entry block
                                                        carries 2 Task ID
                                                        lines" + the
                                                        separator/entry
                                                        mismatch)
  D  the exact-duplicate Task ID (the last entry block 198-gap-s63
     appended in FULL — the same ID twice, no renumbering; the backup
     form: the first design's renumber shape broke the revert — 2
     identical strings after apply — and its bite named the hole class
     [101], not the dup; the pure block-append isolates the dup)
                                                     -> s63 pin 4's dup
                                                        invariant
                                                        ("exact-duplicate
                                                        worklog Task IDs")
  E  the helper's empty-corpus neutering (the line source forced to []
     — zero entries AND zero separators, so the 1:1 structure passes
     vacuously and only the floor catches it; the first design's
     report-field neuter report["entries"] = 0 hit the structure check
     first — 203 separators vs 0 entries)
                                                     -> s63 pin 4's floor
                                                        ("found 0" — the s56
                                                        mapDeps lesson)
  F  the README badge revert 288 -> 287             -> s48 family + the s50 BRIDGE
                                                        ("found 287 & 288")
  G  the §7.1 row's test-count mutation 4 -> 3      -> s49 pad pin ("claims 3
                                                        tests — the runtime
                                                        count is 4")
  H  the paired-constant bump to 64                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch)
"""
import pathlib
import shutil
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
BACKUP = pathlib.Path("/tmp/s63-mut-backups")
BACKUP.mkdir(exist_ok=True)

# The text mutations: (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "worklog.md",
        "Task ID: 198-gap-s63",
        "Task ID: 200-gap-s63",
        1,
    ),
    "B": (
        "worklog.md",
        "Agent: main (Super Z) — session 63",
        "Agxnt: main (Super Z) — session 63",
        1,
    ),
    "C": (
        "worklog.md",
        "---\nTask ID: 198-gap-s63",
        "Task ID: 198-gap-s63",
        1,
    ),
    "E": (
        "scripts/check-worklog.py",
        'lines = WORKLOG.read_text(encoding="utf-8").split("\\n")',
        "lines = []",
        1,
    ),
    "F": (
        "README.md",
        "tests-288%20unit",
        "tests-287%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "the coordination surface pinned) | 1 | 4 | `tests/doc-enumeration-contract.test.ts` | Vitest |",
        "the coordination surface pinned) | 1 | 3 | `tests/doc-enumeration-contract.test.ts` | Vitest |",
        1,
    ),
}

# The block-append mutations (backup + append + restore — never git checkout,
# the s53 doctrine; the s62 binary-mutation backup lineage). The renumber
# form of a dup mutation breaks its own revert (2 identical strings after
# apply); the pure block-append duplicates the LAST entry block in full.
BLOCKDUP = {
    "D": "worklog.md",
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 63;", "const CURRENT_SESSION = 64;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 63;", "const CURRENT_SESSION = 64;"),
    ],
}


def apply_blockdup(mid: str) -> None:
    f = BLOCKDUP[mid]
    src = R / f
    dst = BACKUP / f"{mid}.md"
    shutil.copy2(src, dst)
    t = src.read_text(encoding="utf-8")
    lines = t.split("\n")
    idx = max(i for i, l in enumerate(lines) if l == "---")
    block = "\n".join(lines[idx:])
    # the file ends with a newline (measured) — the block appends directly
    sep = "" if t.endswith("\n") else "\n"
    src.write_text(t + sep + block, encoding="utf-8")
    t2 = src.read_text(encoding="utf-8")
    assert t2.count("Task ID: 198-gap-s63") == 2, "the block-append did not duplicate the ID"
    print(f"applied {mid}: {f} (the last entry block appended in full; backup at {dst})")


def revert_blockdup(mid: str) -> None:
    f = BLOCKDUP[mid]
    src = R / f
    dst = BACKUP / f"{mid}.md"
    shutil.copy2(dst, src)
    t = src.read_text(encoding="utf-8")
    assert t.count("Task ID: 198-gap-s63") == 1, "the backup restore left the duplicate"
    print(f"reverted {mid}: {f} restored from backup")


def apply_m(mid: str) -> None:
    if mid in BLOCKDUP:
        apply_blockdup(mid)
        return
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {mid}: the paired bump to 64 in BOTH pin files")
        return
    f, old, new, expect = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{f}: expected {expect} of {old!r}, found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"applied {mid}: {f}")


def revert_m(mid: str) -> None:
    if mid in BLOCKDUP:
        revert_blockdup(mid)
        return
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(new) == 1, f"{f}: {new!r} count {t.count(new)}"
            p.write_text(t.replace(new, old), encoding="utf-8")
        print(f"reverted {mid}: the paired bump restored in BOTH pin files")
        return
    f, old, new, _ = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(new)
    # C's revert target ("Task ID: 198-gap-s63") is a substring of its apply
    # form — after the apply the mangled text carries exactly one bare
    # occurrence (the separator was consumed), so count 1 holds both ways.
    assert n == 1, f"{f}: expected 1 of {new!r}, found {n}"
    p.write_text(t.replace(new, old), encoding="utf-8")
    print(f"reverted {mid}: {f}")


def show(mid: str) -> None:
    if mid in MUTATIONS:
        print(mid, MUTATIONS[mid])
    elif mid in BLOCKDUP:
        print(mid, BLOCKDUP[mid], "(block-append, backup form)")
    elif mid in PAIRED:
        print(mid, PAIRED[mid])
    else:
        print(f"unknown mutation {mid}")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"apply", "revert", "show"}:
        print("usage: s63-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
    {"apply": apply_m, "revert": revert_m, "show": show}[sys.argv[1]](sys.argv[2])
