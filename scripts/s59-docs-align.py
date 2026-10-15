#!/usr/bin/env python3
"""S59: the docs alignment (Component 2). Each replacement count-verified
exactly-once (the s58-docs-align lineage):
  - AGENTS.md: the Session-59 contracts section + the reference-list range
    through s58 + the screenshots lineage s59
  - PAD: the known-issues RESOLVED session-59 row (newest first)
  - SKILL: v2.57.0 + the description session-59 + lesson 113 at the LEDGER TAIL
  - CLAUDE.md: the s59 anti-pattern (the co-location doctrine)
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:60]!r}..., found {n}"
    p.write_text(t.replace(old, new))
    print(f"  {path}: {old[:44]!r} -> {new[:44]!r}")


# ---------- 1. AGENTS.md: the Session-59 contracts section ----------
agents = R / "AGENTS.md"
t = agents.read_text()
anchor = "## Reference\n"
assert t.count(anchor) == 1
section = """## Session-59 contracts (pinned by `tests/artifact-existence-contract.test.ts` (pin 4); inventory in `docs/remediation-plan-session59.md`)

- **The co-location closure (the own-side audit at a NEW level: the pin's own grammar semantics)**: the s56 artifact-existence pin 3 implemented its MATCH-scoped exclusion (`isKnownNonCommit(h)`) as a LINE-scoped escape (`return` inside the `forEach` line callback instead of `continue` in the match loop) — a backticked hex token sharing its line with an EARLIER excluded token (a pure-digit id, the SSH algorithm name, a file-signature magic) silently escaped the sweep. **Live-proven by the THIRD consecutive operator-transcript event:** the operator's `49c6865` transcript commit (docs/session_106.md) carried the fabricated token backticked at lines 13+52 — the pin caught line 52 (alone) and MISSED line 13 (co-located with the pure-digit `2914125`); CI run #159 FAILED (the third red main run — the alternating-red pattern #153/#156/#159). Measured corpus-wide (scripts/s59-audit-colocation.py): 33 shielded tokens, buggy 643 claims/46 excluded vs correct 660/62, the one real dangling citation exactly the operator's line-13 quote (de-grammared — zero dangling under the corrected grammar), 29 co-location shape lines. Closed: the shared `classifyBareHexCorpus()` helper (the `continue` semantics) + pin 4 the no-silent-skip invariant (every bare-hex token claimed or excluded, never silently dropped — the raw-vs-classified parity fails naming the dropped token's file+line; the shape floor 20) — born-green, 7-mutation-verified (A the co-located live-event shape bites through the FIXED loop; B the return-regression bites pin 4 naming 49 dropped-token sites).
- **The 41st parity sweep: the TWENTY-FIFTH /login WAVE — the first REAL topology change since the 22nd wave (NOT a pure re-hash), user-facing NON-GAP** (the entry rotated `index-Da5vh3Iz.js` 200/105258 → `index-OG0wzUXG.js` 200/101339 — a different byte size; the login CSS rotated for the FIRST time: `index-BIWjBcok.css` 904487 → `index-BCfnIRWB.css` 901951; the chunk-ref comparison vs the s58 baseline re-fetched BY NAME: 766→696 basenames, 41 added, 111 removed, 655 common, 588 re-hashed, 67 hash-stable; the computed-style spot ledger BYTE-IDENTICAL — the sidebar `#fafafa`, the h1 20px; `logoutReturnPath` hash-stable the 42nd); their three standing defects persist 41st — the real click REFUSED at the toggle rect 24,16,28,28 by the guarded form; ours the working superset — the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass (the fill AND check both S59), Prisma-verified + cleaned + the canonical seed 4/11/3.

"""
t = t.replace(anchor, section + anchor)
agents.write_text(t)
print("  AGENTS.md: the Session-59 contracts section inserted before ## Reference")

# ---------- 2. AGENTS.md: the reference-list range through s58 ----------
sub("AGENTS.md", "- `docs/remediation-plan-session2.md` … `-session57.md` — the per-session gap inventories",
         "- `docs/remediation-plan-session2.md` … `-session58.md` — the per-session gap inventories")

# ---------- 3. AGENTS.md: the screenshots lineage s59 ----------
sub("AGENTS.md", "refreshed by `scripts/capture-screenshots-s58.sh` (the s50–s57 lineage verbatim + the self-contained /tmp/s58-baselines save (the workspace-reset lesson — the s57 lineage left the baselines copy to the session)",
         "refreshed by `scripts/capture-screenshots-s59.sh` (the s50–s58 lineage verbatim + the self-contained /tmp/s59-baselines save (the workspace-reset lesson — the s57 lineage left the baselines copy to the session)")

# ---------- 4. PAD: the RESOLVED session-59 row (newest first, above the s58 row) ----------
pad = R / "Project_Architecture_Document.md"
t = pad.read_text()
s58_row_anchor = "| RESOLVED | Session-58 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 11th consecutive session) — then the SECOND consecutive operator-transcript event:"
assert t.count(s58_row_anchor) == 1, "the s58 RESOLVED row anchor not found exactly once"
s59_row = """| RESOLVED | Session-59 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 13th consecutive session) — then the THIRD consecutive operator-transcript event: the operator's `49c6865` transcript commit (docs/session_106.md) reintroduced the backticked fabricated-token form at lines 13+52; the s56 artifact-existence pin 3 caught line 52 at the baseline gate AND in CI — run #159 on `49c6865` FAILED (the third red main-branch run — the alternating-red pattern #153/#156/#159); fixed by the de-grammar edit (the fourth operator-side doc edit, the third consecutive session requiring one). The deeper finding — the CO-LOCATION HOLE: the pin's own grammar implemented a MATCH-scoped exclusion as a LINE-scoped escape (return in the line callback, not continue in the match loop) — the line-13 quote was shielded by the pure-digit `2914125` earlier on its line; measured corpus-wide: 33 shielded tokens, buggy 643/46 vs correct 660/62, the one real dangling citation exactly the shielded quote, 29 co-location shape lines. Closed: the shared classifyBareHexCorpus() helper (the continue semantics) + pin 4 the no-silent-skip parity (raw === claims + excluded, the dropped tokens named; the shape floor 20) — born-green, 7-mutation-verified. The 41st parity sweep: the TWENTY-FIFTH /login WAVE — the first REAL topology change since the 22nd wave, user-facing NON-GAP (the entry rotated 105258 → 101339 a DIFFERENT byte size; the login CSS rotated for the FIRST time 904487 → 901951; 766→696 basenames, 41 added, 111 removed; the computed-style ledger byte-identical; logoutReturnPath hash-stable the 42nd); their three standing defects persist 41st; ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass) | The co-location class (a match-scoped exclusion implemented as a line-level escape silently drops same-line tokens — the s56 mutation battery's single-token D-shape never tried the co-located form; and the operator-transcript recurrence is now three cycles deep — the baseline gate EXPECTS it) | Fixed — the 2 de-grammar edits on the operator's transcript + the classifier fix + pin 4 (born-green) + the corpus move 282→283 (9 family sites + the quickstart line 34/283 + the §7.1 in-place row 3→4); 283 unit / 198 E2E / 121 smoke, 7-mutation-checked, live-verified; inventory in `docs/remediation-plan-session59.md` |
"""
t = t.replace(s58_row_anchor, s59_row + s58_row_anchor)
pad.write_text(t)
print("  PAD: the RESOLVED session-59 row inserted above the s58 row")

# ---------- 5. SKILL: v2.57.0 + the description + lesson 113 at the ledger tail ----------
sub("service-desk_SKILL.md", "version: 2.56.0", "version: 2.57.0")
sub("service-desk_SKILL.md", "functionality. Distilled through the session-58 remediation (2026-10-15).",
         "functionality. Distilled through the session-59 remediation (2026-10-15).")

skill = R / "service-desk_SKILL.md"
t = skill.read_text()
lesson112_tail = "and a battery that greps a DIFFERENT session's string than it fills is a battery that can never verify its own fill.**"
assert t.count(lesson112_tail) == 1, "the lesson-112 tail anchor not found exactly once"
lesson113 = "\n113. **A match-scoped exclusion implemented as a line-level escape is a silent-drop bug — and the mutation shape that never fired is the shape that ships.** (Session 59.) The third consecutive operator-transcript event (the `49c6865` transcript commit quoting the fabricated token backticked at session_106.md:13+52; CI run #159 FAILED — the third red main run) exposed a hole IN THE PIN ITSELF: the s56 artifact-existence pin 3 caught line 52 (the token alone on its line) but MISSED line 13 — the same token co-located with the pure-digit `2914125` earlier on the line. The root cause: `isKnownNonCommit(h)` is a property of the MATCH, but the pin's `return` exited the whole `forEach` line callback — every token after the first excluded one on a line silently dropped from the sweep (33 corpus tokens mis-classified, measured by the pinned-grammar mirror script; the s56 mutation battery's D-mutation never caught it because it introduced its fabricated token ALONE on a line — the single-token shape, never the co-located form). The closure: the shared `classifyBareHexCorpus()` helper with the `continue` semantics + the no-silent-skip parity pin (the raw token stream independently re-derived; raw === claims + excluded; a `return` regression drops tokens while the raw stream still sees them — the parity fails naming the dropped token's file+line, observed biting on 49 sites) + the co-location shape floor (29 measured lines, floor 20 — the class can never silently empty). TWO doctrines: (1) an exclusion's SCOPE must match its SEMANTICS — a match-level predicate implemented with a line-level control flow is a grammar hole no floor can catch (the floor counts what the grammar claims, not what the line carries); (2) a mutation battery must try the CO-LOCATED shape whenever the grammar is token-scoped — the single-token mutation verifies the happy path, the co-located mutation verifies the loop discipline. And the operator-transcript recurrence is now three cycles deep (#153, #156, #159 — the alternating-red pattern): the baseline gate opens every session EXPECTING it.**"
t = t.replace(lesson112_tail, lesson112_tail + lesson113)
skill.write_text(t)
print("  SKILL: lesson 113 appended at the ledger tail")

# ---------- 6. CLAUDE.md: the s59 anti-pattern ----------
sub("CLAUDE.md",
    "a battery's fill and check strings must name the SAME session — the s57 roundtrip's one-session-lag bug read as a timing artifact and cost a recheck)**",
    "a battery's fill and check strings must name the SAME session — the s57 roundtrip's one-session-lag bug read as a timing artifact and cost a recheck)**\n- **A match-scoped exclusion must NEVER be implemented as a line-level escape (session 59: the s56 artifact-existence pin 3's `return` inside the `forEach` line callback silently dropped every hex token after the first excluded one on the same line — the operator's line-13 quote co-located with the pure-digit `2914125` escaped the sweep that caught line 52; CI run #159 FAILED, the third red main run, the alternating-red pattern #153/#156/#159. The fix: `continue` in the match loop — the exclusion skips the TOKEN, never the rest of the line. The guard: the no-silent-skip parity pin — every bare-hex token is either excluded or claimed, the raw stream independently re-derived, a dropped token fails naming its file+line; the co-location shape floor 20 (29 measured). The doctrine: an exclusion's SCOPE must match its SEMANTICS, and the mutation battery must try the CO-LOCATED shape whenever the grammar is token-scoped — the single-token mutation verifies the happy path, the co-located mutation verifies the loop discipline)**")

print("\nS59 docs alignment complete.")
