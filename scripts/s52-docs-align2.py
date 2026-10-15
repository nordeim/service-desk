#!/usr/bin/env python3
"""S52 docs-align part 2 — PAD (the RESOLVED session-52 row) + the SKILL
(v2.50.0: the version + lesson 106 + the project_state) + the plan's
execution status. Every replacement count-verified EXACTLY-ONCE."""
import sys

REPO = "/home/z/my-project/service-desk"

def apply(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n} — ABORT (no write)")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new))
    print(f"OK   {label}")

# --- PAD: the RESOLVED session-52 known-issues row (before the s51 row) ---
PAD_S52_ROW = "| RESOLVED | Session-52 own-side audit (the s91 shortlist's three leading candidates measured CLEAN again — the CLAUDE major-only prose (16.4.0/19.3.0/4.3.3/6.19.3 satisfy every claim, the fifth consecutive clean session) + the DEPLOYMENT rate-limit figures (10/5/15-min + `BUCKETS_SWEEP_THRESHOLD = 1_000` + `BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000` all match auth.ts) + the vitest/playwright version surfaces (held by the s48 version-contract pins) — then one level deeper: the DATE-shaped claim sweep): FOUR doc-freshness sites, THREE stale (CLAUDE.md `last_updated: 2026-10-09` + the PAD `**Last Updated:** 2026-10-09` — both edited by `f9de02b` (2026-10-15 +0800) with the s50/s51 counts + anti-patterns, the dates never moving; AGENTS.md's \"Verified against the toolchain on 2026-10-09.\" — the file also edited by f9de02b, the toolchain re-verified by every gate since) + ONE internally inconsistent (the SKILL description's \"Distilled through the session-50 remediation (2026-10-14).\" vs its own frontmatter 2.49.0/2026-10-15 + its last lesson tagged (Session 51.)). The class survived 51 sessions because the DATE shape matches no pin family's form and the session checklist bumps the SKILL's frontmatter alone. Closed: the 3 docdate-contract pins (the git-anchored staleness — each claimed date >= the doc's git last-commit date, the +0800 operator-timezone convention; the SKILL-internal ledger coherence — the description's session == the last lesson's tag + its date == the frontmatter; the no-future-dating guard) + the CI verify-job checkout `fetch-depth: 0` (measured: a depth-1 clone answers HEAD's date for EVERY file — the pin would measure nothing; the s45 shape pins survive untouched). The 34th parity sweep: NO twenty-first /login wave (the rolldown bundle byte-identical to the s50/s51 records — the entry 105055, the CSS 904487, `logoutReturnPath` hash-stable the 35th, the old CSS still 200 (900665) — the s51 edge-cache state persists); their three standing defects persist (34th — the real click REFUSED at the toggle rect 24,16,28,28); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape, the nav-tap auto-close + navigate; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation) | The doc-freshness class (a `last_updated` field is a checkable claim whose ground truth is the file's own content history — a date that does not move with the file is a stale claim no corpus family will ever catch; born-right-then-drifted-stale dates need git-anchored pins, and the git anchor needs REAL history — the shallow-clone measurement trap closed with fetch-depth: 0) + the one-sided-staleness doctrine (claimed >= git: the enforcement point is CI, post-commit, where the committer date is final — the future-lie gets its own no-future-dating guard) | Fixed — the 3 docdate-contract pins + the 4 date fixes + the ci.yml fetch-depth + the corpus move 257→260 (9 family sites + the quickstart line 27/260 + the §7.1 new row); 260 unit / 198 E2E / 121 smoke, 6-mutation-checked (A–F, each bit exactly its pin; E and F bit both the s49 pad pin and the s50 BRIDGE), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: nine byte-identical + one BENIGN); inventory in `docs/remediation-plan-session52.md` |\n"

