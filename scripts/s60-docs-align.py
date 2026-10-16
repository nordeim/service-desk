#!/usr/bin/env python3
"""S60: the docs alignment (Component 2).

Edits (each count-verified exactly-once, the s58/s59 lineage form):
  1. AGENTS.md — the Session-60 contracts section (inserted before ## Reference)
  2. AGENTS.md — the reference-list range endpoint -session58.md -> -session59.md
  3. AGENTS.md — the screenshots lineage s59 -> s60
  4. PAD — the RESOLVED session-60 row (newest first, above the s59 row)
  5. CLAUDE.md — the s60 anti-pattern (the blind-replace lineage doctrine)
  6. SKILL — v2.58.0 + lesson 114 at the ledger tail + the description/date bump
  7. The dated docs' freshness claims -> 2026-10-16 (the docdate pins: each
     claimed date >= the doc's git last-commit date, the +0800 convention)
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:80]!r}..., found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"  {path}: {old[:55]!r} -> {new[:55]!r}")


# ---------- 1. AGENTS.md: the Session-60 contracts section ----------
agents = R / "AGENTS.md"
t = agents.read_text(encoding="utf-8")
anchor = "## Reference"
assert t.count(anchor) == 1
section = """## Session-60 contracts (pinned by `tests/scripts-integrity-contract.test.ts`; inventory in `docs/remediation-plan-session60.md`)

- **The scripts-integrity closure (the own-side audit at a NEW level: the battery generator's blind-replace class)**: the committed `scripts/s58-wave-analysis.py:24` + `scripts/s59-wave-analysis.py:24` both referenced `s56_b` — a variable defined NOWHERE in their files. The make-battery generators derive each session's wave-analysis from the prior copy via `.replace()` on their OWN session-pair vocabulary; the s56-era leftover on line 24 predates both vocabularies and survived two generations. The committed scripts crashed with NameError the moment their /tmp inputs existed — the s58/s59 wave figures came from in-flight-fixed copies that never landed (the durability gap; the s57 one-session-lag lineage bug, now at the variable level). **Live-proven by the fresh-clone reproduction**: the s60 battery's own wave-analysis crashed on its first run (the inherited `s56_b`), observed at the 26th-wave measurement. Measured by `scripts/s60-audit-undefined-names.py` (the AST mirror): 75 scripts scanned, exactly 2 offenders (both the live class). Closed: the two one-word lineage fixes (each file's own baseline variable) + the standing helper `scripts/check-undefined-names.py` (the --check/--json form) + the 2 pins (`tests/scripts-integrity-contract.test.ts`: the undefined-name check with the scanned-files floor 70 + the wave-analysis family floor 4 with the per-session contiguity) — born-green, 7-mutation-verified (A the historical re-introduction; B the fresh-generation form; C the family deletion; D the vacuous-shape neutering).
- **The FOURTH consecutive operator-transcript event**: the operator's `f8d6aab` transcript commit (docs/session_108.md) quoted the fabricated token backticked at FOUR sites (lines 9, 10, 11, 45 — the first time an even-doc transcript carried more than two); the s56 pin 3 (with the s59 match-scoped classifier) caught ALL FOUR at the baseline gate (282/283); CI run #162 FAILED (the fourth red main run — the alternating-red pattern #153/#156/#159/#162). Fixed by the de-grammar edit (the fifth operator-side doc edit, the fourth consecutive session requiring one). The doctrine holds: the baseline gate opens every session EXPECTING it.
- **The 42nd parity sweep: the TWENTY-SIXTH /login WAVE — the second REAL topology change in two sessions, user-facing NON-GAP** (the entry rotated `index-OG0wzUXG.js` 101339 → `index-DRs9_-5K.js` 101519; the login CSS rotated for the SECOND time: `index-BCfnIRWB.css` 901951 → `index-DPOrvWRk.css` 899411; 696→695 basenames, 2 added (DevLoopsAPI, RelatedAppsSmall), 3 removed (Bookmark, PinSmall, SecretsForm), 693 common, 432 re-hashed, 261 hash-stable; the computed-style ledger byte-identical — sidebar `#fafafa`, h1 20px; `logoutReturnPath` hash-stable the 43rd; their three standing defects persist 42nd — the real click REFUSED at the toggle rect 24,16,28,28; ours the working superset — the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass).

