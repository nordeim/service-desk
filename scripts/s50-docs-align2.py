#!/usr/bin/env python3
"""S50 docs alignment part 2: PAD (the RESOLVED session-50 known-issues row),
SKILL (v2.48.0 + lesson 104 + the description line), the plan's execution
status. Every replacement count-verified exactly-once."""
import sys

def replace_once(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK: {label} (1 site)")

# --- 1. PAD §10: the RESOLVED session-50 row (appended after the s49 row) ---
# anchor: the s49 row's ending — "inventory in `docs/remediation-plan-session49.md` |"
with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()
S49_ROW_TAIL = "inventory in `docs/remediation-plan-session49.md` |"
if pad.count(S49_ROW_TAIL) != 1:
    print(f"FATAL: the s49 known-issues row tail: expected 1, found {pad.count(S49_ROW_TAIL)}")
    sys.exit(1)

S50_ROW = ("\n| RESOLVED | Session-50 own-side audit (the s87 shortlist's two leading candidates measured CLEAN again — the CLAUDE major-only prose (16.4.0/19.3.0/4.3.3/6.19.3 satisfy every claim) + the DEPLOYMENT rate-limit figures (10/5/15-min + the 1000-key sweep + the one-sweep-per-minute gate all match auth.ts) — then one level deeper: every test-shaped numeral across the five docs OUTSIDE every s48 family shape): the README Quick Start's Verify Setup block quoted `bun run test` as \"4 files / 55 tests passed\" — session-1-era figures that survived 49 sessions and every corpus move (199→254) because the line's shape (a QUOTED-OUTPUT form) is swept by no corpus family. Closed: the figure fix (25 files / 255 tests) + the s50 BRIDGE pin (the quoted file figure == the fs listing of the vitest include patterns, the quoted test figure == the runtime-pinned §7.1 Vitest sum, and the family canonical == that same sum — the s48 blind spot closed: a whole-family drift now fails loudly). The 32nd parity sweep: THE TWENTIETH /login wave ARRIVED — bundle-internal (the reference restructured onto ROLLDOWN: the entry + CSS + the whole chunk topology rotated; the old CSS 404; the login-contract strings moved to AuthAPI/AuthContext/i18n + the rendered DOM) with the RENDERED DOM unchanged on every surface (computed-style-verified: login card, active-nav gradient, sidebar #fafafa, h1 36px, quick-stats 48px gradient rows, the filter grid, the detail grid); `logoutReturnPath` hash-stable (33rd); their three standing defects persist (32nd); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape, the nav-tap auto-close + navigate; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation) | The quoted-output claim class (a quoted CLI output is a claim site like any other — no family swept its shape) + the family-canonical blind spot (a consistency family with no runtime bridge is a consensus, not a contract) + the non-unique-anchor mutation class (a revert needle must be unique in BOTH pre-apply and post-apply states) | Fixed — the BRIDGE pin + the figure fix + the corpus move 254→255 (9 family sites + the §7.1 row 4→5); 255 unit / 198 E2E / 121 smoke, 6-mutation-checked (A–F, each bit exactly its pin; D and F bit both my pin and the s49 pad pin), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: seven byte-identical + three BENIGN); inventory in `docs/remediation-plan-session50.md` |")

replace_once(
    "Project_Architecture_Document.md",
    S49_ROW_TAIL,
    S49_ROW_TAIL + S50_ROW,
    "PAD §10 the RESOLVED session-50 row",
)

# --- 2. SKILL: version + description + lesson 104 ---
replace_once(
    "service-desk_SKILL.md",
    "version: 2.47.0",
    "version: 2.48.0",
    "SKILL version 2.47.0 → 2.48.0",
)
replace_once(
    "service-desk_SKILL.md",
    "functionality. Distilled through the session-49 remediation (2026-10-14).",
    "functionality. Distilled through the session-50 remediation (2026-10-14).",
    "SKILL description line s49 → s50",
)

# lesson 104 goes after lesson 103 (the s49 distribution-table lesson)
LESSON_103_TAIL = "so deletion mutations operate on the NEIGHBOR-ANCHOR pair (apply removes neighbor+row, revert re-inserts), the s48 reverse-replace doctrine extended to deletions.**"
LESSON_104 = LESSON_103_TAIL + """
104. **A quoted CLI output is a claim site like any other — and a consistency family with no runtime bridge is a consensus, not a contract.** (Session 50.) The s87 shortlist's two leading candidates (the CLAUDE major-only prose, the DEPLOYMENT rate-limit figures) measured clean again, so the own-side audit went one level deeper: every test-shaped numeral across the five docs OUTSIDE every s48 family shape — and found exactly one live stale site: the README Quick Start's Verify Setup block quoted `bun run test`'s output as "4 files / 55 tests passed" — session-1-era figures that survived 49 sessions and every corpus move (199→254) because the line's shape (a QUOTED-OUTPUT form, `«N» files / «M» tests passed`) was swept by no corpus family (the family shapes are corpus-count forms: badge/verification/pyramid/commands/checklist/appendix). The deeper design defect the same audit exposed: the s48 family pins hold all sites to ONE number — but a whole-family drift (every site moving to a wrong number together) passes the family pin silently; nothing linked the family canonical to the RUNTIME total. The s49 pads pin the §7.1 rows per-file (so the §7.1 sum IS the runtime total), but nothing held the family canonical to that sum. The closure is the BRIDGE pin: the quickstart line is held directly to the ground truths (the quoted file figure == the fs listing of the vitest include patterns — counting FILES is a directory listing, always exact, never the s48 each-generated-tests trap that applies to counting TESTS; the quoted test figure == the runtime-pinned §7.1 sum), and the family canonical == that same sum — a whole-family drift now fails loudly. The doctrine: when a consistency pin family exists, ask what holds the family's ONE number to reality; if the answer is nothing, the family is a consensus, not a contract. And the live harness lesson, learned twice-over: a mutation whose revert needle appears elsewhere in the doc can never be count-verified (mutation E's first design anchored on the bare gate command, which appears 2× in README — after the apply collapsed the pair, the revert found 2 candidates and FATAL'd); the anchor must be unique in BOTH the pre-apply and post-apply states (the fix: the "← server + database healthy" prefix anchor, unique to the Verify Setup block).**"""

replace_once(
    "service-desk_SKILL.md",
    LESSON_103_TAIL,
    LESSON_104,
    "SKILL lesson 104",
)

# --- 3. the plan's execution status ---
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] The pin lands RED first (the honest RED — my pin + the s49 unit pad pin)",
    "- [x] The pin lands RED first (the honest RED — my pin: \"the quoted file count must name the vitest include listing — the listing carries 25 files: expected 4 to be 25\"; the s49 unit pad pin: \"the §7.1 row for tests/corpus-count-contract.test.ts claims 4 tests — the runtime count is 5\"; one pin-harness bug fixed in flight: the `**/` sequence inside a block comment terminates it early — the s50 comment class, rewritten glob-free)",
    "plan status: RED",
)
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] The README fix + the §7.1 row fix + the corpus move (254 → 255 ×9 sites + pin 1's literal) — GREEN 255/255",
    "- [x] The README fix + the §7.1 row fix + the corpus move (254 → 255 ×9 sites + pin 1's literal) — GREEN 255/255 = 254 + 1 (scripts/s50-doc-fixes.py, 12 replacements count-verified exactly-once)",
    "plan status: GREEN",
)
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] The mutation checks (6: A–F, each observed + reverted + re-verified)",
    "- [x] The mutation checks (6: A–F, each observed + reverted + re-verified — reverse-replace, never checkout; A the quickstart tests one-behind bit my pin's assertion 2; B the files revert bit assertion 1; C the badge revert bit pin 1's family + the BRIDGE; D the §7.1 row revert bit the s49 pad pin + my pin; E the line deletion bit my pin's floor — the live harness lesson: a non-unique revert needle can never be count-verified, the anchor fixed to the \"← server + database healthy\" prefix; F the row DELETION bit the s49 pad pin's missing-row direction + my pin)",
    "plan status: mutations",
)
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] The full gate in the clean environment: lint ✓ typecheck ✓ 255/255 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓",
    "- [x] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 255/255 unit ✓ build ✓ 198/198 E2E (2.8m) ✓ smoke 121 ✓",
    "plan status: gate",
)
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] Live re-verification + screenshots (the 10-shot set, VLM-diffed) + docs alignment + worklog tasks 152+",
    "- [x] Live re-verification + screenshots + docs alignment + worklog tasks 152+ (the mobile matrix 375=375 green on the remediated build, the real click opens 0,0,288,667, Escape, the nav-tap; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip: the S50 remediated probe Prisma-verified cmv8mzbgl0001ucc16ij1b8r2 open/hardware + cleaned + the canonical 4/11/3; the 10-shot set: SEVEN byte-identical to the s49 baselines + the THREE changed shots (04/05 the timestamp class + 09 the S50 fixture title) VLM-diffed BENIGN)",
    "plan status: verification",
)
replace_once(
    "docs/remediation-plan-session50.md",
    "- [ ] Commit + push + CI verification",
    "- [x] Commit + push + CI verification — see the worklog tasks 152+ and docs/session_89.md",
    "plan status: push",
)

print("docs-align part 2 complete: PAD + SKILL + the plan's execution status")
