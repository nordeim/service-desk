#!/usr/bin/env python3
"""S57: the corpus move 276 -> 279 + the fs-listing move 32 -> 33 + the
standing duties (CURRENT_SESSION 57 + PLAN_CORPUS_FLOOR 56) + the PAD §7.1
new row. Each replacement count-verified exactly-once (the s56 lineage)."""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
edits = 0


def fix(path, old, new, expect=1, label=""):
    global edits
    p = R / path
    t = p.read_text()
    n = t.count(old)
    if n != expect:
        print(f"FATAL: {path}: {label or old[:40]!r} found {n}x (expected {expect})")
        sys.exit(1)
    p.write_text(t.replace(old, new))
    edits += 1
    print(f"  ok [{path}] {label or old[:40]!r} ({n}x)")


# --- the 9 unit-family sites ---
fix("README.md", "tests-276%20unit", "tests-279%20unit", 1, "badge")
fix("README.md", "276 Vitest unit tests", "279 Vitest unit tests", 1, "verification")
fix("README.md", "276 unit + 198 E2E tests", "279 unit + 198 E2E tests", 1, "pyramid")
fix("README.md", "Vitest unit: 276 tests", "Vitest unit: 279 tests", 1, "commands")
fix("AGENTS.md", "Vitest unit suite (276 tests", "Vitest unit suite (279 tests", 1, "commands")
fix("CLAUDE.md", "276 unit / 198 E2E", "279 unit / 198 E2E", 1, "commands")
fix("Project_Architecture_Document.md", "276/273", "279/276", 1, "the §7.4 new/old form")
fix("service-desk_SKILL.md", "project_state: 276 unit tests", "project_state: 279 unit tests", 1, "project_state")
fix("service-desk_SKILL.md", "Vitest — 276 unit tests", "Vitest — 279 unit tests", 1, "Appendix A")

# --- the quickstart OUTPUT line (both figures, the s50 BRIDGE) ---
fix("README.md", "32 files / 276 tests passed", "33 files / 279 tests passed", 1, "quickstart output")

# --- the corpus pin literal + lineage ---
fix("tests/corpus-count-contract.test.ts", "expect(Number(n)).toBe(276);", "expect(Number(n)).toBe(279);", 1, "pin literal")
fix(
    "tests/corpus-count-contract.test.ts",
    "// artifact-existence pins 3. A suite change without the doc move fails",
    "// artifact-existence pins 3 + the s57 doc-enumeration pins 3. A suite\n    // change without the doc move fails",
    1,
    "pin lineage",
)

# --- the BRIDGE ternary ---
fix(
    "tests/corpus-count-contract.test.ts",
    'listing.length === 32 ? "src 5 + tests 27" : "walk src/ + tests/ for *.test.ts"',
    'listing.length === 33 ? "src 5 + tests 28" : "walk src/ + tests/ for *.test.ts"',
    1,
    "BRIDGE ternary",
)

# --- the standing duties (the s56 closeout's first-pin-duty instruction) ---
fix("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 56;", "const CURRENT_SESSION = 57;", 1, "CURRENT_SESSION bump")
fix("tests/plan-status-contract.test.ts", "const PLAN_CORPUS_FLOOR = 55;", "const PLAN_CORPUS_FLOOR = 56;", 1, "floor recalibration")

# --- the PAD §7.1 new row (after the s56 artifact-existence row) ---
pad = R / "Project_Architecture_Document.md"
t = pad.read_text()
anchor = t.index("tests/artifact-existence-contract.test.ts` | Vitest |")
line_end = t.index("\n", anchor)
row = (
    "\n| Unit — the s57 doc-enumeration pins (the numbered families held to their index sequences: the plan corpus enumerates "
    "exactly {2..CURRENT} — complete, contiguous, no extras; the session-log corpus contiguous from 1 with the one-session-lag "
    "floor at the previous session's agent log doc 2N−11; the agent-log correspondence — every paired session N ≥ 12 carries "
    "its agent log at doc 2N−11 (header-identified) + its operator transcript at doc 2N−10) | 1 | 3 | "
    "`tests/doc-enumeration-contract.test.ts` | Vitest |"
)
t = t[:line_end] + row + t[line_end:]
pad.write_text(t)
edits += 1
print("  ok [Project_Architecture_Document.md] the §7.1 new row (insertion)")

print(f"\nDONE: {edits} edits landed")
