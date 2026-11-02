#!/usr/bin/env python3
"""S100: derive the 11 s100 lineage scripts from the s99 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s99->s100, S99->S100, session-99->session-100).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the baseline re-point (BA3Eznmu -> OLDXOew4, the 66th-wave entry LAST
  RECORDED — the wave landed at this session's open, the era's SEVENTH
  zero-delta re-hash: the entry rotated at the SAME byte size 98220, the
  login CSS CapATpwD UNCHANGED, the login-pair trigger NOT fired but the
  ten-pair VLM battery carried forward per the s82 structural doctrine),
  the operator commits (266a3f4/f51a2ac — the s99 remediation + closeout
  pair; PLUS the operator transcript commit f32f798 — session_188.md, the
  cadence RESUMED), the era ordinal (RED-AT-PULL — the TWENTY-SECOND, the
  operator-transcript token class re-introduced at the resumed cadence),
  the sweep ordinal (82nd), the wave-watch ordinal (SIXTY-SIXTH — landed
  and measured), the streak ordinal (83rd), and the restoration of every
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
    ("s99-ref-sweep.sh", "s100-ref-sweep.sh"),
    ("s99-wave-analysis.py", "s100-wave-analysis.py"),
    ("s99-ref-surfaces.sh", "s100-ref-surfaces.sh"),
    ("s99-ourside-verify.sh", "s100-ourside-verify.sh"),
    ("s99-roundtrip.sh", "s100-roundtrip.sh"),
    ("s99-probe-cleanup.ts", "s100-probe-cleanup.ts"),
    ("s99-vlm-check.mjs", "s100-vlm-check.mjs"),
    ("s99-vlm-shotdiff.mjs", "s100-vlm-shotdiff.mjs"),
    ("capture-screenshots-s99.sh", "capture-screenshots-s100.sh"),
    ("s99-ci-status.py", "s100-ci-status.py"),
    ("s99-ci-poll.py", "s100-ci-poll.py"),
]

RULES = [
    (re.compile(r"s99"), "s100"),
    (re.compile(r"S99"), "S100"),
    (re.compile(r"session-99"), "session-100"),
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
