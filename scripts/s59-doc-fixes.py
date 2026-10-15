#!/usr/bin/env python3
"""S59: the corpus move 282 -> 283 (the co-location pin lands in an EXISTING
file — the fs-listing move NONE, the BRIDGE ternary UNCHANGED) + the standing
duties (the PAIRED CURRENT_SESSION 58 -> 59 + PLAN_CORPUS_FLOOR 57 -> 58).

Each replacement count-verified exactly-once (the s58-doc-fixes lineage).
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
sub("README.md", "tests-282%20unit", "tests-283%20unit")
sub("README.md", "282 Vitest unit tests", "283 Vitest unit tests")
sub("README.md", "282 unit + 198 E2E tests", "283 unit + 198 E2E tests")
sub("README.md", "Vitest unit: 282 tests", "Vitest unit: 283 tests")
sub("AGENTS.md", "Vitest unit suite (282 tests", "Vitest unit suite (283 tests")
sub("CLAUDE.md", "282 unit / 198 E2E", "283 unit / 198 E2E")
sub("Project_Architecture_Document.md", "`bun run test` — 282/279", "`bun run test` — 283/282")
sub("service-desk_SKILL.md", "project_state: 282 unit tests", "project_state: 283 unit tests")
sub("service-desk_SKILL.md", "bun run test          # Vitest — 282 unit tests",
    "bun run test          # Vitest — 283 unit tests")

print("== the quickstart OUTPUT line (the s50 BRIDGE — the FILE figure unchanged: the pin lands in an existing file) ==")
sub("README.md", "34 files / 282 tests passed", "34 files / 283 tests passed")

print("== the corpus pin literal + lineage ==")
sub("tests/corpus-count-contract.test.ts", "expect(Number(n)).toBe(282);",
    "expect(Number(n)).toBe(283);")
sub("tests/corpus-count-contract.test.ts",
    """    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3. A suite
    // change without the doc move fails""",
    """    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3 + the s59 co-location pins 1. A suite
    // change without the doc move fails""")

print("== the PAD §7.1 in-place row update (the artifact-existence row: 3 -> 4 tests) ==")
sub("Project_Architecture_Document.md",
    "the bare-citation reachability — every backticked hex commit citation resolves in git, the exact known-non-commit exclusion set + the needed-ness guard) | 1 | 3 | `tests/artifact-existence-contract.test.ts` | Vitest |",
    "the bare-citation reachability — every backticked hex commit citation resolves in git, the exact known-non-commit exclusion set + the needed-ness guard, the exclusion MATCH-scoped since s59 (never a line-level escape) — plus the s59 no-silent-skip parity: every bare-hex token claimed or excluded, never silently dropped, with the co-location shape floor) | 1 | 4 | `tests/artifact-existence-contract.test.ts` | Vitest |")

print("== the standing duties (the PAIRED bump) ==")
sub("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 58;", "const CURRENT_SESSION = 59;")
sub("tests/plan-status-contract.test.ts", "const PLAN_CORPUS_FLOOR = 57;", "const PLAN_CORPUS_FLOOR = 58;")
sub("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 58;", "const CURRENT_SESSION = 59;")

print("\nS59 doc fixes complete.")
