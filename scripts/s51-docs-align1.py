#!/usr/bin/env python3
"""S51 docs alignment part 1: README + AGENTS + CLAUDE (the s50 pattern —
every replacement count-verified EXACTLY-ONCE, idempotent recovery)."""
import sys

REPO = "/home/z/my-project/service-desk/"

def apply(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK   {label}")

README = REPO + "README.md"
AGENTS = REPO + "AGENTS.md"
CLAUDE = REPO + "CLAUDE.md"

# 1. README: the commands-table row gains the s51 pin description (the s50
#    pattern — the row's description enumerates every pin family)
apply(README,
      "the quoted-output claim class closed + the s48 whole-family-drift blind spot closed)\n",
      "the quoted-output claim class closed + the s48 whole-family-drift blind spot closed) + the s51 prerequisites pins (the README Quick Start's Requires line held two-sided: the seed's crypto is node:crypto + the requirements enumeration carries no Python token — the false 'Python ≥ 3.9 for the seed's crypto imports' claim that survived 50 sessions closed)\n",
      "README commands row: the s51 pin description")

# 2. AGENTS: the NEW Session-51 contracts section (before "## Reference")
SESSION51_SECTION = """## Session-51 contracts (pinned by `tests/prereq-contract.test.ts`; inventory in `docs/remediation-plan-session51.md`)

- **The prerequisites-claim closure (the own-side audit at a NEW level)**: the README Quick Start's Requires line claimed "Python ≥ 3.9 for the seed's crypto imports" for 50 sessions — born wrong (the session-1 docs commit described a Python the seed never had: `prisma/seed.ts` has imported `randomUUID, scryptSync, randomBytes` from `node:crypto` since its first line) and unswept by every pin family (the shape — a REQUIREMENTS enumeration — matches no corpus-count, §7.1-row, or quoted-output form). Closed two-sided: the seed-crypto ground-truth pin (the `node:crypto` import + no Python token in the seed) + the Requires-line pin (the floor + Node ≥ 20 + Bun ≥ 1.1 + NO Python token in the requirements enumeration).
- **The requirements-enumeration scoping doctrine**: a prerequisites line is TWO surfaces — the requirements enumeration (the first sentence, the CLAIM) and the explanatory prose after it (not a claim). The pin guards the enumeration alone (`[^.]*` stops at the first period): a greedy line-regex would flag the honest "no Python required" negation — the s51 pin-harness bug, fixed in flight before the honest RED.
- **The 33rd parity sweep: NO twenty-first /login wave** — the rolldown bundle byte-identical to the s50 records (the entry `index-C-ulo5ek.js` 105055, the CSS `index-BIWjBcok.css` 904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 34th consecutive session); the ONE bundle-internal delta: the old CSS `index-D0Q6-tUz.css` back to HTTP 200 after its s50 404 (an edge-cache artifact on an unreferenced chunk — recorded, not cloned). Their three standing defects persist (33rd re-verification); ours the working superset (the mobile matrix byte-identical to the s41–s50 records: 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates).

## Reference"""

apply(AGENTS,
      "## Reference",
      SESSION51_SECTION,
      "AGENTS: the NEW Session-51 contracts section (before ## Reference)")

# 3. AGENTS: the reference-list range through session 51
apply(AGENTS,
      "- `docs/remediation-plan-session2.md` … `-session50.md` — the per-session gap inventories",
      "- `docs/remediation-plan-session2.md` … `-session51.md` — the per-session gap inventories",
      "AGENTS reference list: the range through session 51")

# 4. AGENTS: the screenshots lineage s50 → s51
apply(AGENTS,
      "refreshed by `scripts/capture-screenshots-s50.sh` (the s49 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s50 fixture title)",
      "refreshed by `scripts/capture-screenshots-s51.sh` (the s50 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s51 fixture title)",
      "AGENTS screenshots lineage: s50 → s51")

# 5. CLAUDE: the s51 anti-pattern bullet (appended at the file's end)
with open(CLAUDE, encoding="utf-8") as f:
    claude = f.read()
BULLET = """
- **A Quick Start's requirements line is a claim site, and a requirement the codebase does not have is a false claim no corpus family will ever catch (session 51: "Python ≥ 3.9 for the seed's crypto imports" shipped in the session-1 docs and survived 50 sessions — the seed has used node:crypto since its first line; the shape — a REQUIREMENTS enumeration — matches no corpus-count, §7.1-row, or quoted-output form, and the claim was born wrong rather than drifted, so even a perfect drift watch would have missed it: nothing to compare against except the CODE. The closure is two-sided: the ground truth (the seed's node:crypto import) and the claim (the enumeration carries no Python token) — and the enumeration is the FIRST SENTENCE alone; explanatory prose after it ("no Python required") is not a claim, so the guard is scoped to the sentence: a greedy line-regex would flag the honest negation. The doctrine: audit the docs' IMPERATIVE surfaces — requirements, prerequisites, promises of behavior — against the code the way corpus figures are audited against the run)**
"""
if claude.endswith("\n"):
    claude = claude + BULLET.lstrip("\n")
else:
    claude = claude + "\n" + BULLET.lstrip("\n")
with open(CLAUDE, "w", encoding="utf-8") as f:
    f.write(claude)
print("OK   CLAUDE: the s51 anti-pattern bullet (the prerequisites-claim doctrine)")

print("\nPART 1 DONE — README + AGENTS + CLAUDE aligned")
