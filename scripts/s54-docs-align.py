#!/usr/bin/env python3
"""S54: the docs alignment (Component 2 — the standing set, every replacement
count-verified exactly-once, the s53 docs-align pattern).
  AGENTS.md: the reference-list range through s53 + the screenshots lineage
             s53->s54 + the NEW Session-54 contracts section
  CLAUDE.md: the pure-seams enumeration gains the route-head mention + the s54
             anti-pattern (the coverage-completeness doctrine)
  PAD:       the RESOLVED session-54 known-issues row (newest first)
  SKILL:     v2.52.0 (version + the description session-54 + lesson 108)
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
AGENTS = apply(AGENTS, "`docs/remediation-plan-session2.md` … `-session52.md`",
               "`docs/remediation-plan-session2.md` … `-session53.md`",
               label="AGENTS the reference list through s54")

# 2. the screenshots lineage: s53 -> s54
AGENTS = apply(AGENTS,
    "refreshed by `scripts/capture-screenshots-s53.sh` (the s50–s52 lineage verbatim",
    "refreshed by `scripts/capture-screenshots-s54.sh` (the s50–s53 lineage verbatim",
    label="AGENTS the screenshots lineage s53 -> s54")

# 3. the NEW Session-54 contracts section (after the Session-53 section, before ## Reference)
S54_SECTION = """## Session-54 contracts (pinned by `tests/pad-coverage-contract.test.ts` + `src/lib/__tests__/route-head.test.ts`; inventory in `docs/remediation-plan-session54.md`)

- **The coverage-completeness closure (the own-side audit at a NEW level)**: the PAD §7.3 universal "every pure seam in `src/lib/` is unit-tested" was FALSE for exactly one file — `src/lib/route-head.ts`, the s12 social URL seam that landed at `dcfc542` with E2E mechanism pins only, no unit layer. The claim was BORN TRUE at `cf8e4f0` (session 1: every then-existing seam had its test — auth, constants, validation, db-path, utils; db.ts the side-effectful client holder, correctly outside the "pure" scope) and went FALSE at session 12 — 42 sessions of drift. The class survived because the COVERAGE shape matches no pin family: the s49 pads map the RUNTIME to §7.1's rows (every row names its file's runtime count, every runtime file has a row) — but a source file with NO test never enters the runtime, so the bidirectional map never asks about it. Closed three-sided: the fs-boundary pin (a new `src/lib` seam fails loudly until mapped or excluded — the `db.ts` named-exclusion precedent), the map-verification pin (every mapped test exists AND imports its source, via specifier resolution — the map is honest, not a naming convention), and the exclusion-exactness + claim-presence pin (a stale exclusion fails; the §7.3 sentence cannot be silently weakened — the s52 coherence form). The seam's missing unit layer landed as `src/lib/__tests__/route-head.test.ts` (4 pins: the s12 trio agreement, the s17 wholesale-REPLACES og-set completeness, the asset-truth pair, the s8 DESCRIPTION freeze). The corpus moved 263 -> 270 (9 family sites + the quickstart line 30/270 + the §7.1 two rows + the BRIDGE ternary 30/"src 5 + tests 25"). The doctrine: a coverage claim needs a SOURCE-side map held to the fs — the tests that EXIST can never prove the tests that are MISSING.
- **The 36th parity sweep: NO twenty-first /login wave** — the rolldown bundle byte-identical fourth session running (the entry `index-C-ulo5ek.js` 200/105055, the CSS `index-BIWjBcok.css` 200/904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 37th consecutive session, live 200 + still referenced; the old CSS `index-D0Q6-tUz.css` still 200 (900665) — the edge-cache state persists). Their three standing defects persist (36th re-verification: the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED at the toggle rect 24,16,28,28, `elementFromPoint` returns the `fixed top-0 z-[100]` toast-container div; the toggle located via the TEXT-matching refined probe — now held IN the s54 sweep-script lineage, the s53 session had to apply it ad-hoc); ours the working superset (the mobile matrix byte-identical to the s41–s53 records: 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip Prisma-verified).

## Reference"""

AGENTS = apply(AGENTS, "\n## Reference\n", "\n" + S54_SECTION + "\n",
               label="AGENTS the NEW Session-54 contracts section")
write("AGENTS.md", AGENTS)

# ---------------- CLAUDE.md ----------------
CLAUDE = read("CLAUDE.md")

