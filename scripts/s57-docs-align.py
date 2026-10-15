#!/usr/bin/env python3
"""S57: the docs alignment (Component 2) — the SKILL v2.55.0 lesson 111 at the
ledger tail + the AGENTS Session-57 section + the reference range + the
screenshots lineage + the PAD RESOLVED row + the CLAUDE anti-pattern.
Each replacement count-verified exactly-once (the s56 lineage)."""
import pathlib
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
edits = 0


def fix(path, old, new, expect=1, label=""):
    global edits
    p = R / path
    t = p.read_text()
    n = t.count(old)
    if n != expect:
        print(f"FATAL: {path}: {label or old[:40]!r} found {n}x (expected {expect})")
        sys.exit(1)
    p.write_text(t.replace(old, new))
    edits += 1
    print(f"  ok [{path}] {label}")


# --- 1. the SKILL frontmatter (version + description) ---
fix("service-desk_SKILL.md", "version: 2.54.0", "version: 2.55.0", 1, "version bump")
fix("service-desk_SKILL.md",
    "Distilled through the session-56 remediation (2026-10-15).",
    "Distilled through the session-57 remediation (2026-10-15).", 1, "description")

# --- 2. the SKILL lesson 111 at the LEDGER TAIL (the newest-LAST convention) ---
skill = R / "service-desk_SKILL.md"
t = skill.read_text()
lesson111 = (
    "\n111. **The operator's transcript archive is a first-class pin citizen — and a count floor guards mass deletion, never the hole.** "
    "(Session 57.) The baseline gate opened red for the first time in the corpus' history: the operator's transcript commit dfc1f7d "
    "(docs/session_102.md) quoted the s56 fabricated-token narrative in the backticked grammar-matching form at two sites — the s56 "
    "artifact-existence pin 3 caught it at the baseline gate, and CI run #153 had already FAILED on it (39s, the first red main-branch "
    "run ever; runs #1–#152 all green or cancelled) — the pin apparatus working exactly as designed on operator-side drift; the red "
    "state simply sat between sessions. The transcript class needs no new pin (the s56 grammars sweep every docs/*.md file, the "
    "operator's verbatim quotes included — the catch fired in CI at 39s); the response doctrine: the baseline gate is the "
    "operator-side drift catcher — the FIRST duty each session, before any sweep — and the fix is the de-grammar edit (the first "
    "operator-side doc edit in the corpus' history: the claim word-form goes, the historical narrative stays). The deeper structural "
    "slack the event exposed — the ENUMERATION gap: the corpus' numbered families were held by COUNT floors only, and a floor passes "
    "with a hole in the middle (56 plans on the fs, floor 55, one middle deletion: 55 >= 55 — the floor passes, the corpus has a gap "
    "no reader can follow). Measured CLEAN (the plans {2..56} exact — no gaps, no dupes, no extras; the logs {1..102} contiguous; the "
    "correspondence formula doc(N) = 2N−11 + the header identification holding N = 12..56 — the s12 transitional header the boundary, "
    "the s6–s11 free-form era before it) — the born-green closure (the s56 pin-3 precedent): the exact-set enumeration (a deleted "
    "middle plan, an extra plan, or a renumbered corpus fails naming the delta), the contiguity + one-session-lag floor (a forgotten "
    "closeout log fails the VERY NEXT session's baseline gate naming the exact missing doc — the plan-status precedent's honest "
    "chicken-and-egg cost), and the pairing correspondence (a mislabeled or renumbered log, a shifted mapping, a missing transcript). "
    "TWO harness lessons observed in flight: (1) the head-identification check is multi-reference-sensitive — a single-site title "
    "mislabel does NOT bite (the numbering note carries a second session-N reference that still identifies the doc); the mutation had "
    "to be the FULL mislabel, and the sensitivity is the honest behavior — a doc that identifies its session anywhere in its head is "
    "identified; (2) the mapDeps lineage comparison — the s56 node regex for the entry's dependency map missed the actual format "
    "entirely (0 keys extracted from BOTH sides: a silent vacuous pass, the worst comparison shape there is); the robust form is the "
    "chunk-ref basename-hash extraction, held IN the sweep lineage this time (the s54 institutionalization lesson — an ad-hoc fix "
    "that stays ad-hoc is a fix the next session does not have). The doctrine: the doc corpus' INDEXED families (plans, logs) are "
    "sequences, not bags — audit the numbering the way the counts are audited; and the operator's even-doc transcripts are inside "
    "every grammar's sweep, so every session opens at the baseline gate expecting to catch their drift.**\n"
)
if not t.endswith("\n"):
    t += "\n"