apply(f"{REPO}/Project_Architecture_Document.md",
      "| RESOLVED | Session-51 own-side audit (the s89 shortlist's three leading candidates measured CLEAN again",
      PAD_S52_ROW + "| RESOLVED | Session-51 own-side audit (the s89 shortlist's three leading candidates measured CLEAN again",
      "PAD §10: the RESOLVED session-52 row (before the s51 row)")

# --- SKILL: the version bump 2.49.0 → 2.50.0 ---
apply(f"{REPO}/service-desk_SKILL.md",
      "version: 2.49.0",
      "version: 2.50.0",
      "SKILL frontmatter: version 2.49.0 → 2.50.0")

# --- SKILL: the project_state gains the s52 pins (before the closing of the pin list) ---
apply(f"{REPO}/service-desk_SKILL.md",
      "the missing-row class closed; the smoke row tied to the corpus family)); CI on GitHub Actions green",
      "the missing-row class closed; the smoke row tied to the corpus family) + the s51 prerequisites pins (the README Requires line held two-sided: the seed's node:crypto ground truth + the enumeration guard — no Python requirement the codebase does not have) + the s52 docdate pins (the four dated docs' freshness claims held to their git content history + the SKILL-internal ledger coherence + the no-future-dating guard — the stale '2026-10-09' claims + the session-50 description closed)); CI on GitHub Actions green",
      "SKILL project_state: the s51 + s52 pin lines appended")

# --- SKILL: lesson 106 (appended after lesson 105) ---
LESSON_105_TAIL = "audit the docs' IMPERATIVE surfaces — requirements, prerequisites, promises of behavior — against the code the way corpus figures are audited against the run; a born-wrong claim is invisible to every drift watch by construction.**"
LESSON_106 = LESSON_105_TAIL + """

106. **A `last_updated` field is a checkable claim — and its ground truth is the file's own content history.** (Session 52.) The s91 shortlist's three leading candidates (the CLAUDE major-only prose, the DEPLOYMENT rate-limit figures, the vitest/playwright version surfaces) measured clean again (the fifth consecutive session), so the own-side audit went one level deeper: the DATE-shaped claim sweep across the five docs + DEPLOYMENT — and found FOUR freshness sites, THREE stale and ONE internally inconsistent. CLAUDE.md's frontmatter and the PAD's header both claimed `2026-10-09` while `f9de02b` (2026-10-15 +0800) had just landed the s50/s51 corpus counts + anti-patterns IN those files — the dates were born right at session 1 and drifted stale across 50+ sessions because the session checklist bumps the SKILL's frontmatter alone; the SKILL's own description named "session-50" while its frontmatter said 2.49.0 / 2026-10-15 and its last lesson was tagged (Session 51.) — the version and the lessons moved, the description did not. The class survived every pin family because the DATE shape matches no corpus-count, §7.1-row, quoted-output, or requirements-enumeration form, and no drift watch compared a date claim to the file's actual history. The closure is three-sided: the git-anchored staleness pin (claimed >= the doc's git last-commit date, read in the operator timezone +0800 — measured: the s51 commit landed 2026-10-14 23:34 UTC and the SKILL correctly claimed 2026-10-15, the +0800 reading; a UTC clock false-REDs that legitimate claim), the SKILL-internal ledger coherence (the description's session == the LAST lesson's tag, its date == the frontmatter), and the no-future-dating guard (the staleness pin is one-sided BY DESIGN — a session lands a dated doc before its commit's committer date is knowable, so the enforcement point is CI post-commit, the same CI-is-the-gate-that-bites pattern as the s50 BRIDGE — which means the future-lie needs its own guard). TWO measurement traps the design survived, both measured live before the pin was written: (1) a depth-1 shallow clone — GitHub Actions' `actions/checkout@v4` DEFAULT — answers `git log -1 --format=%cI -- <file>` with HEAD's date for EVERY file, even files HEAD did not touch; the CI verify-job checkout now carries `fetch-depth: 0` and the pin fails loudly on shallow rather than silently skipping (the s18 doctrine). (2) mtime is no ground truth — fresh clones reset every mtime to checkout time; git history is the only stable content-history measure. The doctrine: audit the docs' META surfaces — dates, versions, freshness signals — the way corpus figures are audited against the run; a freshness signal that does not move with the file is a stale claim no corpus family will ever catch, and its pin needs the file's real history, not a cheaper proxy.**"""

