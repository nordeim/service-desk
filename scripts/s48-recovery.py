#!/usr/bin/env python3
"""S48 recovery: re-apply the SKILL doc fixes wiped by the buggy mutation
runner's `git checkout` (the lesson: mutations revert by REVERSE-REPLACE,
never git checkout — checkout reverts uncommitted remediation too).

Idempotent: a fix whose old form is gone but whose new form exists counts
as already-applied; anything else aborts.
"""
import sys

REPO = "/home/z/my-project/service-desk"

FIXES = [
    ("service-desk_SKILL.md",
     "bun run test          # Vitest — 54 unit tests",
     "bun run test          # Vitest — 251 unit tests"),
    ("service-desk_SKILL.md",
     "bun run test:e2e      # 57 E2E (needs the prior build)",
     "bun run test:e2e      # 198 E2E (needs the prior build)"),
    ("service-desk_SKILL.md",
     "bash scripts/smoke-test.sh   # 11-step API contract on :3999",
     "bash scripts/smoke-test.sh   # 121-step API contract on :3999"),
    ("service-desk_SKILL.md",
     "bun run test:e2e  # 107 E2E",
     "bun run test:e2e  # 198 E2E"),
    ("service-desk_SKILL.md",
     "project_state: 245 unit tests",
     "project_state: 251 unit tests"),
    ("README.md",
     "163 E2E parity tests",
     "164 E2E parity tests"),
]

problems = []
for fname, old, new in FIXES:
    path = f"{REPO}/{fname}"
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n_old = text.count(old)
    n_new = text.count(new)
    if n_old >= 1:
        expected = 2 if old == "bun run test:e2e  # 107 E2E" else 1
        if n_old != expected:
            problems.append(f"{fname}: {old!r} found {n_old}x, expected {expected}")
            continue
        text = text.replace(old, new)
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"APPLIED {fname}: {old[:50]!r} -> new ({n_old} site(s))")
    elif n_new >= (2 if old == "bun run test:e2e  # 107 E2E" else 1):
        print(f"ALREADY-APPLIED {fname}: {new[:50]!r}")
    else:
        problems.append(f"{fname}: neither {old!r} nor {new!r} present")

if problems:
    print("ABORT:", file=sys.stderr)
    for p in problems:
        print(f"  {p}", file=sys.stderr)
    sys.exit(1)
print("SKILL fixes recovered; README verified intact.")
