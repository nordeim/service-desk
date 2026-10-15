#!/usr/bin/env python3
"""S55: the doc-fixes script (the GREEN — every replacement count-verified
exactly-once, the s52/s53/s54 doctrine). Lands:
  1. the PAD §7.1 NEW row (plan-status-contract.test.ts 3 tests — after the
     s54 coverage row)
  2. the PAD §7.4 checklist 270/263 -> 273/270
  3. the corpus move 270 -> 273 (9 family sites + the quickstart line 31/273
     + the corpus pin's toBe literal + lineage comment + the BRIDGE ternary)
"""
import sys

REPO = "/home/z/my-project/service-desk"

def apply(content, old, new, expect_count=1, label=""):
    n = content.count(old)
    if n != expect_count:
        print(f"FATAL: {label!r} expected {expect_count} occurrence(s), found {n}")
        sys.exit(1)
    print(f"OK   {label}")
    return content.replace(old, new)

def read(p):
    with open(f"{REPO}/{p}") as f:
        return f.read()

def write(p, content):
    with open(f"{REPO}/{p}", "w") as f:
        f.write(content)

# ---------- 1. the PAD §7.1 NEW row (after the s54 coverage row) ----------
PAD = read("Project_Architecture_Document.md")
PAD = apply(PAD,
    "| Unit — the s54 source-side coverage pins (the PAD §7.3 universal held to the fs + the test-import graph: the fs boundary — a new src/lib seam fails loudly until mapped or excluded; the map verification — every mapped test exists AND imports its source; the exclusion exactness + the §7.3 claim-presence) | 1 | 3 | `tests/pad-coverage-contract.test.ts` | Vitest |",
    "| Unit — the s54 source-side coverage pins (the PAD §7.3 universal held to the fs + the test-import graph: the fs boundary — a new src/lib seam fails loudly until mapped or excluded; the map verification — every mapped test exists AND imports its source; the exclusion exactness + the §7.3 claim-presence) | 1 | 3 | `tests/pad-coverage-contract.test.ts` | Vitest |\n"
    "| Unit — the s55 plan-status pins (the remediation plans' execution-status sections held to the state they assert: the closed-plans completeness — every plan numbered below the current session carries zero unchecked boxes, the closeout omission caught at the next boundary; the self-contradiction guard — an unchecked box whose own text asserts completion caught the moment it is written; the enumeration honesty — the glob-driven walk + the corpus floor 53 + the current session's plan present) | 1 | 3 | `tests/plan-status-contract.test.ts` | Vitest |",
    label="§7.1 the NEW s55 row (3 tests)")

# ---------- 2. the §7.4 checklist 270/263 -> 273/270 ----------
PAD = apply(PAD, "- [ ] `bun run test` — 270/263", "- [ ] `bun run test` — 273/270",
            label="§7.4 checklist 270/263 -> 273/270")

write("Project_Architecture_Document.md", PAD)

# ---------- 3a. the corpus move 270 -> 273 (the 9 family sites) ----------
README = read("README.md")
README = apply(README, "tests-270%20unit", "tests-273%20unit", label="README badge 270 -> 273")
README = apply(README, "270 Vitest unit tests", "273 Vitest unit tests", label="README verification 270 -> 273")
README = apply(README, "270 unit + 198 E2E tests", "273 unit + 198 E2E tests", label="README pyramid 270 -> 273")
README = apply(README, "Vitest unit: 270 tests", "Vitest unit: 273 tests", label="README commands 270 -> 273")
README = apply(README, "30 files / 270 tests passed", "31 files / 273 tests passed", label="README quickstart 30/270 -> 31/273")
write("README.md", README)

AGENTS = read("AGENTS.md")
AGENTS = apply(AGENTS, "unit suite (270 tests", "unit suite (273 tests", label="AGENTS commands 270 -> 273")
write("AGENTS.md", AGENTS)

CLAUDE = read("CLAUDE.md")
CLAUDE = apply(CLAUDE, "270 unit / 198 E2E (needs", "273 unit / 198 E2E (needs", label="CLAUDE commands 270 -> 273")
write("CLAUDE.md", CLAUDE)

SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL, "project_state: 270 unit", "project_state: 273 unit", label="SKILL project_state 270 -> 273")
SKILL = apply(SKILL, "Vitest — 270 unit tests", "Vitest — 273 unit tests", label="SKILL Appendix A 270 -> 273")
write("service-desk_SKILL.md", SKILL)

# ---------- 3b. the corpus pin's toBe literal + lineage + BRIDGE ternary ----------
CORPUS = read("tests/corpus-count-contract.test.ts")
CORPUS = apply(CORPUS,
    "    // The current canonical (runtime-verified every session's gate): 270\n"
    "    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart\n"
    "    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +\n"
    "    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54\n"
    "    // coverage pins 3. A suite change without the doc move fails the\n"
    "    // consistency check above; a doc move without the suite change fails the\n"
    "    // gate itself.\n"
    "    expect(Number(n)).toBe(270);",
    "    // The current canonical (runtime-verified every session's gate): 273\n"
    "    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart\n"
    "    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +\n"
    "    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54\n"
    "    // coverage pins 3 + the s55 plan-status pins 3. A suite change without\n"
    "    // the doc move fails the consistency check above; a doc move without the\n"
    "    // suite change fails the gate itself.\n"
    "    expect(Number(n)).toBe(273);",
    label="corpus pin literal + lineage 270 -> 273")
CORPUS = apply(CORPUS,
    'listing.length === 30 ? "src 5 + tests 25" : "walk src/ + tests/ for *.test.ts"',
    'listing.length === 31 ? "src 5 + tests 26" : "walk src/ + tests/ for *.test.ts"',
    label="BRIDGE ternary 30/src5+tests25 -> 31/src5+tests26")
write("tests/corpus-count-contract.test.ts", CORPUS)

print("\nS55 doc-fixes: all replacements landed (each count-verified exactly-once)")
