#!/usr/bin/env python3
# S46 docs alignment part 3 (PAD) — display-artifact-safe anchors
import sys

MAIN = chr(0x5B) + "main" + chr(0x5D)

def patch(path, replacements):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for old, new in replacements:
        count = text.count(old)
        if count != 1:
            print(f"FATAL: {path}: expected 1 occurrence, found {count}")
            sys.exit(1)
        text = text.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK: {path} ({len(replacements)} replacements)")

S45_ROW = ("| Unit — the s45 CI-contract pins (the workflow's silent-failure surface: the frozen-install step in both jobs, the hidden-files "
           "artifact flag, the " + MAIN + " triggers, the bun.lock tsx entry — line-anchored code-shaped) | 1 | 4 | `tests/ci-contract.test.ts` | Vitest |\n")
S46_ROW = ("| Unit — the s46 env-contract pins (the .env.example ↔ codebase bidirectional coverage: every code-read env var documented, every "
           "documented var live, the canonical DATABASE_URL literal — line-anchored) | 1 | 3 | `tests/env-contract.test.ts` | Vitest |\n")

patch("Project_Architecture_Document.md", [
    ("- [ ] `bun run test` — 235/235", "- [ ] `bun run test` — 238/238"),
    (S45_ROW, S45_ROW + S46_ROW),
])

S46_KNOWN = (
    "| RESOLVED | Session-46 own-side audit (the s79 next-session shortlist executed: the 235-count drift watch CLEAN (five docs consistent), "
    "nothing new grew (the 50a79ca..cd9fd58 diff is docs-only — session_80.md + the worklog), the console-site ledger stable (4 sites, all "
    "pinned), the CI YAML bytes correct, the health log-prefix bytes od-verified fresh) — and the next-level audit axis CONFIRMED: the "
    "environment-contract surface (`.env.example` ↔ the codebase) entirely unpinned, zero tests referencing .env.example while AGENTS.md claims "
    "it \"documents every variable\" and every session closeout re-verified the match MANUALLY. Closed: tests/env-contract.test.ts (3 pins — "
    "bidirectional coverage + the canonical DATABASE_URL literal, line-anchored). The 28th parity sweep ALL NON-GAP — NO sixteenth /login wave "
    "(all three chunks byte-size-identical to the s45 records: index-CneaUv24.js 104739, UserAppMain-DOZft9ba.js 58761, index-D0Q6-tUz.css "
    "900665, logoutReturnPath hash-stable — the second quiet session in three); their three standing defects persist (the 1328-vs-1280 desktop "
    "overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, 28th re-verification); ours the working "
    "superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates) + the paired VLM check "
    "LAYOUT-OK (both pre- and post-remediation) | The environment-example-is-a-contract class (the quickstart's config surface pinned "
    "bidirectionally — every code var documented, every documented var live; the session's manual closeout step automated) | Fixed — the 3 "
    "env-contract pins; 238 unit / 198 E2E / 121 smoke, 4-mutation-checked (A/B/C/D, each bit exactly its pin), live-verified (the mobile matrix "
    "+ the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical); inventory in `docs/remediation-plan-session46.md` |\n"
)
with open("Project_Architecture_Document.md", encoding="utf-8") as f:
    pad = f.read()
anchor = "inventory in `docs/remediation-plan-session45.md` |"
if pad.count(anchor) != 1:
    print(f"FATAL: PAD s45 known-issues anchor count = {pad.count(anchor)}")
    sys.exit(1)
pad = pad.replace(anchor, anchor + "\n" + S46_KNOWN.rstrip("\n"))
with open("Project_Architecture_Document.md", "w", encoding="utf-8") as f:
    f.write(pad)
print("OK: Project_Architecture_Document.md (known-issues row appended)")
print("Part 3 complete")
