#!/usr/bin/env python3
"""S48 docs alignment part 1: README + AGENTS (commands tables, the
Session-48 contracts section, the reference list, the screenshots lineage).
Every replacement count-verified exactly-once; abort on any miscount."""

import sys

REPO = "/home/z/my-project/service-desk"

S48_PINS_DESC = (" + the s48 corpus-count-contract pins (the drift-watch automation: every live "
 "unit/e2e/parity/smoke corpus claim site names ONE number across the five docs, with "
 "minimum-site floors — the stale '54 unit'/'57 E2E'/'11-step'/'# 107 E2E' figures in the "
 "SKILL appendices + README's '163 parity' closed) + the s48 version-contract pins (the "
 "README badge row + the PAD §2 tech table ↔ the installed node_modules versions + the "
 "bun.lock resolved entries — the stack's face pinned bidirectionally)")

S48_SECTION = """## Session-48 contracts (pinned by `tests/corpus-count-contract.test.ts` + `tests/version-contract.test.ts`; inventory in `docs/remediation-plan-session48.md`)

- **The corpus-count closure (the drift-watch automation — CONFIRMED ACTIVE DRIFT, not merely unpinned)**: the s83 shortlist's own leading candidate executed with a twist — the manual per-session grep only ever checked the CURRENT value's sites (is "245" consistent?), never swept for stale-era siblings. The family-shaped extraction found SIX drifted sites the watch could never see: the SKILL's Appendix quick-reference blocks carried session-4-era figures for 44 sessions ("54 unit tests", "57 E2E", "11-step API contract" + the two "# 107 E2E" gate comments), and README's feature table claimed "163 E2E parity tests" vs the actual 164 while CLAUDE.md correctly said 164 — the exact partial-update failure mode. The pins (4, in `tests/corpus-count-contract.test.ts`): per-figure FAMILY consistency — every live claim site of the unit count (9 sites: the README badge/verification/pyramid/commands, the AGENTS commands, the CLAUDE commands, the PAD §7.4 checklist, the SKILL project_state + Appendix) must name ONE number, same for the E2E count (10 sites), the parity count (3 sites), the smoke-steps count (4 sites) — each with a minimum-site floor so a dropped claim site fails loudly instead of silently shrinking the family. The PAD §10 historical rows are excluded by boundary (immutable records); the values themselves stay runtime measures (the s47 smoke doctrine — the pin closes the DOC side; a static count of a runtime suite would be a false claim, measured: the parity spec's line-anchored `test(` count is 155, the runtime count 164). Mutation-verified 5 ways (A: the SKILL '54' revert; B: the README e2e '57'; C: the parity '163'; D: the SKILL '11-step'; H: the dropped README pyramid site — bit BOTH the unit and e2e families, the site carries one claim of each).
- **The stack-version closure (the repo's face, pinned bidirectionally)**: the README badge row + the PAD §2 tech table claimed the stack's versions with zero pins — correct today (node_modules + bun.lock + both doc surfaces all verified byte-agreeing: 16.4.0/19.3.0/5.9.3/4.3.3/6.19.3/5.0.3/1.64.0), but any `bun update` drifts the claims silently (package.json's ranges already float: ^16.1.1 resolves to 16.4.0). The pins (2, in `tests/version-contract.test.ts`): the documented-figures pin (every PAD §2 row's full figure + every README badge's major.minor figure equals the INSTALLED version, ≥1-match floors per surface so a dropped badge line or table row fails loudly) + the lockfile-agreement pin (bun.lock carries the exact resolved entry "pkg@version" for each of the seven documented packages, equal to the installed version — the CI artifact and the local runtime agree; the s45 tsx-entry doctrine generalized to the whole stack). Only the seven packages the docs CLAIM are pinned — the transitive tree is lockfile-governed and undocumented (pin the claims, not the universe). Mutation-verified 3 ways (E: the badge bump; F: the PAD row bump; G: the lockfile entry drift).
- **The s48 live lesson (the mutation-runner class)**: the first mutation run's revert used `git checkout -- <file>` — which reverts UNCOMMITTED REMEDIATION too, silently wiping the session's own doc fixes mid-run (recovered idempotently). The doctrine: mutations on an uncommitted tree revert by REVERSE-REPLACE, never by checkout — the s47 mutation-C class (a tool that solves the immediate problem while destroying the work) applied to the test harness itself.
- **NO eighteenth /login wave (the 30th sweep's F1)**: all three chunks byte-size-identical to the s47 records — the entry `index-CneaUv24.js` (104739), the contract carrier `UserAppMain-DOZft9ba.js` (58761), the login CSS `index-D0Q6-tUz.css` (900665), `logoutReturnPath-HjtsxsFd.js` hash-stable (31st consecutive session, live HTTP 200). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. The fourth quiet session in six. NON-GAP.

"""

def apply(path, old, new, count=1):
    with open(path, encoding="utf-8") as f:
        t = f.read()
    c = t.count(old)
    if c != count:
        print(f"ABORT {path}: expected {count} hits of {old[:60]!r}..., found {c}", file=sys.stderr)
        sys.exit(1)
    t = t.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(t)
    print(f"OK {path}: {old[:50]!r}... ({count} site)")

# 1. README commands table: the s48 pin description
apply(f"{REPO}/README.md",
      " + the s47 docs-contract pins (DEPLOYMENT.md's route-module claim (12, fs-counted) + its smoke-claim (121 steps) — the docs surface that never had a drift watch, the stale '16'/'30' figures closed)",
      " + the s47 docs-contract pins (DEPLOYMENT.md's route-module claim (12, fs-counted) + its smoke-claim (121 steps) — the docs surface that never had a drift watch, the stale '16'/'30' figures closed)" + S48_PINS_DESC)

# 2. AGENTS commands table: the same append (its s47 tail differs slightly)
apply(f"{REPO}/AGENTS.md",
      "the s47 tests/docs-contract.test.ts claims pins (DEPLOYMENT.md's route-module figure — fs-counted 12, doc line-anchored, the stale '16' cannot return + the smoke-claim '121 steps' — the stale '30 E2E checks' cannot return)) |",
      "the s47 tests/docs-contract.test.ts claims pins (DEPLOYMENT.md's route-module figure — fs-counted 12, doc line-anchored, the stale '16' cannot return + the smoke-claim '121 steps' — the stale '30 E2E checks' cannot return)" + S48_PINS_DESC + " |")

# 3. AGENTS: the Session-48 contracts section (before ## Reference)
apply(f"{REPO}/AGENTS.md", "## Reference\n", S48_SECTION + "## Reference\n")

# 4. AGENTS reference list: the plan range + the screenshots lineage
apply(f"{REPO}/AGENTS.md",
      "`docs/remediation-plan-session2.md` … `-session47.md`",
      "`docs/remediation-plan-session2.md` … `-session48.md`")
apply(f"{REPO}/AGENTS.md",
      "refreshed by `scripts/capture-screenshots-s47.sh`",
      "refreshed by `scripts/capture-screenshots-s48.sh` (the s47 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 pattern; the s48 fixture title)")

print("Part 1 complete: README + AGENTS aligned.")
