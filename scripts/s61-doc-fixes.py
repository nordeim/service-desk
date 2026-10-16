#!/usr/bin/env python3
"""S61: the corpus move 285 -> 286 + the floor lineage notes (the s61 doc-fixes).

Each replacement count-verified exactly-once (the s59/s60 doc-fixes convention).
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:60]!r}..., found {n}"
    p.write_text(t.replace(old, new))
    print(f"  {path}: 1x replaced")


# 1. README badge
sub("README.md", "tests-285%20unit%20%2B%20198%20E2E", "tests-286%20unit%20%2B%20198%20E2E")
# 2. README verification line
sub("README.md", "typecheck` ✓ · 285 Vitest unit tests ✓", "typecheck` ✓ · 286 Vitest unit tests ✓")
# 3. README pyramid row
sub("README.md", "285 unit + 198 E2E tests + API smoke (121 steps)",
              "286 unit + 198 E2E tests + API smoke (121 steps)")
# 4. README quickstart OUTPUT line (the FILE figure unchanged at 35 — the BRIDGE held)
sub("README.md", "35 files / 285 tests passed", "35 files / 286 tests passed")
# 5. README commands line
sub("README.md", "bun run test               # Vitest unit: 285 tests",
              "bun run test               # Vitest unit: 286 tests")
# 6. AGENTS commands
sub("AGENTS.md", "Vitest unit suite (285 tests — auth incl.", "Vitest unit suite (286 tests — auth incl.")
# 7. CLAUDE commands
sub("CLAUDE.md", "285 unit / 198 E2E (needs prior build)", "286 unit / 198 E2E (needs prior build)")
# 8. SKILL project_state
sub("service-desk_SKILL.md", "project_state: 285 unit tests + 198 E2E green",
                              "project_state: 286 unit tests + 198 E2E green")
# 9. SKILL Appendix A
sub("service-desk_SKILL.md", "bun run test          # Vitest — 285 unit tests",
                              "bun run test          # Vitest — 286 unit tests")
# 10. PAD §7.4 checklist (the current-over-prior pair form)
sub("Project_Architecture_Document.md", "- [ ] `bun run test` — 285/283",
                                          "- [ ] `bun run test` — 286/285")
# 11. the corpus pin literal + its lineage comment
sub("tests/corpus-count-contract.test.ts", "expect(Number(n)).toBe(285);",
                                           "expect(Number(n)).toBe(286);")
sub("tests/corpus-count-contract.test.ts",
    """// The current canonical (runtime-verified every session's gate): 285
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3 + the s56
    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3 + the s59 co-location pins 1 + the s60
    // scripts-integrity pins 2. A suite""",
    """// The current canonical (runtime-verified every session's gate): 286
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3 + the s54 route-head seam pins 4 + the s54
    // coverage pins 3 + the s55 plan-status pins 3 + the s56
    // artifact-existence pins 3 + the s57 doc-enumeration pins 3 + the s58
    // doc-path-reachability pins 3 + the s59 co-location pins 1 + the s60
    // scripts-integrity pins 2 + the s61 scripts-integrity pin 3 (the
    // language-symmetry closure). A suite""")
# 12. the PAD §7.1 scripts-integrity row (in place: 2 -> 3 tests + the pin-3 prose)
sub("Project_Architecture_Document.md",
    """| Unit — the s60 scripts-integrity pins (the committed scripts' own-name contract: the static AST undefined-name check via the standing helper `scripts/check-undefined-names.py` — a loaded name must be defined in its file, imported, a param, a builtin, or a dunder; the s56_b lineage class: the make-battery's blind `.replace()` propagates stale variable names across generations — the s58/s59 wave-analysis scripts crashed the moment their /tmp inputs existed; + the scanned-files floor 70, the vacuous-pass guard; + the wave-analysis family floor 4 with the per-session contiguity — the family is a sequence) | 1 | 2 | `tests/scripts-integrity-contract.test.ts` | Vitest |""",
    """| Unit — the s60+s61 scripts-integrity pins (the committed scripts' own-name + own-syntax contracts: the static AST undefined-name check via the standing helper `scripts/check-undefined-names.py` — a loaded name must be defined in its file, imported, a param, a builtin, or a dunder; the s56_b lineage class: the make-battery's blind `.replace()` propagates stale variable names across generations — the s58/s59 wave-analysis scripts crashed the moment their /tmp inputs existed; + the s61 language-symmetry closure (P1: the s60 closure protected the .py family only — 275 of 358 scripts carried no standing check): every .sh/.mjs/.ts passes its language's standard static layer (bash -n / node --check / ONE tsc invocation) via the standing helper `scripts/check-syntax.py`, the per-language floors 120/115/15 the vacuous-pass guards; + the scanned-files floor 75, the vacuous-pass guard; + the wave-analysis family floor 5 with the per-session contiguity — the family is a sequence) | 1 | 3 | `tests/scripts-integrity-contract.test.ts` | Vitest |""")

print("doc-fixes complete: 10 family sites + the quickstart line + the corpus pin + the §7.1 in-place row")