"""
t = t.replace(anchor, section + anchor)
agents.write_text(t, encoding="utf-8")
print("  AGENTS.md: the Session-60 contracts section inserted before ## Reference")

# ---------- 2. AGENTS.md: the reference-list range through s59 ----------
sub("AGENTS.md", "- `docs/remediation-plan-session2.md` … `-session58.md` — the per-session gap inventories",
         "- `docs/remediation-plan-session2.md` … `-session59.md` — the per-session gap inventories")

# ---------- 3. AGENTS.md: the screenshots lineage s60 ----------
sub("AGENTS.md", "refreshed by `scripts/capture-screenshots-s59.sh` (the s50–s58 lineage verbatim + the self-contained /tmp/s59-baselines save (the workspace-reset lesson — the s57 lineage left the baselines copy to the session)",
         "refreshed by `scripts/capture-screenshots-s60.sh` (the s50–s59 lineage verbatim + the self-contained /tmp/s60-baselines save (the workspace-reset lesson — the s57 lineage left the baselines copy to the session)")

# ---------- 4. PAD: the RESOLVED session-60 row (newest first) ----------
pad = R / "Project_Architecture_Document.md"
t = pad.read_text(encoding="utf-8")
s59_anchor = "| RESOLVED | Session-59 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 13th consecutive session) — then the THIRD consecutive operator-transcript event:"
assert t.count(s59_anchor) == 1
s60_row = """| RESOLVED | Session-60 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the 14th consecutive session) — then the FOURTH consecutive operator-transcript event: the operator's `f8d6aab` transcript commit (docs/session_108.md) reintroduced the backticked fabricated-token form at FOUR sites (lines 9, 10, 11, 45 — the first time an even-doc transcript carried more than two); the s56 pin 3 (with the s59 match-scoped classifier) caught ALL FOUR at the baseline gate; CI run #162 on `f8d6aab` FAILED (the fourth red main run — the alternating-red pattern #153/#156/#159/#162); fixed by the de-grammar edit (the fifth operator-side doc edit, the fourth consecutive session requiring one). The deeper finding — the UNDEFINED-NAME LINEAGE BUG: the committed s58/s59 wave-analysis scripts' line 24 both referenced `s56_b` (defined nowhere in their files) — the make-battery's blind `.replace()` propagates stale variable names across generations; the scripts crashed the moment their /tmp inputs existed (the recorded wave figures came from in-flight-fixed copies that never landed). Measured (the AST mirror): 75 scripts scanned, exactly 2 offenders, both the live class. Closed: the two one-word lineage fixes + the standing helper scripts/check-undefined-names.py + the 2 scripts-integrity pins (the undefined-name check + the scanned-files floor 70; the wave-analysis family floor 4 + the per-session contiguity) — born-green, 7-mutation-verified. The 42nd parity sweep: the TWENTY-SIXTH /login WAVE — the second REAL topology change in two sessions, user-facing NON-GAP (the entry rotated 101339 → 101519; the login CSS rotated for the SECOND time 901951 → 899411; 2 added, 3 removed basenames; the computed-style ledger byte-identical; logoutReturnPath hash-stable the 43rd); their three standing defects persist 42nd; ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip single-pass) | The blind-replace lineage class (a generated script is a durable artifact whose own vocabulary must be validated post-generation — a `.replace()` derivation without an integrity check propagates stale names indefinitely; and a script that cannot run as committed is not the record of what ran) + the operator-transcript recurrence four cycles deep (the baseline gate EXPECTS it) | Fixed — the 4 de-grammar edits on the operator's transcript + the 2 lineage fixes + the standing helper + the 2 new pins (born-green) + the corpus move 283→285 (9 family sites + the quickstart line 35/285 + the BRIDGE ternary + the §7.1 new row); 285 unit / 198 E2E / 121 smoke, 7-mutation-checked, live-verified; inventory in `docs/remediation-plan-session60.md` |
"""
t = t.replace(s59_anchor, s60_row + s59_anchor)
pad.write_text(t, encoding="utf-8")
print("  PAD: the RESOLVED session-60 row inserted (newest first)")

# ---------- 5. CLAUDE.md: the s60 anti-pattern ----------
claude = R / "CLAUDE.md"
t = claude.read_text(encoding="utf-8")
anchor59 = "- **A match-scoped exclusion must NEVER be implemented as a line-level escape (session 59:"
assert t.count(anchor59) == 1
s60_doctrine = """- **A generated lineage script must be validated against its own vocabulary — a blind `.replace()` generation is a stale-name propagator (session 60: the committed s58/s59 wave-analysis scripts' line 24 both referenced `s56_b`, a variable defined nowhere in their files — the make-battery generators replaced only their own session-pair names, and the s56-era leftover survived every generation; the scripts crashed with NameError the moment their /tmp inputs existed, and the recorded wave figures came from in-flight-fixed copies that never landed — a durability gap masquerading as an environment gap at fresh-clone time. The fix: the two one-word lineage edits + the standing AST undefined-name checker + the scripts-integrity pins (the undefined-name check, the scanned-files floor 70, the wave-analysis family floor 4). The doctrine: every battery-generated script gets a post-generation integrity check — the generation's own replace vocabulary is NEVER exhaustive over the file's variables; and the operator-transcript recurrence is now four cycles deep (#153, #156, #159, #162 — the alternating-red pattern): the baseline gate opens every session EXPECTING it)**
"""
t = t.replace(anchor59, s60_doctrine + anchor59)
claude.write_text(t, encoding="utf-8")
print("  CLAUDE.md: the s60 anti-pattern inserted")

# ---------- 6. SKILL: v2.58.0 + lesson 114 + the description/date bump ----------
# (read fresh AFTER the subs below — a pre-read `t` went stale in the first
# pass and the lesson-append wrote it back, wiping the frontmatter edits;
# the docdate pin caught it; the script fixed to the re-read form)
skill = R / "service-desk_SKILL.md"

# the frontmatter
sub("service-desk_SKILL.md", "functionality. Distilled through the session-59 remediation (2026-10-15).",
         "functionality. Distilled through the session-60 remediation (2026-10-16).")
sub("service-desk_SKILL.md", "version: 2.57.0", "version: 2.58.0")
sub("service-desk_SKILL.md", "last_updated: 2026-10-15", "last_updated: 2026-10-16")

# lesson 114 at the ledger tail (the newest-LAST convention) — read FRESH
t = skill.read_text(encoding="utf-8")
assert t.rstrip().endswith("the baseline gate opens every session EXPECTING it.**"), "the ledger tail is not lesson 113"
lesson = """
114. **A generated lineage script is a durable artifact whose own vocabulary must be validated post-generation — a blind `.replace()` derivation propagates stale names indefinitely.** (Session 60.) The fresh-clone reproduction of the 26th-wave analysis crashed on NameError: the s60 battery's wave-analysis (generated from the s59 copy by the make-battery's `.replace()`) inherited `s56_b` on line 24 — a variable defined NOWHERE in any of the three files that carried it (s58, s59, s60). The root cause: each session's generator replaces only ITS OWN session-pair variable names (`s57_b`→`s58_b`, then `s58_b`→`s59_b`) — any OLDER leftover predating the vocabulary survives every generation untouched, and the bug shipped twice (the committed s58/s59 scripts crash the moment their /tmp inputs exist; the recorded wave figures came from in-flight-fixed copies that never landed — the durability gap). TWO lessons: (1) the class is MEASURABLE — a static AST undefined-name scan (every loaded name must be defined somewhere in its own file: assignment, def/class, import, param, exception bind, global/nonlocal, builtin, dunder) caught exactly the live class corpus-wide (75 scripts, 2 offenders, zero false positives) and is now the standing helper `scripts/check-undefined-names.py` + the s60 scripts-integrity pins (the scanned-files floor 70 — the vacuous-pass guard; the wave-analysis family floor 4 + the per-session contiguity); the checker's honest boundary: defined-ANYWHERE not per-scope (the observed class is defined-NOWHERE — the over-acceptance documented, not hidden). (2) The pin-side lesson: `execFileSync` THROWS on a non-zero exit before the pin's own error message can run — the first observation pass showed the bite as "Command failed" instead of the offender list; `spawnSync` + reading the JSON either way (status 0 or 1) is the machine-readable-contract form. And the operator-transcript recurrence is four cycles deep (#153, #156, #159, #162 — the alternating-red pattern, the first four-site event): the baseline gate opens every session EXPECTING it.**
"""
t = t.rstrip("\n") + "\n" + lesson
skill.write_text(t, encoding="utf-8")
print("  SKILL: lesson 114 appended at the ledger tail (newest LAST)")

# ---------- 7. The dated docs' freshness claims -> 2026-10-16 ----------
sub("AGENTS.md", "Verified against the toolchain on 2026-10-15.", "Verified against the toolchain on 2026-10-16.")
sub("CLAUDE.md", "last_updated: 2026-10-15", "last_updated: 2026-10-16")
sub("Project_Architecture_Document.md", "**Last Updated:** 2026-10-15", "**Last Updated:** 2026-10-16")

print("\nS60 docs alignment complete")
