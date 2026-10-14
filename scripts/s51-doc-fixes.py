#!/usr/bin/env python3
# S51: the GREEN doc fixes — every replacement count-verified EXACTLY-ONCE
# (the s48/s49/s50 doctrine: a replacement that lands 0 or 2+ times FATALs
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

# --- README.md: the P1 fix (the prerequisites line + the openssl comment) ---
apply(f"{REPO}/README.md",
      "Requires **Node.js ≥ 20** (or Bun ≥ 1.1) and Python ≥ 3.9 for the seed's crypto imports.",
      "Requires **Node.js ≥ 20** (or Bun ≥ 1.1). The seed's password hashing uses Node's built-in `node:crypto` — no Python required.",
      "README L94: the prerequisites line (the false Python claim closed)")

apply(f"{REPO}/README.md",
      '#   python3 -c "import secrets; print(secrets.token_hex(32))"   → AUTH_SECRET',
      '#   openssl rand -hex 32   (or: python3 -c "import secrets; print(secrets.token_hex(32))")   → AUTH_SECRET',
      "README quickstart: the openssl form leads, python3 the parenthetical alternative")

# --- README.md: the corpus move (4 family sites + the quickstart output line) ---
apply(f"{REPO}/README.md",
      "tests-255%20unit",
      "tests-257%20unit",
      "README badge: 255 → 257")

apply(f"{REPO}/README.md",
      "255 Vitest unit tests",
      "257 Vitest unit tests",
      "README verification: 255 → 257")

apply(f"{REPO}/README.md",
      "255 unit + 198 E2E tests",
      "257 unit + 198 E2E tests",
      "README pyramid: 255 → 257")

apply(f"{REPO}/README.md",
      "Vitest unit: 255 tests",
      "Vitest unit: 257 tests",
      "README commands: 255 → 257")

apply(f"{REPO}/README.md",
      "# ESLint clean · tsc clean · 25 files / 255 tests passed",
      "# ESLint clean · tsc clean · 26 files / 257 tests passed",
      "README quickstart output line: 25/255 → 26/257")

# --- AGENTS.md: the commands-table site ---
apply(f"{REPO}/AGENTS.md",
      "unit suite (255 tests",
      "unit suite (257 tests",
      "AGENTS commands: 255 → 257")

# --- CLAUDE.md: the commands site ---
apply(f"{REPO}/CLAUDE.md",
      "255 unit / 198 E2E (needs",
      "257 unit / 198 E2E (needs",
      "CLAUDE commands: 255 → 257")

# --- PAD: the §7.4 checklist (new/old form) + the §7.1 NEW row ---
apply(f"{REPO}/Project_Architecture_Document.md",
      "`bun run test` — 255/254",
      "`bun run test` — 257/255",
      "PAD §7.4 checklist: 255/254 → 257/255")

apply(f"{REPO}/Project_Architecture_Document.md",
      "| E2E — auth surface (logged-out incl. the s19 deep-link contract",
      "| Unit — the s51 prerequisites-contract pins (the README Quick Start's Requires line held two-sided to the codebase: the seed's crypto is node:crypto (scryptSync + randomBytes + randomUUID, no Python anywhere in the seed) + the Requires line exists, claims Node.js ≥ 20 + Bun ≥ 1.1, and carries NO Python token — the false 'Python ≥ 3.9 for the seed's crypto imports' claim that survived 50 sessions can never return) | 1 | 2 | `tests/prereq-contract.test.ts` | Vitest |\n| E2E — auth surface (logged-out incl. the s19 deep-link contract",
      "PAD §7.1: the NEW prereq row (2 tests, after the s49 row)")

# --- SKILL: the project_state + Appendix A sites ---
apply(f"{REPO}/service-desk_SKILL.md",
      "project_state: 255 unit",
      "project_state: 257 unit",
      "SKILL project_state: 255 → 257")

apply(f"{REPO}/service-desk_SKILL.md",
      "Vitest — 255 unit tests",
      "Vitest — 257 unit tests",
      "SKILL Appendix A: 255 → 257")

# --- the corpus pin file: pin 1's literal + the lineage comment ---
apply(f"{REPO}/tests/corpus-count-contract.test.ts",
      """    // The current canonical (runtime-verified every session's gate): 255
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin. A suite change without the doc move fails the consistency
    // check above; a doc move without the suite change fails the gate itself.
    expect(Number(n)).toBe(255);""",
      """    // The current canonical (runtime-verified every session's gate): 257
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2. A suite change without the
    // doc move fails the consistency check above; a doc move without the
    // suite change fails the gate itself.
    expect(Number(n)).toBe(257);""",
      "corpus pin 1: toBe(255) → toBe(257) + the lineage comment")

# --- the BRIDGE pin's files-message ternary ---
apply(f"{REPO}/tests/corpus-count-contract.test.ts",
      'listing.length === 25 ? "src 4 + tests 21" : "walk src/ + tests/ for *.test.ts"',
      'listing.length === 26 ? "src 4 + tests 22" : "walk src/ + tests/ for *.test.ts"',
      "the BRIDGE ternary: 25/src-4-tests-21 → 26/src-4-tests-22")

print("\nALL 14 FIXES APPLIED EXACTLY-ONCE — GREEN READY")
