#!/usr/bin/env python3
"""S53: the mutation applier/reverter — each mutation is an exact-string
apply + reverse-replace revert (NEVER git checkout, the s48 doctrine).
Usage: s53-mutations.py apply|revert A|B|C|D|E|F|G"""
import sys

REPO = "/home/z/my-project/service-desk"

# (file, old, new, label) — old = the GREEN state (apply: old->new, revert: new->old)
MUTATIONS = {
    # A: a §11 figure reverted to its stale value — bites pin 1 (staleness)
    "A": ("Project_Architecture_Document.md",
          "| `src/lib/validation.ts` | 437 |",
          "| `src/lib/validation.ts` | 120 |"),
    # B: a §11 figure off-by-one — bites pin 1 (exactness)
    "B": ("Project_Architecture_Document.md",
          "| `src/lib/db-path.ts` | 107 |",
          "| `src/lib/db-path.ts` | 106 |"),
    # C: the ~ hedge reintroduced — bites pin 1 (the form grammar)
    "C": ("Project_Architecture_Document.md",
          "| `src/lib/auth.ts` | 232 |",
          "| `src/lib/auth.ts` | ~232 |"),
    # D: one §11 row deleted (neighbor-anchor pair) — bites pin 2 (floor 18)
    "D": ("Project_Architecture_Document.md",
          "| `playwright.config.ts` | 68 | Standalone-server E2E topology (ADR-006) |\n| `next.config.ts` | 82 |",
          "| `next.config.ts` | 82 |"),
    # E: the seed-data row's path mutated (seed-data.ts -> seed-data2.ts) — the
    # floor stays 18 so pin 2's key-coverage assertion fires DISTINCTLY (+ pin 1
    # on the nonexistent path — a row deletion would only ever bite the floor)
    "E": ("Project_Architecture_Document.md",
          "| `prisma/seed-data.ts` | 174 |",
          "| `prisma/seed-data2.ts` | 174 |"),
    # F: the SKILL auth test-figure revert — bites pin 3 (the §7.1-chained claim)
    "F": ("service-desk_SKILL.md",
          "`src/lib/auth.ts` (232 auditable lines, 20 unit tests)",
          "`src/lib/auth.ts` (232 auditable lines, 11 unit tests)"),
    # G: a family-site revert — bites the s48 family pin + the s50 BRIDGE
    "G": ("README.md",
          "tests-263%20unit",
          "tests-260%20unit"),
}

def main():
    mode, key = sys.argv[1], sys.argv[2]
    path, old, new = MUTATIONS[key]
    with open(f"{REPO}/{path}") as f:
        content = f.read()
    src, dst = (old, new) if mode == "apply" else (new, old)
    n = content.count(src)
    if n != 1:
        print(f"FATAL: mutation {key} {mode}: expected exactly 1 occurrence of the {mode}-side string, found {n}")
        sys.exit(1)
    with open(f"{REPO}/{path}", "w") as f:
        f.write(content.replace(src, dst))
    print(f"OK: mutation {key} {mode} on {path}")

if __name__ == "__main__":
    main()
