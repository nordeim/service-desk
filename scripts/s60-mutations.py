#!/usr/bin/env python3
"""S60: the mutation battery definitions (A–G). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse-replace it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass):
  A  the lineage re-introduction (the s59 wave-analysis script's line 24
     reverted to the s56_b form)                   -> s60 pin 1 (the exact live
                                                      class, on the historical
                                                      file the live bug lived in)
  B  the fresh-generation form (the s60 script's own baseline variable
     swapped for a stale one)                       -> s60 pin 1 (naming
                                                      file+line+name — the class
                                                      a future make-battery
                                                      generation could ship)
  C  the family deletion (s57-wave-analysis.py renamed away)
                                                     -> s60 pin 2 (the family
                                                      floor 4 -> 3)
  D  the helper's scanned-count neutering (the --json report claims zero
     scanned files — the vacuous shape)             -> s60 pin 1's scanned-files
                                                      floor (the s56 mapDeps
                                                      lesson: an emptied corpus
                                                      must fail loudly, not
                                                      vacuous-pass)
  E  the README badge revert 285 -> 283             -> s48 family + the s50 BRIDGE
  F  the §7.1 new row's test-count mutation 2 -> 1  -> s49 pad pin
  G  the paired-constant bump to 61                 -> plan-status 1+3 +
                                                      doc-enumeration 1+2+3 (the
                                                      next-session-catch on the
                                                      live plan's own mid-flight
                                                      boxes)
"""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")

# (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "scripts/s59-wave-analysis.py",
        "added = cur_b - s58_b",
        "added = cur_b - s56_b",
        1,
    ),
    "B": (
        "scripts/s60-wave-analysis.py",
        "added = cur_b - s59_b",
        "added = cur_b - s55_b",
        1,
    ),
    "D": (
        "scripts/check-undefined-names.py",
        'report: dict = {"scanned": len(scripts), "offenders": {}}',
        'report: dict = {"scanned": 0, "offenders": {}}',
        1,
    ),
    "E": (
        "README.md",
        "tests-285%20unit",
        "tests-283%20unit",
        1,
    ),
    "F": (
        "Project_Architecture_Document.md",
        "per-session contiguity — the family is a sequence) | 1 | 2 | `tests/scripts-integrity-contract.test.ts` | Vitest |",
        "per-session contiguity — the family is a sequence) | 1 | 1 | `tests/scripts-integrity-contract.test.ts` | Vitest |",
        1,
    ),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "G": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 60;", "const CURRENT_SESSION = 61;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 60;", "const CURRENT_SESSION = 61;"),
    ],
}

# The family-deletion mutations are renames (not replacements)
RENAME = {
    "C": ("scripts/s57-wave-analysis.py", "scripts/s57-wave-analysis.py.mut"),
}


def apply_m(id: str) -> None:
    if id in RENAME:
        src, dst = RENAME[id]
        (R / src).rename(R / dst)
        print(f"applied {id}: renamed {src} -> {dst}")
        return
    if id in PAIRED:
        for f, old, new in PAIRED[id]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {id}: the paired bump to 61 in BOTH pin files")
        return
    f, old, new, expect = MUTATIONS[id]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{f}: expected {expect} of {old!r}, found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"applied {id}: {f}")


def revert_m(id: str) -> None:
    if id in RENAME:
        src, dst = RENAME[id]
        (R / dst).rename(R / src)
        print(f"reverted {id}: renamed {dst} -> {src}")
        return
    if id in PAIRED:
        for f, old, new in PAIRED[id]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(new) == 1, f"{f}: {new!r} count {t.count(new)}"
            p.write_text(t.replace(new, old), encoding="utf-8")
        print(f"reverted {id}: the paired bump restored in BOTH pin files")
        return
    f, old, new, _ = MUTATIONS[id]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(new)
    assert n == 1, f"{f}: expected 1 of {new!r}, found {n}"
    p.write_text(t.replace(new, old), encoding="utf-8")
    print(f"reverted {id}: {f}")


def show(id: str) -> None:
    if id in RENAME:
        print(f"{id}: rename {RENAME[id][0]} -> {RENAME[id][1]}")
    elif id in PAIRED:
        for f, old, new in PAIRED[id]:
            print(f"{id}: {f}: {old!r} -> {new!r}")
    else:
        f, old, new, expect = MUTATIONS[id]
        print(f"{id}: {f}: {old!r} -> {new!r} (expect {expect})")


if __name__ == "__main__":
    cmd, id = sys.argv[1], sys.argv[2]
    {"apply": apply_m, "revert": revert_m, "show": show}[cmd](id)
