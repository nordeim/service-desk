#!/usr/bin/env python3
"""S50: the mutation checks — each must bite EXACTLY its pin, observed failing,
then REVERSE-REPLACED (never `git checkout` — the s48 harness lesson), then
re-verified green. Deletion mutations use the NEIGHBOR-ANCHOR pair (the s49
empty-needle lesson: an empty needle can never be count-verified)."""
import sys

README = "README.md"
PAD = "Project_Architecture_Document.md"

# the §7.1 neighbor pair for F: the corpus row (line ~460) + the version row
# (line ~461) — apply removes "corpus\nversion" → "version"; revert re-inserts.
CORPUS_ROW = "| Unit — the s48 corpus-count consistency pins (the drift-watch automation, family-shaped: every live unit (9 sites) / e2e (10) / parity (3) / smoke-steps (4) claim site across the five docs names ONE number, minimum-site floors; the stale '54'/'57'/'11-step'/'107' SKILL-appendix figures + README's '163 parity' closed; PAD §10 historical rows excluded by boundary) + the s50 quickstart BRIDGE pin (the README Quick Start's verify-setup output line held to the RUNTIME: the quoted file figure == the fs listing of the vitest include patterns, the quoted test figure == the §7.1 Vitest rows' sum, and the family canonical == that same sum — the s48 blind spot closed: a whole-family drift now fails loudly) | 1 | 5 | `tests/corpus-count-contract.test.ts` | Vitest |"
VERSION_ROW = "| Unit — the s48 stack-version pins (the README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the bun.lock resolved entries — bidirectional, floor-guarded; the s45 tsx-entry doctrine generalized to the seven documented packages) | 1 | 2 | `tests/version-contract.test.ts` | Vitest |"

# the Verify Setup pair for E — the needle is anchored on the unique
# "← server + database healthy" prefix (the bare gate command alone appears
# 2× in README — the s50 harness lesson: an anchor that repeats elsewhere
# can never be count-verified on revert)
HEALTH_PREFIX = "← server + database healthy\n\nbun run lint && bun run typecheck && bun run test"
QUICKSTART_LINE = "# ESLint clean · tsc clean · 25 files / 255 tests passed"

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
    # A: the quickstart tests figure one-behind (255→254) — the partial-update
    # class — must bite my pin's assertion 2 (the tests figure vs the §7.1 sum)
    "A": (README, "25 files / 255 tests passed", "25 files / 254 tests passed"),
    # B: the quickstart files figure revert (25→4, the original drift class) —
    # must bite my pin's assertion 1 (the files figure vs the fs listing)
    "B": (README, "25 files / 255 tests passed", "4 files / 255 tests passed"),
    # C: one family site revert (the README badge 255→254) — must bite pin 1's
    # family consistency AND my pin's BRIDGE (the family canonical)
    "C": (README, "tests-255%20unit", "tests-254%20unit"),
    # D: the §7.1 corpus row revert (5→4) — must bite the s49 unit pad pin
    # (the row vs the runtime) AND my pin (the sum drops)
    "D": (PAD, "| 1 | 5 | `tests/corpus-count-contract.test.ts` | Vitest |",
             "| 1 | 4 | `tests/corpus-count-contract.test.ts` | Vitest |"),
    # E: the quickstart LINE deletion (the dropped-site class) — must bite my
    # pin's floor (expect(m).toBeTruthy()); the NEIGHBOR-ANCHOR pair is the
    # unique "← server + database healthy" prefix + the command + the output
    # line: apply drops the output line; revert re-inserts
    "E": (README, f"{HEALTH_PREFIX}\n{QUICKSTART_LINE}", HEALTH_PREFIX),
    # F: the §7.1 corpus row DELETION (the s49 empty-needle class) — must bite
    # the s49 unit pad pin's completeness direction AND my pin (the sum drops);
    # the NEIGHBOR-ANCHOR pair: apply removes corpus+version → version;
    # revert re-inserts
    "F": (PAD, f"{CORPUS_ROW}\n{VERSION_ROW}", VERSION_ROW),
}

if __name__ == "__main__":
    action, key = sys.argv[1], sys.argv[2]
    path, old, new = MUTATIONS[key]
    if action == "apply":
        apply(path, old, new, f"mutation {key}")
    elif action == "revert":
        revert(path, old, new, f"mutation {key}")
    else:
        print(f"FATAL: unknown action {action}")
        sys.exit(1)
