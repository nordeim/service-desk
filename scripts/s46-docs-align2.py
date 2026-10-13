#!/usr/bin/env python3
# S46 docs alignment part 2 (AGENTS.md, service-desk_SKILL.md) — display-artifact-safe anchors
import sys

MAIN = chr(0x5B) + "main" + chr(0x5D)  # [main] — built char-safe; tool output eats the literal

def patch(path, replacements):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    for old, new in replacements:
        count = text.count(old)
        if count != 1:
            print(f"FATAL: {path}: expected 1 occurrence, found {count}, of: {old[:70].encode('unicode_escape').decode()!r}")
            sys.exit(1)
        text = text.replace(old, new)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"OK: {path} ({len(replacements)} replacements)")

# --- AGENTS.md ---
S46_AGENTS_CELL = (" + the s46 `tests/env-contract.test.ts` env pins (the .env.example ↔ codebase bidirectional coverage: every code-read env var "
                   "documented, every documented var live, the canonical DATABASE_URL literal — line-anchored))")
patch("AGENTS.md", [
    ("| `bun run test` | Vitest unit suite (235 tests —", "| `bun run test` | Vitest unit suite (238 tests —"),
    (f"the {MAIN} triggers, the bun.lock tsx entry — line-anchored code-shaped)) |",
     f"the {MAIN} triggers, the bun.lock tsx entry — line-anchored code-shaped" + S46_AGENTS_CELL + " |"),
    ("capture-screenshots-s45.sh", "capture-screenshots-s46.sh"),
    ("- `docs/remediation-plan-session2.md` … `-session45.md` — the per-session gap inventories",
     "- `docs/remediation-plan-session2.md` … `-session46.md` — the per-session gap inventories"),
])

# Insert the Session-46 contracts section before "## Reference" in AGENTS.md
S46_AGENTS_SECTION = f"""## Session-46 contracts (pinned by `tests/env-contract.test.ts`; inventory in `docs/remediation-plan-session46.md`)

- **The environment-contract closure (the .env.example ↔ codebase surface, pinned bidirectionally)**: AGENTS.md's own Environment section claims "`.env.example` documents every variable," the README quickstart leans on `cp .env.example .env`, and every session closeout re-verified the match MANUALLY — zero tests referenced the file before s46. The measured contract: the code reads exactly three production env vars (`DATABASE_URL` — db.ts + db-path.ts; `AUTH_SECRET` — auth.ts; `NEXT_PUBLIC_SITE_URL` — five sites) plus the framework-managed `NODE_ENV`, and `.env.example` documents exactly those three. The pins (3): the documents-every-variable pin (code → example: a new code-side env var — the PAD known-issues row literally proposes wiring Resend/SendGrid someday — fails until documented, the quickstart-breaks-silently class), the working-example pin (example → code: a documented-but-dead var fails — the "matches the codebase" contract closed in BOTH directions), and the canonical DATABASE_URL literal pin (line-anchored `^DATABASE_URL="file:../db/custom.db"$` — the s45 hardening: a commented-out or corrupted literal fails the pin; the commented PostgreSQL alternative never counts as an active var). NODE_ENV is excluded by design (Next injects it; no user sets it).
- **NO sixteenth /login wave (the 28th sweep's F1)**: all three chunks byte-size-identical to the s45 records — the entry `index-CneaUv24.js` (104739), the contract carrier `UserAppMain-DOZft9ba.js` (58761), the login CSS `index-D0Q6-tUz.css` (900665), `logoutReturnPath-HjtsxsFd.js` hash-stable (29th consecutive session). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. The second quiet session in three (the s35/s41/s42 pattern). NON-GAP.
- **The s18 display-layer artifact's ELEVENTH firing (in-session, doctrine re-held)**: reading the PAD/AGENTS/SKILL docs through tool output rendered `the {MAIN} triggers` as `the ain] triggers` (the output layer eats the `[m` as an escape) — the docs' own bytes verified correct via char-code probes before any patch anchored on them. The doctrine extends to PATCH AUTHORING: never copy a bracket-prefixed literal from tool output into a patch string — probe the actual bytes first.

"""
with open("AGENTS.md", encoding="utf-8") as f:
    agents = f.read()
