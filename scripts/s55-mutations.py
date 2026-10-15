#!/usr/bin/env python3
"""S55: the mutation applier (A–G). Each mutation applies a deliberate break,
observed against the pins (the observed-first doctrine — the bite patterns in
the runner were captured live, never guessed), then reverts by
REVERSE-REPLACE (never git checkout — the s53 doctrine).

  A  the s38 box re-uncheck (shape A reintroduced)         -> pin 1 + pin 2
  B  the s54 box re-uncheck (shape B, record text kept)    -> pin 1 + pin 2
  C  a fresh shape-A line in the CURRENT session's plan    -> pin 2 ONLY
  D  a plan file renamed off the corpus                    -> pin 3 (floor)
  E  the README badge revert 273 -> 270                    -> s48 family + BRIDGE
  F  the §7.1 row's test count 3 -> 2                      -> s49 pad pin
  G  CURRENT_SESSION 55 -> 56 (the boundary transition)    -> pin 1 (s55) + pin 3 (s56)
"""
import sys

REPO = "/home/z/my-project/service-desk"

def edit(path, old, new, expect=1):
    with open(f"{REPO}/{path}") as f:
        c = f.read()
    n = c.count(old)
    if n != expect:
        print(f"FATAL: {path!r} expected {expect} occurrence(s) of the needle, found {n}")
        sys.exit(1)
    with open(f"{REPO}/{path}", "w") as f:
        f.write(c.replace(old, new))

S38_BOX_X = "- [x] Gap analysis (F1–F5 + P1/P2/P3) — complete, recorded in worklog task 100-gap-s38 (the box flipped at session 55"
S38_BOX_UN = "- [ ] Gap analysis (F1–F5 + P1/P2/P3) — complete, recorded in worklog task 100-gap-s38 (the box flipped at session 55"
S54_BOX_X = "- [x] Commit + push + CI verification — `115431e` (the remediation)"
S54_BOX_UN = "- [ ] Commit + push + CI verification — `115431e` (the remediation)"
S55_MUT_LINE = "- [ ] The mutation checks (7: A–G, each observed + reverted + re-verified; G the boundary-transition simulation proving the next-session-catch mechanism)"
S55_FRESH_A = "- [ ] The mutation battery rehearsal — complete, recorded in the dry-run log\n"
CONST_55 = "const CURRENT_SESSION = 55;"
CONST_56 = "const CURRENT_SESSION = 56;"
S55_ROW_3 = "| 1 | 3 | `tests/plan-status-contract.test.ts` | Vitest |"
S55_ROW_2 = "| 1 | 2 | `tests/plan-status-contract.test.ts` | Vitest |"

def apply_m(m):
    if m == "A":
        edit("docs/remediation-plan-session38.md", S38_BOX_X, S38_BOX_UN)
    elif m == "B":
        edit("docs/remediation-plan-session54.md", S54_BOX_X, S54_BOX_UN)
    elif m == "C":
        edit("docs/remediation-plan-session55.md", S55_MUT_LINE, S55_FRESH_A + S55_MUT_LINE)
    elif m == "D":
        import os
        os.rename(f"{REPO}/docs/remediation-plan-session53.md",
                  "/tmp/s55-mutation-D-plan53.md")
    elif m == "E":
        edit("README.md", "tests-273%20unit", "tests-270%20unit")
    elif m == "F":
        edit("Project_Architecture_Document.md", S55_ROW_3, S55_ROW_2)
    elif m == "G":
        edit("tests/plan-status-contract.test.ts", CONST_55, CONST_56)
    else:
        print(f"FATAL: unknown mutation {m!r}")
        sys.exit(1)

def revert_m(m):
    if m == "A":
        edit("docs/remediation-plan-session38.md", S38_BOX_UN, S38_BOX_X)
    elif m == "B":
        edit("docs/remediation-plan-session54.md", S54_BOX_UN, S54_BOX_X)
    elif m == "C":
        edit("docs/remediation-plan-session55.md", S55_FRESH_A, "", expect=1)
    elif m == "D":
        import os
        os.rename("/tmp/s55-mutation-D-plan53.md",
                  f"{REPO}/docs/remediation-plan-session53.md")
    elif m == "E":
        edit("README.md", "tests-270%20unit", "tests-273%20unit")
    elif m == "F":
        edit("Project_Architecture_Document.md", S55_ROW_2, S55_ROW_3)
    elif m == "G":
        edit("tests/plan-status-contract.test.ts", CONST_56, CONST_55)
    else:
        print(f"FATAL: unknown mutation {m!r}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("apply", "revert"):
        print("usage: s55-mutations.py apply|revert A|B|C|D|E|F|G")
        sys.exit(1)
    (apply_m if sys.argv[1] == "apply" else revert_m)(sys.argv[2])
    print(f"OK   {sys.argv[1]} {sys.argv[2]}")
