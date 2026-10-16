#!/usr/bin/env python3
"""S65: the mutation battery definitions (A-H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed per the lesson-117/118 doctrine — each mutation bites
EXACTLY ONE invariant; the ok-rollup catch is the mechanism, not a second
invariant; OBSERVED in the observation pass before the runner ships):

  A  the tsconfig override reintroduced (the live class: the scaffold's
     `"noImplicitAny": false` back in — the exact s65 finding shape)
                                                     -> gate-config pin 1 (the
                                                        strictness-weakening
                                                        guard)
  B  the eslint off-rule restored (`no-explicit-any` back to "off")
                                                     -> gate-config pin 2 (the
                                                        no-explicit-any part)
  C  the AGENTS-claimed rule weakened (`react-hooks/set-state-in-effect`
     added to the off list — the AGENTS "is an ERROR" claim)
                                                     -> gate-config pin 2 (the
                                                        set-state-in-effect part)
  D  the vitest include widened (`*.spec.ts` added — the never-run-twice
     convention broken)
                                                     -> gate-config pin 3 (the
                                                        include part)
  E  the tsconfig exclude drops "skills" (the operator's standing
     exclusion unpinned at the compilation layer)
                                                     -> gate-config pin 1 (the
                                                        exclusion part)
  F  the README badge revert 294 -> 291             -> s48 family + the s50 BRIDGE
                                                        ("found 291 & 294")
  G  the §7.1 row's test-count mutation 3 -> 2      -> s49 pad pin ("claims 2
                                                        tests — the runtime
                                                        count is 3")
  H  the paired-constant bump to 66                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch)
"""
import pathlib
import shutil
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
BACKUP = pathlib.Path("/tmp/s65-mut-backups")
BACKUP.mkdir(exist_ok=True)

# The text mutations: (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "tsconfig.json",
        '"noEmit": true,\n    "esModuleInterop": true,',
        '"noEmit": true,\n    "noImplicitAny": false,\n    "esModuleInterop": true,',
        1,
    ),
    "B": (
        "eslint.config.mjs",
        '"@typescript-eslint/no-explicit-any": "error",',
        '"@typescript-eslint/no-explicit-any": "off",',
        1,
    ),
    "C": (
        "eslint.config.mjs",
        '"react-hooks/exhaustive-deps": "off",',
        '"react-hooks/exhaustive-deps": "off",\n    "react-hooks/set-state-in-effect": "off",',
        1,
    ),
    "D": (
        "vitest.config.ts",
        'include: ["src/**/*.test.ts", "tests/**/*.test.ts"],',
        'include: ["src/**/*.test.ts", "tests/**/*.test.ts", "tests/e2e/**/*.spec.ts"],',
        1,
    ),
    "E": (
        "tsconfig.json",
        '"node_modules",\n    "skills"',
        '"node_modules"',
        1,
    ),
    "F": (
        "README.md",
        "tests-294%20unit",
        "tests-291%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "| 1 | 3 | `tests/gate-config-contract.test.ts` | Vitest |",
        "| 1 | 2 | `tests/gate-config-contract.test.ts` | Vitest |",
        1,
    ),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 65;", "const CURRENT_SESSION = 66;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 65;", "const CURRENT_SESSION = 66;"),
    ],
}


def apply_m(mid: str) -> None:
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {mid}: the paired bump to 66 in BOTH pin files")
        return
    f, old, new, expect = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{f}: expected {expect} of {old!r}, found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"applied {mid}: {f}")


def revert_m(mid: str) -> None:
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
    assert n == 1, f"{f}: expected 1 of {new!r}, found {n}"
    p.write_text(t.replace(new, old), encoding="utf-8")
    print(f"reverted {mid}: {f}")


def show(mid: str) -> None:
    if mid in MUTATIONS:
        print(mid, MUTATIONS[mid])
    elif mid in PAIRED:
        print(mid, PAIRED[mid])
    else:
        print(f"unknown mutation {mid}")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"apply", "revert", "show"}:
        print("usage: s65-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
    {"apply": apply_m, "revert": revert_m, "show": show}[sys.argv[1]](sys.argv[2])
