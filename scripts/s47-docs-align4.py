#!/usr/bin/env python3
# S47: docs alignment part 4 — the SKILL.md v2.45.0 bump + lesson 101 + project_state.
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

patch("service-desk_SKILL.md", [
    ("Distilled through the session-46 remediation (2026-10-14).",
     "Distilled through the session-47 remediation (2026-10-14).", 1),
    ("version: 2.44.0", "version: 2.45.0", 1),
    ("project_state: 238 unit tests", "project_state: 245 unit tests", 1),
    ("the canonical DATABASE_URL literal — line-anchored));",
     "the canonical DATABASE_URL literal — line-anchored; + the s47 gitignore-contract pins (the secret-guard surface EXECUTABLE: check-ignore on .env / the credential patterns / the db binaries + the tracked-surface pin — git ls-files carries no secret-shaped path, the PAD §7.4 checklist automated + the inverse quickstart pin: .env.example tracked, never ignored) + the s47 docs-contract pins (DEPLOYMENT.md's claims — the fs-counted route-module figure (12) + the smoke '121 steps', the stale '16'/'30' closed)));", 1),
])

LESSON_101 = """
101. **Ignore rules are a contract surface, and the tracked surface is the layer they cannot guard — pin BOTH executable layers; and a docs surface without a drift watch drifts — pin the claim to the counted ground truth.** (Session 47.) The s46 session's own closing words named the candidate: "a dropped `.env` ignore line would let a future `git add .` commit the secret, currently guarded by convention + the operator's manual `git ls-files` habit" — 46 sessions of a correct `.gitignore` with ZERO tests referencing it. The two-layer doctrine: `git check-ignore` proves the RULE engine (a dropped, commented-out, or reordered rule fails it directly — the executable form makes the s45/s46 line-anchoring hardening inherent, not bolted on), while `git ls-files` proves the REPO STATE — the layer the rules cannot reach, because tracked files ignore ignore-rules (a historically-committed or force-added secret stays silent at the pattern layer forever). The mutation run taught the complementary-layers lesson live: the plain `git add -N s47-leak.key` was REFUSED by the `*.key` pattern — git's own guard fired first — while the force-added form bit only the tracked-surface pin; each layer catches what the other cannot. The inverse pin matters as much as the forward ones: `.env.example` must stay TRACKED and un-ignored, or every fresh clone's `cp .env.example .env` quickstart breaks silently (the s46 env-contract pins would only fire in CI, after the file is already gone from the checkout). The sibling doctrine from the same session: DEPLOYMENT.md claimed "16 API route handlers" and "30 E2E checks" for 41 sessions because nothing compared its figures to the codebase — the last major docs surface without a drift watch, drifted. The pin closes BOTH sides: the fs-counted ground truth (12 route modules — counted on the FILESYSTEM, what `next build` compiles, not git state: the mutation-F lesson, an untracked new route module must count) AND the doc's line-anchored claim, so a 13th route module forces the pair to move together. The doctrine: a doc claim is pinned when its figure and the counted reality are the SAME assertion — pin the number and the sentence that carries it.**
"""

with open("service-desk_SKILL.md", encoding="utf-8") as f:
    text = f.read()
if not text.endswith("\n"):
    text += "\n"
text += LESSON_101
with open("service-desk_SKILL.md", "w", encoding="utf-8") as f:
    f.write(text)
print("OK: service-desk_SKILL.md (lesson 101 appended)")

print("part 4 complete")
