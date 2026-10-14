#!/usr/bin/env python3
"""S48: the six stale-figure doc fixes (count-verified exactly-once each).

The corpus-count closure: SKILL appendices carry session-4-era figures
(54 unit / 57 E2E / 11-step / # 107 E2E x2) and README's feature table
claims 163 parity tests vs the actual 164. Each fix is verified to hit
exactly once; the run aborts on any miscount (the s46/s47 surgical
doctrine).
"""
import sys

REPO = "/home/z/my-project/service-desk"

FIXES = [
    # (file, old, new, expected_count)
    ("service-desk_SKILL.md",
     "bun run test          # Vitest — 54 unit tests",
     "bun run test          # Vitest — 251 unit tests",
     1),
    ("service-desk_SKILL.md",
     "bun run test:e2e      # 57 E2E (needs the prior build)",
     "bun run test:e2e      # 198 E2E (needs the prior build)",
     1),
    ("service-desk_SKILL.md",
     "bash scripts/smoke-test.sh   # 11-step API contract on :3999",
     "bash scripts/smoke-test.sh   # 121-step API contract on :3999",
     1),
    ("service-desk_SKILL.md",
     "bun run test:e2e  # 107 E2E",
     "bun run test:e2e  # 198 E2E",
     2),
    ("README.md",
     "163 E2E parity tests",
     "164 E2E parity tests",
     1),
]

failures = []
for fname, old, new, expected in FIXES:
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
    print(f"OK {fname}: {old!r} -> {new!r} ({count} site(s))")

if failures:
    print("ABORT — miscounts:", file=sys.stderr)
    for f in failures:
        print(f"  {f}", file=sys.stderr)
    sys.exit(1)
print("All six stale-figure fixes landed (5 fix specs, 6 sites).")
