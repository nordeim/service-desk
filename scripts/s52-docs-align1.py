#!/usr/bin/env python3
"""S52 docs-align part 1 — AGENTS.md (the Session-52 contracts section + the
screenshots lineage) + CLAUDE.md (the s52 anti-pattern). Every replacement
count-verified EXACTLY-ONCE (the s48–s51 doctrine)."""
import sys

REPO = "/home/z/my-project/service-desk"

def apply(path, old, new, label):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    n = text.count(old)
    if n != 1:
        print(f"FATAL: {label}: expected exactly 1 occurrence, found {n} — ABORT (no write)")
        sys.exit(1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text.replace(old, new))
    print(f"OK   {label}")

# --- AGENTS.md: the NEW Session-52 contracts section (before "## Reference") ---
AGENTS_S52_SECTION = """## Session-52 contracts (pinned by `tests/docdate-contract.test.ts`; inventory in `docs/remediation-plan-session52.md`)

- **The doc-freshness date-claim closure (the own-side audit at a NEW level)**: four docs claim their own freshness — CLAUDE.md's frontmatter `last_updated`, the PAD's `**Last Updated:**` line, the SKILL's frontmatter `last_updated` + its description's "Distilled through the session-N remediation (DATE)." line, and AGENTS.md's "Verified against the toolchain on DATE." — and THREE of the four were STALE at the s52 audit (CLAUDE.md + the PAD claimed 2026-10-09 while `f9de02b` (2026-10-15 +0800) had just landed the s50/s51 counts + anti-patterns IN those files; the SKILL's description named "session-50" while its own frontmatter said 2.49.0 / 2026-10-15 and its last lesson was tagged (Session 51.)). The class survived 51 sessions because the DATE shape matches no pin family's form (corpus counts, §7.1 rows, quoted outputs, requirements enumerations) and the session checklist bumps the SKILL's frontmatter alone. Closed three-sided: the git-anchored staleness pin (each claimed date >= the doc's git last-commit date, the +0800 operator-timezone convention), the SKILL-internal ledger coherence pin (the description's session == the LAST lesson's tag + its date == the frontmatter), and the no-future-dating guard (every claimed date <= today).
- **The shallow-clone measurement doctrine (measured live before the pin was designed)**: in a depth-1 shallow clone — GitHub Actions' `actions/checkout@v4` DEFAULT — `git log -1 --format=%cI -- <file>` answers HEAD's date for EVERY file, even files HEAD did not touch. A git-anchored pin therefore either needs real history (the CI verify-job checkout now carries `fetch-depth: 0` — the s45 shape pins survive: they match executable YAML shapes, not line numbers) or must FAIL LOUDLY on shallow (the s18 doctrine: a pin that silently skips is a pin that does not exist). And the staleness pin is ONE-SIDED by design (claimed >= git): a session lands a dated doc hours before its commit's committer date is knowable — the enforcement point is CI, post-commit, where the git date is final (the same CI-is-the-gate-that-bites pattern as the s50 BRIDGE).
- **The 34th parity sweep: NO twenty-first /login wave** — the rolldown bundle byte-identical to the s50/s51 records (the entry `index-C-ulo5ek.js` 200/105055, the CSS `index-BIWjBcok.css` 200/904487, `logoutReturnPath-HjtsxsFd.js` hash-stable the 35th consecutive session, live 200 + still referenced; the old CSS `index-D0Q6-tUz.css` still 200 (900665) — the s51 edge-cache state persists, not back to its s50 404). Their three standing defects persist (34th re-verification: the 1328-vs-1280 desktop overflow, the 468-vs-375 mobile overflow, the s4 toast-viewport blocking — the real click REFUSED, `elementFromPoint` at the toggle's own rect (24,16,28,28) returns the `fixed top-0 z-[100]` toast-container div); ours the working superset (the mobile matrix byte-identical to the s41–s51 records: 375=375, the real click opens 0,0,288,667, Escape closes, the nav-tap auto-closes + navigates; the paired VLM LAYOUT-OK first attempt pre- AND post-remediation; the UI round-trip Prisma-verified).

## Reference
"""

apply(f"{REPO}/AGENTS.md",
      "## Reference\n",
      AGENTS_S52_SECTION,
      "AGENTS.md: the NEW Session-52 contracts section (before ## Reference)")

# --- AGENTS.md: the screenshots lineage s51 → s52 (the reference list) ---
apply(f"{REPO}/AGENTS.md",
      "refreshed by `scripts/capture-screenshots-s51.sh` (the s50 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s51 fixture title)",
      "refreshed by `scripts/capture-screenshots-s52.sh` (the s50/s51 lineage verbatim + the in-script server boot — the sandbox kills detached processes between tool calls, the s48 battery pattern; the s52 fixture title)",
      "AGENTS.md reference list: the screenshots lineage s51 → s52")

# --- CLAUDE.md: the s52 anti-pattern (appended after the s51 bullet) ---
apply(f"{REPO}/CLAUDE.md",
      "audit the docs' IMPERATIVE surfaces — requirements, prerequisites, promises of behavior — against the code the way corpus figures are audited against the run)**\n",
      "audit the docs' IMPERATIVE surfaces — requirements, prerequisites, promises of behavior — against the code the way corpus figures are audited against the run)**\n- **A `last_updated` field is a checkable claim, and its ground truth is the file's own content history (session 52: CLAUDE.md and the PAD claimed `2026-10-09` while the s50/s51 remediations had just edited them — the dates were born right at session 1 and drifted stale across 50+ sessions because the session checklist bumps the SKILL's frontmatter alone and NO pin family has the DATE shape; the SKILL's own description named \"session-50\" while its frontmatter said 2.49.0 + its last lesson was tagged (Session 51.). The closure is git-anchored: each claimed date >= the doc's git last-commit date (the +0800 operator-timezone convention — a UTC clock false-REDs the legitimate 2026-10-15 claim of a 2026-10-14-23:34-UTC commit, measured), the SKILL's two internal surfaces agree with each other, and no date claims freshness from the future. The measurement trap the design must survive: a depth-1 shallow clone (GitHub Actions' checkout DEFAULT) answers HEAD's date for EVERY file — the CI checkout carries `fetch-depth: 0` and the pin fails loudly on shallow rather than silently skipping. The doctrine: audit the docs' META surfaces — dates, versions, freshness signals — against the file's own history the way corpus figures are audited against the run; a freshness signal that does not move with the file is a stale claim no corpus family will ever catch)**\n",
      "CLAUDE.md: the s52 anti-pattern (the doc-freshness doctrine)")

print("\nS52 docs-align part 1 complete.")
