#!/usr/bin/env python3
"""S59: the mutation battery definitions (A–G). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse-replace it (count-verified, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass):
  A  the CO-LOCATED live-event shape (a pure-digit excluded token BEFORE a
     dangling hex token on the SAME line)      -> pin 3 THROUGH THE FIXED LOOP
                                                  (the exact shape that escaped
                                                  the s56 battery — the s59 fix
                                                  claimed the co-located token)
  B  the return-regression (the classifier's match-scoped continue reverted
     to the line-level return)                 -> s59 pin 4 (the no-silent-skip
                                                  parity, the dropped tokens named)
  C  the classic fabricated-token quote alone on its line
                                               -> pin 3 (the s56 D-shape)
  D  the PNG-magic exclusion literal de-backticked at ALL its corpus sites
                                               -> pin 3's needed-ness guard
  E  the README badge revert 283 -> 282        -> s48 family + the s50 BRIDGE
  F  the §7.1 row's test-count mutation 4 -> 3 -> s49 pad pin
  G  the paired-constant bump to 60            -> plan-status 1+3 + doc-enumeration
                                                  (the next-session-catch on the
                                                  live plan's own mid-flight boxes)
"""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")

# (file, old, new, expect-on-apply)
MUTATIONS = {
    "A": (
        "worklog.md",
        "\n---\nTask ID: 186-gap-s59",
        "\n---\nMUTATION-A: the co-located shape (commit `1234567`) before the fabricated `deadbeef` token (a mutation line, removed by the revert)\nTask ID: 186-gap-s59",
        1,
    ),
    "B": (
        "tests/artifact-existence-contract.test.ts",
        """        if (isKnownNonCommit(h)) {
          excluded.push({ file, line: i + 1, h });
          continue; // the match-scoped skip — the s59 fix (never `return`)
        }""",
        """        if (isKnownNonCommit(h)) {
          return; // MUTATION-B: the line-level escape regression (the s56–s58 form)
        }""",
        1,
    ),
    "C": (
        "worklog.md",
        "\n---\nTask ID: 186-gap-s59",
        "\n---\nMUTATION-C: the fabricated `deadbeef` token alone on its line (a mutation line, removed by the revert)\nTask ID: 186-gap-s59",
        1,
    ),
    "D_PLAN18": (
        "docs/remediation-plan-session18.md",
        "`89504e470d0a1a0a`",
        "89504e470d0a1a0a",
        3,
    ),
    "D_PLAN56": (
        "docs/remediation-plan-session56.md",
        "`89504e470d0a1a0a`",
        "89504e470d0a1a0a",
        3,
    ),
    "D_SESS25": (
        "docs/session_25.md",
        "`89504e470d0a1a0a`",
        "89504e470d0a1a0a",
        1,
    ),
    "E": (
        "README.md",
        "![Tests](https://img.shields.io/badge/tests-283%20unit%20%2B%20198%20E2E-brightgreen)",
        "![Tests](https://img.shields.io/badge/tests-282%20unit%20%2B%20198%20E2E-brightgreen)",
        1,
    ),
    "F": (
        "Project_Architecture_Document.md",
        "with the co-location shape floor) | 1 | 4 | `tests/artifact-existence-contract.test.ts` | Vitest |",
        "with the co-location shape floor) | 1 | 3 | `tests/artifact-existence-contract.test.ts` | Vitest |",
        1,
    ),
    "G_PLAN_STATUS_CURRENT": (
        "tests/plan-status-contract.test.ts",
        "const CURRENT_SESSION = 59;",
        "const CURRENT_SESSION = 60;",
        1,
    ),
    "G_PLAN_STATUS_FLOOR": (
        "tests/plan-status-contract.test.ts",
        "const PLAN_CORPUS_FLOOR = 58;",
        "const PLAN_CORPUS_FLOOR = 59;",
        1,
    ),
    "G_DOC_ENUM_CURRENT": (
        "tests/doc-enumeration-contract.test.ts",
        "const CURRENT_SESSION = 59;",
        "const CURRENT_SESSION = 60;",
        1,
    ),
}

# G is one logical mutation across three constants;
# D is one logical mutation across THREE files (the needed-ness guard checks
# the citedAll union across the whole corpus — every citation of the literal
# must go: the s58 mutation-B multi-site lesson, held from the s57 C-redesign)
GROUPS = {
    "G": ["G_PLAN_STATUS_CURRENT", "G_PLAN_STATUS_FLOOR", "G_DOC_ENUM_CURRENT"],
    "D": ["D_PLAN18", "D_PLAN56", "D_SESS25"],
}


def apply_one(key):
    file, old, new, expect = MUTATIONS[key]
    p = R / file
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"apply {key}: expected {expect} of the anchor, found {n} in {file}"
    p.write_text(t.replace(old, new) if expect > 1 else t.replace(old, new, 1))
    print(f"applied {key} on {file} (x{expect})")


def revert_one(key):
    file, old, new, expect = MUTATIONS[key]
    # revert = replace new -> old (the new text must now be present exactly expect times)
    p = R / file
    t = p.read_text()
    n = t.count(new)
    assert n == expect, f"revert {key}: expected the mutated form x{expect}, found {n} in {file}"
    p.write_text(t.replace(new, old) if expect > 1 else t.replace(new, old, 1))
    print(f"reverted {key} on {file} (x{expect})")


def main():
    if len(sys.argv) < 3 or sys.argv[1] not in ("apply", "revert", "show"):
        print(__doc__)
        sys.exit(2)
    action, key = sys.argv[1], sys.argv[2]
    keys = GROUPS.get(key, [key])
    for k in keys:
        if action == "show":
            file, old, new, expect = MUTATIONS[k]
            print(f"{k}: {file}\n  old: {old[:90]!r}\n  new: {new[:90]!r} (x{expect})")
        elif action == "apply":
            apply_one(k)
        elif action == "revert":
            revert_one(k)


if __name__ == "__main__":
    main()
