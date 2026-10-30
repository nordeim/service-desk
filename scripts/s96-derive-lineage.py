#!/usr/bin/env python3
"""S96: derive the 11 s96 lineage scripts from the s95 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s95->s96, S95->S96, session-95->session-96).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the baseline re-point (D__5Nn5J -> Z33Eor9g, the 61st-wave entry LAST
  RECORDED), the CSS watch re-point (Dv2nVyxn -> D3d5-7RD), the operator
  commits (5981b8f/2b98915), the transcript doc (session_180), the era
  ordinal (NINETEENTH / ninth consecutive), the sweep ordinal (78th), the
  wave-watch ordinal (SIXTY-SECOND), the streak ordinal (79th), and the
  restoration of every historical per-wave record the mechanical bump
  would have over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s95-ref-sweep.sh", "s96-ref-sweep.sh"),
    ("s95-wave-analysis.py", "s96-wave-analysis.py"),
    ("s95-ref-surfaces.sh", "s96-ref-surfaces.sh"),
    ("s95-ourside-verify.sh", "s96-ourside-verify.sh"),
    ("s95-roundtrip.sh", "s96-roundtrip.sh"),
    ("s95-probe-cleanup.ts", "s96-probe-cleanup.ts"),
    ("s95-vlm-check.mjs", "s96-vlm-check.mjs"),
    ("s95-vlm-shotdiff.mjs", "s96-vlm-shotdiff.mjs"),
    ("capture-screenshots-s95.sh", "capture-screenshots-s96.sh"),
    ("s95-ci-status.py", "s96-ci-status.py"),
    ("s95-ci-poll.py", "s96-ci-poll.py"),
]

# Phase-1 rules: the OWN bump only. Each rule's per-file hit count is
# printed and accumulated for the ledger.
RULES = [
    (re.compile(r"s95"), "s96"),
    (re.compile(r"S95"), "S96"),
    (re.compile(r"session-95"), "session-96"),
]

total = 0
for src_name, dst_name in PAIRS:
    src = S / src_name
    dst = S / dst_name
    text = src.read_text()
    counts = []
    for pat, repl in RULES:
        n = len(pat.findall(text))
        if n:
            text = pat.sub(repl, text)
            counts.append(f"{pat.pattern}->{repl}:{n}")
            total += n
    dst.write_text(text)
    per = " ".join(counts) if counts else "(no phase-1 hits)"
    print(f"{dst_name}: {per}")

print(f"\nTOTAL phase-1 substitutions: {total}")
print("Phase 2 (hand-audit) follows via targeted edits.")
