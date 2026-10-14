#!/usr/bin/env python3
# S47: docs alignment part 3 — the PAD rows + the SKILL.md v2.45.0 bump + lesson 101.
# (Bracket-free anchors only; every replacement count-verified exactly-once.)
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

# --- PAD §7.1: the two new test rows, inserted after the s46 env-contract row ---
S46_ROW_TAIL = "`tests/env-contract.test.ts` | Vitest |\n"
S47_ROWS = (
    "| Unit — the s47 .gitignore hygiene pins (the secret-guard surface, EXECUTABLE: check-ignore on `.env` / the credential patterns (`*.key`, `*.pem`, `ssh-key.txt`) / the db binaries + the tracked-surface pin — `git ls-files` matches no secret-shaped path, the PAD §7.4 checklist automated — + the inverse pin: `.env.example` tracked and never ignored, the quickstart source) | 1 | 5 | `tests/gitignore-contract.test.ts` | Vitest |\n"
    "| Unit — the s47 DEPLOYMENT.md claims pins (the docs surface that never had a drift watch: the route-module count — fs-counted 12, doc line-anchored, the stale '16' closed — and the smoke-claim '121 steps', the stale '30 E2E checks' closed) | 1 | 2 | `tests/docs-contract.test.ts` | Vitest |\n"
)

with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()

n = pad.count(S46_ROW_TAIL)
if n != 1:
    print(f"FATAL: PAD s46 row tail count {n} != 1")
    sys.exit(1)
pad = pad.replace(S46_ROW_TAIL, S46_ROW_TAIL + S47_ROWS)

with open("Project_Architecture_Document.md", "w", encoding="utf-8") as f:
    f.write(pad)
print("OK: PAD §7.1 rows (2 inserted)")

# --- PAD: the checklist count + the new known-issues row ---
patch("Project_Architecture_Document.md", [
    ("- [ ] `bun run test` — 238/238", "- [ ] `bun run test` — 245/245", 1),
])

S47_KNOWN_ROW = (
    "| RESOLVED | Session-47 own-side audit (the s81 next-session shortlist executed: the 238-count drift watch CLEAN (five docs consistent), nothing new grew (the c7e10c4..05d7054 diff is docs-only — session_82.md), the console-site ledger stable (4 sites, all pinned), the CI YAML bytes od-verified fresh ([main] — the display artifact re-fired in the tool output, doctrine re-held), the health log-prefix bytes od-verified fresh) — and the two CONFIRMED defects: the `.gitignore` hygiene surface entirely unpinned (the secret-guard held by the PAD §7.4 manual checklist alone — a dropped `.env` ignore line would let a future `git add .` commit the secret) and DEPLOYMENT.md carrying two stale numeric claims (the '16 API route handlers' figure vs the actual 12 route modules; '30 E2E checks' vs the canonical 121 steps — the docs surface that never had a drift watch). Closed: tests/gitignore-contract.test.ts (5 EXECUTABLE pins — check-ignore + the tracked surface + the inverse) + tests/docs-contract.test.ts (2 pins — the fs-counted ground truth AND the doc's line-anchored claim, both sides). The 29th parity sweep ALL NON-GAP — NO seventeenth /login wave (all three chunks byte-size-identical to the s46 records, logoutReturnPath hash-stable 30th); their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, 29th); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates) + the paired VLM check LAYOUT-OK (both pre- and post-remediation, first attempt) | The ignore-rules-are-a-contract class (the secret-guard pinned executably at BOTH layers — the rule engine AND the tracked surface; the tracked-surface pin is the guard check-ignore cannot provide) + the docs-drift class (a doc without a drift watch drifts — pin the claim to the counted ground truth) | Fixed — the 5 hygiene pins + the 2 claims pins; 245 unit / 198 E2E / 121 smoke, 6-mutation-checked (A–F, each bit exactly its pin; F drove the fs-count hardening — the s45 live-pin-lesson class), live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical); inventory in `docs/remediation-plan-session47.md` |\n"
)

with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()

anchor = "| RESOLVED | Session-46 own-side audit"
n = pad.count(anchor)
if n != 1:
    print(f"FATAL: PAD s46 known-issues row anchor count {n} != 1")
    sys.exit(1)
pad = pad.replace(anchor, S47_KNOWN_ROW + anchor)
with open("Project_Architecture_Document.md", "w", encoding="utf-8") as f:
    f.write(pad)
print("OK: PAD known-issues row (1 inserted)")

print("part 3 complete")
