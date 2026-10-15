#!/usr/bin/env python3
"""S56: the docs alignment (Component 2) — SKILL v2.54.0 lesson 110, the AGENTS
Session-56 contracts section + the reference-list range + the screenshots lineage,
the PAD RESOLVED session-56 row, the CLAUDE anti-pattern. Count-verified."""
import sys

REPO = "/home/z/my-project/service-desk"

def edit(path, old, new, expect=1):
    full = f"{REPO}/{path}"
    text = open(full, encoding="utf-8").read()
    n = text.count(old)
    if n != expect:
        print(f"FATAL: {path}: expected {expect} occurrence(s), found {n}:\n  {old[:100]}...")
        sys.exit(1)
    open(full, "w", encoding="utf-8").write(text.replace(old, new) if expect > 1 else text.replace(old, new, 1))
    print(f"OK {path}: {old[:60].strip()[:56]}...")

# --- 1. the SKILL: the version + the description ---
edit("service-desk_SKILL.md", "version: 2.53.0", "version: 2.54.0")
edit("service-desk_SKILL.md",
     "functionality. Distilled through the session-55 remediation (2026-10-15).",
     "functionality. Distilled through the session-56 remediation (2026-10-15).")

# --- 2. the SKILL: lesson 110 at the LEDGER TAIL (the newest-LAST convention) ---
LESSON_110 = (
    "\n110. **An existence claim is a claim — a named artifact needs holding to the fs/git ground truth.** "
    "(Session 56.) The s95 shortlist's named candidates measured clean again (the ninth consecutive session), "
    "so the own-side audit went one level deeper: the existence-claim sweep — when the docs name a durable "
    "artifact as evidence, does the named thing exist? Found FALSE at exactly four sites, three grammars. "
    "G1 (the persistence claims — the word \"persisted\" immediately followed by a backticked scripts/ path): "
    "the s40 stub-applier claim (session_69.md:21) + the two s41 claims (session_71.md:20/24) named scripts "
    "that were NEVER in git — TRUE-THEN-FALSE-NOW: the s40/s41 sessions ran them from the workspace (the "
    "Script Persistence Rule's save-to-file sense), the script-COMMIT convention begins at s42 (the s42/s43/s44 "
    "standing-rerun scripts each carry exactly one commit), and the workspace resets destroyed the only copies "
    "— 15+ sessions of drift, a reader following the session log cannot find the script. G2 (the push-range "
    "citations): the how-to doc's 2026-09-16 field-test note cited `0ab29dc..f932360`, the PRE-IMPORT history "
    "— the repo's git begins at the GitHub web-upload commits, so every commit pushed before the import is "
    "unreachable in the current repository. G3 (the bare commit citations): 616 claims, ZERO dangling after the "
    "exact known-non-commit exclusion set (the SSH algorithm name + the PNG/JPEG magic signatures cited by the "
    "s18 asset-truth pins) — the born-green guard. The class survived because the EXISTENCE shape matches no pin "
    "family's form: the s48 corpus pins watch COUNTS, the s52 docdate pins watch DATES, the s53 keyfiles pins "
    "watch SIZES, the s54 coverage pins map SOURCE-to-TESTS, the s55 plan-status pins watch CHECKBOXES — nothing "
    "anywhere asks whether a NAMED artifact is real. The closure is three-sided (tests/artifact-existence-contract.test.ts): "
    "(1) the persistence grammar — every persisted-scripts claim names an fs file (the word is the claim; the fix "
    "form drops the word and annotates the pre-convention loss); (2) the range reachability — every backticked "
    "`A..B` hex pair resolves in git via one batched `git cat-file --batch-check` call, UNLESS the line carries "
    "the pre-import token (the narrow self-documenting escape: an unreachable range MUST name why on its own "
    "line); (3) the bare-citation reachability — every backticked 7–40-hex citation resolves in git, with the "
    "exact exclusion set + the needed-ness guard (every exclusion literal must remain genuinely cited — the "
    "exclusion can never silently outlive its reason). The class boundary: the weaker method-narratives "
    "(pre-convention helper mentions without the persistence word, the manifest.ts mid-cycle correction, the "
    "s47-fake mutation narrative, the operator's verbatim prompt archive) are history, not claims — outside the "
    "pinned grammars, documented in the plan. THREE harness lessons observed in flight: (1) `git cat-file "
    "--batch-check` returns short-hash inputs EXPANDED to their full 40-char forms — a parser keyed by the "
    "output's first token misses every short-hash lookup (the order-zipped map is the fix, the measured behavior "
    "documented in the pin); (2) a session's own plan QUOTES the claim grammars it audits — the plan must "
    "describe the collocations without reproducing them, or the pins bite the plan itself forever (the s55 "
    "immediate-catch pattern firing at plan time now, caught BEFORE the RED); (3) the mutation-runner's "
    "re-verify helper must grep the WHOLE vitest output for the Tests-passed summary — the summary is never in "
    "the tail-3 lines (Start at/Duration/Isolate follow it). The doctrine: audit the docs' EVIDENCE surfaces — "
    "named scripts, cited commits, referenced files — the way corpus figures are audited against the run; a "
    "named artifact that does not exist is a false claim no corpus family will ever catch, and its pin's ground "
    "truth is the fs and git object reachability, both one batched call away.**\n"
)
skill = open(f"{REPO}/service-desk_SKILL.md", encoding="utf-8").read()
if not skill.endswith("\n"):
    skill += "\n"
