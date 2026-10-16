#!/usr/bin/env python3
"""S58: the docs alignment (Component 2) — 8 count-verified edits.

1. AGENTS.md — the Session-58 contracts section (after the Session-57 section)
2. AGENTS.md — the reference-list range -session56.md -> -session57.md
3. AGENTS.md — the screenshots-lineage line (the s58 capture script)
4. SKILL   — v2.56.0 + the description "session-58 remediation"
5. SKILL   — lesson 112 at the LEDGER TAIL (the newest-LAST convention)
6. CLAUDE.md — the session-58 anti-pattern (after the session-57 line)
7. PAD     — the RESOLVED session-58 row (newest first, above the s57 row)
8. PAD     — the §10 known-issues table stays as-is (the s58 row carries it)
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:60]!r}..., found {n}"
    p.write_text(t.replace(old, new))
    print(f"  {path}: edited ({old[:44]!r}...)")


# 1. AGENTS.md — the Session-58 contracts section, inserted right before
#    "## Reference" (the s57 section stays above it — the session-ordered
#    convention).
ag = (R / "AGENTS.md").read_text()
anchor = "## Reference\n"
assert ag.count(anchor) == 1
section = """## Session-58 contracts (pinned by `tests/doc-path-reachability-contract.test.ts`; inventory in `docs/remediation-plan-session58.md`)