apply(f"{REPO}/service-desk_SKILL.md",
      LESSON_105_TAIL,
      LESSON_106,
      "SKILL: lesson 106 appended after lesson 105")

# --- the plan's execution status ---
apply(f"{REPO}/docs/remediation-plan-session52.md",
      """## 5. Execution status

- [ ] Gap analysis (F1–F5 all non-gap + the no-21st-wave records + P1) — complete, recorded in the workspace worklog
- [ ] The pins land RED first (the honest RED — pin 1 on the three stale docs; pin 2 on the session-50 description; pin 3 green)
- [ ] The date fixes + the ci.yml fetch-depth + the §7.1 row + the corpus move (257 → 260 ×9 sites + the quickstart line 27/260 + the pin literal + the BRIDGE ternary) — GREEN 260/260 = 257 + 3
- [ ] The mutation checks (6: A–F, each observed + reverted + re-verified)
- [ ] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 260/260 unit ✓ build ✓ 198/198 E2E ✓ smoke 121 ✓
- [ ] Live re-verification + screenshots + docs alignment + worklog tasks 160+
- [ ] Commit + push + CI verification""",
      """## 5. Execution status

- [x] Gap analysis (F1–F5 all non-gap + the no-21st-wave records + P1) — complete, recorded in the workspace worklog
- [x] The pins land RED first (the honest RED — pin 1: "CLAUDE.md's frontmatter last_updated claims 2026-10-09 but the file's git last-commit date is 2026-10-15 (Asia/Singapore)"; pin 2: "the description names session-50 but the file's LAST lesson is tagged (Session 51.)"; pin 3 green — nothing future-dated; plus the standing pins' honest REDs: the s49 pad pin on the missing §7.1 row + the s50 BRIDGE on "the listing carries 27 files: expected 26 to be 27")
- [x] The date fixes + the ci.yml fetch-depth + the §7.1 row + the corpus move (257 → 260 ×9 sites + the quickstart line 27/260 + the pin literal + the BRIDGE ternary) — GREEN 260/260 = 257 + 3 (scripts/s52-doc-fixes.py, 19 replacements, each count-verified exactly-once)
- [x] The mutation checks (6: A–F, each observed + reverted + re-verified — reverse-replace, never checkout; A the stale-date reintroduction bit pin 1's staleness direction; B the future-dated PAD date bit pin 3's no-future-dating guard; C the session-50 description revert bit pin 2's ledger agreement; D the badge revert 260→257 bit the s48 family pin's ONE-number check; E the §7.1 docdate row count 3→2 bit the s49 pad pin AND the s50 BRIDGE (the sum 259); F the row deletion bit the s49 pad pin's missing-row direction AND the BRIDGE (the sum 257))
- [x] The full gate in the clean environment (ports 3000/3100/3999 free): lint ✓ typecheck ✓ 260/260 unit ✓ build ✓ 198/198 E2E (2.9m) ✓ smoke 121 ✓
- [x] Live re-verification + screenshots + docs alignment + worklog tasks 160+ (the mobile matrix 375=375 green on the remediated build, the real click opens 0,0,288,667, Escape, the nav-tap; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip: the S52 remediated probe Prisma-verified cmv8sovqd0001tk3xefkbc8jz open/hardware + cleaned + the canonical 4/11/3; the 10-shot set: NINE byte-identical to the s51 baselines + the ONE changed shot (09 the S52 fixture title) VLM-diffed BENIGN)
- [ ] Commit + push + CI verification""",
      "the plan's execution status (the completed checkboxes)")

print("\nS52 docs-align part 2 complete.")