tail_109 = "the fs and git object reachability, both one batched call away.**"  # guard below
if LESSON_110.strip()[:4] in skill:
    print("SKIP SKILL lesson 110: already present")
else:
    skill = skill + LESSON_110
    open(f"{REPO}/service-desk_SKILL.md", "w", encoding="utf-8").write(skill)
    print("OK service-desk_SKILL.md: lesson 110 appended at the ledger tail")

# --- 3. the AGENTS: the Session-56 contracts section (before ## Reference) ---
AGENTS_SECTION = """## Session-56 contracts (pinned by `tests/artifact-existence-contract.test.ts`; inventory in `docs/remediation-plan-session56.md`)

- **The artifact-existence closure (the own-side audit at a NEW level)**: the docs' existence claims — a named script, a cited commit — held to the fs and git object reachability. Found FALSE at four sites, three grammars: the three pre-s42 persistence claims (the s40/s41 scripts the workspace resets destroyed — never in git, 15+ sessions of drift) + the how-to doc's pre-import push-range citation. Closed three-sided (the persistence grammar + the range reachability with the pre-import annotation escape + the bare-citation reachability with the exact exclusion set and the needed-ness guard), one batched `git cat-file --batch-check` call per pin.
- **The 38th parity sweep: the TWENTY-SECOND /login wave ARRIVED — the first in six sessions — and it is user-facing NON-GAP** (a Base44 platform redeploy: the entry rotated `index-C-ulo5ek.js` 200/105055 → `index-B8wmtmTR.js` 200/105258, 427 chunks re-hashed, 4 NEW files all builder/editor infrastructure — `PlaySmall.js`, `preview-comments.store.js`, `useIsEditorTopbarCompact.js`, `visual-edit.store.js` — 0 removed; the login CSS `index-BIWjBcok.css` hash-STABLE 200/904487, the computed-style spot ledger byte-identical, `logoutReturnPath-HjtsxsFd.js` hash-stable the 39th; their three standing defects persist 38th — the desktop 1328-vs-1280, the mobile 468-vs-375, the toast-viewport blocking with the REAL click REFUSED at the toggle rect 24,16,28,28; ours the working superset — the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the UI round-trip Prisma-verified).

"""
edit("AGENTS.md", "## Reference\n", AGENTS_SECTION + "## Reference\n")

# --- 4. the AGENTS: the reference-list range + the screenshots lineage ---
edit("AGENTS.md", "`docs/remediation-plan-session2.md` … `-session54.md`", "`docs/remediation-plan-session2.md` … `-session55.md`")
edit("AGENTS.md",
     "refreshed by `scripts/capture-screenshots-s55.sh` (the s50–s54 lineage verbatim",
     "refreshed by `scripts/capture-screenshots-s56.sh` (the s50–s55 lineage verbatim")

