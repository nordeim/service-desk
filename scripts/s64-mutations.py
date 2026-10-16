#!/usr/bin/env python3
"""S64: the mutation battery definitions (A-H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed per the lesson-117 doctrine — each mutation bites
EXACTLY ONE invariant; the ok-rollup catch is the mechanism, not a second
invariant; OBSERVED in the observation pass before the runner ships):

  A  the undocumented script (the live class: a fake `fixtures:gen` added to
     package.json with no AGENTS-table row — the exact s64 finding shape)
                                                     -> commands pin 1 (the
                                                        documented surface)
                                                        + pin 3's ok rollup
  B  the stale citation (`bun run db:migrate:prod` inserted into CLAUDE.md —
     the renamed-script regression)
                                                     -> commands pin 2 (the
                                                        citation resolution,
                                                        named with file+line)
                                                        + pin 3's ok rollup
  C  the AGENTS table row deletion (the `bun run db:reset` row removed)
                                                     -> commands pin 1 (the
                                                        row-deletion form)
                                                        + pin 3's ok rollup
  D  the helper's docs-citation neutering (the CORE_DOCS loop forced empty —
                                                     doc_counts {} and
                                                     docs_citing 0, every
                                                     other measure intact —
                                                     the vacuous-pass guard's
                                                     pure form)
                                                     -> commands pin 3's
                                                        paired citing-docs
                                                        constant ("expected
                                                        5, found 0") + the ok
                                                        rollup
  E  the workflow command break (`bun run test` -> `bun run test:all` in
     ci.yml — the workflow surface, invisible to every doc)
                                                     -> commands pin 2 (the
                                                        workflow stale, named
                                                        with file+line) +
                                                        pin 3's ok rollup
  F  the README badge revert 291 -> 288             -> s48 family + the s50 BRIDGE
                                                        ("found 288 & 291")
  G  the §7.1 row's test-count mutation 3 -> 2      -> s49 pad pin ("claims 2
                                                        tests — the runtime
                                                        count is 3")
  H  the paired-constant bump to 65                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch)
"""
import pathlib
import shutil
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
BACKUP = pathlib.Path("/tmp/s64-mut-backups")
BACKUP.mkdir(exist_ok=True)

# The text mutations: (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "package.json",
        '"db:generate": "prisma generate",',
        '"db:generate": "prisma generate",\n    "fixtures:gen": "node scripts/build-fixtures.mjs",',
        1,
    ),
    "B": (
        "CLAUDE.md",
        "| `bun run test` / `bun run test:e2e` | 291 unit / 198 E2E (needs prior build) |",
        "| `bun run test` / `bun run test:e2e` | 291 unit / 198 E2E (needs prior build; prod migrations via `bun run db:migrate:prod`) |",
        1,
    ),
    "C": (
        "AGENTS.md",
        "| `bun run db:reset` | Drop + recreate + reseed |\n",
        "",  # the deletion form — the revert uses the BACKUP restore (no anchor survives)
        1,
    ),
    "D": (
        "scripts/check-commands.py",
        "for name in CORE_DOCS:",
        "for name in []:",
        1,
    ),
    "E": (
        ".github/workflows/ci.yml",
        "run: bun run test\n",
        "run: bun run test:all\n",
        1,
    ),
    "F": (
        "README.md",
        "tests-291%20unit",
        "tests-288%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "| 1 | 3 | `tests/commands-contract.test.ts` | Vitest |",
        "| 1 | 2 | `tests/commands-contract.test.ts` | Vitest |",
        1,
    ),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 64;", "const CURRENT_SESSION = 65;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 64;", "const CURRENT_SESSION = 65;"),
    ],
}


def apply_m(mid: str) -> None:
    if mid == "C":
        # the deletion form: backup + delete (the revert restores the whole
        # file — a deleted row leaves no anchor to find, the s62 backup
        # lineage's text-mutation form)
        f = MUTATIONS["C"][0]
        src = R / f
        dst = BACKUP / "C.md"
        shutil.copy2(src, dst)
        _, old, new, expect = MUTATIONS[mid]
        t = src.read_text(encoding="utf-8")
        n = t.count(old)
        assert n == expect, f"{f}: expected {expect} of the row anchor, found {n}"
        src.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied C: {f} (the db:reset row deleted; backup at {dst})")
        return
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {mid}: the paired bump to 65 in BOTH pin files")
        return
    f, old, new, expect = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{f}: expected {expect} of {old!r}, found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"applied {mid}: {f}")


def revert_m(mid: str) -> None:
    if mid == "C":
        f = MUTATIONS["C"][0]
        src = R / f
        dst = BACKUP / "C.md"
        shutil.copy2(dst, src)
        t = src.read_text(encoding="utf-8")
        assert t.count("| `bun run db:reset` | Drop + recreate + reseed |") == 1, "the backup restore lost the row"
        print(f"reverted C: {f} restored from backup")
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
        print("usage: s64-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
    {"apply": apply_m, "revert": revert_m, "show": show}[sys.argv[1]](sys.argv[2])
