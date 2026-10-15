#!/usr/bin/env python3
# S52: the GREEN doc fixes — every replacement count-verified EXACTLY-ONCE
# (the s48–s51 doctrine: a replacement that lands 0 or 2+ times FATALs
# before the tree is contaminated; reverse-replace recovery, never checkout).
import sys

REPO = "/home/z/my-project/service-desk"

def apply(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n} — ABORT (no write)")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new))
    print(f"OK   {label}")

# --- P1a: the four stale date sites ---
apply(f"{REPO}/CLAUDE.md",
      "last_updated: 2026-10-09",
      "last_updated: 2026-10-15",
      "CLAUDE.md L5: the stale last_updated (10-09 → 10-15)")

apply(f"{REPO}/Project_Architecture_Document.md",
      "**Last Updated:** 2026-10-09",
      "**Last Updated:** 2026-10-15",
      "PAD L6: the stale Last Updated (10-09 → 10-15)")

apply(f"{REPO}/AGENTS.md",
      "Verified against the toolchain on 2026-10-09.",
      "Verified against the toolchain on 2026-10-15.",
      "AGENTS.md L3: the stale verification date (10-09 → 10-15)")

apply(f"{REPO}/service-desk_SKILL.md",
      "Distilled through the session-50 remediation (2026-10-14).",
      "Distilled through the session-52 remediation (2026-10-15).",
      "SKILL description: session-50 (2026-10-14) → session-52 (2026-10-15) — the in-flight correction: this session's own lesson 106 bumped the ledger to Session 52, so the description names s52")

# --- P1b: the CI checkout depth (the git-history requirement) ---
apply(f"{REPO}/.github/workflows/ci.yml",
      """  verify:
    name: lint + typecheck + unit + build
    runs-on: ubuntu-latest
    env:
      AUTH_SECRET: ci-only-session-secret-not-for-production
    steps:
      - uses: actions/checkout@v4
""",
      """  verify:
    name: lint + typecheck + unit + build
    runs-on: ubuntu-latest
    env:
      AUTH_SECRET: ci-only-session-secret-not-for-production
    steps:
      - uses: actions/checkout@v4
        with:
          # Session 52: the docdate pins read the dated docs' git last-commit
          # dates — the default depth-1 clone answers HEAD's date for EVERY
          # file (measured live), so the verify job needs real history.
          fetch-depth: 0
""",
      "ci.yml verify job: the checkout gains fetch-depth: 0")

# --- README.md: the corpus move (4 family sites + the quickstart output line) ---
apply(f"{REPO}/README.md",
      "tests-257%20unit",
      "tests-260%20unit",
      "README badge: 257 → 260")

apply(f"{REPO}/README.md",
      "257 Vitest unit tests",
      "260 Vitest unit tests",
      "README verification: 257 → 260")

apply(f"{REPO}/README.md",
      "257 unit + 198 E2E tests",
      "260 unit + 198 E2E tests",
      "README pyramid: 257 → 260")

apply(f"{REPO}/README.md",
      "Vitest unit: 257 tests",
      "Vitest unit: 260 tests",
      "README commands: 257 → 260")

apply(f"{REPO}/README.md",
      "# ESLint clean · tsc clean · 26 files / 257 tests passed",
      "# ESLint clean · tsc clean · 27 files / 260 tests passed",
      "README quickstart output line: 26/257 → 27/260")

# --- AGENTS.md: the commands-table site ---
apply(f"{REPO}/AGENTS.md",
      "unit suite (257 tests",
      "unit suite (260 tests",
      "AGENTS commands: 257 → 260")

# --- CLAUDE.md: the commands site ---
apply(f"{REPO}/CLAUDE.md",
      "257 unit / 198 E2E (needs",
      "260 unit / 198 E2E (needs",
      "CLAUDE commands: 257 → 260")

# --- PAD: the §7.4 checklist site (the new/old form) ---
apply(f"{REPO}/Project_Architecture_Document.md",
      "`bun run test` — 257/255",
      "`bun run test` — 260/257",
      "PAD §7.4 checklist: 257/255 → 260/257")

# --- SKILL: the project_state + Appendix A sites ---
apply(f"{REPO}/service-desk_SKILL.md",
      "project_state: 257 unit",
      "project_state: 260 unit",
      "SKILL project_state: 257 → 260")

apply(f"{REPO}/service-desk_SKILL.md",
      "Vitest — 257 unit tests",
      "Vitest — 260 unit tests",
      "SKILL Appendix A: 257 → 260")

# --- the corpus pin internals: the literal + the lineage comment + the BRIDGE ternary ---
apply(f"{REPO}/tests/corpus-count-contract.test.ts",
      "    expect(Number(n)).toBe(257);",
      "    expect(Number(n)).toBe(260);",
      "corpus pin literal: toBe(257) → toBe(260)")

apply(f"{REPO}/tests/corpus-count-contract.test.ts",
      """    // The current canonical (runtime-verified every session's gate): 257
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2. A suite change without the
    // doc move fails the consistency check above; a doc move without the
    // suite change fails the gate itself.""",
      """    // The current canonical (runtime-verified every session's gate): 260
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3. A
    // suite change without the doc move fails the consistency check above; a
    // doc move without the suite change fails the gate itself.""",
      "corpus pin lineage comment: 257 → 260 + the s52 line")

apply(f"{REPO}/tests/corpus-count-contract.test.ts",
      'listing.length === 26 ? "src 4 + tests 22"',
      'listing.length === 27 ? "src 4 + tests 23"',
      "BRIDGE ternary: 26/src 4 + tests 22 → 27/src 4 + tests 23")

# --- PAD §7.1: the NEW row (placed after the s51 prereq row, the session-ordered convention) ---
apply(f"{REPO}/Project_Architecture_Document.md",
      "| Unit — the s51 prerequisites-contract pins (the README Quick Start's Requires line held two-sided to the codebase: the seed's crypto is node:crypto (scryptSync + randomBytes + randomUUID, no Python anywhere in the seed) + the Requires line exists, claims Node.js ≥ 20 + Bun ≥ 1.1, and carries NO Python token — the false 'Python ≥ 3.9 for the seed's crypto imports' claim that survived 50 sessions can never return) | 1 | 2 | `tests/prereq-contract.test.ts` | Vitest |",
      "| Unit — the s51 prerequisites-contract pins (the README Quick Start's Requires line held two-sided to the codebase: the seed's crypto is node:crypto (scryptSync + randomBytes + randomUUID, no Python anywhere in the seed) + the Requires line exists, claims Node.js ≥ 20 + Bun ≥ 1.1, and carries NO Python token — the false 'Python ≥ 3.9 for the seed's crypto imports' claim that survived 50 sessions can never return) | 1 | 2 | `tests/prereq-contract.test.ts` | Vitest |\n| Unit — the s52 doc-freshness-contract pins (the four dated docs' freshness claims held to their git last-commit dates (the +0800 operator-timezone convention) + the SKILL-internal ledger coherence (the description's session == the last lesson's tag, its date == the frontmatter) + the no-future-dating guard — the stale '2026-10-09' claims and the session-50 description can never return) | 1 | 3 | `tests/docdate-contract.test.ts` | Vitest |",
      "PAD §7.1: the NEW s52 docdate row (3 tests, after the s51 prereq row)")

print("\nAll S52 doc fixes applied — each exactly-once.")
