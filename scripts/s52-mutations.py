#!/usr/bin/env python3
"""S52: the mutation checks — each must bite EXACTLY its pin, observed failing,
then REVERSE-REPLACED (never `git checkout` — the s48 harness lesson), then
re-verified green. Deletion mutations use the NEIGHBOR-ANCHOR pair (the s49
empty-needle lesson: an empty needle can never be count-verified)."""
import sys

REPO = "/home/z/my-project/service-desk/"
CLAUDE = REPO + "CLAUDE.md"
PAD = REPO + "Project_Architecture_Document.md"
SKILL = REPO + "service-desk_SKILL.md"
README = REPO + "README.md"

# Mutation A: the CLAUDE date reverted to the stale 2026-10-09 — must bite
# pin 1 (the staleness direction: the claim is older than the content history).
CLAUDE_FRESH = "last_updated: 2026-10-15"
CLAUDE_STALE = "last_updated: 2026-10-09"

# Mutation B: the PAD date future-dated +1 day — must bite pin 3 (the
# no-future-dating guard; pin 1 is one-sided BY DESIGN, so only pin 3 catches
# the forward-lie).
PAD_FRESH = "**Last Updated:** 2026-10-15"
PAD_FUTURE = "**Last Updated:** 2026-10-16"

# Mutation C: the SKILL description's session reverted to session-50 (the
# date kept honest) — must bite pin 2's ledger agreement.
SKILL_S52 = "Distilled through the session-52 remediation (2026-10-15)."
SKILL_S50 = "Distilled through the session-50 remediation (2026-10-15)."

# Mutation D: the README badge revert 260 → 257 — must bite the s48 family
# pin + the s50 BRIDGE (both run the family).
BADGE_260 = "tests-260%20unit"
BADGE_257 = "tests-257%20unit"

# Mutation E: the §7.1 docdate row's count 3 → 2 — must bite the s49 pad pin
# + the s50 BRIDGE (the sum drops to 259).
ROW_3 = "| 1 | 3 | `tests/docdate-contract.test.ts` | Vitest |"
ROW_2 = "| 1 | 2 | `tests/docdate-contract.test.ts` | Vitest |"

# Mutation F's neighbor pair: the §7.1 docdate row + the E2E row that follows
# — apply deletes the row; revert re-inserts it.
DOCDATE_ROW = "| Unit — the s52 doc-freshness-contract pins (the four dated docs' freshness claims held to their git last-commit dates (the +0800 operator-timezone convention) + the SKILL-internal ledger coherence (the description's session == the last lesson's tag, its date == the frontmatter) + the no-future-dating guard — the stale '2026-10-09' claims and the session-50 description can never return) | 1 | 3 | `tests/docdate-contract.test.ts` | Vitest |\n"
NEXT_ROW = "| E2E — auth surface (logged-out incl. the s19 deep-link contract"

def apply(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL apply {label}: expected exactly 1 occurrence, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new))
    print(f"APPLIED {label}")

def revert(path: str, old: str, new: str, label: str) -> None:
    # reverse-replace: new → old (the mutations are their own inverses)
    apply(path, new, old, f"revert {label}")

def main() -> None:
    cmd = sys.argv[1]
    mut = sys.argv[2]
    if cmd == "apply":
        if mut == "A":
            apply(CLAUDE, CLAUDE_FRESH, CLAUDE_STALE, "A: CLAUDE date → stale 2026-10-09")
        elif mut == "B":
            apply(PAD, PAD_FRESH, PAD_FUTURE, "B: PAD date → future 2026-10-16")
        elif mut == "C":
            apply(SKILL, SKILL_S52, SKILL_S50, "C: SKILL description → session-50")
        elif mut == "D":
            apply(README, BADGE_260, BADGE_257, "D: README badge 260 → 257")
        elif mut == "E":
            apply(PAD, ROW_3, ROW_2, "E: §7.1 docdate row 3 → 2")
        elif mut == "F":
            # deletion via the neighbor pair: row+neighbor → neighbor
            with open(PAD, encoding="utf-8") as f:
                text = f.read()
            pair = DOCDATE_ROW + NEXT_ROW
            n = text.count(pair)
            if n != 1:
                print(f"FATAL apply F: expected exactly 1 neighbor pair, found {n}")
                sys.exit(1)
            with open(PAD, "w", encoding="utf-8") as f:
                f.write(text.replace(pair, NEXT_ROW))
            print("APPLIED F: §7.1 docdate row deleted")
        else:
            sys.exit(2)
    elif cmd == "revert":
        if mut == "A":
            revert(CLAUDE, CLAUDE_FRESH, CLAUDE_STALE, "A")
        elif mut == "B":
            revert(PAD, PAD_FRESH, PAD_FUTURE, "B")
        elif mut == "C":
            revert(SKILL, SKILL_S52, SKILL_S50, "C")
        elif mut == "D":
            revert(README, BADGE_260, BADGE_257, "D")
        elif mut == "E":
            revert(PAD, ROW_3, ROW_2, "E")
        elif mut == "F":
            # re-insertion via the neighbor pair: neighbor → row+neighbor
            with open(PAD, encoding="utf-8") as f:
                text = f.read()
            n = text.count(NEXT_ROW)
            if n != 1:
                print(f"FATAL revert F: expected exactly 1 neighbor anchor, found {n}")
                sys.exit(1)
            with open(PAD, "w", encoding="utf-8") as f:
                f.write(text.replace(NEXT_ROW, DOCDATE_ROW + NEXT_ROW))
            print("REVERTED F: §7.1 docdate row re-inserted")
        else:
            sys.exit(2)
    else:
        sys.exit(2)

if __name__ == "__main__":
    main()