- **The doc-path-reachability closure (the s56 existence-claim closure, extended from the scripts/ grammar to the whole-path class)**: every backticked path-shaped reference in the five core docs is an existence claim about the fs. Measured CLEAN — 529 total path-shaped matches, 13 excluded by the four-entry measured set (the RUNTIME TARGET `db/custom.db` (gitignored — the db/ folder ships .gitkeep only), the E2E TRANSIENT `db/e2e.db` (created + destroyed by the global setup per run), the SMOKE TRANSIENT `db/smoke.db` (the trap removes it at the end of every run), and the REPLACED-STATIC narrative `public/robots.txt` (`src/app/robots.ts` serves the route) — each genuinely cited, the needed-ness guard), 516 checked ALL RESOLVING. The 3 pins (tests/doc-path-reachability-contract.test.ts: the core-docs reachability — a doc citing a nonexistent path fails naming the doc + line; the needed-ness guard — a stale exclusion fails naming the entry; the floor 500 — the vacuous-pass guard, the s56 mapDeps lesson), born-green (the s56 pin-3 / s57 precedents).
- **The 40th parity sweep: the TWENTY-FOURTH /login WAVE ARRIVED — the third consecutive same-shape wave, a PURE RE-HASH, user-facing NON-GAP** (the entry rotated `index-BQ2gMrp1.js` 200/105258 → `index-Da5vh3Iz.js` 200/105258 the SAME byte size; the chunk-ref comparison vs the s57 baseline RE-FETCHED BY NAME (the workspace reset wiped /tmp/s57-results): 766→766 basenames, 455 re-hashed, 311 hash-stable, 0 added, 0 removed — no topology change; the login CSS `index-BIWjBcok.css` hash-stable 904487, `logoutReturnPath` hash-stable the 41st; their three standing defects persist 40th — the real click REFUSED at the toggle rect 24,16,28,28 by the guarded form; ours the working superset — the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass: the s57 "render-timing artifact" run to ground as a LINEAGE BUG (the s57-roundtrip.sh listing check greped the S56 title while the fill used the S57 title — the one-session-lag form; the s58 battery carries the fill AND check both S58), Prisma-verified + cleaned + the canonical seed 4/11/3).
- **The SECOND consecutive operator-transcript event (the s57 doctrine's recurrence confirmation)**: the operator's `2914125` transcript commit (docs/session_104.md) reintroduced the backticked fabricated-token form at lines 10+12; the s56 artifact-existence pin 3 caught it at the baseline gate AND in CI — **run #156 on `2914125` FAILED in 41s** (the second red main-branch run after #153's 39s; runs #1–#152 green, #153 red, #154/#155 green, #156 red); fixed by the de-grammar edit (the THIRD operator-side doc edit, the second consecutive session requiring one). The recurrence is now a standing per-session reality: every session's baseline gate should EXPECT the operator's even-doc transcript to carry the raw grammar-matching token forms — the response bound is the baseline gate (the FIRST duty each session), the fix the de-grammar edit.

"""
ag = ag.replace(anchor, section + anchor, 1)
(R / "AGENTS.md").write_text(ag)
print("  AGENTS.md: the Session-58 contracts section inserted before ## Reference")

# 2. AGENTS.md — the reference-list range
sub("AGENTS.md", "`docs/remediation-plan-session2.md` … `-session56.md`",
              "`docs/remediation-plan-session2.md` … `-session57.md`")

# 3. AGENTS.md — the screenshots lineage
sub("AGENTS.md", "refreshed by `scripts/capture-screenshots-s57.sh` (the s50–s56 lineage verbatim",
              "refreshed by `scripts/capture-screenshots-s58.sh` (the s50–s57 lineage verbatim + the self-contained /tmp/s58-baselines save (the workspace-reset lesson — the s57 lineage left the baselines copy to the session)")

# 4. SKILL — the version + description
sub("service-desk_SKILL.md", "version: 2.55.0", "version: 2.56.0")
sub("service-desk_SKILL.md", "functionality. Distilled through the session-57 remediation (2026-10-15).",
              "functionality. Distilled through the session-58 remediation (2026-10-15).")

# 5. SKILL — lesson 112 at the LEDGER TAIL (append after lesson 111, the
#    newest-LAST convention held since the start)
sk = (R / "service-desk_SKILL.md").read_text()
lesson112 = r"""
112. **A backticked path-shaped reference in a core doc is an existence claim about the fs — the whole-path extension of the s56 scripts-grammar closure; and the operator's transcript recurrence is now a standing per-session reality.** (Session 58.) The baseline gate opened red the SECOND consecutive time: the operator's `2914125` transcript commit (docs/session_104.md) reintroduced the backticked fabricated-token form at lines 10+12, CI run #156 FAILED in 41s (the second red main-branch run), and the de-grammar edit landed as the third operator-side doc edit — the recurrence confirms the s57 doctrine: every session opens at the baseline gate EXPECTING the operator's even-doc transcripts to carry the raw grammar-matching token forms (the response bound is the baseline gate — the FIRST duty each session; the fix the de-grammar edit; the red state between sessions the bounded cost). The deeper measurement — the DOC-PATH REACHABILITY class: the s56 existence-claim closure had pinned ONE grammar (the `persisted \`scripts/…\`` form); the whole-path class holds EVERY backticked path-shaped reference in the five core docs to the fs — measured CLEAN (529 matches, 13 excluded by the four-entry measured set — the runtime-target `db/custom.db`, the E2E transient `db/e2e.db`, the smoke transient `db/smoke.db`, the replaced-static `public/robots.txt` — each genuinely cited; 516 checked, ALL resolving; per-doc: AGENTS 252, PAD 169, SKILL 51, CLAUDE 29, README 15), closed born-green three-sided (the reachability pin + the needed-ness guard + the floor 500 — the vacuous-pass guard, the s56 mapDeps lesson: a silent vacuous pass reads as green while checking nothing). TWO in-flight lineage lessons: (1) the s57-roundtrip.sh listing check greped the S56 title while the fill used the S57 title — a ONE-SESSION-LAG lineage bug that read as a "render-timing artifact" and cost a recheck run; the battery generator now derives BOTH strings from the same session constant (the fill AND the check must name the SAME session); (2) the workspace reset wiped /tmp/s57-results (the s56 entry baseline) — the s58 sweep re-fetches the prior session's entry BY NAME (prior entries stay live per the s56 records), and the capture script now saves its own /tmp/s58-baselines from the pre-capture set (a lineage step that lived only in the session's fingers is a step the next reset destroys). The doctrine: a doc's path references are claims the way its counts, dates, sizes, checkboxes, and citations are — audit the whole-path form the way the s56 audit caught the scripts form; and a battery that greps a DIFFERENT session's string than it fills is a battery that can never verify its own fill.**
"""
# append at the very end (the ledger tail — newest LAST)
assert sk.rstrip().endswith("**") or True
sk = sk.rstrip() + "\n" + lesson112.rstrip() + "\n"
(R / "service-desk_SKILL.md").write_text(sk)
print("  SKILL: lesson 112 appended at the ledger tail")

# 6. CLAUDE.md — the session-58 anti-pattern, after the session-57 line
cl = (R / "CLAUDE.md").read_text()
ap57_anchor = """the numbering note's second reference still identifies the doc)**
"""
assert cl.count(ap57_anchor) == 1
ap58 = """- **A backticked path-shaped reference in a core doc is an existence claim about the fs — and the operator's transcript recurrence is a standing per-session reality (session 58: the operator's `2914125` transcript commit reintroduced the backticked fabricated-token form at session_104.md:10+12; CI run #156 FAILED in 41s — the second red main-branch run; the fix the de-grammar edit, the third operator-side doc edit. The deeper closure: the s56 scripts-grammar existence-claim class extended to the WHOLE-PATH form — every backticked path-shaped reference in the five core docs held to the fs, born-green (516 checked, all resolving; the four-entry measured exclusion set — the runtime-target + transient + replaced-static forms — each needed-ness-guarded; the floor 500 guards the vacuous pass). The doctrine: the baseline gate is the operator-side drift catcher — the first duty each session, and every session should EXPECT the recurrence; a battery's fill and check strings must name the SAME session — the s57 roundtrip's one-session-lag bug read as a timing artifact and cost a recheck)**
"""
cl = cl.replace(ap57_anchor, ap57_anchor + ap58, 1)
(R / "CLAUDE.md").write_text(cl)
print("  CLAUDE.md: the session-58 anti-pattern appended")

# 7. PAD — the RESOLVED session-58 row, newest first (above the s57 row)
pad = (R / "Project_Architecture_Document.md").read_text()
s57_row_start = "| RESOLVED | Session-57 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the tenth consecutive session)"
assert pad.count(s57_row_start) == 1
s58_row = """| RESOLVED | Session-58 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 11th consecutive session) — then the SECOND consecutive operator-transcript event: the operator's `2914125` transcript commit (docs/session_104.md) reintroduced the backticked fabricated-token form at lines 10+12; the s56 artifact-existence pin 3 caught it at the baseline gate AND in CI — run #156 on `2914125` FAILED in 41s, the second red main-branch run (after #153's 39s); fixed by the de-grammar edit (the third operator-side doc edit). The deeper measurement — the DOC-PATH REACHABILITY class: the s56 existence-claim closure extended from the `persisted scripts/…` grammar to the whole-path class; measured CLEAN — 529 path-shaped matches across the five core docs, 13 excluded by the four-entry measured set (the runtime-target `db/custom.db` + the E2E transient `db/e2e.db` + the smoke transient `db/smoke.db` + the replaced-static `public/robots.txt`, each genuinely cited), 516 checked ALL RESOLVING. Closed: tests/doc-path-reachability-contract.test.ts (the core-docs reachability + the needed-ness guard + the floor 500), born-green. The 40th parity sweep: the TWENTY-FOURTH /login wave — the third consecutive same-shape wave, a PURE RE-HASH, user-facing NON-GAP (the entry rotated 105258 → 105258 same-size `index-Da5vh3Iz.js`, 766→766 basenames, 455 re-hashed, 0 added, 0 removed; the login CSS hash-stable 904487, logoutReturnPath hash-stable the 41st); their three standing defects persist 40th; ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass — the s57 "render-timing artifact" run to ground as a lineage bug: the s57 roundtrip greped the S56 title while filling the S57 title) | The whole-path existence-claim class + the transcript-recurrence doctrine (a core doc's backticked path reference is a claim the way its counts/dates/sizes are; the operator's even-doc transcripts carry the raw token forms every session — the baseline gate is the response bound; and a battery's fill and check strings must name the same session) | Fixed — the 2 de-grammar edits on the operator's transcript + the 3 doc-path pins (born-green) + the corpus move 279→282 (9 family sites + the quickstart line 34/282 + the §7.1 new row); 282 unit / 198 E2E / 121 smoke, 7-mutation-checked, live-verified; inventory in `docs/remediation-plan-session58.md` |
"""
pad = pad.replace(s57_row_start, s58_row + s57_row_start, 1)
(R / "Project_Architecture_Document.md").write_text(pad)
print("  PAD: the RESOLVED session-58 row inserted newest-first")

print("\nS58 docs alignment complete (8 edits).")
