#!/usr/bin/env python3
"""S56: the corpus move 273 -> 276 + the fs-listing move 31 -> 32 (src 5 + tests 27).
Each replacement count-verified exactly-once; the §7.1 row is an insertion.
"""
import sys

REPO = "/home/z/my-project/service-desk"
os_fixes = []  # (path, old, new) — each must appear exactly once

def fix(path, old, new):
    os_fixes.append((path, old, new))

# --- the 9 unit-family sites ---
fix("README.md",
    "![Tests](https://img.shields.io/badge/tests-273%20unit%20%2B%20198%20E2E-brightgreen)",
    "![Tests](https://img.shields.io/badge/tests-276%20unit%20%2B%20198%20E2E-brightgreen)")
fix("README.md",
    "273 Vitest unit tests ✓",
    "276 Vitest unit tests ✓")
fix("README.md",
    "273 unit + 198 E2E tests",
    "276 unit + 198 E2E tests")
fix("README.md",
    "Vitest unit: 273 tests",
    "Vitest unit: 276 tests")
fix("AGENTS.md",
    "unit suite (273 tests",
    "unit suite (276 tests")
fix("CLAUDE.md",
    "273 unit / 198 E2E (needs",
    "276 unit / 198 E2E (needs")
fix("Project_Architecture_Document.md",
    "- [ ] `bun run test` — 273/270",
    "- [ ] `bun run test` — 276/273")
fix("service-desk_SKILL.md",
    "project_state: 273 unit tests + 198 E2E green",
    "project_state: 276 unit tests + 198 E2E green")
fix("service-desk_SKILL.md",
    "bun run test          # Vitest — 273 unit tests",
    "bun run test          # Vitest — 276 unit tests")

# --- the quickstart OUTPUT line (the s50 BRIDGE) ---
fix("README.md",
    "# ESLint clean · tsc clean · 31 files / 273 tests passed",
    "# ESLint clean · tsc clean · 32 files / 276 tests passed")

# --- the corpus pin literal + its lineage comment ---
fix("tests/corpus-count-contract.test.ts",
    "    // The current canonical (runtime-verified every session's gate): 273",
    "    // The current canonical (runtime-verified every session's gate): 276")
fix("tests/corpus-count-contract.test.ts",
    """    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3. A suite change without
    // the doc move fails the consistency check above; a doc move without the
    // suite change fails the gate itself.
    expect(Number(n)).toBe(273);""",
    """    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3 + the s56
    // artifact-existence pins 3. A suite change without the doc move fails
    // the consistency check above; a doc move without the suite change
    // fails the gate itself.
    expect(Number(n)).toBe(276);""")

# --- the BRIDGE ternary (the files-message) ---
fix("tests/corpus-count-contract.test.ts",
    'listing.length === 31 ? "src 5 + tests 26"',
    'listing.length === 32 ? "src 5 + tests 27"')

for path, old, new in os_fixes:
    full = f"{REPO}/{path}"
    text = open(full, encoding="utf-8").read()
    n = text.count(old)
    if n == 0 and new in text:
        print(f"SKIP {path}: already applied — {old[:48].strip()[:44]}...")
        continue
    if n != 1:
        print(f"FATAL: {path}: expected exactly 1 occurrence, found {n}:\n  {old[:90]}...")
        sys.exit(1)
    open(full, "w", encoding="utf-8").write(text.replace(old, new, 1))
    print(f"OK {path}: {old[:60].strip()[:48]}...")

# --- the PAD §7.1 NEW ROW (an insertion after the s55 plan-status row) ---
PAD = f"{REPO}/Project_Architecture_Document.md"
pad = open(PAD, encoding="utf-8").read()
anchor = "| Unit — the s55 plan-status pins"
i = pad.find(anchor)
if i < 0:
    print("FATAL: the s55 §7.1 row anchor not found")
    sys.exit(1)
new_row = ("| Unit — the s56 artifact-existence pins (the durable-artifact existence "
           "claims: the persistence grammar — every persisted-scripts claim names an "
           "fs file; the push-range reachability — every backticked `A..B` hex-range "
           "citation names two git-reachable commits, the pre-import history "
           "annotated on the line; the bare-citation reachability — every backticked "
           "hex commit citation resolves in git, the exact known-non-commit "
           "exclusion set + the needed-ness guard) | 1 | 3 | "
           "`tests/artifact-existence-contract.test.ts` | Vitest |")
if new_row in pad:
    print("SKIP Project_Architecture_Document.md: the §7.1 s56 row already present")
else:
    row_end = pad.find("\n", i)
    pad = pad[:row_end] + "\n" + new_row + pad[row_end:]
    open(PAD, "w", encoding="utf-8").write(pad)
    print("OK Project_Architecture_Document.md: the §7.1 s56 row inserted")

print(f"all {len(os_fixes)} replacements + 1 insertion landed")
