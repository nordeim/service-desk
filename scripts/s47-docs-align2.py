#!/usr/bin/env python3
# S47: docs alignment part 2 — the AGENTS Session-47 contracts section, the CLAUDE anti-pattern,
# the PAD rows, the SKILL.md v2.45.0 bump + lesson 101. (Bracket-free anchors only.)
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

S47_SECTION = """## Session-47 contracts (pinned by `tests/gitignore-contract.test.ts` + `tests/docs-contract.test.ts`; inventory in `docs/remediation-plan-session47.md`)

- **The .gitignore hygiene closure (the secret-guard surface, pinned EXECUTABLE)**: the s46 session's own closing candidate — "a dropped `.env` ignore line would let a future `git add .` commit the secret, currently guarded by convention + the operator's manual `git ls-files` habit." Zero tests referenced `.gitignore` before s47. The pins (5, all shell-outs, cwd pinned to the repo root): the secret-file pin (`git check-ignore .env` exits 0 — the AUTH_SECRET carrier), the credential-pattern pin (`*.key`/`*.pem`/`ssh-key.txt` — the SSH-wrapper push surfaces), the DB-binary pin (`db/*.db` + the journal — the fresh-clone story), the tracked-surface pin (`git ls-files` matches no secret-shaped path — the PAD §7.4 pre-commit checklist AUTOMATED; the guard check-ignore cannot provide, because tracked files ignore ignore-rules), and the inverse pin (`.env.example` tracked AND not check-ignored — the quickstart's `cp .env.example .env` source stays in every fresh clone). The executable form needs no line-anchoring hardening: check-ignore consults the rule engine, so a dropped, commented-out, or reordered rule fails it directly. Mutation-verified 4 ways (A: the dropped `.env` line bit pin 1; B: the dropped `*.key` line bit pin 2; C: the force-staged `s47-leak.key` bit pin 4 — the plain `git add` was REFUSED by the pattern first, the complementary-layers lesson; D: the index-removed `.env.example` bit pin 5).
- **The DEPLOYMENT.md claims closure (the docs surface that never had a drift watch)**: the operator-facing deployment guide carried two stale figures for 41 sessions — "the 16 API route handlers" (the actual: 12 route modules, the 11 known routes + the s33 catch-all, fs-counted) and "30 E2E checks" for the smoke script (the canonical: 121 steps). Both fixed + pinned in `tests/docs-contract.test.ts` (2 pins): the route-module claim pin (fs count 12 AND the doc's line-anchored "12 API route modules" claim — a 13th route module forces the doc + pin to move together; the count walks the FILESYSTEM, what `next build` compiles, not git state — the mutation-F lesson: an untracked route file must count), the smoke-claim pin (the doc's "121 steps" — consistent with the README/AGENTS/PAD/SKILL corpus). Mutation-verified 2 ways (E: the doc regression 12→16 bit the doc-side assertion; F: the 13th route module bit the count — after the fs-count hardening, the s45 live-pin-lesson class firing on the pin's own blind spot).
- **NO seventeenth /login wave (the 29th sweep's F1)**: all three chunks byte-size-identical to the s46 records — the entry `index-CneaUv24.js` (104739), the contract carrier `UserAppMain-DOZft9ba.js` (58761), the login CSS `index-D0Q6-tUz.css` (900665), `logoutReturnPath-HjtsxsFd.js` hash-stable (30th consecutive session). The login-contract string counts re-measured fresh: `from_url` ×14, "Forgot password" ×1, "Need an account" ×1, "Password" ×39 — all identical. The third quiet session in five. NON-GAP.

"""

patch("AGENTS.md", [
    ("\n## Reference\n", "\n" + S47_SECTION + "## Reference\n", 1),
])

# --- CLAUDE.md: the s47 anti-pattern appended to the anti-patterns tail ---
CLAUDE_S47 = "- **Ignore rules are a contract surface, and the tracked surface is the layer they cannot guard (session 47: `.env` was ignored — correctly — for 46 sessions while ZERO tests referenced `.gitignore`; the guard was the PAD §7.4 checklist run manually \"before doc-heavy commits.\" The drift scenario the convention could not see: tracked files IGNORE ignore-rules, so a historically-committed or force-added secret stays silent at the pattern layer forever; and a dropped `.env` line makes the next `git add .` leak AUTH_SECRET with no alarm. The closure pins BOTH layers EXECUTABLE: `git check-ignore <path>` (the rule engine — a commented-out, reordered, or deleted rule fails it directly, so the s45/s46 line-anchoring concern is inherent, not bolted on) and `git ls-files` (the repo state — the PAD checklist automated). The inverse pin matters as much as the forward ones: `.env.example` must stay TRACKED and un-ignored, or every fresh clone's quickstart breaks silently. The sibling doctrine from the same session: a docs surface without a drift watch drifts — DEPLOYMENT.md claimed \"16 API route handlers\" and \"30 E2E checks\" for 41 sessions because nothing compared its figures to the codebase; the pin closes both sides (the fs-counted ground truth AND the doc's line-anchored claim), so a 13th route module forces the pair to move together).**\n"

with open("CLAUDE.md", encoding="utf-8") as f:
    text = f.read()
if not text.endswith("\n"):
    text += "\n"
text += CLAUDE_S47
with open("CLAUDE.md", "w", encoding="utf-8") as f:
    f.write(text)
print("OK: CLAUDE.md (anti-pattern appended)")

print("part 2 complete")
