#!/usr/bin/env python3
"""S66: the mutation battery definitions (A-H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed per the lesson-117/118 doctrine — each mutation bites
EXACTLY ONE invariant; the first-failing expect is the designed bite, every
other invariant still holds; OBSERVED in the observation pass before the
runner ships):

  A  the runner unpinned (the live class: the verify job back to
     ubuntu-latest — the floating alias)
                                                     -> ci-contract pin 5 (the
                                                        never-ubuntu-latest
                                                        guard)
  B  the toolchain unpinned (the e2e job's setup-bun back to latest)
                                                     -> ci-contract pin 6 (the
                                                        never-latest guard)
  C  the runner drift (the e2e job pinned to a DIFFERENT OS — ubuntu-22.04)
                                                     -> ci-contract pin 5 (the
                                                        both-same-literal guard)
  D  the toolchain drift (the verify job pinned to a different bun — 1.2.0)
                                                     -> ci-contract pin 6 (the
                                                        both-same-literal guard)
  E  the pin commented out (the verify job's bun-version line prefixed #)
                                                     -> ci-contract pin 6 (the
                                                        line-anchored count —
                                                        the s43 mutation-C
                                                        doctrine)
  F  the README badge revert 296 -> 294             -> s48 family + the s50
                                                        BRIDGE ("found 294 & 296")
  G  the §7.1 row's test-count mutation 6 -> 5      -> s49 pad pin ("claims 5
                                                        tests — the runtime
                                                        count is 6")
  H  the paired-constant bump to 67                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch)
"""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
BACKUP = pathlib.Path("/tmp/s66-mut-backups")
BACKUP.mkdir(exist_ok=True)

# The text mutations: (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        ".github/workflows/ci.yml",
        "    runs-on: ubuntu-24.04\n    env:",
        "    runs-on: ubuntu-latest\n    env:",
        1,
    ),
    "B": (
        ".github/workflows/ci.yml",
        "          # Session 66: pinned — same rationale as the verify job.\n          bun-version: 1.3.14",
        "          # Session 66: pinned — same rationale as the verify job.\n          bun-version: latest",
        1,
    ),
    "C": (
        ".github/workflows/ci.yml",
        "    runs-on: ubuntu-24.04\n    needs: verify",
        "    runs-on: ubuntu-22.04\n    needs: verify",
        1,
    ),
    "D": (
        ".github/workflows/ci.yml",
        "          bun-version: 1.3.14\n\n      - name: Install dependencies\n        run: bun install --frozen-lockfile\n\n      - name: Generate Prisma client\n        run: bun run db:generate\n\n      - name: Lint",
        "          bun-version: 1.2.0\n\n      - name: Install dependencies\n        run: bun install --frozen-lockfile\n\n      - name: Generate Prisma client\n        run: bun run db:generate\n\n      - name: Lint",
        1,
    ),
    "E": (
        ".github/workflows/ci.yml",
        "          bun-version: 1.3.14\n\n      - name: Install dependencies\n        run: bun install --frozen-lockfile\n\n      - name: Generate Prisma client\n        run: bun run db:generate\n\n      - name: Lint",
        "          # bun-version: 1.3.14\n\n      - name: Install dependencies\n        run: bun install --frozen-lockfile\n\n      - name: Generate Prisma client\n        run: bun run db:generate\n\n      - name: Lint",
        1,
    ),
    "F": (
        "README.md",
        "tests-296%20unit",
        "tests-294%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "| 1 | 6 | `tests/ci-contract.test.ts` | Vitest |",
        "| 1 | 5 | `tests/ci-contract.test.ts` | Vitest |",
        1,
    ),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 66;", "const CURRENT_SESSION = 67;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 66;", "const CURRENT_SESSION = 67;"),
    ],
}


def apply_m(mid: str) -> None:
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {mid}: the paired bump to 67 in BOTH pin files")
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
        print("usage: s66-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
    {"apply": apply_m, "revert": revert_m, "show": show}[sys.argv[1]](sys.argv[2])
