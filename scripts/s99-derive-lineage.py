#!/usr/bin/env python3
"""S99: derive the 11 s99 lineage scripts from the s98 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s98->s99, S98->S99, session-98->session-99).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the baseline re-point (BKhnHaM4 -> BA3Eznmu, the 65th-wave entry LAST
  RECORDED — the wave landed at this session's open, a DUAL event: the
  entry rotated at -180 bytes AND the login CSS rotated BHjkUcdg ->
  CapATpwD at +4998 bytes, the era's TWENTY-FIRST CSS rotation, the
  login-pair trigger FIRED so the ten-pair VLM battery is mandatory this
  window), the operator commits (3037d9e/34b51a0 — the s98 remediation +
  closeout pair; NO operator transcript commit at this open), the era
  ordinal (GREEN-AT-PULL — the eleven-session red-at-pull streak BROKEN;
  the next red-at-pull — if any — the twenty-second), the sweep ordinal
  (81st), the wave-watch ordinal (SIXTY-FIFTH — landed and measured), the
  streak ordinal (82nd), and the restoration of every historical
  per-wave record the mechanical bump would have over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s98-ref-sweep.sh", "s99-ref-sweep.sh"),
    ("s98-wave-analysis.py", "s99-wave-analysis.py"),
    ("s98-ref-surfaces.sh", "s99-ref-surfaces.sh"),
    ("s98-ourside-verify.sh", "s99-ourside-verify.sh"),
    ("s98-roundtrip.sh", "s99-roundtrip.sh"),
    ("s98-probe-cleanup.ts", "s99-probe-cleanup.ts"),
    ("s98-vlm-check.mjs", "s99-vlm-check.mjs"),
    ("s98-vlm-shotdiff.mjs", "s99-vlm-shotdiff.mjs"),
    ("capture-screenshots-s98.sh", "capture-screenshots-s99.sh"),
    ("s98-ci-status.py", "s99-ci-status.py"),
    ("s98-ci-poll.py", "s99-ci-poll.py"),
]

# Phase-1 rules: the OWN bump only. Each rule's per-file hit count is
# printed and accumulated for the ledger.
RULES = [
    (re.compile(r"s98"), "s99"),
    (re.compile(r"S98"), "S99"),
    (re.compile(r"session-98"), "session-99"),
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
