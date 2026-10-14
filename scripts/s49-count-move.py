#!/usr/bin/env python3
"""S49: the corpus-count move 251 → 254 (the s48 count-move doctrine — every
live claim site moves together; the PAD §10 historical rows immutable).
Each replacement count-verified exactly-once; bracket-free anchors only."""
import sys

def replace_n(path: str, pairs: list[tuple[str, str]], expect_counts: list[int]) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for (old, new), n_expected in zip(pairs, expect_counts):
        n = text.count(old)
        if n != n_expected:
            print(f"FATAL {path}: '{old[:60]}...' expected {n_expected}, found {n}")
            sys.exit(1)
        text = text.replace(old, new)
        print(f"OK {path}: {old[:48]!r} -> {new[:48]!r} ({n} site{'s' if n > 1 else ''})")
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

# README: 4 sites (badge, verification, pyramid, commands)
replace_n("README.md", [
    ("tests-251%20unit", "tests-254%20unit"),
    ("251 Vitest unit tests", "254 Vitest unit tests"),
    ("251 unit + 198 E2E tests", "254 unit + 198 E2E tests"),
    ("Vitest unit: 251 tests", "Vitest unit: 254 tests"),
], [1, 1, 1, 1])

# AGENTS: 1 site (the commands table)
replace_n("AGENTS.md", [
    ("Vitest unit suite (251 tests", "Vitest unit suite (254 tests"),
], [1])

# CLAUDE: 1 site (the commands table)
replace_n("CLAUDE.md", [
    ("251 unit / 198 E2E", "254 unit / 198 E2E"),
], [1])

# PAD: 1 site (the §7.4 checklist; §10 historical rows untouched)
replace_n("Project_Architecture_Document.md", [
    ("`bun run test` — 251/251", "`bun run test` — 254/254"),
], [1])

# SKILL: 2 sites (project_state + Appendix A)
replace_n("service-desk_SKILL.md", [
    ("project_state: 251 unit tests", "project_state: 254 unit tests"),
    ("Vitest — 251 unit tests", "Vitest — 254 unit tests"),
], [1, 1])

print("corpus-count move 251→254 complete (9 sites)")