t += lesson111
skill.write_text(t)
edits += 1
print("  ok [service-desk_SKILL.md] lesson 111 at the ledger tail")

# --- 3. the AGENTS Session-57 contracts section (between the s56 section and ## Reference) ---
agents = R / "AGENTS.md"
t = agents.read_text()
section = """## Session-57 contracts (pinned by `tests/doc-enumeration-contract.test.ts`; inventory in `docs/remediation-plan-session57.md`)

- **The doc-enumeration closure (the operator-transcript event + the numbered families held to their index sequences)**: the baseline gate caught the operator's transcript quotes reintroducing the s56 fabricated-token grammar form (CI run #153 on `dfc1f7d` had FAILED in 39s — the first red main-branch run ever; the de-grammar repair the first operator-side doc edit: the claim word-form goes, the narrative stays); the deeper slack closed three-sided, born-green — the plan corpus enumerates exactly {2..CURRENT} (complete, contiguous, no extras), the session-log corpus is contiguous from 1 with the one-session-lag floor at the previous session's agent log (doc 2N−11), and the agent-log correspondence holds (every paired session N ≥ 12 carries its header-identified log at doc 2N−11 + its operator transcript at doc 2N−10).
- **The 39th parity sweep: the TWENTY-THIRD /login wave ARRIVED — the second in two sessions — a PURE RE-HASH, user-facing NON-GAP** (the entry rotated `index-B8wmtmTR.js` 200/105258 → `index-BQ2gMrp1.js` 200/105258 — the SAME byte size; the chunk-ref comparison 766 basenames → 766: 455 re-hashed, 311 hash-stable, 0 ADDED, 0 REMOVED — no topology change, unlike the 22nd wave's 4 builder files; the mapDeps comparison held IN the lineage; the login CSS `index-BIWjBcok.css` hash-STABLE 200/904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 40th, the computed-style ledger byte-identical; their three standing defects persist 39th — the desktop 1328-vs-1280, the mobile 468-vs-375, the toast-viewport blocking with the REAL click REFUSED at the toggle rect 24,16,28,28; ours the working superset — the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip Prisma-verified with the listing-timing artifact run to ground).

"""
anchor = "## Reference\n"
assert t.count(anchor) == 1, "the Reference anchor"
t = t.replace(anchor, section + anchor)
agents.write_text(t)
edits += 1
print("  ok [AGENTS.md] the Session-57 contracts section")

# --- 4. the AGENTS reference-list range + the screenshots lineage ---
fix("AGENTS.md", "`docs/remediation-plan-session2.md` … `-session55.md`", "`docs/remediation-plan-session2.md` … `-session56.md`", 1, "reference range")
fix("AGENTS.md", "refreshed by `scripts/capture-screenshots-s56.sh` (the s50–s55 lineage", "refreshed by `scripts/capture-screenshots-s57.sh` (the s50–s56 lineage", 1, "screenshots lineage")

