#!/usr/bin/env python3
"""S55: the docs alignment (Component 2 — every replacement count-verified
exactly-once, the s52/s53/s54 doctrine). Lands:
  1. the AGENTS Session-55 contracts section (after the Session-54 section)
  2. the AGENTS reference-list range -session53.md -> -session54.md
  3. the AGENTS screenshots-lineage s54 -> s55
  4. the PAD known-issues RESOLVED session-55 row (newest first)
  5. the CLAUDE.md anti-pattern (the s55 plan-status doctrine)
  6. the SKILL v2.53.0 (the description session-55 + lesson 109)
"""
import sys

REPO = "/home/z/my-project/service-desk"

def apply(content, old, new, expect_count=1, label=""):
    n = content.count(old)
    if n != expect_count:
        print(f"FATAL: {label!r} expected {expect_count} occurrence(s), found {n}")
        sys.exit(1)
    print(f"OK   {label}")
    return content.replace(old, new)

def read(p):
    with open(f"{REPO}/{p}") as f:
        return f.read()

def write(p, content):
    with open(f"{REPO}/{p}", "w") as f:
        f.write(content)

# ---------------- AGENTS ----------------
AGENTS = read("AGENTS.md")

S55_SECTION = """## Session-55 contracts (pinned by `tests/plan-status-contract.test.ts`; inventory in `docs/remediation-plan-session55.md`)

- **The plan-status closure (the own-side audit at a NEW level)**: the remediation plans' execution-status sections are STATUS CLAIMS, and two of them contradicted their own text or the verified history — the s38 shape A (an UNCHECKED box whose own text asserts completion: "— complete, recorded in worklog task 100-gap-s38", born at the remediation commit 221141a, missed by the s38 closeout 7fa3c8f which checked only the push box three lines below, 17 sessions of drift) and the s54 shape B (the "Commit + push + CI verification" box honestly unchecked at the remediation commit by the push chicken-and-egg, then the closeout bd05e5d updated only worklog.md — the s52 closeout-checks and the s53 deferral-form conventions were both missed; the box contradicted the verified history: the pushes landed + CI green on both). The class survived because the STATUS shape matches no pin family: the s48 corpus pins watch COUNTS, the s52 docdate pins watch DATES, the s53 keyfiles pins watch SIZES, the s54 coverage pins map SOURCE-to-TESTS — nothing asked whether a checkbox agrees with the state it asserts. Closed three-sided: the closed-plans completeness pin (every plan numbered below the current session carries zero unchecked boxes — the constant bumps each session, so a forgotten closeout box fails the VERY NEXT session's sweep, naming the exact file and line), the self-contradiction guard (an unchecked box whose own text asserts completion — the case-insensitive completion grammar — caught the MOMENT it is written, mid-flight or not), and the enumeration honesty (the glob-driven walk, never a hardcoded list + the corpus floor 54 + the current session's plan present). The template checklists (PAD §7.4, the SKILL manual-verify) carry unchecked boxes BY DESIGN — the glob reaches the plan corpus only. The doctrine: a status claim is a claim — an execution-status section needs its checkboxes held to the state they assert, and the push chicken-and-egg is closed BY CONVENTION (the deferral form at the remediation commit, verified by the closeout, swept by the next session's bump).
- **The 37th parity sweep: NO twenty-first /login wave** — the rolldown bundle byte-identical a FIFTH consecutive session (the entry `index-C-ulo5ek.js` 200/105055, the CSS `index-BIWjBcok.css` 200/904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 38th consecutive session, live 200 + still referenced; the old CSS `index-D0Q6-tUz.css` still 200 (900665) — the edge-cache state persists). Their three standing defects persist (37th re-verification: the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the REAL click REFUSED at the toggle rect 24,16,28,28 via the snapshot-ref guarded click, `elementFromPoint` returns the `fixed top-0 z-[100]` toast-container div, zero dialogs); ours the working superset (the mobile matrix byte-identical to the s41–s54 records: 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt; the UI round-trip Prisma-verified).

## Reference"""

AGENTS = apply(AGENTS, "\n## Reference\n", "\n" + S55_SECTION + "\n",
               label="AGENTS the NEW Session-55 contracts section")

AGENTS = apply(AGENTS,
    "`docs/remediation-plan-session2.md` … `-session53.md`",
    "`docs/remediation-plan-session2.md` … `-session54.md`",
    label="AGENTS the reference-list range through s54")

write("AGENTS.md", AGENTS)

