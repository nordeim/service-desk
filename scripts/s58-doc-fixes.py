#!/usr/bin/env python3
"""S58: the corpus move 279 -> 282 + the fs-listing move 33 -> 34 + the standing
duties (the PAIRED CURRENT_SESSION 57 -> 58 + PLAN_CORPUS_FLOOR 56 -> 57).

Each replacement count-verified exactly-once (the s57-doc-fixes lineage).
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:60]!r}..., found {n}"
    p.write_text(t.replace(old, new))
    print(f"  {path}: {old[:50]!r} -> {new[:50]!r}")


print("== the 9 unit-family sites ==")
sub("README.md", "tests-279%20unit", "tests-282%20unit")
sub("README.md", "279 Vitest unit tests", "282 Vitest unit tests")
sub("README.md", "279 unit + 198 E2E tests", "282 unit + 198 E2E tests")
sub("README.md", "Vitest unit: 279 tests", "Vitest unit: 282 tests")
sub("AGENTS.md", "Vitest unit suite (279 tests", "Vitest unit suite (282 tests")
sub("CLAUDE.md", "279 unit / 198 E2E", "282 unit / 198 E2E")
sub("Project_Architecture_Document.md", "`bun run test` — 279/276", "`bun run test` — 282/279")
sub("service-desk_SKILL.md", "project_state: 279 unit tests", "project_state: 282 unit tests")
sub("service-desk_SKILL.md", "bun run test          # Vitest — 279 unit tests",
    "bun run test          # Vitest — 282 unit tests")

print("== the quickstart OUTPUT line (the s50 BRIDGE) ==")
sub("README.md", "33 files / 279 tests passed", "34 files / 282 tests passed")

print("== the corpus pin literal + lineage + the BRIDGE ternary ==")
sub("tests/corpus-count-contract.test.ts", "expect(Number(n)).toBe(279);",
    "expect(Number(n)).toBe(282);")
sub("tests/corpus-count-contract.test.ts",
    """    // artifact-existence pins 3 + the s57 doc-enumeration pins 3. A suite
    // change without the doc move fails""",
    """    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3. A suite
    // change without the doc move fails""")
sub("tests/corpus-count-contract.test.ts",
    'listing.length === 33 ? "src 5 + tests 28" : "walk src/ + tests/ for *.test.ts"',
    'listing.length === 34 ? "src 5 + tests 29" : "walk src/ + tests/ for *.test.ts"')

print("== the PAD §7.1 new row (after the s57 doc-enumeration row) ==")
pad = R / "Project_Architecture_Document.md"
t = pad.read_text()
anchor = """| Unit — the s57 doc-enumeration pins (the numbered families held to their index sequences: the plan corpus enumerates exactly {2..CURRENT} — complete, contiguous, no extras; the session-log corpus contiguous from 1 with the one-session-lag floor at the previous session's agent log doc 2N−11; the agent-log correspondence — every paired session N ≥ 12 carries its agent log at doc 2N−11 (header-identified) + its operator transcript at doc 2N−10) | 1 | 3 | `tests/doc-enumeration-contract.test.ts` | Vitest |"""
assert t.count(anchor) == 1, "the s57 §7.1 anchor not found exactly once"
new_row = anchor + "\n" + """| Unit — the s58 doc-path-reachability pins (the whole-path existence-claim contract: every backticked path-shaped reference in the five core docs resolves on the fs — the four-entry measured exclusion set (the runtime-target + transient + replaced-static forms, each genuinely cited, the needed-ness guard); the checked-reference floor 500 — the vacuous-pass guard) | 1 | 3 | `tests/doc-path-reachability-contract.test.ts` | Vitest |"""
pad.write_text(t.replace(anchor, new_row))
print("  PAD §7.1: the s58 row inserted after the s57 row")

print("== the standing duties (the PAIRED bump) ==")
sub("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 57;", "const CURRENT_SESSION = 58;")
sub("tests/plan-status-contract.test.ts", "const PLAN_CORPUS_FLOOR = 56;", "const PLAN_CORPUS_FLOOR = 57;")
sub("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 57;", "const CURRENT_SESSION = 58;")

print("\nS58 doc fixes complete.")