# --- 5. the PAD RESOLVED session-57 row (newest first — above the s56 row) ---
pad = R / "Project_Architecture_Document.md"
t = pad.read_text()
s56_row_start = t.index("| RESOLVED | Session-56 own-side audit")
row = (
    "| RESOLVED | Session-57 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the tenth consecutive session) — then the baseline-gate event: the operator's transcript commit `dfc1f7d` (docs/session_102.md) quoted the s56 fabricated-token narrative backticked at two sites; the s56 artifact-existence pin 3 caught it at the baseline gate AND in CI — run #153 on `dfc1f7d` FAILED in 39s, the first red main-branch run ever — the pin apparatus working as designed on operator-side drift, the red state sitting between sessions; fixed by the de-grammar edit, the first operator-side doc edit; the deeper measurement — the ENUMERATION class: the numbered families held by COUNT floors only, a floor passing with a middle hole (56 plans, floor 55, one deletion: 55 >= 55); measured CLEAN — the plans {2..56} exact, the logs {1..102} contiguous, the correspondence doc(N) = 2N−11 + the header identification holding N = 12..56. Closed: tests/doc-enumeration-contract.test.ts (the exact-set plan enumeration + the log contiguity with the one-session-lag floor + the 2N−11 pairing correspondence), born-green, 7-mutation-verified. The 39th parity sweep: the TWENTY-THIRD /login wave — the second in two sessions — a PURE RE-HASH, user-facing NON-GAP (the entry rotated 105258 → 105258 same-size `index-BQ2gMrp1.js`, 766→766 basenames, 455 re-hashed, 0 added, 0 removed; the login CSS hash-stable 904487, logoutReturnPath hash-stable the 40th); their three standing defects persist 39th; ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip Prisma-verified with the listing-timing artifact run to ground) | The operator-transcript class + the enumeration gap (the operator's even-doc transcripts are inside every pin's sweep corpus — their verbatim quotes can reintroduce grammar-matching citation forms, and the catch's response bound is the next session's baseline gate; and a count floor guards mass deletion, never the hole — the indexed families are sequences, not bags; the head-identification check is multi-reference-sensitive — a single-site title mislabel does not bite, the numbering note's second reference still identifies the doc) | Fixed — the 2 de-grammar edits on the operator's transcript + the 3 doc-enumeration pins (born-green) + the corpus move 276→279 (9 family sites + the quickstart line 33/279 + the §7.1 new row); 279 unit / 198 E2E / 121 smoke, 7-mutation-checked (A–G clean end-to-end, C redesigned in flight to the full-mislabel form), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + the screenshot set); inventory in `docs/remediation-plan-session57.md` |\n"
)
t = t[:s56_row_start] + row + t[s56_row_start:]
pad.write_text(t)
edits += 1
print("  ok [Project_Architecture_Document.md] the RESOLVED session-57 row (newest first)")

# --- 6. the CLAUDE anti-pattern (newest first — above the s56 entry) ---
claude = R / "CLAUDE.md"
t = claude.read_text()
s56_entry = "- **An existence claim is a claim, and its ground truth is the fs/git artifact it names (session 56:"
assert t.count(s56_entry) == 1
entry = (
    "- **The operator's transcript archive is inside every pin's sweep corpus — and a count floor guards mass deletion, never the hole (session 57: the operator's session_102.md transcript quotes reintroduced the s56 fabricated-token grammar form; the artifact-existence pin caught it in CI run #153 — 39s, the first red main-branch run ever — and the red state sat between sessions until the next baseline gate; the fix is the de-grammar edit, the first operator-side doc edit: the claim word-form goes, the narrative stays. The deeper slack: the numbered families' COUNT floors pass with a hole in the middle (56 plans, floor 55, one deletion: 55 >= 55) — closed by the exact-set enumeration + the contiguity/one-session-lag floor + the 2N−11 pairing correspondence, born-green, the corpus measured complete. The doctrine: the baseline gate is the operator-side drift catcher — the first duty each session; the doc corpus' indexed families are sequences, not bags — audit the numbering the way the counts are audited; and the head-identification check is multi-reference-sensitive — a single-site title mislabel does not bite, the numbering note's second reference still identifies the doc)**\n"
)
t = t.replace(s56_entry, entry + s56_entry)
claude.write_text(t)
edits += 1
print("  ok [CLAUDE.md] the anti-pattern (newest first)")

print(f"\nDONE: {edits} edits landed")
