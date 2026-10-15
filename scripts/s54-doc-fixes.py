#!/usr/bin/env python3
"""S54: the doc-fixes script (the GREEN — every replacement count-verified
exactly-once, the s52/s53 doctrine). Lands:
  1. the PAD §7.3 doctrine note (the claim kept + the coverage pin named)
  2. the PAD §7.1 TWO new rows (route-head.test.ts 4 tests +
     pad-coverage-contract.test.ts 3 tests — after the s53 keyfiles row)
  3. the PAD §7.4 checklist 263/260 -> 270/263
  4. the corpus move 263 -> 270 (9 family sites + the quickstart line 30/270
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

# ---------- 1. the PAD §7.3 doctrine note ----------
PAD = read("Project_Architecture_Document.md")
PAD = apply(PAD,
    "No numeric coverage gate is configured (documented honestly). The implicit contract: every pure seam in `src/lib/` is unit-tested; every UI contract that parity depends on",
    "No numeric coverage gate is configured (documented honestly). The implicit contract: every pure seam in `src/lib/` is unit-tested — pinned source-side by `tests/pad-coverage-contract.test.ts` (the s54 coverage closure: the claim was born true at session 1 (every then-existing seam had its test), went false at session 12 when `src/lib/route-head.ts` landed with E2E mechanism pins only, and drifted 42 sessions because the s49 pads map the RUNTIME to the §7.1 table's rows — a source file with no test never enters the runtime, so no pin ever asked about it; the map + the fs boundary + the named-exclusion list make the universal checkable, and a new seam fails loudly until it is either mapped or excluded); every UI contract that parity depends on",
    label="§7.3 the doctrine note (the claim kept + the coverage pin named)")

# ---------- 2. the PAD §7.1 TWO new rows (after the s53 keyfiles row) ----------
PAD = apply(PAD,
    "| Unit — the s53 size-claim pins (the PAD §11 Key Files Reference's figures held EXACT to the fs line counts — the `~` hedges that drifted 3.6x stale for 44 sessions closed; the grammar rejects the tilde form; the row floor 18 + the prisma/seed-data.ts key-coverage; + the SKILL's backticked-path size claims + the auth compound claim's test figure chained to this table's runtime-pinned auth row) | 1 | 3 | `tests/pad-keyfiles-contract.test.ts` | Vitest |",
    "| Unit — the s53 size-claim pins (the PAD §11 Key Files Reference's figures held EXACT to the fs line counts — the `~` hedges that drifted 3.6x stale for 44 sessions closed; the grammar rejects the tilde form; the row floor 18 + the prisma/seed-data.ts key-coverage; + the SKILL's backticked-path size claims + the auth compound claim's test figure chained to this table's runtime-pinned auth row) | 1 | 3 | `tests/pad-keyfiles-contract.test.ts` | Vitest |\n"
    "| Unit — the s54 route-head social URL seam pins (the s12 seam's missing unit layer — the coverage-completeness closure: the s12 trio agreement (canonical == og:url == the segment, twitter:url the segment's absolute) + the s17 wholesale-REPLACES og-set completeness + the asset-truth pair (OG_IMAGES declares the real 512x512 PNG) + the s8 DESCRIPTION freeze; the E2E mechanism pins stay in visual-parity.spec.ts) | 1 | 4 | `src/lib/__tests__/route-head.test.ts` | Vitest |\n"
    "| Unit — the s54 source-side coverage pins (the PAD §7.3 universal held to the fs + the test-import graph: the fs boundary — a new src/lib seam fails loudly until mapped or excluded; the map verification — every mapped test exists AND imports its source; the exclusion exactness + the §7.3 claim-presence) | 1 | 3 | `tests/pad-coverage-contract.test.ts` | Vitest |",
    label="§7.1 the TWO new s54 rows (4 + 3 tests)")

# ---------- 3. the §7.4 checklist 263/260 -> 270/263 ----------
PAD = apply(PAD, "- [ ] `bun run test` — 263/260", "- [ ] `bun run test` — 270/263",
            label="§7.4 checklist 263/260 -> 270/263")

write("Project_Architecture_Document.md", PAD)

# ---------- 4a. the corpus move 263 -> 270 (the 9 family sites) ----------
README = read("README.md")
README = apply(README, "tests-263%20unit", "tests-270%20unit", label="README badge 263 -> 270")
README = apply(README, "263 Vitest unit tests", "270 Vitest unit tests", label="README verification 263 -> 270")
README = apply(README, "263 unit + 198 E2E tests", "270 unit + 198 E2E tests", label="README pyramid 263 -> 270")
README = apply(README, "Vitest unit: 263 tests", "Vitest unit: 270 tests", label="README commands 263 -> 270")
README = apply(README, "28 files / 263 tests passed", "30 files / 270 tests passed", label="README quickstart 28/263 -> 30/270")
write("README.md", README)

AGENTS = read("AGENTS.md")
AGENTS = apply(AGENTS, "unit suite (263 tests", "unit suite (270 tests", label="AGENTS commands 263 -> 270")
write("AGENTS.md", AGENTS)

CLAUDE = read("CLAUDE.md")
CLAUDE = apply(CLAUDE, "263 unit / 198 E2E (needs", "270 unit / 198 E2E (needs", label="CLAUDE commands 263 -> 270")
write("CLAUDE.md", CLAUDE)

SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL, "project_state: 263 unit", "project_state: 270 unit", label="SKILL project_state 263 -> 270")
SKILL = apply(SKILL, "Vitest — 263 unit tests", "Vitest — 270 unit tests", label="SKILL appendix 263 -> 270")
write("service-desk_SKILL.md", SKILL)

# ---------- 4b. the corpus pin literal + lineage comment + BRIDGE ternary ----------
CORPUS = read("tests/corpus-count-contract.test.ts")
CORPUS = apply(CORPUS,
    """    // The current canonical (runtime-verified every session's gate): 263
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3. A suite change without the doc move fails the
    // consistency check above; a doc move without the suite change fails the
    // gate itself.
    expect(Number(n)).toBe(263);""",
    """    // The current canonical (runtime-verified every session's gate): 270
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3. A suite change without the doc move fails the
    // consistency check above; a doc move without the suite change fails the
    // gate itself.
    expect(Number(n)).toBe(270);""",
    label="corpus pin toBe(263) -> toBe(270) + lineage")
CORPUS = apply(CORPUS,
    'listing.length === 28 ? "src 4 + tests 24"',
    'listing.length === 30 ? "src 5 + tests 25"',
    label="BRIDGE ternary 28/24 -> 30/25")
write("tests/corpus-count-contract.test.ts", CORPUS)

print("\nALL S54 DOC FIXES LANDED (each exactly-once)")
