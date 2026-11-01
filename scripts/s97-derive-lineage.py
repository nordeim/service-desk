#!/usr/bin/env python3
"""S97: derive the 11 s97 lineage scripts from the s96 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s96->s97, S96->S97, session-96->session-97).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the baseline re-point (Z33Eor9g -> CXDNEK28, the 62nd-wave entry LAST
  RECORDED, re-fetchable 200/98239 at this session's open), the CSS watch
  re-point (D3d5-7RD -> DLdV97oh), the operator commits (ef575d7/b36183b),
  the transcript doc (session_182), the era ordinal (TWENTIETH / tenth
  consecutive), the sweep ordinal (79th), the wave-watch ordinal
  (SIXTY-THIRD), the streak ordinal (80th), and the restoration of every
  historical per-wave record the mechanical bump would have
  over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s96-ref-sweep.sh", "s97-ref-sweep.sh"),
    ("s96-wave-analysis.py", "s97-wave-analysis.py"),
    ("s96-ref-surfaces.sh", "s97-ref-surfaces.sh"),
    ("s96-ourside-verify.sh", "s97-ourside-verify.sh"),
    ("s96-roundtrip.sh", "s97-roundtrip.sh"),
    ("s96-probe-cleanup.ts", "s97-probe-cleanup.ts"),
    ("s96-vlm-check.mjs", "s97-vlm-check.mjs"),
    ("s96-vlm-shotdiff.mjs", "s97-vlm-shotdiff.mjs"),
    ("capture-screenshots-s96.sh", "capture-screenshots-s97.sh"),
    ("s96-ci-status.py", "s97-ci-status.py"),
    ("s96-ci-poll.py", "s97-ci-poll.py"),
]

# Phase-1 rules: the OWN bump only. Each rule's per-file hit count is
# printed and accumulated for the ledger.
RULES = [
    (re.compile(r"s96"), "s97"),
    (re.compile(r"S96"), "S97"),
    (re.compile(r"session-96"), "session-97"),
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
