#!/usr/bin/env python3
"""S107: derive the 12 s107 lineage scripts from the s106 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s106->s107, S106->S107, session-106->session-107).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 89th sweep measured the NO-WAVE form —
  the entry index-DyOb2xUE.js 200/101405 UNCHANGED + the login CSS
  index-Bt66wgTd.css 200/924143 UNCHANGED — the login-pair trigger NOT
  fired, the TEN paired VLM checks run voluntarily ALL TEN LAYOUT-OK
  first-pass; the wave analysis 781=781, 0 added / 0 removed, 0 re-hashed /
  781 hash-stable; the 70th-wave entry DyOb2xUE the LAST RECORDED — the
  per-wave baseline unchanged), the operator commits (64bdcea/55ec020 —
  the s106 remediation/closeout pair; PLUS the operator transcript commit
  7327ed3 — session_202.md, the cadence CONTINUED at the TWENTY-NINTH
  red-at-pull, the tokens at SIX sites this window — equaling the era's
  largest count), the era ordinal (RED-AT-PULL — the TWENTY-NINTH, the
  operator-transcript token class at the continued cadence), the sweep
  ordinal (89th), the wave-watch ordinal (SEVENTY-SECOND — the next
  watch), the streak ordinal (90th), and the restoration of every
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
    ("s106-ref-sweep.sh", "s107-ref-sweep.sh"),
    ("s106-wave-analysis.py", "s107-wave-analysis.py"),
    ("s106-ref-surfaces.sh", "s107-ref-surfaces.sh"),
    ("s106-ourside-verify.sh", "s107-ourside-verify.sh"),
    ("s106-roundtrip.sh", "s107-roundtrip.sh"),
    ("s106-probe-cleanup.ts", "s107-probe-cleanup.ts"),
    ("s106-vlm-check.mjs", "s107-vlm-check.mjs"),
    ("s106-vlm-shotdiff.mjs", "s107-vlm-shotdiff.mjs"),
    ("capture-screenshots-s106.sh", "capture-screenshots-s107.sh"),
    ("s106-ci-status.py", "s107-ci-status.py"),
    ("s106-ci-poll.py", "s107-ci-poll.py"),
    ("s106-seed-verify.ts", "s107-seed-verify.ts"),
]

RULES = [
    (re.compile(r"s106"), "s107"),
    (re.compile(r"S106"), "S107"),
    (re.compile(r"session-106"), "session-107"),
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
