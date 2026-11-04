#!/usr/bin/env python3
"""S103: derive the 11 s103 lineage scripts from the s102 lineage.

The count-verified derivation discipline (the s69-onward form):
  Phase 1 — the OWN bump, mechanical, every rule's hit count checked at
  application time (s102->s103, S102->S103, session-102->session-103).
  Phase 2 — the context-aware hand-audit (separate, via targeted edits):
  the standing-figures context (the 85th sweep's wave watch — the
  SIXTY-NINTH /login wave watch; the standing figures at the s103 open
  are the 84th sweep's frozen record: the entry index-r0DWh4vL.js
  200/99725 + the login CSS index-xihcXjhm.css 200/916169, the
  68th-wave entry r0DWh4vL the LAST RECORDED — the per-wave baseline
  UNCHANGED unless the 85th sweep measures a wave), the operator
  commits (59265f1/2a76345/9a75092 — the s102 remediation/fix/closeout
  triple; PLUS the operator transcript commit fa686d7 — session_194.md,
  the cadence CONTINUED at the TWENTY-FIFTH red-at-pull), the era
  ordinal (RED-AT-PULL — the TWENTY-FIFTH, the operator-transcript
  token class at the continued cadence), the sweep ordinal (85th), the
  wave-watch ordinal (SIXTY-NINTH — the watch), the streak ordinal
  (86th), and the restoration of every historical per-wave record the
  mechanical bump would have over-substituted.

This script performs Phase 1 only and prints the per-file hit counts for
the audit ledger.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
S = REPO / "scripts"

PAIRS = [
    ("s102-ref-sweep.sh", "s103-ref-sweep.sh"),
    ("s102-wave-analysis.py", "s103-wave-analysis.py"),
    ("s102-ref-surfaces.sh", "s103-ref-surfaces.sh"),
    ("s102-ourside-verify.sh", "s103-ourside-verify.sh"),
    ("s102-roundtrip.sh", "s103-roundtrip.sh"),
    ("s102-probe-cleanup.ts", "s103-probe-cleanup.ts"),
    ("s102-vlm-check.mjs", "s103-vlm-check.mjs"),
    ("s102-vlm-shotdiff.mjs", "s103-vlm-shotdiff.mjs"),
    ("capture-screenshots-s102.sh", "capture-screenshots-s103.sh"),
    ("s102-ci-status.py", "s103-ci-status.py"),
    ("s102-ci-poll.py", "s103-ci-poll.py"),
]

RULES = [
    (re.compile(r"s102"), "s103"),
    (re.compile(r"S102"), "S103"),
    (re.compile(r"session-102"), "session-103"),
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
