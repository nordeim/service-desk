#!/usr/bin/env python3
"""S104: derive the 11 s104 lineage scripts from the s103 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s103->s104, S103->S104, session-103->session-104).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 86th sweep measured NO SEVENTIETH
  /login wave — the no-wave form, the s86/s87/s91 precedent class: the
  entry index-6xnUqbWf.js 200/100538 UNCHANGED + the login CSS
  index-BVWWKVEJ.css 200/917016 UNCHANGED, the 69th-wave entry 6xnUqbWf
  the LAST RECORDED — the per-wave baseline), the operator commits
  (5da6027/a888cc5 — the s103 remediation/closeout pair; PLUS the
  operator transcript commit e35458d — session_196.md, the cadence
  CONTINUED at the TWENTY-SIXTH red-at-pull), the era ordinal
  (RED-AT-PULL — the TWENTY-SIXTH, the operator-transcript token class
  at the continued cadence), the sweep ordinal (86th), the wave-watch
  ordinal (SEVENTIETH — the watch), the streak ordinal (87th), and the
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
    ("s103-ref-sweep.sh", "s104-ref-sweep.sh"),
    ("s103-wave-analysis.py", "s104-wave-analysis.py"),
    ("s103-ref-surfaces.sh", "s104-ref-surfaces.sh"),
    ("s103-ourside-verify.sh", "s104-ourside-verify.sh"),
    ("s103-roundtrip.sh", "s104-roundtrip.sh"),
    ("s103-probe-cleanup.ts", "s104-probe-cleanup.ts"),
    ("s103-vlm-check.mjs", "s104-vlm-check.mjs"),
    ("s103-vlm-shotdiff.mjs", "s104-vlm-shotdiff.mjs"),
    ("capture-screenshots-s103.sh", "capture-screenshots-s104.sh"),
    ("s103-ci-status.py", "s104-ci-status.py"),
    ("s103-ci-poll.py", "s104-ci-poll.py"),
]

RULES = [
    (re.compile(r"s103"), "s104"),
    (re.compile(r"S103"), "S104"),
    (re.compile(r"session-103"), "session-104"),
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
