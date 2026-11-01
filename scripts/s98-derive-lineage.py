#!/usr/bin/env python3
"""S98: derive the 11 s98 lineage scripts from the s97 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s97->s98, S97->S98, session-97->session-98).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the baseline re-point (CXDNEK28 -> CP3DCnoK, the 63rd-wave entry LAST
  RECORDED, re-fetchable 200/98400 at this session's open), the CSS watch
  re-point (DLdV97oh -> BHjkUcdg), the operator commits (2d1959b/869d0dc),
  the transcript doc (session_184), the era ordinal (TWENTY-FIRST /
  eleventh consecutive), the sweep ordinal (80th), the wave-watch ordinal
  (SIXTY-FOURTH), the streak ordinal (81st), and the restoration of every
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
    ("s97-ref-sweep.sh", "s98-ref-sweep.sh"),
    ("s97-wave-analysis.py", "s98-wave-analysis.py"),
    ("s97-ref-surfaces.sh", "s98-ref-surfaces.sh"),
    ("s97-ourside-verify.sh", "s98-ourside-verify.sh"),
    ("s97-roundtrip.sh", "s98-roundtrip.sh"),
    ("s97-probe-cleanup.ts", "s98-probe-cleanup.ts"),
    ("s97-vlm-check.mjs", "s98-vlm-check.mjs"),
    ("s97-vlm-shotdiff.mjs", "s98-vlm-shotdiff.mjs"),
    ("capture-screenshots-s97.sh", "capture-screenshots-s98.sh"),
    ("s97-ci-status.py", "s98-ci-status.py"),
    ("s97-ci-poll.py", "s98-ci-poll.py"),
]

# Phase-1 rules: the OWN bump only. Each rule's per-file hit count is
# printed and accumulated for the ledger.
RULES = [
    (re.compile(r"s97"), "s98"),
    (re.compile(r"S97"), "S98"),
    (re.compile(r"session-97"), "session-98"),
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
    print(f"{dst_name}: {'; '.join(counts) if counts else 'NO MATCHES'}")

print(f"TOTAL substitutions: {total}")