# ---------------- PAD ----------------
PAD = read("Project_Architecture_Document.md")
S55_ROW = "| RESOLVED | Session-55 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the eighth consecutive session) — the CLAUDE major-only prose + the DEPLOYMENT rate-limit figures + the vitest/playwright version surfaces + the SKILL's prose-recap forms — then one level deeper: the status-claim sweep): the remediation plans' execution-status sections held to the state they assert — found FALSE at exactly two sites — the s38 shape A (an unchecked box whose own text asserts completion, born at 221141a, missed by the closeout 7fa3c8f, 17 sessions of drift) + the s54 shape B (the push box honestly unchecked at the remediation commit, the closeout bd05e5d updated only worklog.md, the box contradicting the verified pushes + CI-green history). The class survived because the STATUS shape matches no pin family (counts/dates/sizes/source-maps — nothing asks whether a checkbox agrees with its asserted state). Closed: tests/plan-status-contract.test.ts (the closed-plans completeness + the self-contradiction guard + the enumeration honesty) + the two box fixes (the s38 flip + the s54 record form reconstructed from the worklog's push entry) + the corpus move 270→273. The 37th parity sweep ALL NON-GAP — NO twenty-first /login wave (the rolldown bundle byte-identical FIFTH session running: the entry 105055, the CSS 904487, logoutReturnPath hash-stable the 38th, the old CSS still 200 (900665)); their three standing defects persist 37th (the real click REFUSED at the toggle rect 24,16,28,28); ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip Prisma-verified) | The plan-status class (a status claim is a claim — the execution-status sections need their checkboxes held to the state they assert; the push chicken-and-egg closed by the deferral-form convention, swept at the next session's boundary) | Fixed — the 3 plan-status pins + the 2 box fixes + the corpus move 270→273 (9 family sites + the quickstart line 31/273 + the §7.1 new row); 273 unit / 198 E2E / 121 smoke, 7-mutation-checked (A–G, each bit exactly its pin — the battery clean end-to-end after one E-pattern re-observation; two in-flight pin fixes from the observation pass: the case-insensitive grammar + the floor recalibration), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: nine byte-identical + one BENIGN); inventory in `docs/remediation-plan-session55.md` |\n"
# insert BEFORE the session-54 row (newest first, the table's convention)
S54_ROW_PREFIX = "| RESOLVED | Session-54 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the seventh consecutive session)"
PAD = apply(PAD, S54_ROW_PREFIX, S55_ROW + S54_ROW_PREFIX,
            label="PAD the RESOLVED session-55 known-issues row")
write("Project_Architecture_Document.md", PAD)

# ---------------- CLAUDE ----------------
CLAUDE = read("CLAUDE.md")
S55_LESSON = "- **A status claim is a claim, and its ground truth is the checkbox-vs-state relation (session 55: the remediation plans' execution-status sections drifted twice — the s38 \"— complete, recorded\" text under an UNCHECKED box (a self-contradiction within one line, born at the remediation commit, missed by the closeout that checked only the push box), and the s54 push box honestly unchecked at the remediation commit (the chicken-and-egg: the push of that very commit had not happened) with the closeout updating only worklog.md — the box contradicting the verified pushes + CI-green history. Invisible to every pin family: counts, dates, sizes, and source-maps never ask whether a checkbox agrees with the state it asserts. The closure is three-sided: the closed-plans sweep (every plan below the current session fully checked — the constant bumps each session, so a forgotten closeout fails the VERY NEXT session, naming file + line), the self-contradiction guard (an unchecked box whose own text asserts completion, caught the MOMENT it is written — case-insensitive, the CI-status \"COMPLETED/SUCCESS\" form included), and the enumeration (glob-driven walk + floor + the current plan present). The push chicken-and-egg is closed BY CONVENTION: the deferral form at the remediation commit (\"— see the worklog's push entry for the final figures\"), verified by the closeout, swept by the next session's bump. The doctrine: an execution-status section is a ledger, not a scratchpad — every box is either done (checked) or pending (unchecked with future-tense text), and any line that is both is a defect.**\n"
CLAUDE = apply(CLAUDE,
    "## Anti-Patterns to Avoid\n\n",
    "## Anti-Patterns to Avoid\n\n" + S55_LESSON,
    label="CLAUDE the s55 anti-pattern (the plan-status doctrine)")
write("CLAUDE.md", CLAUDE)

# ---------------- SKILL ----------------
SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL,
    "Distilled through the session-54 remediation (2026-10-15).",
    "Distilled through the session-55 remediation (2026-10-15).",
    label="SKILL description session-54 -> session-55")
