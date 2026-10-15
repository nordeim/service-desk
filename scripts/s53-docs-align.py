#!/usr/bin/env python3
"""S53: the docs alignment (Component 2 — the standing set, every replacement
count-verified exactly-once, the s52 docs-align pattern).
  AGENTS.md: the NEW Session-53 contracts section + the reference-list range
             through s53 + the screenshots lineage s52->s53
  CLAUDE.md: the s53 anti-pattern (the size-claim doctrine)
  PAD:       the RESOLVED session-53 known-issues row
  SKILL:     v2.51.0 (version + the description session-53 + lesson 107)
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

# ---------------- AGENTS.md ----------------
AGENTS = read("AGENTS.md")

# 1. the reference-list range: through s52 -> through s53
AGENTS = apply(AGENTS, "`docs/remediation-plan-session2.md` … `-session51.md`",
               "`docs/remediation-plan-session2.md` … `-session52.md`",
               label="AGENTS the reference list through s53")

# 2. the screenshots lineage: s52 -> s53
AGENTS = apply(AGENTS,
    "refreshed by `scripts/capture-screenshots-s52.sh` (the s50/s51 lineage verbatim",
    "refreshed by `scripts/capture-screenshots-s53.sh` (the s50–s52 lineage verbatim",
    label="AGENTS the screenshots lineage s52 -> s53")

# 3. the NEW Session-53 contracts section (before ## Reference)
S53_SECTION = """## Session-53 contracts (pinned by `tests/pad-keyfiles-contract.test.ts`; inventory in `docs/remediation-plan-session53.md`)

