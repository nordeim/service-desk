#!/usr/bin/env python3
"""S58: the mutation battery definitions (A–G). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse-replace it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass):
  A  a core-doc path reference made dangling            -> s58 pin 1
  B  an exclusion entry's citation de-backticked        -> s58 pin 2 (stale exclusion)
  C  the pin's PATH_RE crippled to one prefix           -> s58 pin 3 (the vacuous-pass floor)
  D  the fabricated-token quote re-introduced backticked -> s56 pin 3 (the live event, 3rd time)
  E  the README badge revert 282 -> 279                 -> s48 family + the s50 BRIDGE
  F  the §7.1 row's test-count mutation 3 -> 2          -> s49 pad pin
  G  the paired-constant bump to 59                     -> plan-status 1+3 + doc-enumeration 1+2+3
                                                          (the next-session-catch on the live plan)
"""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")

# (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "AGENTS.md",
        "- **One database contract:** `DATABASE_URL=\"file:../db/custom.db\"` resolves **against `prisma/schema.prisma`**",
        "- **One database contract:** `DATABASE_URL=\"file:../db/custom.db\"` resolves **against `prisma/schema.prisma` (the anchor seam `src/lib/db-pathz.ts`)**",
        1,
    ),
    "B_AGENTS_342": (
        "AGENTS.md",
        "a mid-run FAIL used to leave `db/smoke.db` behind (the removal lived only on the success path)",
        "a mid-run FAIL used to leave db/smoke.db behind (the removal lived only on the success path)",
        1,
    ),
    "B_AGENTS_S58": (
        "AGENTS.md",
        "the SMOKE TRANSIENT `db/smoke.db` (the trap removes it at the end of every run)",
        "the SMOKE TRANSIENT db/smoke.db (the trap removes it at the end of every run)",
        1,
    ),
    "B_PAD_ROW": (
        "Project_Architecture_Document.md",
        "the smoke transient `db/smoke.db` + the replaced-static",
        "the smoke transient db/smoke.db + the replaced-static",
        1,
    ),
    "B_SKILL_LESSON": (
        "service-desk_SKILL.md",
        "the smoke transient `db/smoke.db`, the replaced-static",
        "the smoke transient db/smoke.db, the replaced-static",
        1,
    ),
    "C": (
        "tests/doc-path-reachability-contract.test.ts",
        "const PATH_RE = /`((?:src|tests|docs|prisma|scripts|db|public|skills)\\/[A-Za-z0-9_./-]+)`/g;",
        "const PATH_RE = /`((?:skills)\\/[A-Za-z0-9_./-]+)`/g;",
        1,
    ),
    "D": (
        "worklog.md",
        "\n---\nTask ID: 183-gap-s58",
        "\n---\nMUTATION-D: the fabricated `deadbeef` token quote (a mutation line, removed by the revert)\nTask ID: 183-gap-s58",
        1,
    ),
    "E": (
        "README.md",
        "![Tests](https://img.shields.io/badge/tests-282%20unit%20%2B%20198%20E2E-brightgreen)",
        "![Tests](https://img.shields.io/badge/tests-279%20unit%20%2B%20198%20E2E-brightgreen)",
        1,
    ),
    "F": (
        "Project_Architecture_Document.md",
        "the checked-reference floor 500 — the vacuous-pass guard) | 1 | 3 | `tests/doc-path-reachability-contract.test.ts` | Vitest |",
        "the checked-reference floor 500 — the vacuous-pass guard) | 1 | 2 | `tests/doc-path-reachability-contract.test.ts` | Vitest |",
        1,
    ),
    "G_PLAN_STATUS_CURRENT": (
        "tests/plan-status-contract.test.ts",
        "const CURRENT_SESSION = 58;",
        "const CURRENT_SESSION = 59;",
        1,
    ),
    "G_PLAN_STATUS_FLOOR": (
        "tests/plan-status-contract.test.ts",
        "const PLAN_CORPUS_FLOOR = 57;",
        "const PLAN_CORPUS_FLOOR = 58;",
        1,
    ),
    "G_DOC_ENUM_CURRENT": (
        "tests/doc-enumeration-contract.test.ts",
        "const CURRENT_SESSION = 58;",
        "const CURRENT_SESSION = 59;",
        1,
    ),
}

# G is one logical mutation across three constants;
# B is one logical mutation across FOUR sites (the includes()-based needed-ness
# check needs EVERY citation gone — the single-site de-backtick does NOT bite:
# the s57 mutation-C redesign lesson, observed in flight this session)
GROUPS = {
    "G": ["G_PLAN_STATUS_CURRENT", "G_PLAN_STATUS_FLOOR", "G_DOC_ENUM_CURRENT"],
    "B": ["B_AGENTS_342", "B_AGENTS_S58", "B_PAD_ROW", "B_SKILL_LESSON"],
}


def apply_one(key):
    file, old, new, expect = MUTATIONS[key]
    p = R / file
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"apply {key}: expected {expect} of the anchor, found {n} in {file}"
    p.write_text(t.replace(old, new, 1))
    print(f"applied {key} on {file}")


def revert_one(key):
    file, old, new, expect = MUTATIONS[key]
    # revert = replace new -> old (the new text must now be present exactly once)
    p = R / file
    t = p.read_text()
    n = t.count(new)
    assert n == 1, f"revert {key}: expected the mutated form exactly once, found {n} in {file}"
    p.write_text(t.replace(new, old, 1))
    print(f"reverted {key} on {file}")


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("apply", "revert", "show"):
        print(__doc__)
        sys.exit(2)
    op, ident = sys.argv[1], sys.argv[2].upper()
    keys = GROUPS.get(ident, [ident])
    if ident not in MUTATIONS and ident not in GROUPS:
        print(f"unknown mutation {ident}; known: A B C D E F G")
        sys.exit(2)
    for k in keys:
        if op == "apply":
            apply_one(k)
        elif op == "revert":
            revert_one(k)
        else:
            file, old, new, _ = MUTATIONS[k]
            print(f"{k} on {file}:\n  old: {old[:70]}\n  new: {new[:70]}")


if __name__ == "__main__":
    main()
