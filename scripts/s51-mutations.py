#!/usr/bin/env python3
"""S51: the mutation checks — each must bite EXACTLY its pin, observed failing,
then REVERSE-REPLACED (never `git checkout` — the s48 harness lesson), then
re-verified green. Deletion mutations use the NEIGHBOR-ANCHOR pair (the s49
empty-needle lesson: an empty needle can never be count-verified)."""
import sys

REPO = "/home/z/my-project/service-desk/"
README = REPO + "README.md"
SEED = REPO + "prisma/seed.ts"
PAD = REPO + "Project_Architecture_Document.md"

# The honest prerequisites line (post-GREEN) — mutation A reintroduces the
# false claim INTO the requirements enumeration.
HONEST_ENUM = "Requires **Node.js ≥ 20** (or Bun ≥ 1.1). The seed's password hashing uses Node's built-in `node:crypto` — no Python required."
FALSE_ENUM = "Requires **Node.js ≥ 20** (or Bun ≥ 1.1) and Python ≥ 3.9 for the seed's crypto imports. The seed's password hashing uses Node's built-in `node:crypto` — no Python required."

# Mutation B's neighbor pair: the Quick Start heading + the Requires line —
# apply deletes the line; revert re-inserts it.
QS_HEAD = "## Quick Start\n\n"
QS_WITH_LINE = "## Quick Start\n\nRequires **Node.js ≥ 20** (or Bun ≥ 1.1). The seed's password hashing uses Node's built-in `node:crypto` — no Python required.\n"

# Mutation C: the seed's scryptSync import dropped (the hashing primitive the
# prerequisites line describes).
SEED_FULL = 'import { randomUUID, scryptSync, randomBytes } from "node:crypto";'
SEED_MUTED = 'import { randomUUID, randomBytes } from "node:crypto";'

# Mutation E: the §7.1 prereq row's count 2 → 1.
ROW_2 = "| 1 | 2 | `tests/prereq-contract.test.ts` | Vitest |"
ROW_1 = "| 1 | 1 | `tests/prereq-contract.test.ts` | Vitest |"

# Mutation F's neighbor pair: the §7.1 prereq row + the E2E row that follows.
PREREQ_ROW = "| Unit — the s51 prerequisites-contract pins (the README Quick Start's Requires line held two-sided to the codebase: the seed's crypto is node:crypto (scryptSync + randomBytes + randomUUID, no Python anywhere in the seed) + the Requires line exists, claims Node.js ≥ 20 + Bun ≥ 1.1, and carries NO Python token — the false 'Python ≥ 3.9 for the seed's crypto imports' claim that survived 50 sessions can never return) | 1 | 2 | `tests/prereq-contract.test.ts` | Vitest |\n"
NEXT_ROW = "| E2E — auth surface (logged-out incl. the s19 deep-link contract"

def apply(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"APPLIED {label}")

def revert(path: str, old: str, new: str, label: str) -> None:
    # reverse-replace: swap back the exact strings
    apply(path, new, old, f"REVERT {label}")

MUTATIONS = {
    # A: the false Python claim REINTRODUCED into the requirements enumeration
    # — must bite pin 2 (the false-requirement guard).
    "A": lambda op: (apply(README, HONEST_ENUM, FALSE_ENUM, f"{op} A") if op == "apply"
                     else revert(README, HONEST_ENUM, FALSE_ENUM, f"{op} A")),
    # B: the Requires line DELETED (the neighbor-anchored deletion) — must
    # bite pin 2's floor (the dropped-site doctrine).
    "B": lambda op: (apply(README, QS_WITH_LINE, QS_HEAD, f"{op} B") if op == "apply"
                     else revert(README, QS_WITH_LINE, QS_HEAD, f"{op} B")),
    # C: the seed's scryptSync import dropped — must bite pin 1 (the
    # ground-truth side: the hashing primitive).
    "C": lambda op: (apply(SEED, SEED_FULL, SEED_MUTED, f"{op} C") if op == "apply"
                     else revert(SEED, SEED_FULL, SEED_MUTED, f"{op} C")),
    # D: the README badge revert 257→255 — must bite pin 1's family
    # consistency + the s50 BRIDGE (the canonical).
    "D": lambda op: (apply(README, "tests-257%20unit", "tests-255%20unit", f"{op} D") if op == "apply"
                     else revert(README, "tests-257%20unit", "tests-255%20unit", f"{op} D")),
    # E: the §7.1 prereq row count 2→1 — must bite the s49 pad pin (the row
    # names its file's runtime count) + the BRIDGE (the sum drops to 256).
    "E": lambda op: (apply(PAD, ROW_2, ROW_1, f"{op} E") if op == "apply"
                     else revert(PAD, ROW_2, ROW_1, f"{op} E")),
    # F: the §7.1 prereq row DELETED (the neighbor-anchored deletion) — must
    # bite the s49 pad pin's missing-row direction + the BRIDGE (the sum
    # drops to 255).
    "F": lambda op: (apply(PAD, PREREQ_ROW + NEXT_ROW, NEXT_ROW, f"{op} F") if op == "apply"
                     else revert(PAD, PREREQ_ROW + NEXT_ROW, NEXT_ROW, f"{op} F")),
}

if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in ("apply", "revert") or sys.argv[2] not in MUTATIONS:
        print("usage: s51-mutations.py apply|revert A|B|C|D|E|F")
        sys.exit(2)
    MUTATIONS[sys.argv[2]](sys.argv[1])