if agents.count("## Reference") != 1:
    print("FATAL: AGENTS.md '## Reference' not unique")
    sys.exit(1)
agents = agents.replace("## Reference", S46_AGENTS_SECTION + "## Reference", 1)
with open("AGENTS.md", "w", encoding="utf-8") as f:
    f.write(agents)
print("OK: AGENTS.md (Session-46 contracts section inserted)")

# --- service-desk_SKILL.md ---
S46_SKILL_STATE = (" + the s46 env-contract pins (the .env.example ↔ codebase bidirectional coverage: every code-read env var documented, "
                   "every documented var live, the canonical DATABASE_URL literal — line-anchored)")
patch("service-desk_SKILL.md", [
    ("Distilled through the session-45 remediation (2026-10-13).", "Distilled through the session-46 remediation (2026-10-14)."),
    ("version: 2.43.0", "version: 2.44.0"),
    ("last_updated: 2026-10-13", "last_updated: 2026-10-14"),
    ("project_state: 235 unit tests", "project_state: 238 unit tests"),
    (f"include-hidden-files: true, the {MAIN} triggers, the bun.lock tsx entry — line-anchored);",
     f"include-hidden-files: true, the {MAIN} triggers, the bun.lock tsx entry — line-anchored);".replace(");", ";") + S46_SKILL_STATE + ");"),
])

S46_LESSON = (
    f"100. **An environment example is a contract surface, and its coverage is BIDIRECTIONAL — every code-read variable documented, every documented variable live; and bracket-prefixed literals read through a terminal are display-suspect even when they come from your OWN tool's output.** (Session 46.) AGENTS.md's \"`.env.example` documents every variable\" was held by manual re-verification alone for 45 sessions — zero tests referenced the file while the quickstart (`cp .env.example .env`) and every session closeout's \"re-verified, matches\" leaned on it. The measured contract: the code reads exactly three production env vars, `.env.example` documents exactly those three — a match held by convention, one PR away from a silently broken quickstart (the PAD known-issues row literally proposes wiring Resend/SendGrid someday). The pins close BOTH directions: code → example (a new env var fails until documented — the quickstart-breaks-silently class) and example → code (a stale documented var after a reverted feature fails — dead config misleads every operator who sets it), plus the canonical DATABASE_URL literal in its LINE-ANCHORED executable shape (the s45 hardening — a commented-out or corrupted literal fails; the commented PostgreSQL alternative never counts). NODE_ENV stays excluded by design: the framework injects it, no user sets it, and an environment EXAMPLE's job is user-facing configuration. **Generalized: (a) the config file the quickstart COPIES is as much a contract surface as the CI workflow — pin its coverage, not its comments; (b) the \"matches the codebase\" phrase is bidirectional by nature — one-directional coverage pins half the drift surface; (c) the s18 display-layer artifact fired an ELEVENTH time, on the session's OWN doc-patch authoring: the PAD/AGENTS/SKILL anchor strings read through tool output carried `the ain] triggers` where the files' actual bytes carry `the {MAIN} triggers` (the output layer eats the `[m` as an escape) — never copy a bracket-prefixed literal from displayed output into a patch; probe the actual bytes (char-code dumps) before anchoring on it.**\n"
)
with open("service-desk_SKILL.md", encoding="utf-8") as f:
    skill = f.read()
# Append lesson 100 after lesson 99 (the file's last numbered lesson)
idx = skill.find("99. **A CI workflow file is a contract surface")
if idx < 0:
    print("FATAL: SKILL lesson 99 not found")
    sys.exit(1)
# find the end of the lesson-99 line (it's a single long line)
eol = skill.find("\n", idx)
if eol < 0:
    print("FATAL: SKILL lesson 99 line end not found")
    sys.exit(1)
skill = skill[:eol+1] + S46_LESSON + skill[eol+1:]
with open("service-desk_SKILL.md", "w", encoding="utf-8") as f:
    f.write(skill)
print("OK: service-desk_SKILL.md (lesson 100 appended)")

print("Part 2 complete")
