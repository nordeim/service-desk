#!/usr/bin/env python3
"""S61: the mutation battery definitions (A–H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse-replace it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass — every bite
message below was produced by a live vitest run before this file landed):
  A  the bash syntax error (an unbalanced shell quote in a .sh entry point)
                                                     -> s61 pin 3 naming
                                                        file+tool (bash -n)
  B  the node parse error (a corrupted .mjs arrow function)
                                                     -> s61 pin 3 naming
                                                        file+tool (node --check)
  C  the tsc type error (a type-annotated .ts, the .ts-specific layer)
                                                     -> s61 pin 3 naming
                                                        file+tool (tsc — the
                                                        stdout-parsing lesson)
  D  the family deletion (s57-wave-analysis.py renamed away)
                                                     -> s61 pin 2 (the family
                                                        floor 5 -> 4)
  E  the helper's scanned-count neutering (the --json report claims zero
     scanned per language — the vacuous shape)     -> s61 pin 3's per-language
                                                        floors (the s56 mapDeps
                                                        lesson)
  F  the README badge revert 286 -> 285             -> s48 family + the s50 BRIDGE
                                                        ("found 285 & 286")
  G  the §7.1 row's test-count mutation 3 -> 2      -> s49 pad pin ("claims 2
                                                        tests — the runtime
                                                        count is 3")
  H  the paired-constant bump to 62                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch
                                                        on the live plan's own
                                                        mid-flight boxes)
"""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")

# (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "scripts/s61-ref-sweep.sh",
        "set -o pipefail",
        "set -o pipefail\nif [ then; fi",
        1,
    ),
    "B": (
        "scripts/s61-vlm-check.mjs",
        "const toB64 = (p) => fs.readFileSync(p).toString('base64');",
        "const toB64 = :( => fs.readFileSync(p).toString('base64');",
        1,
    ),
    "C": (
        "scripts/s61-probe-cleanup.ts",
        "const prisma = new PrismaClient();",
        "const prisma: number = new PrismaClient();",
        1,
    ),
    "E": (
        "scripts/check-syntax.py",
        '"scanned": {"sh": len(sh), "mjs": len(mjs), "ts": len(ts)},',
        '"scanned": {"sh": 0, "mjs": 0, "ts": 0},',
        1,
    ),
    "F": (
        "README.md",
        "tests-286%20unit",
        "tests-285%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "per-language floors 120/115/15 the vacuous-pass guards; + the scanned-files floor 75, the vacuous-pass guard; + the wave-analysis family floor 5 with the per-session contiguity — the family is a sequence) | 1 | 3 | `tests/scripts-integrity-contract.test.ts` | Vitest |",
        "per-language floors 120/115/15 the vacuous-pass guard; + the scanned-files floor 75, the vacuous-pass guard; + the wave-analysis family floor 5 with the per-session contiguity — the family is a sequence) | 1 | 2 | `tests/scripts-integrity-contract.test.ts` | Vitest |",
        1,
    ),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 61;", "const CURRENT_SESSION = 62;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 61;", "const CURRENT_SESSION = 62;"),
    ],
}

# The family-deletion mutations are renames (not replacements)
RENAME = {
    "D": ("scripts/s57-wave-analysis.py", "scripts/s57-wave-analysis.py.mut"),
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
        print(f"applied {id}: the paired bump to 62 in BOTH pin files")
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
        print(f"{id}: RENAME {RENAME[id][0]} -> {RENAME[id][1]}")
    elif id in PAIRED:
        print(f"{id}: PAIRED {[x[0] for x in PAIRED[id]]}")
    else:
        f, old, new, _ = MUTATIONS[id]
        print(f"{id}: {f}: {old[:60]!r} -> {new[:60]!r}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    id_ = sys.argv[2] if len(sys.argv) > 2 else ""
    if cmd == "apply" and id_:
        apply_m(id_)
    elif cmd == "revert" and id_:
        revert_m(id_)
    elif cmd == "show" and id_:
        show(id_)
    else:
        print("usage: s61-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
