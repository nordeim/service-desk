#!/usr/bin/env python3
"""S50 docs alignment part 1: README (the commands-table pin description),
AGENTS (the Session-50 contracts section + the reference list + the screenshots
lineage), CLAUDE (the s50 anti-pattern). Every replacement count-verified
exactly-once."""
import sys

def replace_once(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK: {label} (1 site)")

# --- 1. README: the commands-table test description gains the s50 pin ---
replace_once(
    "README.md",
    "+ the s49 pad-testcount pins (the PAD §7.1 per-file test distribution pinned bidirectionally to the RUNTIME — every row names its file's runtime count, every runtime file has a row, via the nested vitest JSON run + the playwright --list; the smoke row joined the s48 corpus family)",
    "+ the s49 pad-testcount pins (the PAD §7.1 per-file test distribution pinned bidirectionally to the RUNTIME — every row names its file's runtime count, every runtime file has a row, via the nested vitest JSON run + the playwright --list; the smoke row joined the s48 corpus family) + the s50 quickstart BRIDGE pin (the README Quick Start's verify-setup output line: the quoted file figure == the fs listing of the vitest include patterns, the quoted test figure == the runtime-pinned §7.1 Vitest sum, and the family canonical == that same sum — the quoted-output claim class closed + the s48 whole-family-drift blind spot closed)",
    "README commands-table s50 pin description",
)

# --- 2. AGENTS: the Session-50 contracts section (before ## Reference) ---
replace_once(
    "AGENTS.md",
    "\n## Reference\n",
    """
## Session-50 contracts (pinned by `tests/corpus-count-contract.test.ts` (the 5th test); inventory in `docs/remediation-plan-session50.md`)

- **The quickstart output-line closure (the own-side audit at a NEW level)**: the README Quick Start's Verify Setup block quoted `bun run test`'s output as "4 files / 55 tests passed" — session-1-era figures that survived 49 sessions because the line's shape (a QUOTED-OUTPUT form) is swept by NO s48 corpus family (the family shapes are corpus-count forms: badge/verification/pyramid/commands/checklist/appendix). The audit that found it: after the s87 shortlist's two leading candidates (the CLAUDE major-only prose, the DEPLOYMENT rate-limit figures) measured clean again, the sweep went one level deeper — every test-shaped numeral across the five docs OUTSIDE every family shape. Closed: the figure fix (25 files / 255 tests) + the BRIDGE pin — three assertions in one test: the quoted file figure == the fs listing of the vitest include patterns (a directory listing is always exact — counting FILES is never the s48 each-generated-tests trap), the quoted test figure == the §7.1 Vitest rows' sum (runtime-pinned per-file by the s49 pads, so the sum IS the runtime total), and the corpus family's canonical == that same sum.
- **The s48 blind spot closed (the BRIDGE doctrine)**: the s48 family pins hold all sites to ONE number — but a whole-family drift (every site moving to a wrong number together) passed the family pin silently; nothing linked the family canonical to the RUNTIME total (the s49 pads pin the §7.1 rows per-file, so the §7.1 sum is the runtime total — but nothing held the family canonical to that sum). The s50 BRIDGE is that link: the family canonical must equal the runtime-pinned §7.1 sum. A whole-family drift now fails loudly, and the quickstart line can never drift again (it is held directly to the fs listing + the sum).
- **THE TWENTIETH /login wave ARRIVED (the 32nd sweep's F1 — bundle-internal, the rendered DOM unchanged)**: the reference restructured its entire frontend build onto ROLLDOWN — the entry rotated `index-CneaUv24.js` (104739) → `index-C-ulo5ek.js` (105055), the login CSS `index-D0Q6-tUz.css` (900665) → `index-BIWjBcok.css` (904487; the old CSS now 404 — the first time a dropped chunk went fully dark), a 40-chunk topology (`rolldown-runtime`, `vendor-react`, `vendor-data`, `AuthAPI`, `AuthContext`, `i18n`, `useDesignSystem`, `use-mobile`…) replacing the vite-era set, and the login-contract strings moved OUT of the entry (the new carriers: AuthAPI from_url ×1, AuthContext from_url ×2, i18n Password ×23 + Email ×50 + the rendered DOM itself). `logoutReturnPath-HjtsxsFd.js` hash-STABLE (33rd consecutive session, live HTTP 200 — still referenced by the new HTML); the old entry + UserAppMain chunks still return 200 but are no longer referenced. The parity sweep's ground truth is the RENDERED DOM — verified unchanged at the computed-style level on every surface (the login card `bg-white/95` + `blur(4px)` + `shadow-2xl` + `rounded-2xl` 16px + the `bg-slate-900` sign-in button radius 12px; the active-nav `linear-gradient(to right, rgb(6,182,212), rgb(37,99,235))` + white + the sidebar `#fafafa`; the page h1 36px text-4xl; the quick-stats 48px `from-slate-50 to-gray-50` gradient rows; the `mb-6 grid grid-cols-1 md:grid-cols-3 gap-4` filter row + "Search tickets..." placeholder; the `grid lg:grid-cols-3 gap-6` detail grid; the stat-card `bg-card shadow-lg` + the flat recent rows). Their three standing defects persist (32nd re-verification); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt, pre- AND post-remediation).
- **The s50 live harness lesson (the non-unique anchor class)**: a mutation whose revert needle is a string that appears elsewhere in the doc can never be count-verified — mutation E's first design anchored the quickstart line on the bare gate command, which appears 2× in README (the Verify Setup block + the Testing section); after the apply collapsed the pair, the revert found 2 candidates and could not proceed. The fix: anchor the pair on a prefix unique to the block (the "← server + database healthy" line) — extending the s48 reverse-replace doctrine: the anchor must be unique in BOTH the pre-apply and post-apply states.

## Reference
""",
    "AGENTS Session-50 contracts section",
)

# --- 3. AGENTS: the reference list grows through s50 ---
replace_once(
    "AGENTS.md",
    "`docs/remediation-plan-session2.md` … `-session49.md` — the per-session gap inventories",
    "`docs/remediation-plan-session2.md` … `-session50.md` — the per-session gap inventories",
    "AGENTS reference list through s50",
)

# --- 4. AGENTS: the screenshots lineage s49 → s50 ---
replace_once(
    "AGENTS.md",
    "refreshed by `scripts/capture-screenshots-s49.sh` (the s48 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s49 fixture title)",
    "refreshed by `scripts/capture-screenshots-s50.sh` (the s49 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s50 fixture title)",
    "AGENTS screenshots lineage s49→s50",
)

# --- 5. CLAUDE: the s50 anti-pattern (after the s49 distribution-table doctrine) ---
replace_once(
    "CLAUDE.md",
    "**A per-file distribution table with only a totals watch (session 49: the PAD §7.1 rows summed to 194 while the corpus pins held 251 — three stale counts (domain 61→75, headers-config 4→9, auth.spec 9→11) plus three MISSING rows (api-catchall/proxy-fromurl/body-size, 38 tests) drifted silently because every per-session watch verified the TOTALS, never the distribution; the ground truth for per-file counts is the RUNTIME (a nested vitest JSON run + the playwright --list — each-generated tests undercount statically: 226-vs-251, measured), never a `test(` line count)**",
    "**A per-file distribution table with only a totals watch (session 49: the PAD §7.1 rows summed to 194 while the corpus pins held 251 — three stale counts (domain 61→75, headers-config 4→9, auth.spec 9→11) plus three MISSING rows (api-catchall/proxy-fromurl/body-size, 38 tests) drifted silently because every per-session watch verified the TOTALS, never the distribution; the ground truth for per-file counts is the RUNTIME (a nested vitest JSON run + the playwright --list — each-generated tests undercount statically: 226-vs-251, measured), never a `test(` line count)**\n- **A quoted CLI output is a claim site like any other, and a consistency family with no runtime bridge drifts together (session 50: the README Quick Start quoted `bun run test` as \"4 files / 55 tests passed\" for 49 sessions — the shape (a QUOTED-OUTPUT form) was swept by no s48 corpus family, and the family pins held all corpus sites to ONE number while nothing linked that number to the RUNTIME total: a whole-family drift would have passed the family pin silently. The closure: the quickstart line is held directly to the ground truths (the quoted file figure == the fs listing of the vitest include patterns — counting FILES is a directory listing, always exact, never the each-generated-tests trap; the quoted test figure == the runtime-pinned §7.1 sum), and the family canonical == that same sum — the BRIDGE. The doctrine: when a consistency pin family exists, ask what holds the family's ONE number to reality; if the answer is nothing, the family is a consensus, not a contract)**",
    "CLAUDE s50 anti-pattern",
)

print("docs-align part 1 complete: README + AGENTS + CLAUDE")