SKILL = apply(SKILL,
    "version: 2.52.0",
    "version: 2.53.0",
    label="SKILL version 2.52.0 -> 2.53.0")

S55_LESSON_SKILL = """109. **A status claim is a claim — an execution-status checkbox needs holding to the state it asserts.** (Session 55.) The s95 shortlist's named candidates measured clean again (the eighth consecutive session), so the own-side audit went one level deeper: the status-claim sweep — are the remediation plans' "Execution status" sections honest? Found FALSE at exactly two sites, two distinct shapes. Shape A (s38, the self-contradiction): `- [ ] Gap analysis (F1–F5 + P1/P2/P3) — complete, recorded in worklog task 100-gap-s38` — the TEXT asserts completion (and names its evidence, which exists), the CHECKBOX says not-done. Born at the remediation commit 221141a (the section was assembled with the text already asserting completion — the box was simply never flipped) and survived the closeout 7fa3c8f, whose diff checks only the push box three lines below. 17 sessions of drift. Shape B (s54, the closeout omission): the "Commit + push + CI verification" box honestly unchecked at the remediation commit 115431e (the push of that very commit had not happened — the chicken-and-egg), then the closeout bd05e5d updated only worklog.md — so the box contradicted the verified history (the pushes landed, CI green on both runs). The two prior sessions each had a working convention — s52 checked the box at the closeout with the full record; s53 used the deferral form at the remediation commit — and s54 did neither. The class survived because the STATUS shape matches no pin family's form: the s48 corpus pins watch COUNTS, the s52 docdate pins watch DATES, the s53 keyfiles pins watch SIZES, the s54 coverage pins map SOURCE-to-TESTS — nothing anywhere asks whether a checkbox agrees with the state it asserts. The closure is three-sided, the s53/s54 precedent: (1) the closed-plans completeness pin — every plan numbered below CURRENT_SESSION (a constant bumped each session, the corpus-pin pattern) carries zero unchecked boxes, so a forgotten closeout box fails the VERY NEXT session's sweep, naming the exact file and line (the one-session lag is the honest cost of the chicken-and-egg allowance: the current session's plan may be mid-flight); (2) the self-contradiction guard — NO plan, ANY session number, may carry an unchecked box whose own text asserts completion (the case-insensitive completion grammar: `— complete`, `complete, recorded`, `completed`, `done —` — the s54 record's "COMPLETED/SUCCESS" CI-status form included, observed at mutation B), caught the MOMENT it is written, mid-flight or not — this pin demonstrated itself live on its very first run, catching the s55 plan's own fresh gap-analysis line (written shape-A-style minutes earlier); (3) the enumeration honesty — the walk is glob-driven (never a hardcoded list), the corpus floor counts the corpus WITH the current session's plan (54 at s55 — observed at mutation D: the pre-s55 calibration 53 let one deletion through; recalibrate alongside the constant), and the current session's plan must exist. The template boundary: the PAD §7.4 Pre-PR checklist and the SKILL's manual-verify checklist carry unchecked boxes BY DESIGN (per-run templates, not status records) — the glob reaches `docs/remediation-plan-session*.md` only. The push chicken-and-egg is closed BY CONVENTION now: the deferral form at the remediation commit ("— see the worklog's push entry for the final figures"), verified by the closeout commit, swept by the next session's constant bump — mutation G proved the mechanism end-to-end (the simulated s56 pin caught the s55 plan's mid-flight boxes AND demanded the s56 plan's existence). THREE harness lessons observed in flight: a case-sensitive completion grammar misses the uppercase CI-status form (the record text IS a completion assertion — fix: the case-insensitive flag); a corpus floor calibrated before the current session's plan lands lets exactly one deletion through (fix: the floor counts WITH the current plan, recalibrated each session); and the BRIDGE pin's badge-revert bite is the CONSISTENCY direction ("found 270 & 273"), never the sum direction — the s53 guessed-message lesson re-met at mutation E and closed by re-observation. The doctrine: an execution-status section is a ledger, not a scratchpad — every box is either done (checked) or pending (unchecked with future-tense text), and any line that is both is a defect.**
"""
SKILL = apply(SKILL,
    "108. **A coverage claim is a universal — and a universal needs a SOURCE-side map held to the fs.**",
    S55_LESSON_SKILL + "108. **A coverage claim is a universal — and a universal needs a SOURCE-side map held to the fs.**",
    label="SKILL lesson 109 (the plan-status doctrine, above lesson 108)")
write("service-desk_SKILL.md", SKILL)

print("\nS55 docs-align: all replacements landed (each count-verified exactly-once)")
