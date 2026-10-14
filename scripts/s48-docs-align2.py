#!/usr/bin/env python3
"""S48 docs alignment part 2: CLAUDE anti-pattern + PAD §7.1 rows + PAD §10
RESOLVED row + SKILL v2.46.0 (version, description, project_state, lesson 102).
Every replacement count-verified exactly-once; abort on any miscount."""

import sys

REPO = "/home/z/my-project/service-desk"

CLAUDE_ANTIPATTERN = ("- Sweeping only the CURRENT value's doc sites when drift-watching corpus counts (\"is '251' consistent?\") — the s48 audit found SIX stale-era siblings the manual watch could never see: the SKILL appendices carried session-4-era figures (\"54 unit tests\", \"57 E2E\", \"11-step\", \"# 107 E2E\" ×2) for 44 sessions, and README claimed 163 parity tests while CLAUDE said 164. Drift-watch by FAMILY SHAPE (every live claim site of a figure, floor-guarded), never by value-grep. **This class + the fix are pinned in `tests/corpus-count-contract.test.ts` (session 48).**\n")

PAD_ROWS = """| Unit — the s48 corpus-count consistency pins (the drift-watch automation, family-shaped: every live unit (9 sites) / e2e (10) / parity (3) / smoke-steps (4) claim site across the five docs names ONE number, minimum-site floors; the stale '54'/'57'/'11-step'/'107' SKILL-appendix figures + README's '163 parity' closed; PAD §10 historical rows excluded by boundary) | 1 | 4 | `tests/corpus-count-contract.test.ts` | Vitest |
| Unit — the s48 stack-version pins (the README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the bun.lock resolved entries — bidirectional, floor-guarded; the s45 tsx-entry doctrine generalized to the seven documented packages) | 1 | 2 | `tests/version-contract.test.ts` | Vitest |
"""

PAD_RESOLVED = "| RESOLVED | Session-48 own-side audit (the s83 shortlist's leading candidate executed): the corpus-count surface carried SIX stale claim sites — the SKILL appendices at session-4-era figures (\"54 unit tests\", \"57 E2E\", \"11-step API contract\", \"# 107 E2E\" ×2; 44 sessions stale) + README's \"163 E2E parity tests\" vs the actual 164 while CLAUDE said 164 (the exact partial-update failure mode) — because the manual drift-watch grep only ever checked the CURRENT value's sites. Closed: the six doc fixes + `tests/corpus-count-contract.test.ts` (4 family-consistency pins, floor-guarded). The sibling surface: the stack-version claims (README badges + PAD §2) correct but unpinned — closed by `tests/version-contract.test.ts` (2 pins: documented figures ↔ installed versions; bun.lock agreement). The 30th parity sweep ALL NON-GAP — NO eighteenth /login wave (all three chunks byte-identical to the s47 records, logoutReturnPath hash-stable 31st); their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, 30th); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates) + the paired VLM check LAYOUT-OK (both pre- and post-remediation, first attempt) | The corpus-drift class (a claim set without a family-shaped consistency pin drifts on partial updates — sweep the family shapes, not the value's sites) + the repo-face class (version claims pin to the installed artifact at BOTH layers: node_modules + the lockfile) + the mutation-harness class (mutations on an uncommitted tree revert by REVERSE-REPLACE, never `git checkout` — checkout wipes the remediation itself) | Fixed — the 4 corpus pins + the 2 version pins + the 6 stale-figure doc fixes; 251 unit / 198 E2E / 121 smoke, 8-mutation-checked (A–H, each bit exactly its pin; H bit both the unit and e2e families), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical); inventory in `docs/remediation-plan-session48.md` |\n"

