#!/usr/bin/env python3
"""S51 docs alignment part 2: PAD known-issues row + SKILL v2.49.0 (lesson 105)
+ the plan's execution status (the s50 pattern — count-verified EXACTLY-ONCE)."""
import sys

REPO = "/home/z/my-project/service-desk/"

def apply(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK   {label}")

PAD = REPO + "Project_Architecture_Document.md"
SKILL = REPO + "service-desk_SKILL.md"
PLAN = REPO + "docs/remediation-plan-session51.md"

# 1. PAD: the RESOLVED session-51 known-issues row (right after the s50 row —
#    the block's session order)
S50_ROW_END = "inventory in `docs/remediation-plan-session50.md` |\n"
S51_ROW = ("| RESOLVED | Session-51 own-side audit (the s89 shortlist's three leading candidates measured CLEAN again — the CLAUDE major-only prose (16.4.0/19.3.0/4.3.3/6.19.3 satisfy every claim) + the DEPLOYMENT rate-limit figures (10/5/15-min + `BUCKETS_SWEEP_THRESHOLD = 1_000` + `BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000` all match auth.ts) + the vitest/playwright version surfaces (held by the s48 version-contract pins) — then one level deeper: the REQUIREMENT-shaped prose sweep): the README Quick Start's Requires line claimed \"Python ≥ 3.9 for the seed's crypto imports\" — FALSE at birth (the session-1 docs commit described a Python the seed never had: `prisma/seed.ts` has imported `randomUUID, scryptSync, randomBytes` from `node:crypto` since its first line) and unswept for 50 sessions (the shape — a requirements enumeration — matches no corpus-count, §7.1-row, or quoted-output form; born wrong rather than drifted, so even a perfect drift watch would miss it: nothing to compare against except the CODE). Closed: the two-sided prereq-contract pins (the seed-crypto ground truth + the Requires-line enumeration guard — the enumeration is the FIRST SENTENCE alone; the honest \"no Python required\" clarification lives in the prose after it, outside the claim surface) + the openssl-first secret comment (the .env.example canonical recommendation aligned into the quickstart). The 33rd parity sweep: NO twenty-first /login wave (the rolldown bundle byte-identical to the s50 records — the entry 105055, the CSS 904487, `logoutReturnPath` hash-stable 34th; the ONE bundle-internal delta: the old CSS back to 200 after its s50 404, an edge-cache artifact on an unreferenced chunk); their three standing defects persist (33rd); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape, the nav-tap auto-close + navigate; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation) | The prerequisites-claim class (a Quick Start's requirements are claims like any other — a requirement the codebase does not have is a false claim no corpus family will ever catch; born-wrong claims need CODE-grounded pins, not drift watches) + the enumeration-scoping doctrine (the claim surface is the first sentence; explanatory prose after it is not a claim — a greedy guard flags the honest negation) | Fixed — the 2 prereq-contract pins + the README fixes + the corpus move 255→257 (9 family sites + the quickstart line 26/257 + the §7.1 new row); 257 unit / 198 E2E / 121 smoke, 6-mutation-checked (A–F, each bit exactly its pin; E and F bit both the s49 pad pin and the s50 BRIDGE), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: seven byte-identical + three BENIGN); inventory in `docs/remediation-plan-session51.md` |\n")
apply(PAD,
      S50_ROW_END,
      S50_ROW_END + S51_ROW,
      "PAD: the RESOLVED session-51 known-issues row")

# 2. SKILL: the version bump 2.48.0 → 2.49.0 + last_updated
apply(SKILL,
      "version: 2.48.0\nlast_updated: 2026-10-14",
      "version: 2.49.0\nlast_updated: 2026-10-15",
      "SKILL: v2.48.0 → v2.49.0 + last_updated")

# 3. SKILL: lesson 105 (appended after lesson 104 — the file's last lesson)
with open(SKILL, encoding="utf-8") as f:
    skill = f.read()
LESSON105 = """
105. **A Quick Start's requirements line is a claim site — and a requirement the codebase does not have is a false claim no corpus family will ever catch.** (Session 51.) The s89 shortlist's three leading candidates (the CLAUDE major-only prose, the DEPLOYMENT rate-limit figures, the vitest/playwright version surfaces) measured clean again, so the own-side audit went one level deeper: the REQUIREMENT-shaped prose sweep across the five docs + DEPLOYMENT — and found exactly one live site, FALSE at birth: the README Quick Start's "Requires **Node.js ≥ 20** (or Bun ≥ 1.1) and Python ≥ 3.9 for the seed's crypto imports." The seed has imported `randomUUID, scryptSync, randomBytes` from `node:crypto` since its first commit — the session-1 docs regeneration described a Python the seed never had, and the claim survived 50 sessions because (a) the shape (a REQUIREMENTS enumeration) matches no pin family's form (corpus counts, §7.1 rows, quoted outputs) and (b) it was BORN WRONG rather than drifted — even a perfect drift watch compares docs to docs or docs to runs; nothing compared the requirements to the CODE. The closure is two-sided: the seed-crypto ground-truth pin (the node:crypto import + no Python token in the seed) and the Requires-line pin (the floor + Node ≥ 20 + Bun ≥ 1.1 + NO Python token in the enumeration). The scoping doctrine the pin-harness bug taught: a prerequisites line is TWO surfaces — the requirements enumeration (the FIRST SENTENCE, the claim) and the explanatory prose after it (not a claim); the guard is scoped to the sentence (`[^.]*` — a greedy line-regex flags the honest "no Python required" negation, the bug fixed in flight before the honest RED). The doctrine: audit the docs' IMPERATIVE surfaces — requirements, prerequisites, promises of behavior — against the code the way corpus figures are audited against the run; a born-wrong claim is invisible to every drift watch by construction.**
"""
if not skill.endswith("\n"):
    skill += "\n"
skill += LESSON105
with open(SKILL, "w", encoding="utf-8") as f:
    f.write(skill)
print("OK   SKILL: lesson 105 (the prerequisites-claim doctrine)")

# 4. The plan's execution status — the checkboxes close
apply(PLAN,
      """## 5. Execution status

- [ ] Gap analysis (F1–F5 all non-gap + the no-21st-wave records + P1) — complete, recorded in the workspace worklog
- [ ] The pins land RED first (the honest RED — pin 2: the prerequisites line carries a Python requirement the seed does not have; the s49 pad pin: the missing §7.1 row; the s50 BRIDGE: the quickstart figures 25/255 vs the listing 26 + the sum 257)
- [ ] The README fixes + the §7.1 row + the corpus move (255 → 257 ×9 sites + the quickstart line + pin 1's literal + the BRIDGE ternary) — GREEN 257/257 = 255 + 2
- [ ] The mutation checks (6: A–F, each observed + reverted + re-verified — reverse-replace, never checkout)
- [ ] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 257/257 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓
- [ ] Live re-verification + screenshots + docs alignment + worklog tasks 156+
- [ ] Commit + push + CI verification — see the worklog tasks 156+ and docs/session_91.md""",
      """## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + the no-21st-wave records + P1) — complete, recorded in the workspace worklog
- [x] The pins land RED first (the honest RED — pin 2: "the README Requires line's requirements enumeration must not carry a Python requirement: expected true to be false"; the s49 pad pin: "the suite runs tests/prereq-contract.test.ts (2 tests) with NO §7.1 row"; the s50 BRIDGE: "the listing carries 26 files: expected 25 to be 26"; one pin-harness bug fixed in flight: the greedy `(.*)` line-regex swallowed the honest "no Python required" clarification — the enumeration scoping doctrine, `[^.]*` to the first period)
- [x] The README fixes + the §7.1 row + the corpus move (255 → 257 ×9 sites + the quickstart line 26/257 + pin 1's literal + the BRIDGE ternary) — GREEN 257/257 = 255 + 2 (scripts/s51-doc-fixes.py, 14 replacements, each count-verified exactly-once)
- [x] The mutation checks (6: A–F, each observed + reverted + re-verified — reverse-replace, never checkout; A the false-claim reintroduction bit pin 2; B the line deletion bit pin 2's floor; C the seed-import break bit pin 1; D the badge revert bit pin 1's family; E the row-count mutation bit the s49 pad pin AND the s50 BRIDGE; F the row deletion bit the s49 pad pin's missing-row direction AND the BRIDGE)
- [x] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 257/257 unit ✓ build ✓ 198/198 E2E (2.8m) ✓ smoke 121 ✓
- [x] Live re-verification + screenshots + docs alignment + worklog tasks 156+ (the mobile matrix 375=375 green on the remediated build, the real click opens 0,0,288,667, Escape, the nav-tap; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip: the S51 remediated probe Prisma-verified cmv8qmm4g0001tkbl0b74hv4n open/hardware + cleaned + the canonical 4/11/3; the 10-shot set: SEVEN byte-identical to the s50 baselines + the THREE changed shots (04/05 the timestamp class + 09 the S51 fixture title) VLM-diffed BENIGN)
- [ ] Commit + push + CI verification — see the worklog tasks 156+ and docs/session_91.md""",
      "The plan's execution status (the first six checkboxes closed)")

print("\nPART 2 DONE — PAD + SKILL + the plan aligned")