- **The size-claim closure (the own-side audit at a NEW level)**: the PAD §11 Key Files Reference's 17 `~LINE-COUNT` figures were born TRUE at the session-1 docs (`cf8e4f0`: auth ~170 vs 174, validation ~120 vs 112, globals ~130 vs 134) and drifted up to 3.6x stale across 44 sessions (validation ~120 vs 437, constants ~95 vs 250, globals.css ~130 vs 336, next.config ~40 vs 82, api/tickets/route.ts ~120 vs 254; seed.ts ~180 vs 83 — inverted by the s43 seed-data extraction) because the session checklist bumps the SKILL frontmatter + the corpus counts, never §11's size figures; the SKILL's compound auth claim ("~170 auditable lines, 11 unit tests" vs 232 lines + the §7.1-runtime-pinned 20 tests) drifted the same way. The class survived because the SIZE shape matches no pin family (corpus counts, §7.1 rows, quoted outputs, requirements, dates). Closed three-sided: the exact-count pin (every §11 row's figure == its file's fs line count, `wc -l` semantics — EXACT figures, not a tolerance band: a +/-20% band would have passed auth.ts's +36% drift today; the grammar rejects the `~` hedge as a malformed row — the hedge is the mask), the row-floor + key-coverage pin (>= 18 rows + `prisma/seed-data.ts` named — the corpus home born s43 and absent from the table 10 sessions), and the SKILL family pin (every backticked-path size claim held to the fs + the auth compound claim's test figure chained to the §7.1 runtime-pinned row — the s50 BRIDGE chaining pattern). The doctrine: a size figure is a checkable claim whose ground truth is one `wc -l`; bump the row when the file changes.
- **The 35th parity sweep: NO twenty-first /login wave** — the rolldown bundle byte-identical to the s50/s51/s52 records, the third consecutive byte-stable session (the entry `index-C-ulo5ek.js` 200/105055, the CSS `index-BIWjBcok.css` 200/904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 36th consecutive session, live 200 + still referenced; the old CSS `index-D0Q6-tUz.css` still 200 (900665) — the edge-cache state persists). Their three standing defects persist (35th re-verification: the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, `elementFromPoint` at the toggle's own rect (24,16,28,28) returns the `fixed top-0 z-[100]` toast-container div; the toggle located via the TEXT-matching refined probe — their toggle carries NO aria-label, only the "Toggle Sidebar" text); ours the working superset (the mobile matrix byte-identical to the s41–s52 records: 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip Prisma-verified).

## Reference"""

AGENTS = apply(AGENTS, "\n## Reference\n", "\n" + S53_SECTION + "\n",
               label="AGENTS the NEW Session-53 contracts section")
write("AGENTS.md", AGENTS)

# ---------------- CLAUDE.md ----------------
CLAUDE = read("CLAUDE.md")
S53_ANTIPATTERN = "- **A `~N` size figure is a checkable claim, and its ground truth is one `wc -l` (session 53: the PAD §11 Key Files Reference's 17 line-count figures were born true at the session-1 docs and drifted up to 3.6x stale across 44 sessions — validation.ts claimed ~120 against 437 actual lines, seed.ts ~180 against 83 (the s43 extraction inverted it) — because the session checklist bumps the SKILL frontmatter + the corpus counts, never §11's size figures; the SKILL's compound auth claim drifted the same way (\"~170 auditable lines, 11 unit tests\" vs 232 + the §7.1-runtime-pinned 20). The class survived every pin family because the SIZE shape matches no corpus-count, §7.1-row, quoted-output, requirements, or date form. The closure: EXACT figures (the `~` hedge dropped — a hedge that can be 3.6x off is not an approximation, it is a stale claim; a +/-20% tolerance band would have passed auth.ts's +36% drift today) pinned to the fs (newline-character counting, `wc -l` semantics — no git history needed, no mtime trap), with the grammar rejecting the tilde form at the extraction level (a malformed row, not an approximation) and the row floor + the seed-data key-coverage guarding the table's shape. The doctrine: audit the docs' SIZE surfaces the way corpus figures are audited against the run; bump the row when the file changes — a size signal that does not move with the file is a stale claim no corpus family will ever catch)**\n"
CLAUDE = apply(CLAUDE,
    "## Anti-Patterns to Avoid\n",
    "## Anti-Patterns to Avoid\n\n" + S53_ANTIPATTERN,
    label="CLAUDE the s53 anti-pattern (the size-claim doctrine)")
write("CLAUDE.md", CLAUDE)

# ---------------- PAD ----------------
PAD = read("Project_Architecture_Document.md")
S53_ROW = "| RESOLVED | Session-53 own-side audit (the s93 shortlist's three leading candidates measured CLEAN again — the CLAUDE major-only prose (16.4.0/19.3.0/4.3.3/6.19.3 satisfy every claim, the sixth consecutive clean session) + the DEPLOYMENT rate-limit figures (10/5/15-min + `BUCKETS_SWEEP_THRESHOLD = 1_000` + `BUCKETS_SWEEP_MIN_INTERVAL_MS = 60_000` all match auth.ts) + the vitest/playwright version surfaces (held by the s48 version-contract pins) — then one level deeper: the SIZE-shaped claim sweep): the PAD §11 Key Files Reference's 17 `~LINE-COUNT` figures born true at the session-1 docs (cf8e4f0) and drifted up to 3.6x stale across 44 sessions (validation ~120 vs 437, constants ~95 vs 250, globals.css ~130 vs 336, next.config ~40 vs 82, api/tickets/route.ts ~120 vs 254, seed.ts ~180 vs 83 — the s43 extraction inverted it; prisma/seed-data.ts absent from the table entirely), + the SKILL's compound auth claim (\"~170 auditable lines, 11 unit tests\" vs 232 lines + the §7.1-runtime-pinned 20 tests — a per-file test count outside §7.1, a sub-shape the s49 pads cannot reach). Closed: tests/pad-keyfiles-contract.test.ts (the exact-count pin with the tilde-rejecting grammar + the row floor 18 + the seed-data key-coverage + the SKILL size-figure family with the §7.1 chaining). The 35th parity sweep ALL NON-GAP — NO twenty-first /login wave (the rolldown bundle byte-identical third session running: the entry 105055, the CSS 904487, logoutReturnPath hash-stable the 36th, the old CSS still 200 (900665) — the edge-cache state persists); their three standing defects persist 35th (the real click REFUSED at the toggle rect 24,16,28,28 — the toggle carries no aria-label, located via the text-matching refined probe); ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt pre- AND post-remediation, the UI round-trip Prisma-verified) | The size-claim class (a `~N` line figure is a checkable claim whose ground truth is one `wc -l` — the hedge masked 3.6x drift for 44 sessions; born-right-then-drifted figures need exact pins, and the exact form needs its grammar enforced so the hedge cannot return) | Fixed — the 3 keyfiles pins + the §11 exact conversion (17 figures + the tilde dropped + the seed-data row added) + the SKILL compound-claim fix + the corpus move 260→263 (9 family sites + the quickstart line 28/263 + the §7.1 new row); 263 unit / 198 E2E / 121 smoke, 8-mutation-checked (A–H, each bit exactly its pin; E redesigned in flight — a row deletion only ever bites the floor, the path-mutation form bites the key-coverage distinctly; H's expected-bite pattern fixed to the pad pin's actual message), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: nine byte-identical + one BENIGN); inventory in `docs/remediation-plan-session53.md` |\n"
# insert BEFORE the session-52 row (newest first, the table's convention)
S52_ROW_PREFIX = "| RESOLVED | Session-52 own-side audit (the s91 shortlist's three leading candidates measured CLEAN again"
PAD = apply(PAD, S52_ROW_PREFIX, S53_ROW + S52_ROW_PREFIX,
            label="PAD the RESOLVED session-53 known-issues row")
write("Project_Architecture_Document.md", PAD)

# ---------------- SKILL ----------------
SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL, "version: 2.50.0", "version: 2.51.0",
              label="SKILL version 2.50.0 -> 2.51.0")
SKILL = apply(SKILL,
    "Distilled through the session-52 remediation (2026-10-15).",
    "Distilled through the session-53 remediation (2026-10-15).",
    label="SKILL the description session-52 -> session-53")

# lesson 107 appended after lesson 106 (the file ends with lesson 106)
LESSON107 = """
107. **A `~N` size figure is a checkable claim — and its ground truth is one `wc -l`.** (Session 53.) The s93 shortlist's three leading candidates (the CLAUDE major-only prose, the DEPLOYMENT rate-limit figures, the vitest/playwright version surfaces) measured clean again (the sixth consecutive session), so the own-side audit went one level deeper: the SIZE-shaped claim sweep — and found the PAD §11 Key Files Reference's 17 `~LINE-COUNT` figures born TRUE at the session-1 docs (verified in git: at cf8e4f0, auth ~170 vs 174 actual, validation ~120 vs 112, globals.css ~130 vs 134) and drifted up to 3.6x stale across 44 sessions (validation ~120 vs 437, constants ~95 vs 250, globals.css ~130 vs 336, next.config ~40 vs 82, api/tickets/route.ts ~120 vs 254 — and seed.ts INVERTED: ~180 vs 83, because the s43 extraction moved the corpus data to prisma/seed-data.ts, a file §11 did not list at all). The SKILL's compound auth claim drifted the same way ("~170 auditable lines, 11 unit tests" vs 232 lines + the §7.1-runtime-pinned 20 tests — a per-file test count OUTSIDE §7.1, a sub-shape the s49 pads cannot reach: they hold §7.1's rows, not prose echoes elsewhere). The class survived every pin family because the SIZE shape matches no corpus-count, §7.1-row, quoted-output, requirements-enumeration, or date form — nothing compared a size claim to the file it names. TWO design decisions, both measured: (1) EXACT figures, not a tolerance band — the `~` hedge is dropped and the pin holds exact equality, because a +/-20% band would have passed auth.ts's +36% drift today and the corpus-family discipline (9 sites bumped every session the suite grows) already proves the exact-figure maintenance pattern; (2) the grammar enforces the form — the §11 extraction accepts ONLY a bare integer, so a `~N` cell is a MALFORMED row that fails loudly with the fix named, not an approximation (the same grammar-level form guard as the s51 no-Python-token enumeration). The measurement surface is the cleanest of any pin family: the fs line count (newline-character counting, `wc -l` semantics) is deterministic across machines, needs no git history (no s52 shallow-clone trap) and no mtimes (no s49 reset trap). The harness lessons learned in flight: a mutation that DELETES a row from a table pinned at its floor can only ever bite the floor (the deletion drops the count below the floor before the coverage assertion is reached) — to bite the key-coverage direction distinctly, mutate the row's PATH (the floor holds, the coverage assertion fires); and an expected-bite pattern written from a GUESSED message shape FATALs the runner — read the pin's actual assertion text before writing the pattern (the s52 lesson at C, repeating at H). The doctrine: audit the docs' SIZE surfaces the way corpus figures are audited against the run — a size signal that does not move with the file is a stale claim no corpus family will ever catch, and its pin needs only the file itself, the cheapest ground truth there is.**
"""
# find the last lesson (106) end — the file ends with it; append
if not SKILL.rstrip().endswith("The doctrine: audit the docs' META surfaces — dates, versions, freshness signals — the way corpus figures are audited against the run; a freshness signal that does not move with the file is a stale claim no corpus family will ever catch, and its pin needs the file's real history, not a cheaper proxy. And the harness lesson learned in flight: the ledger-extraction regex must match the lesson-OWN tag form (the tag that follows the bold title) — a lesson body that QUOTES an earlier session's tag ('its last lesson was tagged (Session 51.)') poisons a naive last-match extraction, and the pin GREENS for the wrong reason: a pin that passes on a poisoned extraction measures nothing.**"):
    print("FATAL: the SKILL does not end with lesson 106's expected tail")
    sys.exit(1)
SKILL = SKILL.rstrip() + "\n" + LESSON107
print("OK   SKILL lesson 107 appended (after lesson 106)")
write("service-desk_SKILL.md", SKILL)

print("\nALL S53 DOCS ALIGNMENTS LANDED (each exactly-once)")
