#!/usr/bin/env python3
"""S49 docs alignment part 1: README + AGENTS.md + CLAUDE.md.
Every replacement count-verified exactly-once; bracket-free anchors only."""
import sys

def replace_once(path: str, old: str, new: str, label: str) -> None:
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n == 0 and new in text:
        print(f"SKIP {label} (already applied — idempotent recovery)")
        return
    if n != 1:
        print(f"FATAL {label}: expected 1, found {n}")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new, 1))
    print(f"OK {label}")

S49_DESC = (" + the s49 pad-testcount pins (the PAD §7.1 per-file test distribution "
            "pinned bidirectionally to the RUNTIME — every row names its file's runtime "
            "count, every runtime file has a row, via the nested vitest JSON run + the "
            "playwright --list; the smoke row joined the s48 corpus family)")

# --- README: the commands-table cell (the s49 pin description) ---
replace_once(
    "README.md",
    "the stack's face pinned bidirectionally)\n",
    "the stack's face pinned bidirectionally)" + S49_DESC + "\n",
    "README commands cell + s49 pins",
)

# --- AGENTS.md: the commands-table cell ---
replace_once(
    "AGENTS.md",
    "the stack's face pinned bidirectionally) |\n",
    "the stack's face pinned bidirectionally)" + S49_DESC + " |\n",
    "AGENTS commands cell + s49 pins",
)

# --- AGENTS.md: the NEW Session-49 contracts section (before ## Reference) ---
S49_SECTION = """## Session-49 contracts (pinned by `tests/pad-testcount-contract.test.ts`; inventory in `docs/remediation-plan-session49.md`)

- **The §7.1 test-distribution closure (the s85 shortlist's leading candidate — CONFIRMED ACTIVE DRIFT)**: the per-file test-count class. The totals held by the s48 corpus pins were correct (251/198), but the PAD §7.1 Test Distribution rows were never re-measured after the sessions that grew them: domain.test.ts claimed 61 vs the runtime 75, headers-config.test.ts claimed 4 vs 9, the auth.spec E2E row claimed 9 vs the --list 11, and THREE unit files had NO ROW AT ALL (api-catchall 19, proxy-fromurl 8, body-size 11 — 38 tests unrepresented; the table's unit rows summed to 194 against the canonical 251). Closed: the six row fixes + the four new rows (the three missing + the pin file's own) + 3 pins comparing the table BIDIRECTIONALLY against the runtime — the unit side via a NESTED `vitest run --reporter=json` (the recursion bounded at depth 1 by the SD_PAD_NESTED sentinel; workers bounded for CI; the JSON report's per-file assertion counts — the RUN is the ground truth, `vitest list` undercounts each-generated tests 226-vs-251, measured), the E2E side via `playwright test --list` (test.each expands at collection: the list IS the runtime truth; 0.7s, no server boot, no global-setup — measured), the smoke row tied to the s48 corpus family.
- **The s49 live lesson (the empty-string-mutation class)**: a mutation that deletes a whole doc ROW can never be reverted by reverse-replace (an empty needle cannot be count-verified — `str.count("")` returns every position) — the mutation must operate on the NEIGHBOR-ANCHOR pair (apply removes "neighbor\\nrow\\n" → "neighbor\\n"; revert re-inserts), extending the s48 reverse-replace doctrine to deletion mutations.
- **NO nineteenth /login wave (the 31st sweep's F1)**: all three chunks byte-size-identical to the s48 records — the entry `index-CneaUv24.js` (104739), the contract carrier `UserAppMain-DOZft9ba.js` (58761), the login CSS `index-D0Q6-tUz.css` (900665), `logoutReturnPath-HjtsxsFd.js` hash-stable (32nd consecutive session, live HTTP 200). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39. Their three standing defects persist (the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — their toggle covered by the `fixed top-0 z-[100]` toast div at its own rect, 31st); ours the working superset (1280=1280, 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt).

"""
replace_once(
    "AGENTS.md",
    "## Reference\n",
    S49_SECTION + "## Reference\n",
    "AGENTS Session-49 contracts section",
)

# --- AGENTS.md: the reference list through s49 ---
replace_once(
    "AGENTS.md",
    "- `docs/remediation-plan-session2.md` … `-session48.md` — the per-session gap inventories",
    "- `docs/remediation-plan-session2.md` … `-session49.md` — the per-session gap inventories",
    "AGENTS reference list through s49",
)

# --- AGENTS.md: the screenshots lineage s48→s49 ---
replace_once(
    "AGENTS.md",
    "refreshed by `scripts/capture-screenshots-s48.sh` (the s47 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 pattern; the s48 fixture title)",
    "refreshed by `scripts/capture-screenshots-s49.sh` (the s48 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s49 fixture title)",
    "AGENTS screenshots lineage s48→s49",
)

# --- CLAUDE.md: the s49 anti-pattern (appended at the anti-patterns tail) ---
replace_once(
    "CLAUDE.md",
    "- **Ignore rules are a contract surface, and the tracked surface is the layer they cannot guard (session 47:",
    "- **A per-file distribution table with only a totals watch (session 49: the PAD §7.1 rows summed to 194 while the corpus pins held 251 — three stale counts (domain 61→75, headers-config 4→9, auth.spec 9→11) plus three MISSING rows (api-catchall/proxy-fromurl/body-size, 38 tests) drifted silently because every per-session watch verified the TOTALS, never the distribution; the ground truth for per-file counts is the RUNTIME (a nested vitest JSON run + the playwright --list — each-generated tests undercount statically: 226-vs-251, measured), never a `test(` line count)**\n- **Ignore rules are a contract surface, and the tracked surface is the layer they cannot guard (session 47:",
    "CLAUDE s49 anti-pattern",
)

print("docs alignment part 1 complete (README + AGENTS + CLAUDE)")
