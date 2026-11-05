#!/usr/bin/env python3
"""S105: derive the 12 s105 lineage scripts from the s104 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s104->s105, S104->S105, session-104->session-105).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 87th sweep measured THE SEVENTIETH
  /login WAVE — the wave form: the entry index-6xnUqbWf.js 200/100538
  ROTATED to index-DyOb2xUE.js 200/101405 (+867) + the login CSS
  index-BVWWKVEJ.css 200/917016 ROTATED to index-Bt66wgTd.css 200/924143
  (+7127) — the era's TWENTY-FOURTH CSS rotation — the login-pair trigger
  FIRED, ALL TEN paired VLM checks re-verified ALL LAYOUT-OK first-pass;
  the wave analysis 777->788? NO — 777->781, 9 added / 5 removed, 467
  re-hashed / 305 hash-stable; the 70th-wave entry DyOb2xUE the LAST
  RECORDED — the per-wave baseline MOVES), the operator commits
  (00d8a73/54a9c1c — the s104 remediation/closeout pair; PLUS the
  operator transcript commit 9ad3015 — session_198.md, the cadence
  CONTINUED at the TWENTY-SEVENTH red-at-pull, the token at TWO sites
  this window), the era ordinal (RED-AT-PULL — the TWENTY-SEVENTH, the
  operator-transcript token class at the continued cadence), the sweep
  ordinal (87th), the wave-watch ordinal (SEVENTY-FIRST — the next
  watch), the streak ordinal (88th), and the restoration of every
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
    ("s104-ref-sweep.sh", "s105-ref-sweep.sh"),
    ("s104-wave-analysis.py", "s105-wave-analysis.py"),
    ("s104-ref-surfaces.sh", "s105-ref-surfaces.sh"),
    ("s104-ourside-verify.sh", "s105-ourside-verify.sh"),
    ("s104-roundtrip.sh", "s105-roundtrip.sh"),
    ("s104-probe-cleanup.ts", "s105-probe-cleanup.ts"),
    ("s104-vlm-check.mjs", "s105-vlm-check.mjs"),
    ("s104-vlm-shotdiff.mjs", "s105-vlm-shotdiff.mjs"),
    ("capture-screenshots-s104.sh", "capture-screenshots-s105.sh"),
    ("s104-ci-status.py", "s105-ci-status.py"),
    ("s104-ci-poll.py", "s105-ci-poll.py"),
    ("s104-seed-verify.ts", "s105-seed-verify.ts"),
]

RULES = [
    (re.compile(r"s104"), "s105"),
    (re.compile(r"S104"), "S105"),
    (re.compile(r"session-104"), "session-105"),
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
