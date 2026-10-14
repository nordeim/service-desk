#!/usr/bin/env python3
# S47: docs alignment (the s46 surgical practice — every replacement count-verified exactly-once)
# Per the s46 display-artifact lesson: no bracket-prefixed literals in anchors; anchors chosen
# from freshly probed bytes. All anchors below are bracket-free.
import sys

def patch(path, replacements):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for old, new, count in replacements:
        n = text.count(old)
        if n != count:
            print(f"FATAL: {path}: anchor count {n} != {count} for: {old[:80]!r}")
            sys.exit(1)
        text = text.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK: {path} ({len(replacements)} replacements)")

# --- README.md ---
patch("README.md", [
    ("tests-238%20unit", "tests-245%20unit", 1),
    ("238 Vitest unit tests", "245 Vitest unit tests", 1),
    ("| 🧪 **Test pyramid** | 238 unit + 198 E2E", "| 🧪 **Test pyramid** | 245 unit + 198 E2E", 1),
    ("the canonical DATABASE_URL literal — line-anchored)\n",
     "the canonical DATABASE_URL literal — line-anchored) + the s47 gitignore-contract pins (the secret-guard surface: .env, *.key/*.pem/ssh-key.txt, db binaries — EXECUTABLE check-ignore pins + the tracked-surface pin (git ls-files carries no secret-shaped path, the PAD §7.4 checklist automated) + .env.example tracked, not ignored — the quickstart source) + the s47 docs-contract pins (DEPLOYMENT.md's route-module claim (12, fs-counted) + its smoke-claim (121 steps) — the docs surface that never had a drift watch, the stale '16'/'30' figures closed)\n", 1),
    ("-session46.md` — the per-session gap inventories", "-session47.md` — the per-session gap inventories", 0),
])

# --- CLAUDE.md ---
patch("CLAUDE.md", [
    ("238 unit / 198 E2E", "245 unit / 198 E2E", 1),
])

# --- AGENTS.md: the commands-table count ---
patch("AGENTS.md", [
    ("Vitest unit suite (238 tests", "Vitest unit suite (245 tests", 1),
    ("every documented var live, the canonical DATABASE_URL literal — line-anchored)) |",
     "every documented var live, the canonical DATABASE_URL literal — line-anchored) + the s47 tests/gitignore-contract.test.ts hygiene pins (the secret-guard surface EXECUTABLE: check-ignore on .env / the credential patterns / the db binaries + the tracked-surface pin — git ls-files carries no secret-shaped path, the PAD §7.4 checklist automated + the inverse pin: .env.example tracked, never ignored — the quickstart source stays in every fresh clone) + the s47 tests/docs-contract.test.ts claims pins (DEPLOYMENT.md's route-module figure — fs-counted 12, doc line-anchored, the stale '16' cannot return + the smoke-claim '121 steps' — the stale '30 E2E checks' cannot return)) |", 1),
    ("-session46.md` — the per-session gap inventories", "-session47.md` — the per-session gap inventories", 1),
    ("refreshed by `scripts/capture-screenshots-s46.sh`", "refreshed by `scripts/capture-screenshots-s47.sh`", 1),
])

print("part 1 complete")
