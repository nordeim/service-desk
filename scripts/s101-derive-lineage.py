#!/usr/bin/env python3
"""S101: derive the 11 s101 lineage scripts from the s100 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s100->s101, S100->S101, session-100->session-101).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 83rd sweep measured NO SIXTY-SEVENTH
  WAVE — the entry index-OLDXOew4.js re-measured 200/98220 BYTE-IDENTICAL
  to the s100 capture (sha-verified) + the login CSS index-CapATpwD.css
  200/913384 UNCHANGED — the era's TWENTY-FIRST rotation standing; the
  no-wave precedent form, the s86/s87/s91 class; the per-wave baseline
  STILL the 66th-wave entry OLDXOew4, the LAST RECORDED), the operator
  commits (7bfe777/0b28700 — the s100 remediation + closeout pair; PLUS
  the operator transcript commit 82730ab — session_190.md, the cadence
  CONTINUED at the resumed rate), the era ordinal (RED-AT-PULL — the
  TWENTY-THIRD, the operator-transcript token class at the continued
  cadence), the sweep ordinal (83rd), the wave-watch ordinal
  (SIXTY-SEVENTH — measured, NO wave), the streak ordinal (84th), and
  the restoration of every historical per-wave record the mechanical
  bump would have over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s100-ref-sweep.sh", "s101-ref-sweep.sh"),
    ("s100-wave-analysis.py", "s101-wave-analysis.py"),
    ("s100-ref-surfaces.sh", "s101-ref-surfaces.sh"),
    ("s100-ourside-verify.sh", "s101-ourside-verify.sh"),
    ("s100-roundtrip.sh", "s101-roundtrip.sh"),
    ("s100-probe-cleanup.ts", "s101-probe-cleanup.ts"),
    ("s100-vlm-check.mjs", "s101-vlm-check.mjs"),
    ("s100-vlm-shotdiff.mjs", "s101-vlm-shotdiff.mjs"),
    ("capture-screenshots-s100.sh", "capture-screenshots-s101.sh"),
    ("s100-ci-status.py", "s101-ci-status.py"),
    ("s100-ci-poll.py", "s101-ci-poll.py"),
]

RULES = [
    (re.compile(r"s100"), "s101"),
    (re.compile(r"S100"), "S101"),
    (re.compile(r"session-100"), "session-101"),
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
