#!/usr/bin/env python3
"""S102: derive the 11 s102 lineage scripts from the s101 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s101->s102, S101->S102, session-101->session-102).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 84th sweep's wave watch — the
  SIXTY-EIGHTH /login wave watch; the standing figures at the s102 open
  are the 83rd sweep's frozen record: the entry index-OLDXOew4.js
  200/98220 + the login CSS index-CapATpwD.css 200/913384, the
  66th-wave entry OLDXOew4 the LAST RECORDED — the per-wave baseline
  UNCHANGED unless the 84th sweep measures a wave), the operator
  commits (856e4c3/47f4fb4 — the s101 remediation + closeout pair; PLUS
  the operator transcript commit 0aee412 — session_192.md, the cadence
  CONTINUED), the era ordinal (RED-AT-PULL — the TWENTY-FOURTH, the
  operator-transcript token class at the continued cadence), the sweep
  ordinal (84th), the wave-watch ordinal (SIXTY-EIGHTH — measured), the
  streak ordinal (85th), and the restoration of every historical
  per-wave record the mechanical bump would have over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s101-ref-sweep.sh", "s102-ref-sweep.sh"),
    ("s101-wave-analysis.py", "s102-wave-analysis.py"),
    ("s101-ref-surfaces.sh", "s102-ref-surfaces.sh"),
    ("s101-ourside-verify.sh", "s102-ourside-verify.sh"),
    ("s101-roundtrip.sh", "s102-roundtrip.sh"),
    ("s101-probe-cleanup.ts", "s102-probe-cleanup.ts"),
    ("s101-vlm-check.mjs", "s102-vlm-check.mjs"),
    ("s101-vlm-shotdiff.mjs", "s102-vlm-shotdiff.mjs"),
    ("capture-screenshots-s101.sh", "capture-screenshots-s102.sh"),
    ("s101-ci-status.py", "s102-ci-status.py"),
    ("s101-ci-poll.py", "s102-ci-poll.py"),
]

RULES = [
    (re.compile(r"s101"), "s102"),
    (re.compile(r"S101"), "S102"),
    (re.compile(r"session-101"), "session-102"),
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
