#!/usr/bin/env python3
"""S48: the corpus-count move — 245 -> 251 across the 8 live claim sites.

The session's 6 new pins (4 corpus + 2 version) take the unit suite from
245 to 251. The live claim sites move together (the partial-update drift
class the corpus pins exist to catch). The PAD §10 historical row (the
RESOLVED session-47 record) is immutable by convention and stays at 245.
Each replacement is count-verified exactly-once; abort on any miscount.
"""
import sys

REPO = "/home/z/my-project/service-desk"

# (file, old, new, expected_count) — the 8 live unit-count sites
MOVES = [
    ("README.md",
     "badge/tests-245%20unit%20%2B%20198%20E2E-brightgreen",
     "badge/tests-251%20unit%20%2B%20198%20E2E-brightgreen",
     1),
    ("README.md",
     "245 Vitest unit tests",
     "251 Vitest unit tests",
     1),
    ("README.md",
     "245 unit + 198 E2E tests",
     "251 unit + 198 E2E tests",
     1),
    ("README.md",
     "Vitest unit: 245 tests",
     "Vitest unit: 251 tests",
     1),
    ("AGENTS.md",
     "Vitest unit suite (245 tests",
     "Vitest unit suite (251 tests",
     1),
    ("CLAUDE.md",
     "245 unit / 198 E2E",
     "251 unit / 198 E2E",
     1),
    ("Project_Architecture_Document.md",
     "- [ ] `bun run test` — 245/245",
     "- [ ] `bun run test` — 251/251",
     1),
    ("service-desk_SKILL.md",
     "project_state: 245 unit tests",
     "project_state: 251 unit tests",
     1),
]

failures = []
for fname, old, new, expected in MOVES:
    path = f"{REPO}/{fname}"
    with open(path, encoding="utf-8") as f:
        text = f.read()
    count = text.count(old)
    if count != expected:
        failures.append(f"{fname}: expected {expected} hits of {old!r}, found {count}")
        continue
    text = text.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK {fname}: {old[:60]!r}... -> 251-form ({count} site)")

if failures:
    print("ABORT — miscounts:", file=sys.stderr)
    for f in failures:
        print(f"  {f}", file=sys.stderr)
    sys.exit(1)

# Post-verification: no live 245 remains (the historical PAD row is the
# only allowed survivor).
import subprocess
out = subprocess.run(
    ["grep", "-rn", "245", f"{REPO}/README.md", f"{REPO}/AGENTS.md",
     f"{REPO}/CLAUDE.md", f"{REPO}/Project_Architecture_Document.md",
     f"{REPO}/service-desk_SKILL.md"],
    capture_output=True, text=True).stdout
live = [l for l in out.splitlines() if "245" in l]
print(f"\nRemaining '245' mentions ({len(live)}):")
for l in live:
    print(f"  {l[:130]}")