# --- 5. the PAD: the RESOLVED session-56 row (above the s55 row, newest-first) ---
PAD_ROW = (
    "| RESOLVED | Session-56 own-side audit (the s95 shortlist's named candidates measured CLEAN again (the ninth "
    "consecutive session) — the CLAUDE major-only prose + the DEPLOYMENT rate-limit figures + the "
    "vitest/playwright version surfaces + the SKILL's prose-recap forms — then one level deeper: the "
    "existence-claim sweep): the docs' existence claims — named scripts, cited commits — held to the fs and git "
    "object reachability. Found FALSE at exactly four sites, three grammars: G1 the persistence claims (the "
    "s40 stub-applier claim + the two s41 applier/runner claims — the scripts were NEVER in git; the "
    "script-commit convention begins s42, the workspace resets destroyed the only copies, 15+ sessions of "
    "drift), G2 the push-range citations (the how-to doc's 2026-09-16 field-test note citing the pre-import "
    "history `0ab29dc..f932360` — the repo's git begins at the GitHub web-upload commits), G3 the bare commit "
    "citations (616 claims, ZERO dangling after the exact known-non-commit exclusion set — the born-green "
    "guard). Closed: tests/artifact-existence-contract.test.ts (the persistence grammar + the range "
    "reachability with the pre-import annotation escape + the bare-citation reachability with the exact "
    "exclusion set and the needed-ness guard) + the four claim fixes (the pre-convention annotation form) + the "
    "corpus move 273→276. The 38th parity sweep: the TWENTY-SECOND /login wave ARRIVED — the first in six "
    "sessions — user-facing NON-GAP (a Base44 platform redeploy: the entry rotated 105055 → 105258, 427 chunks "
    "re-hashed, 4 NEW builder/editor files, 0 removed; the login CSS hash-stable 904487, the computed-style "
    "ledger byte-identical, logoutReturnPath hash-stable the 39th); their three standing defects persist 38th; "
    "ours the working superset (the mobile matrix byte-identical, the paired VLM LAYOUT-OK first attempt, the "
    "UI round-trip Prisma-verified) | The existence-claim class (an existence claim is a claim — a named "
    "artifact needs holding to the fs/git ground truth; TRUE-THEN-FALSE-NOW claims need the ground-truth pin, "
    "and the pin's reachability harness must handle short-hash expansion — `git cat-file --batch-check` "
    "returns short inputs EXPANDED, the order-zipped map is the fix) | Fixed — the 3 artifact-existence pins + "
    "the 4 claim fixes + the corpus move 273→276 (9 family sites + the quickstart line 32/276 + the §7.1 new "
    "row); 276 unit / 198 E2E / 121 smoke, 7-mutation-checked (A–G, each bit exactly its pin — the battery "
    "clean end-to-end; G caught the s56 plan's own mid-flight boxes via the simulated s57 sweep), "
    "live-verified (the mobile matrix + the paired VLM LAYOUT-OK + the UI round-trip + the seed canonical + "
    "the screenshot set); inventory in `docs/remediation-plan-session56.md` |\n"
)
pad = open(f"{REPO}/Project_Architecture_Document.md", encoding="utf-8").read()
anchor = "| RESOLVED | Session-55 own-side audit"
i = pad.find(anchor)
if i < 0:
    print("FATAL: the PAD s55 RESOLVED row anchor not found")
    sys.exit(1)
if "Session-56 own-side audit" in pad:
    print("SKIP PAD: the s56 RESOLVED row already present")
else:
    # insert at the start of the s55 row's line
    line_start = pad.rfind("\n", 0, i) + 1
    pad = pad[:line_start] + PAD_ROW + pad[line_start:]
    open(f"{REPO}/Project_Architecture_Document.md", "w", encoding="utf-8").write(pad)
    print("OK Project_Architecture_Document.md: the RESOLVED session-56 row inserted (newest-first)")

# --- 6. the CLAUDE anti-pattern (the newest bullet, right under the section header) ---
CLAUDE_AP = (
    "- **An existence claim is a claim, and its ground truth is the fs/git artifact it names (session 56: three "
    "pre-s42 \"persisted `scripts/…`\" claims named scripts that were never in git — the workspace resets "
    "destroyed the only copies 15+ sessions earlier; the how-to doc cited a push range from the pre-import "
    "history the repo's web-upload root makes unreachable; 616 bare commit citations held clean by the exact "
    "known-non-commit exclusion set. The class survived because the EXISTENCE shape matches no pin family's "
    "form — counts/dates/sizes/source-maps/checkboxes never ask whether a NAMED artifact is real. The closure: "
    "the persistence grammar (fs), the range reachability (one batched `git cat-file --batch-check` call, the "
    "pre-import annotation the narrow escape), and the bare-citation reachability with the needed-ness guard "
    "(every exclusion literal must remain genuinely cited). The harness trap: `--batch-check` returns "
    "short-hash inputs EXPANDED to full 40-char forms — key the map by the REQUESTED hash via order-zipping, "
    "never by the output's first token. The doctrine: audit the docs' EVIDENCE surfaces — named scripts, cited "
    "commits — the way corpus figures are audited against the run; a named artifact that does not exist is a "
    "false claim no corpus family will ever catch)**\n"
)
claude = open(f"{REPO}/CLAUDE.md", encoding="utf-8").read()
if "An existence claim is a claim" in claude:
    print("SKIP CLAUDE: the s56 anti-pattern already present")
else:
    anchor = "## Anti-Patterns to Avoid\n\n"
    i = claude.find(anchor)
    if i < 0:
        print("FATAL: the CLAUDE anti-patterns anchor not found")
        sys.exit(1)
    insert_at = i + len(anchor)
    claude = claude[:insert_at] + CLAUDE_AP + claude[insert_at:]
    open(f"{REPO}/CLAUDE.md", "w", encoding="utf-8").write(claude)
    print("OK CLAUDE.md: the s56 existence-claim anti-pattern inserted (newest-first)")

print("docs alignment complete")
