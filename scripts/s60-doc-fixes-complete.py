#!/usr/bin/env python3
"""S60 doc-fixes COMPLETION (the s59 precedent: the first pass FATALed on the
mis-guessed 9th family site — the SKILL project_state form consumed it; the 9
sites re-derived from UNIT_FAMILY_SHAPES: the PAD §7.4 checklist form, landed
by hand; this script lands the REMAINING edits after the 9 family sites).
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:80]!r}..., found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"  {path}: {old[:60]!r} -> {new[:60]!r}")


print("=== the quickstart line (the FILE figure changes: the pin lands in a NEW file) ===")
sub("README.md", "# ESLint clean · tsc clean · 34 files / 283 tests passed",
                "# ESLint clean · tsc clean · 35 files / 285 tests passed")

print("=== the s50 BRIDGE ternary (34/src 5 + tests 29 -> 35/src 5 + tests 30) ===")
sub("tests/corpus-count-contract.test.ts",
    'listing.length === 34 ? "src 5 + tests 29" : "walk src/ + tests/ for *.test.ts"',
    'listing.length === 35 ? "src 5 + tests 30" : "walk src/ + tests/ for *.test.ts"')

print("=== the corpus pin literal + the lineage comment (the stale leading figure 276 fixed with the same edit) ===")
sub("tests/corpus-count-contract.test.ts",
    """    // The current canonical (runtime-verified every session's gate): 276
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3 + the s56
    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3 + the s59 co-location pins 1. A suite
    // change without the doc move fails
    // the consistency check above; a doc move without the suite change
    // fails the gate itself.
    expect(Number(n)).toBe(283);""",
    """    // The current canonical (runtime-verified every session's gate): 285
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3 + the s56
    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3 + the s59 co-location pins 1 + the s60
    // scripts-integrity pins 2. A suite
    // change without the doc move fails
    // the consistency check above; a doc move without the suite change
    // fails the gate itself.
    expect(Number(n)).toBe(285);""")

print("=== the PAD §7.1 NEW row (after the s58 doc-path-reachability row) ===")
pad = R / "Project_Architecture_Document.md"
t = pad.read_text(encoding="utf-8")
anchor = "| `tests/doc-path-reachability-contract.test.ts` | Vitest |"
assert t.count(anchor) == 1, f"anchor count {t.count(anchor)}"
row = (
    "\n| Unit — the s60 scripts-integrity pins (the committed scripts' own-name contract: "
    "the static AST undefined-name check via the standing helper `scripts/check-undefined-names.py` — "
    "a loaded name must be defined in its file, imported, a param, a builtin, or a dunder; "
    "the s56_b lineage class: the make-battery's blind `.replace()` propagates stale variable names "
    "across generations — the s58/s59 wave-analysis scripts crashed the moment their /tmp inputs existed; "
    "+ the scanned-files floor 70, the vacuous-pass guard; + the wave-analysis family floor 4 with the "
    "per-session contiguity — the family is a sequence) | 1 | 2 | `tests/scripts-integrity-contract.test.ts` | Vitest |"
)
t = t.replace(anchor, anchor + row)
pad.write_text(t, encoding="utf-8")
print("  PAD §7.1: the s60 scripts-integrity row inserted")

print("=== the standing duties (the PAIRED CURRENT_SESSION 60 + PLAN_CORPUS_FLOOR 59) ===")
sub("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 59;", "const CURRENT_SESSION = 60;")
sub("tests/plan-status-contract.test.ts", "const PLAN_CORPUS_FLOOR = 58;", "const PLAN_CORPUS_FLOOR = 59;")
sub("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 59;", "const CURRENT_SESSION = 60;")

print("\nS60 doc fixes complete (the completion pass)")
