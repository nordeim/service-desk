#!/usr/bin/env python3
"""S49 docs alignment part 2: PAD §10 known-issues row + SKILL v2.47.0.
Idempotent recovery; every replacement count-verified exactly-once."""
import sys

def replace_once(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n == 0 and new in text:
        print(f"SKIP {label} (already applied)")
        return
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK {label}")

# --- PAD §10: the RESOLVED session-49 row (appended after the s48 row) ---
S49_ROW = ("| RESOLVED | Session-49 own-side audit (the s85 shortlist's leading candidate — the per-file "
           "test-count class): the PAD §7.1 Test Distribution table carried SIX defects the totals-only "
           "watch could never see — three stale counts (domain.test.ts 61 vs the runtime 75; "
           "headers-config.test.ts 4 vs 9; the auth.spec E2E row 9 vs the --list 11) + three MISSING rows "
           "(tests/api-catchall.test.ts 19, tests/proxy-fromurl.test.ts 8, tests/body-size.test.ts 11 — 38 "
           "tests unrepresented; the table's unit rows summed to 194 against the canonical 251 the corpus "
           "pins held). Closed: the six row fixes + the four new rows (the three missing + the pin file's "
           "own) + `tests/pad-testcount-contract.test.ts` (3 pins, bidirectional: every §7.1 row names its "
           "file's RUNTIME count via the nested vitest JSON run — the recursion bounded by the SD_PAD_NESTED "
           "sentinel — and every runtime file has a row; the E2E side via the playwright --list; the smoke "
           "row tied to the s48 corpus family). The 31st parity sweep ALL NON-GAP — NO nineteenth /login wave "
           "(all three chunks byte-identical to the s48 records, logoutReturnPath hash-stable 32nd); their "
           "three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile "
           "overflow, the s4 toast-viewport blocking — the real click REFUSED, 31st); ours the working "
           "superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap "
           "auto-closes + navigates) + the paired VLM check LAYOUT-OK (both pre- and post-remediation, first "
           "attempt) | The distribution-table class (a per-file table with only a totals watch drifts row by "
           "row — the per-file figures need per-file RUNTIME pins; static `test(` counts are false claims: "
           "`vitest list` undercounts each-generated tests 226-vs-251, measured) + the empty-string-mutation "
           "class (a row-deletion mutation reverts via the NEIGHBOR-ANCHOR pair — an empty needle can never "
           "be count-verified) | Fixed — the 3 per-file pins + the 6 row fixes + the 4 new rows; 254 unit / "
           "198 E2E / 121 smoke, 6-mutation-checked (A–F, each bit exactly its pin), live-verified (the "
           "mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the "
           "screenshot set: six byte-identical + four BENIGN timestamp/fixture-title diffs); inventory in "
           "`docs/remediation-plan-session49.md` |\n")

with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()
# anchor: the end of the s48 row (its unique tail)
S48_TAIL = "inventory in `docs/remediation-plan-session48.md` |\n"
if S49_ROW in pad:
    print("SKIP PAD s49 known-issues row (already applied)")
elif pad.count(S48_TAIL) == 1:
    pad = pad.replace(S48_TAIL, S48_TAIL + S49_ROW, 1)
    with open("Project_Architecture_Document.md", "w", encoding="utf-8") as f:
        f.write(pad)
    print("OK PAD s49 known-issues row")
else:
    print(f"FATAL PAD s49 row anchor: {pad.count(S48_TAIL)}")
    sys.exit(1)

# --- SKILL: version bump + description line + project_state + lesson 103 ---
replace_once(
    "service-desk_SKILL.md",
    "version: 2.46.0",
    "version: 2.47.0",
    "SKILL version 2.46.0→2.47.0",
)

replace_once(
    "service-desk_SKILL.md",
    "Distilled through the session-48 remediation (2026-10-14).",
    "Distilled through the session-49 remediation (2026-10-14).",
    "SKILL description line session-49",
)

replace_once(
    "service-desk_SKILL.md",
    "the README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the bun.lock resolved entries — the stack's face pinned bidirectionally));",
    "the README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the bun.lock resolved entries — the stack's face pinned bidirectionally) + the s49 pad-testcount pins (the PAD §7.1 per-file test distribution pinned bidirectionally to the RUNTIME: every row names its file's runtime count via the nested vitest JSON run, every runtime file has a row via the playwright --list — the missing-row class closed; the smoke row tied to the corpus family));",
    "SKILL project_state + s49 pins",
)

LESSON103 = """

103. **A per-file distribution table needs per-file RUNTIME pins — a totals-only watch leaves the rows to drift; and a row-deletion mutation reverts by the NEIGHBOR-ANCHOR pair, never an empty needle.** (Session 49.) The s85 shortlist's leading candidate: the PAD §7.1 Test Distribution table claimed 21 unit rows while the suite ran 25 — three rows carried counts 44-session-stale (domain 61 vs the runtime 75), and THREE files (the s33 api-catchall, the s35 body-size, the s36 proxy-fromurl pins — 38 tests) had no row at all, while the s48 corpus pins verified the TOTALS green every session. The doctrine: a distribution is a per-file contract; its ground truth is the RUN (a nested vitest --reporter=json — each-generated tests undercount in every static shape: `vitest list` reports 226 vs the runtime 251, measured; the recursion bounded by an env sentinel so the pin file contributes its own true count) and the playwright --list (test.each expands at collection — the list IS the runtime truth, 0.7s, side-effect-free). And the harness lesson: a mutation that deletes a whole row cannot reverse-replace an empty string — `str.count("")` matches every position — so deletion mutations operate on the NEIGHBOR-ANCHOR pair (apply removes neighbor+row, revert re-inserts), the s48 reverse-replace doctrine extended to deletions.**"""

replace_once(
    "service-desk_SKILL.md",
    "a tool that solves the immediate problem while destroying the work is the s47 mutation-C class aimed at the harness itself.**",
    "a tool that solves the immediate problem while destroying the work is the s47 mutation-C class aimed at the harness itself.**" + LESSON103,
    "SKILL lesson 103",
)

print("docs alignment part 2 complete (PAD + SKILL)")
