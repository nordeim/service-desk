#!/usr/bin/env python3
# S46: the docs alignment (surgical, every replacement count-verified exactly-once — the s44/s45 practice)
import sys

def patch(path, replacements):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for old, new in replacements:
        count = text.count(old)
        if count != 1:
            print(f"FATAL: {path}: expected exactly 1 occurrence of {old[:80]!r}, found {count}")
            sys.exit(1)
        text = text.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK: {path} ({len(replacements)} replacements)")

S46_PIN_DESC_README = (" + the s46 env-contract pins (the .env.example ↔ codebase bidirectional coverage: every code-read env var documented, "
                       "every documented var live, the canonical DATABASE_URL literal — line-anchored)")

# --- README.md ---
patch("README.md", [
    ("tests-235%20unit%20%2B%20198%20E2E-brightgreen", "tests-238%20unit%20%2B%20198%20E2E-brightgreen"),
    ("235 Vitest unit tests ✓", "238 Vitest unit tests ✓"),
    ("| 🧪 **Test pyramid** | 235 unit + 198 E2E tests", "| 🧪 **Test pyramid** | 238 unit + 198 E2E tests"),
    ("the bun.lock tsx entry)",
     "the bun.lock tsx entry)" + S46_PIN_DESC_README),
    ("bun run test               # Vitest unit: 235 tests", "bun run test               # Vitest unit: 238 tests"),
])

# --- CLAUDE.md ---
S46_ANTI_PATTERN = (
    "\n- **An environment example is a contract surface, not README decoration (session 46: AGENTS.md's \"`.env.example` documents every variable\" "
    "was held by MANUAL re-verification alone — zero tests referenced the file while the README quickstart's `cp .env.example .env` and every "
    "session closeout's \"re-verified, matches\" leaned on it; the measured contract: the code reads exactly three production env vars "
    "(DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL), .env.example documents exactly those three — a match held by convention, one new env var "
    "away from a silently broken quickstart (the PAD known-issues row literally proposes wiring Resend/SendGrid someday — that day's PR would have "
    "shipped with no alarm anywhere). The pins close the contract BIDIRECTIONALLY: every code-read var documented (a new code var fails the pin "
    "until documented), every documented var live (a stale post-revert line fails the pin — dead config misleads operators), plus the canonical "
    "DATABASE_URL literal in its line-anchored executable shape (the s45 hardening — a commented-out or corrupted literal fails, the commented "
    "PostgreSQL alternative never counts). The doctrine: the config file the quickstart COPIES is as much a contract surface as the CI workflow — "
    "pin its coverage bidirectionally, line-anchor its literals).**\n"
)
patch("CLAUDE.md", [
    ("| `bun run test` / `bun run test:e2e` | 235 unit / 198 E2E (needs prior build) |",
     "| `bun run test` / `bun run test:e2e` | 238 unit / 198 E2E (needs prior build) |"),
])

# Append the s46 anti-pattern as the final bullet of CLAUDE.md's Anti-Patterns section
with open("CLAUDE.md", encoding="utf-8") as f:
    claude = f.read()
if claude.rstrip().endswith("**"):
    claude = claude.rstrip("\n") + "\n" + S46_ANTI_PATTERN.strip("\n") + "\n"
    with open("CLAUDE.md", "w", encoding="utf-8") as f:
        f.write(claude)
    print("OK: CLAUDE.md (s46 anti-pattern appended)")
else:
    print("FATAL: CLAUDE.md tail shape unexpected")
    sys.exit(1)

# --- Project_Architecture_Document.md ---
S46_PAD_ROW = ("| Unit — the s46 env-contract pins (the .env.example ↔ codebase bidirectional coverage: every code-read env var documented, every "
               "documented var live, the canonical DATABASE_URL literal — line-anchored) | 1 | 3 | `tests/env-contract.test.ts` | Vitest |\n")
S46_PAD_KNOWN = (
    "| RESOLVED | Session-46 own-side audit (the s79 next-session shortlist executed: the 235-count drift watch CLEAN (five docs consistent), "
    "nothing new grew (the 50a79ca..cd9fd58 diff is docs-only — session_80.md + the worklog), the console-site ledger stable (4 sites, all "
    "pinned), the CI YAML bytes correct, the health log-prefix bytes od-verified fresh) — and the next-level audit axis CONFIRMED: the "
    "environment-contract surface (`.env.example` ↔ the codebase) entirely unpinned, zero tests referencing .env.example while AGENTS.md claims "
    "it \"documents every variable\" and every session closeout re-verified the match MANUALLY. Closed: tests/env-contract.test.ts (3 pins — "
    "bidirectional coverage + the canonical DATABASE_URL literal, line-anchored). The 28th parity sweep ALL NON-GAP — NO sixteenth /login wave "
    "(all three chunks byte-size-identical to the s45 records: index-CneaUv24.js 104739, UserAppMain-DOZft9ba.js 58761, index-D0Q6-tUz.css "
    "900665, logoutReturnPath hash-stable — the second quiet session in three); their three standing defects persist (the 1328-vs-1280 desktop "
    "overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, 28th re-verification); ours the working "
    "superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates) + the paired VLM check "
    "LAYOUT-OK (both pre- and post-remediation) | The environment-example-is-a-contract class (the quickstart's config surface pinned "
    "bidirectionally — every code var documented, every documented var live; the session's manual closeout step automated) | Fixed — the 3 "
    "env-contract pins; 238 unit / 198 E2E / 121 smoke, 4-mutation-checked (A/B/C/D, each bit exactly its pin), live-verified (the mobile matrix "
    "+ the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical); inventory in `docs/remediation-plan-session46.md` |\n"
)
patch("Project_Architecture_Document.md", [
    ("- [ ] `bun run test` — 235/235", "- [ ] `bun run test` — 238/238"),
    ("| Unit — the s45 CI-contract pins (the workflow's silent-failure surface: the frozen-install step in both jobs, the hidden-files artifact flag, the ain] triggers, the bun.lock tsx entry — line-anchored code-shaped) | 1 | 4 | `tests/ci-contract.test.ts` | Vitest |\n",
     "| Unit — the s45 CI-contract pins (the workflow's silent-failure surface: the frozen-install step in both jobs, the hidden-files artifact flag, the ain] triggers, the bun.lock tsx entry — line-anchored code-shaped) | 1 | 4 | `tests/ci-contract.test.ts` | Vitest |\n" + S46_PAD_ROW),
])
# Append the s46 known-issues row after the s45 row
with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()
anchor = "inventory in `docs/remediation-plan-session45.md` |"
if pad.count(anchor) != 1:
    print("FATAL: PAD s45 known-issues anchor not unique")
    sys.exit(1)
pad = pad.replace(anchor, anchor + "\n" + S46_PAD_KNOWN.rstrip("\n"))
with open("Project_Architecture_Document.md", "w", encoding="utf-8") as f:
    f.write(pad)
print("OK: Project_Architecture_Document.md (known-issues row appended)")

print("Part 1 complete")
