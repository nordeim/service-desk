#!/usr/bin/env python3
"""S50 GREEN: the quickstart figure fix + the corpus-count move 254→255 —
every replacement count-verified exactly-once (the s46 display-artifact
doctrine: bracket-free anchors only)."""
import sys

DOCS = {
    "README": "README.md",
    "AGENTS": "AGENTS.md",
    "CLAUDE": "CLAUDE.md",
    "PAD": "Project_Architecture_Document.md",
    "SKILL": "service-desk_SKILL.md",
    "PIN": "tests/corpus-count-contract.test.ts",
}

def replace_once(text: str, old: str, new: str, label: str) -> str:
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n}")
        sys.exit(1)
    print(f"OK: {label} (1 site)")
    return text.replace(old, new, 1)

def load(name):
    with open(DOCS[name], encoding="utf-8") as f:
        return f.read()

def save(name, text):
    with open(DOCS[name], "w", encoding="utf-8") as f:
        f.write(text)

# --- 1. README: the quickstart figure fix (the audited drift) ---
readme = load("README")
readme = replace_once(
    readme,
    "# ESLint clean · tsc clean · 4 files / 55 tests passed",
    "# ESLint clean · tsc clean · 25 files / 255 tests passed",
    "README quickstart figure 4/55 → 25/255",
)
# --- 2. README: the corpus move 254 → 255 (4 sites) ---
readme = replace_once(readme, "tests-254%20unit", "tests-255%20unit", "README badge 254→255")
readme = replace_once(readme, "254 Vitest unit tests", "255 Vitest unit tests", "README verification 254→255")
readme = replace_once(readme, "254 unit + 198 E2E tests", "255 unit + 198 E2E tests", "README pyramid 254→255")
readme = replace_once(readme, "Vitest unit: 254 tests", "Vitest unit: 255 tests", "README commands 254→255")
save("README", readme)

# --- 3. AGENTS: the commands-table count ---
agents = load("AGENTS")
agents = replace_once(agents, "unit suite (254 tests", "unit suite (255 tests", "AGENTS commands 254→255")
save("AGENTS", agents)

# --- 4. CLAUDE: the commands-table count ---
claude = load("CLAUDE")
claude = replace_once(claude, "254 unit / 198 E2E (needs", "255 unit / 198 E2E (needs", "CLAUDE commands 254→255")
save("CLAUDE", claude)

# --- 5. PAD: the §7.4 checklist count + the §7.1 corpus row (4 → 5 + description) ---
pad = load("PAD")
pad = replace_once(pad, "`bun run test` — 254/", "`bun run test` — 255/", "PAD §7.4 checklist 254→255")
pad = replace_once(
    pad,
    "| Unit — the s48 corpus-count consistency pins (the drift-watch automation, family-shaped: every live unit (9 sites) / e2e (10) / parity (3) / smoke-steps (4) claim site across the five docs names ONE number, minimum-site floors; the stale '54'/'57'/'11-step'/'107' SKILL-appendix figures + README's '163 parity' closed; PAD §10 historical rows excluded by boundary) | 1 | 4 | `tests/corpus-count-contract.test.ts` | Vitest |",
    "| Unit — the s48 corpus-count consistency pins (the drift-watch automation, family-shaped: every live unit (9 sites) / e2e (10) / parity (3) / smoke-steps (4) claim site across the five docs names ONE number, minimum-site floors; the stale '54'/'57'/'11-step'/'107' SKILL-appendix figures + README's '163 parity' closed; PAD §10 historical rows excluded by boundary) + the s50 quickstart BRIDGE pin (the README Quick Start's verify-setup output line held to the RUNTIME: the quoted file figure == the fs listing of the vitest include patterns, the quoted test figure == the §7.1 Vitest rows' sum, and the family canonical == that same sum — the s48 blind spot closed: a whole-family drift now fails loudly) | 1 | 5 | `tests/corpus-count-contract.test.ts` | Vitest |",
    "PAD §7.1 corpus row 4→5 + the s50 description",
)
save("PAD", pad)

# --- 6. SKILL: the project_state + Appendix counts ---
skill = load("SKILL")
skill = replace_once(skill, "project_state: 254 unit", "project_state: 255 unit", "SKILL project_state 254→255")
skill = replace_once(skill, "Vitest — 254 unit tests", "Vitest — 255 unit tests", "SKILL Appendix A 254→255")
save("SKILL", skill)

# --- 7. the pin file: pin 1's toBe literal + the lineage comment ---
pin = load("PIN")
pin = replace_once(
    pin,
    "    // The current canonical (runtime-verified every session's gate): 254\n    // after the s48 6 pins + the s49 3 pad-testcount pins. A suite change\n    // without the doc move fails the consistency check above; a doc move\n    // without the suite change fails the gate itself.\n    expect(Number(n)).toBe(254);",
    "    // The current canonical (runtime-verified every session's gate): 255\n    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart\n    // BRIDGE pin. A suite change without the doc move fails the consistency\n    // check above; a doc move without the suite change fails the gate itself.\n    expect(Number(n)).toBe(255);",
    "pin 1 toBe literal + comment 254→255",
)
save("PIN", pin)

print("S50 GREEN doc fixes complete: quickstart 25/255 + corpus 254→255 (9 sites + pin literal + §7.1 row)")