SKILL_LESSON = """102. **A corpus-claim set drifts by PARTIAL updates — pin the family, not the value; and the repo's version claims pin to the installed artifact at both layers.** (Session 48.) The s83 shortlist's own leading candidate ("the corpus-count drift watch — one grep") executed with a twist: the manual watch had grepped the CURRENT value's sites for six sessions (is "238"/"245" consistent across the docs?) and always read CLEAN — but it never swept for stale-era siblings, and the family-shaped extraction found SIX of them: the SKILL's own appendices carried session-4-era figures ("54 unit tests", "57 E2E", "11-step API contract", "# 107 E2E" ×2) for 44 sessions, and README's feature table said "163 E2E parity tests" while CLAUDE.md correctly said 164. The doctrine: a drift watch by VALUE-grep is structurally blind to the drift it exists to catch (a partial update leaves the value's sites consistent while the stale sibling sits in an appendix nobody re-read); the honest automation is FAMILY-shaped — enumerate every live claim site by its SHAPE (badge forms, commands-table forms, checklist forms, appendix quick-reference forms), require them all to name one number, and FLOOR-guard the site count so a dropped site fails loudly instead of silently shrinking the family. The boundary carve-outs matter as much as the pins: the PAD §10 historical rows are immutable records (slice them out), and the runtime values stay runtime (a static count of the parity spec's `test(` lines reads 155 vs the true 164 — pin the doc side, verify the value live). The sibling surface the same session: the README badge row + the PAD tech table claimed the stack's versions with zero pins — correct today (node_modules, bun.lock, and both doc surfaces byte-agree at 16.4.0/19.3.0/5.9.3/4.3.3/6.19.3/5.0.3/1.64.0), but any `bun update` drifts the face silently (the ranges already float: ^16.1.1 resolves to 16.4.0). Pin the claims to the INSTALLED artifact at both layers — the node_modules version (what the gate runs on) and the lockfile resolved entry (what CI installs frozen) — and floor-guard each doc surface so a dropped badge line or table row fails instead of silently un-claiming. Pin the claims, not the universe: the transitive dependency tree is lockfile-governed and undocumented. And the mutation-harness lesson, learned live: the first mutation run reverted with `git checkout -- <file>` and silently WIPED the session's own uncommitted doc fixes (recovered idempotently) — mutations on an uncommitted tree revert by REVERSE-REPLACE, never by checkout; a tool that solves the immediate problem while destroying the work is the s47 mutation-C class aimed at the harness itself.**
"""

def apply(path, old, new, count=1):
    with open(path, encoding="utf-8") as f:
        t = f.read()
    c = t.count(old)
    if c != count:
        print(f"ABORT {path}: expected {count} hits of {old[:60]!r}..., found {c}", file=sys.stderr)
        sys.exit(1)
    t = t.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(t)
    print(f"OK {path}: {old[:50]!r}... ({count} site)")

# 1. CLAUDE: the s48 anti-pattern (after the space-y trap, the section's last entry)
apply(f"{REPO}/CLAUDE.md",
      "(the shadow-xs doctrine: parity is the COMPUTED value).\n",
      "(the shadow-xs doctrine: parity is the COMPUTED value).\n" + CLAUDE_ANTIPATTERN)

# 2. PAD §7.1: the two new test rows (after the s47 docs-contract row)
apply(f"{REPO}/Project_Architecture_Document.md",
      "the stale '30 E2E checks' closed) | 1 | 2 | `tests/docs-contract.test.ts` | Vitest |\n",
      "the stale '30 E2E checks' closed) | 1 | 2 | `tests/docs-contract.test.ts` | Vitest |\n" + PAD_ROWS)

# 3. PAD §10: the RESOLVED session-48 row (append after the s47 row)
with open(f"{REPO}/Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()
s47_row_marker = "inventory in `docs/remediation-plan-session47.md` |\n"
assert pad.count(s47_row_marker) == 1, "s47 RESOLVED row marker not found"
pad = pad.replace(s47_row_marker, s47_row_marker + PAD_RESOLVED)
with open(f"{REPO}/Project_Architecture_Document.md", "w", encoding="utf-8") as f:
    f.write(pad)
print("OK PAD §10: the RESOLVED session-48 row appended")

# 4. SKILL: version + description + lesson 102
apply(f"{REPO}/service-desk_SKILL.md", "version: 2.45.0", "version: 2.46.0")
apply(f"{REPO}/service-desk_SKILL.md",
      "Distilled through the session-47 remediation (2026-10-14).",
      "Distilled through the session-48 remediation (2026-10-14).")
apply(f"{REPO}/service-desk_SKILL.md",
      "the stale '16'/'30' closed)));",
      "the stale '16'/'30' closed)) + the s48 corpus-count-contract pins (the drift-watch automation, family-shaped: every live unit/e2e/parity/smoke corpus claim site across the five docs names ONE number, floor-guarded — the stale '54'/'57'/'11-step'/'107' SKILL-appendix figures + README's '163 parity' closed) + the s48 version-contract pins (the README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the bun.lock resolved entries — the stack's face pinned bidirectionally));")
with open(f"{REPO}/service-desk_SKILL.md", encoding="utf-8") as f:
    skill = f.read()
lesson101_tail = "pin the number and the sentence that carries it.**\n"
assert skill.count(lesson101_tail) == 1, "lesson 101 tail not found"
skill = skill.replace(lesson101_tail, lesson101_tail + "\n" + SKILL_LESSON)
with open(f"{REPO}/service-desk_SKILL.md", "w", encoding="utf-8") as f:
    f.write(skill)
print("OK SKILL: lesson 102 appended")

print("Part 2 complete: CLAUDE + PAD + SKILL aligned.")