# 1. the pure-seams enumeration gains the route-head mention
CLAUDE = apply(CLAUDE,
    "constants vocabulary, db-path resolution, date/duration formatting",
    "constants vocabulary, db-path resolution, the route-head social URL set (the s54 coverage closure — the seam that drifted 42 sessions), date/duration formatting",
    label="CLAUDE the pure-seams enumeration + route-head")

# 2. the s54 anti-pattern (newest first, right after the heading)
S54_ANTIPATTERN = "- **A coverage claim is a universal, and a universal needs a SOURCE-side map (session 54: the PAD §7.3 \"every pure seam in `src/lib/` is unit-tested\" was born true at session 1, went false at session 12 when `route-head.ts` landed with E2E mechanism pins only, and drifted 42 sessions — because the s49 pads map the RUNTIME to §7.1's rows, and a source file with no test never enters the runtime; nothing compared the claim's universal to the fs + the test-import graph. The closure: the explicit MAP (the s41 allow-list pattern — never a naming convention; every entry import-verified by specifier resolution), the fs boundary (a new seam fails loudly until mapped or excluded, the db.ts named-exclusion precedent), and the claim-presence guard (the §7.3 sentence cannot be silently weakened). The doctrine: the tests that EXIST can never prove the tests that are MISSING — every coverage claim needs a map from the source side, held to the fs)**\n"
CLAUDE = apply(CLAUDE,
    "## Anti-Patterns to Avoid\n",
    "## Anti-Patterns to Avoid\n\n" + S54_ANTIPATTERN,
    label="CLAUDE the s54 anti-pattern (the coverage-completeness doctrine)")
write("CLAUDE.md", CLAUDE)

# ---------------- PAD ----------------
PAD = read("Project_Architecture_Document.md")
S54_ROW = "| RESOLVED | Session-54 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the seventh consecutive session) — the CLAUDE major-only prose + the DEPLOYMENT rate-limit figures + the vitest/playwright version surfaces + the SKILL's prose-recap forms — then one level deeper: the universal-quantifier sweep): the PAD §7.3 claim \"every pure seam in `src/lib/` is unit-tested\" found FALSE for exactly one file — `src/lib/route-head.ts`, the s12 social URL seam (dcfc542), landed with E2E mechanism pins only; the claim was BORN TRUE at cf8e4f0 (every then-existing seam had its test) and went FALSE at session 12 — 42 sessions of drift, invisible to every pin family (the s49 pads map the RUNTIME to §7.1's rows; a source file with no test never enters the runtime). Closed: tests/pad-coverage-contract.test.ts (the fs-boundary + the map-verification + the exclusion-exactness/claim-presence pins) + the seam's missing unit layer src/lib/__tests__/route-head.test.ts (4 pins: the s12 trio, the s17 og-set completeness, the asset-truth pair, the s8 DESCRIPTION freeze) + the §7.3 doctrine note + the corpus move 263→270 (9 family sites + the quickstart line 30/270 + the §7.1 two rows + the BRIDGE ternary). The 36th parity sweep ALL NON-GAP — NO twenty-first /login wave (the rolldown bundle byte-identical fourth session running: the entry 105055, the CSS 904487, logoutReturnPath hash-stable the 37th, the old CSS still 200 (900665)); their three standing defects persist 36th (the real click REFUSED at the toggle rect 24,16,28,28 — the text-matching refined probe now held IN the s54 sweep lineage); ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt pre- AND post-remediation, the UI round-trip Prisma-verified) | The coverage-completeness class (a universal claim needs a SOURCE-side map held to the fs — the tests that EXIST can never prove the tests that are MISSING; the s49 pads map the runtime to the table, never the source files to tests) | Fixed — the 3 coverage pins + the 4 seam pins + the §7.3 doctrine note + the corpus move 263→270 (9 family sites + the quickstart line 30/270 + the §7.1 two rows); 270 unit / 198 E2E / 121 smoke, 7-mutation-checked (A–G, each bit exactly its pin — the battery clean end-to-end on the FIRST full pass, the observed-first doctrine; G a SOURCE mutation reverse-replaced after the bite), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set: nine byte-identical + one BENIGN); inventory in `docs/remediation-plan-session54.md` |\n"
# insert BEFORE the session-53 row (newest first, the table's convention)
S53_ROW_PREFIX = "| RESOLVED | Session-53 own-side audit (the s93 shortlist's three leading candidates measured CLEAN again"
PAD = apply(PAD, S53_ROW_PREFIX, S54_ROW + S53_ROW_PREFIX,
            label="PAD the RESOLVED session-54 known-issues row")
