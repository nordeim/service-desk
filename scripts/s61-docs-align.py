#!/usr/bin/env python3
"""S61: the docs alignment (the re-read form — one read, all subs, one write;
the s60 stale-write lesson held). Each replacement count-verified exactly-once.
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub_file(path, pairs, appends=None):
    """Read once, apply every (old, new) exactly-once, write once."""
    t = (R / path).read_text()
    for old, new in pairs:
        n = t.count(old)
        assert n == 1, f"{path}: expected 1 of {old[:60]!r}..., found {n}"
        t = t.replace(old, new)
    if appends:
        for a in appends:
            t = t.rstrip() + "\n\n" + a + "\n"
    (R / path).write_text(t)
    print(f"  {path}: {len(pairs)} sub(s) + {len(appends or [])} append(s)")


SESSION_61_SECTION = """## Session-61 contracts (pinned by `tests/scripts-integrity-contract.test.ts` (pin 3); inventory in `docs/remediation-plan-session61.md`)

- **The language-symmetry closure (the own-side audit at a NEW level: the s60 closure's language boundary)**: the s60 scripts-integrity closure protected the `.py` family ONLY (83 scripts) — while 275 of the 358-script corpus (`.sh` 132, `.mjs` 125, `.ts` 18 — 77%, including 8 of the battery's 11 per-session entry points) carried NO standing static-integrity check: a committed syntax-broken `.sh`/`.mjs`, or a type-broken `.ts`, failed only at invocation (the s12 inert-guard lesson + the s58 durability-gap class at the language level). Measured at s61 (`bash -n` all 132 `.sh` / `node --check` all 125 `.mjs` / ONE `bunx tsc` invocation all 18 `.ts`): ALL CLEAN — **born-green** (the s56 G3 zero-dangling + the s57 measured-clean precedents). Closed: the standing helper `scripts/check-syntax.py` (the `--check`/`--json` form, the s60 helper's CLI contract; the per-language floors 120/115/15 the vacuous-pass guards) + pin 3 (spawnSync + JSON-either-way, the s60 execFileSync-throw lesson held) + the floor recalibrations (`SCANNED_FLOOR` 70→75, `WAVE_FAMILY_FLOOR` 4→5 — the recalibrate-alongside convention). The s60 records' reproducibility re-verified from the committed script + the survived /tmp inputs (the s60 closure durable).
- **The 43rd parity sweep: the TWENTY-SEVENTH /login WAVE — a PURE RE-HASH wave, user-facing NON-GAP** (the entry re-hashed at the SAME byte size 101519 — `index-DRs9_-5K.js` → `index-CRMsWLS1.js`; the login CSS UNTOUCHED — `index-DPOrvWRk.css` still referenced 899411, the first wave since the 23rd to leave the CSS alone; 0 added/0 removed, 400 re-hashed/295 hash-stable; the computed-style ledger byte-identical; `logoutReturnPath` hash-stable the 44th); their three standing defects persist 43rd (the real click REFUSED at the toggle rect 24,16,28,28 — the sheet stays closed); ours the working superset (the mobile matrix byte-identical 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap navigates; the paired VLM LAYOUT-OK first attempt; the UI round-trip single-pass). The operator-transcript recurrence five cycles deep (#165): the baseline gate opens every session EXPECTING it.

"""

CLAUDE_S61 = """- **A scripts-integrity contract that protects one language of a multi-language corpus is a contract with a hole — the static-integrity layer must cover every language the corpus carries, at each language's standard static layer (session 61: the s60 closure scanned the `.py` family only — 83 of 358 scripts — while the battery's per-session entry points are 8 parts `.sh`/`.mjs`/`.ts` to 3 parts `.py`; a syntax-broken shell script or a type-broken `.ts` shipped green and would fail only at invocation, the s12 inert-guard lesson at the language level; the closure: the standing helper `scripts/check-syntax.py` — `bash -n`/`node --check`/ONE tsc invocation — plus the per-language floors 120/115/15; and a slower pin that pushes a nested run past the test runner's 5s default clock is a NESTED-RUN defect, never a timeout — raise the test timeout to the subprocess bound; the operator-transcript recurrence confirmed the fifth consecutive time — the response bound the next session's baseline gate)
"""

SKILL_LESSON_115 = """115. **A scripts-integrity contract that protects one language of a multi-language corpus is a contract with a hole — the static-integrity layer must cover every language the corpus carries, at each language's standard static layer.** (Session 61.) The s60 closure (the undefined-name scan) covered the `.py` family only — 83 of 358 scripts — while 275 (`.sh` 132, `.mjs` 125, `.ts` 18 — 77% of the corpus, including 8 of the battery's 11 per-session entry points) shipped with no static check of any kind: a committed syntax error in any of the three languages failed only at invocation, exactly where the s12 inert-guard lesson and the s58 durability-gap class predicted. The observed risk: the battery generator writes `.sh` entry points every session — a generation that lands a syntax error in a script the session does NOT invoke ships broken to git with no alarm anywhere. Measured: `bash -n` over all 132 `.sh` / `node --check` over all 125 `.mjs` / ONE `bunx tsc` invocation over all 18 `.ts` (1.4s, the deliberate-error form verified) — ALL CLEAN, born-green (the s56 G3 zero-dangling + the s57 measured-clean precedents). The closure: the standing helper `scripts/check-syntax.py` (the `--check`/`--json` form, the s60 helper's CLI contract) + pin 3 in `tests/scripts-integrity-contract.test.ts` (spawnSync + JSON-either-way, the s60 execFileSync-throw lesson held) with the per-language floors 120/115/15 (the vacuous-pass guards) + the floor recalibrations (`SCANNED_FLOOR` 70→75, `WAVE_FAMILY_FLOOR` 4→5 — the recalibrate-alongside convention). THREE harness lessons in flight: (1) the pad-testcount nested-run pin TIMED OUT at the test runner's 5s default when the new pin slowed the nested suite — a slower nested run must fail on its own merits, never on the runner's default clock (the fix: the test timeout raised to the subprocess bound 300s); (2) the helper's offender paths must be repo-relative (`scripts/<name>`), never absolute — bash/node diagnostics echo the path AS GIVEN, and an absolute form leaks the sandbox layout into the offender messages (the fix: the rel() form + cwd=ROOT); (3) a Python-scripted doc edit that lands a comment continuation WITHOUT its `//` prefix is a PARSE ERROR the very next gate catches — the s61 pin-3 landing bit on exactly that (the observation pass doing its job). And the operator-transcript recurrence is five cycles deep (#165): the baseline gate opens every session EXPECTING it.**"""

PAD_S61_ROW = """| RESOLVED | Session-61 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 15th consecutive session) — then the FIFTH consecutive operator-transcript event: the operator's `5e3b305` transcript commit (docs/session_110.md) reintroduced the backticked fabricated-token form at FOUR sites (lines 5, 7, 8, 10); the s56 pin 3 (with the s59 match-scoped classifier) caught ALL FOUR at the baseline gate; CI run #165 on `5e3b305` FAILED (the fifth red main run — the alternating-red pattern #153/#156/#159/#162/#165); fixed by the de-grammar edit (the sixth operator-side doc edit, the fifth consecutive session requiring one). The deeper finding — the SCRIPTS-INTEGRITY LANGUAGE-SYMMETRY GAP: the s60 closure protected the `.py` family only (83 scripts) while 275 (`.sh` 132 / `.mjs` 125 / `.ts` 18 — 77%) carried no standing static check; measured (`bash -n` / `node --check` / ONE tsc invocation): ALL CLEAN — born-green. Closed: the standing helper scripts/check-syntax.py + pin 3 (the per-language floors 120/115/15, the vacuous-pass guards) + the floor recalibrations (SCANNED_FLOOR 75, WAVE_FAMILY_FLOOR 5) — 8-mutation-verified. The 43rd parity sweep: the TWENTY-SEVENTH /login WAVE — a PURE RE-HASH wave, user-facing NON-GAP (the entry re-hashed at the same byte size 101519 — index-DRs9_-5K.js → index-CRMsWLS1.js; the login CSS untouched — index-DPOrvWRk.css still referenced 899411; 0 added/0 removed, 400 re-hashed/295 hash-stable; the computed-style ledger byte-identical; logoutReturnPath hash-stable the 44th); their three standing defects persist 43rd; ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass) | The language-symmetry class (a scripts-integrity contract that protects one language of a multi-language corpus is a contract with a hole — the static-integrity layer must cover every language, at each language's standard static layer) + the operator-transcript recurrence five cycles deep (the baseline gate EXPECTS it) | Fixed — the 4 de-grammar edits on the operator's transcript + the standing helper + the new pin 3 (born-green) + the corpus move 285→286 (the 10 family sites + the quickstart line 35/286 + the corpus pin + the §7.1 in-place row 2→3); 286 unit / 198 E2E / 121 smoke, 8-mutation-checked, live-verified; inventory in `docs/remediation-plan-session61.md` |
"""

# ---------- 1. AGENTS.md ----------
sub_file("AGENTS.md", [
    ("## Reference\n\n- `Project_Architecture_Document.md`",
     SESSION_61_SECTION + "## Reference\n\n- `Project_Architecture_Document.md`"),
    ("`docs/remediation-plan-session2.md` … `-session59.md`",
     "`docs/remediation-plan-session2.md` … `-session60.md`"),
    ("refreshed by `scripts/capture-screenshots-s60.sh`",
     "refreshed by `scripts/capture-screenshots-s61.sh`"),
    ("(the s50–s59 lineage verbatim + the self-contained /tmp/s60-baselines save",
     "(the s50–s60 lineage verbatim + the self-contained /tmp/s61-baselines save"),
])

# ---------- 2. CLAUDE.md ----------
sub_file("CLAUDE.md", [
    ("- **The operator's transcript archive is inside every pin's sweep corpus — and a count floor guards mass deletion, never the hole (session 57:",
     CLAUDE_S61 + "- **The operator's transcript archive is inside every pin's sweep corpus — and a count floor guards mass deletion, never the hole (session 57:"),
])

# ---------- 3. SKILL.md ----------
sub_file("service-desk_SKILL.md", [
    ("Distilled through the session-60 remediation (2026-10-16).",
     "Distilled through the session-61 remediation (2026-10-16)."),
    ("version: 2.58.0", "version: 2.59.0"),
], appends=[SKILL_LESSON_115])

# ---------- 4. PAD.md ----------
sub_file("Project_Architecture_Document.md", [
    ("| RESOLVED | Session-60 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 14th consecutive session)",
     PAD_S61_ROW + "| RESOLVED | Session-60 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 14th consecutive session)"),
])

print("docs-align complete: AGENTS (the Session-61 section + the reference range + the screenshots lineage) + CLAUDE (the s61 anti-pattern) + SKILL (v2.59.0 + lesson 115 at the tail) + PAD (the RESOLVED row)")