write("Project_Architecture_Document.md", PAD)

# ---------------- SKILL ----------------
SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL, "version: 2.51.0", "version: 2.52.0",
              label="SKILL version 2.51.0 -> 2.52.0")
SKILL = apply(SKILL,
    "Distilled through the session-53 remediation (2026-10-15).",
    "Distilled through the session-54 remediation (2026-10-15).",
    label="SKILL the description session-53 -> session-54")

LESSON108 = """
108. **A coverage claim is a universal — and a universal needs a SOURCE-side map held to the fs.** (Session 54.) The s95 shortlist's named candidates measured clean again (the seventh consecutive session), so the own-side audit went one level deeper: the universal-quantifier sweep (`every`/`all` forms about the current state) — and found the PAD §7.3 "every pure seam in `src/lib/` is unit-tested" FALSE for exactly one file: `src/lib/route-head.ts`, the s12 social URL seam (the `routeHead()` pure function + the SITE_URL/OG_IMAGES constants), which landed at dcfc542 with E2E mechanism pins only, no unit layer. The claim was BORN TRUE at cf8e4f0 — session 1's src/lib was six files, every pure one covered (auth→auth.test, constants+validation→domain.test, db-path→db-path.test, utils→utils.test; db.ts the side-effectful Prisma-client holder, correctly outside the "pure" scope) — and went FALSE at session 12, drifting 42 sessions. The class survived because the COVERAGE shape matches no pin family's form: the s49 pads map the RUNTIME to the §7.1 table (every row names its file's runtime count, every runtime file has a row) — but a source file with NO test never enters the runtime, so the bidirectional map never asks about it. The later seams landed WITH their tests (redirect s19, api-methods s40); route-head was the one that never got its unit layer. The closure is three-sided, the s53 precedent: (1) the fs-boundary pin — a NEW src/lib seam fails loudly until it is either mapped (with a test that imports it) or excluded with a comment naming why it is not a pure seam (the db.ts precedent); (2) the map-verification pin — every mapped test EXISTS and IMPORTS its source, verified by resolving every import specifier (relative forms against the test's directory + the @/ alias) to the source's absolute path — the map is honest, never a naming convention; (3) the exclusion-exactness + claim-presence pin — a stale exclusion fails, and the §7.3 sentence keeps its universal text AND names the pin (it cannot be silently weakened, the s52 coherence form). The seam's missing unit layer landed as 4 pins (the s12 trio agreement, the s17 wholesale-REPLACES og-set completeness, the asset-truth pair, the s8 DESCRIPTION freeze). TWO harness lessons learned in flight: the Next 16 metadata types are UNIONS — the bare `OpenGraphMetadata`/`TwitterMetadata` members carry no `type`/`card`, so a unit pin accessing those fields needs an explicit narrowing cast (two typecheck errors caught by the gate, never by the runtime); and a mutation whose `new` side is the EMPTY STRING can never be reverted (content.count("") matches everywhere — the s49 empty-needle doctrine, re-met at mutation A: the comment-out form, never a deletion). The mutation battery ran CLEAN end-to-end on the FIRST full pass — the first session to achieve that since the hardened-runner doctrine: the bite patterns were OBSERVED against the pins before the runner was written (the s53 lesson-at-H, applied from the start). The doctrine: a coverage claim is the cheapest claim to keep true and the easiest to silently break — every new seam added without a test breaks it, and the break is invisible to every totals-shaped watch; the tests that EXIST can never prove the tests that are MISSING, so the pin must enumerate from the SOURCE side.**
"""
# the SKILL ends with lesson 107 — verify its expected tail, then append
if not SKILL.rstrip().endswith("The doctrine: audit the docs' SIZE surfaces the way corpus figures are audited against the run — a size signal that does not move with the file is a stale claim no corpus family will ever catch, and its pin needs only the file itself, the cheapest ground truth there is.**"):
    print("FATAL: the SKILL does not end with lesson 107's expected tail")
    sys.exit(1)
SKILL = SKILL.rstrip() + "\n" + LESSON108
print("OK   SKILL lesson 108 appended (after lesson 107)")
write("service-desk_SKILL.md", SKILL)

print("\nALL S54 DOCS ALIGNMENTS LANDED (each exactly-once)")
