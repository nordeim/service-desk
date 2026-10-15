#!/usr/bin/env python3
"""S53: the doc-fixes script (the GREEN — every replacement count-verified
exactly-once, the s52 doctrine). Lands:
  1. the PAD §11 exact conversion (17 ~figures -> exact + the tilde dropped)
     + the NEW prisma/seed-data.ts row (174 lines, after the seed.ts row)
  2. the SKILL L56 compound-claim fix (~170/11 -> 232/20)
  3. the corpus move 260 -> 263 (9 family sites + the quickstart line 28/263
     + the corpus pin's toBe literal + lineage comment + the BRIDGE ternary)
  4. the PAD §7.1 NEW row (tests/pad-keyfiles-contract.test.ts, 3 tests,
     Vitest — after the s52 docdate row, the session-ordered convention)
"""
import sys

REPO = "/home/z/my-project/service-desk"

def apply(content, old, new, expect_count=1, label=""):
    n = content.count(old)
    if n != expect_count:
        print(f"FATAL: {label!r} expected {expect_count} occurrence(s), found {n}")
        sys.exit(1)
    print(f"OK   {label}")
    return content.replace(old, new)

def read(p):
    with open(f"{REPO}/{p}") as f:
        return f.read()

def write(p, content):
    with open(f"{REPO}/{p}", "w") as f:
        f.write(content)

# ---------- 1. the PAD §11 exact conversion + the seed-data row ----------
PAD = read("Project_Architecture_Document.md")

ROWS = [
    ("src/lib/auth.ts", "~170", "232"),
    ("src/lib/db-path.ts", "~107", "107"),
    ("src/lib/constants.ts", "~95", "250"),
    ("src/lib/validation.ts", "~120", "437"),
    ("src/components/ui/sidebar.tsx", "~700", "696"),
    ("src/components/app-sidebar.tsx", "~200", "231"),
    ("src/components/app-sidebar-chrome.tsx", "~50", "51"),
    ("src/components/ticket-bits.tsx", "~140", "198"),
    ("src/app/(app)/layout.tsx", "~22", "36"),
    ("src/app/(app)/dashboard/page.tsx", "~230", "277"),
    ("src/app/api/tickets/route.ts", "~120", "254"),
    ("src/app/globals.css", "~130", "336"),
    ("prisma/schema.prisma", "~75", "73"),
    ("prisma/seed.ts", "~180", "83"),
    ("tests/e2e/mobile-navigation.spec.ts", "~135", "132"),
    ("playwright.config.ts", "~55", "68"),
    ("next.config.ts", "~40", "82"),
]
for path, stale, exact in ROWS:
    PAD = apply(PAD, f"| `{path}` | {stale} |", f"| `{path}` | {exact} |",
                label=f"§11 {path} {stale} -> {exact}")

# the §11 header comment: the table now carries exact figures (the s53 doctrine)
PAD = apply(PAD,
    "## 11. Key Files Reference\n\n| File | Lines | Purpose |",
    "## 11. Key Files Reference\n\n> Lines are EXACT fs counts (newline-character counting, `wc -l` semantics), pinned by `tests/pad-keyfiles-contract.test.ts`: a size figure is a checkable claim whose ground truth is one `wc -l` (the s53 size-claim closure — the `~` hedges that drifted 3.6x stale for 44 sessions are gone). Bump the row when the file changes.\n\n| File | Lines | Purpose |",
    label="§11 the exact-count doctrine note (blockquote above the table)")

# the NEW seed-data row (after the seed.ts row)
PAD = apply(PAD,
    "| `prisma/seed.ts` | 83 | Idempotent demo corpus |",
    "| `prisma/seed.ts` | 83 | Idempotent demo corpus |\n| `prisma/seed-data.ts` | 174 | The canonical seed corpus DATA (the side-effect-free extraction `prisma/seed.ts` imports + the s43 seed-corpus pins pin — the 4/11/3 fixture under the E2E suite; born s43, absent from this table 10 sessions until the s53 key-coverage pin) |",
    label="§11 the NEW prisma/seed-data.ts row (174)")

# ---------- 4. the PAD §7.1 NEW row (before the corpus-move sites: the row
# carries the 3-test figure the §7.4 checklist + the corpus family will name) ----------
PAD = apply(PAD,
    "| Unit — the s52 doc-freshness-contract pins (the four dated docs' freshness claims held to their git last-commit dates (the +0800 operator-timezone convention) + the SKILL-internal ledger coherence (the description's session == the last lesson's tag, its date == the frontmatter) + the no-future-dating guard — the stale '2026-10-09' claims and the session-50 description can never return) | 1 | 3 | `tests/docdate-contract.test.ts` | Vitest |",
    "| Unit — the s52 doc-freshness-contract pins (the four dated docs' freshness claims held to their git last-commit dates (the +0800 operator-timezone convention) + the SKILL-internal ledger coherence (the description's session == the last lesson's tag, its date == the frontmatter) + the no-future-dating guard — the stale '2026-10-09' claims and the session-50 description can never return) | 1 | 3 | `tests/docdate-contract.test.ts` | Vitest |\n| Unit — the s53 size-claim pins (the PAD §11 Key Files Reference's figures held EXACT to the fs line counts — the `~` hedges that drifted 3.6x stale for 44 sessions closed; the grammar rejects the tilde form; the row floor 18 + the prisma/seed-data.ts key-coverage; + the SKILL's backticked-path size claims + the auth compound claim's test figure chained to this table's runtime-pinned auth row) | 1 | 3 | `tests/pad-keyfiles-contract.test.ts` | Vitest |",
    label="§7.1 the NEW s53 keyfiles row (3 tests)")

# the §7.4 checklist 260/257 -> 263/260
PAD = apply(PAD, "- [ ] `bun run test` — 260/257", "- [ ] `bun run test` — 263/260",
            label="§7.4 checklist 260/257 -> 263/260")

write("Project_Architecture_Document.md", PAD)

# ---------- 2. the SKILL compound-claim fix ----------
SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL,
    "`src/lib/auth.ts` (~170 auditable lines, 11 unit tests)",
    "`src/lib/auth.ts` (232 auditable lines, 20 unit tests)",
    label="SKILL the auth compound claim ~170/11 -> 232/20")
write("service-desk_SKILL.md", SKILL)

# ---------- 3a. the corpus move 260 -> 263 (the 6 doc sites) ----------
README = read("README.md")
README = apply(README, "tests-260%20unit", "tests-263%20unit", label="README badge 260 -> 263")
README = apply(README, "260 Vitest unit tests", "263 Vitest unit tests", label="README verification 260 -> 263")
README = apply(README, "260 unit + 198 E2E tests", "263 unit + 198 E2E tests", label="README pyramid 260 -> 263")
README = apply(README, "Vitest unit: 260 tests", "Vitest unit: 263 tests", label="README commands 260 -> 263")
README = apply(README, "27 files / 260 tests passed", "28 files / 263 tests passed", label="README quickstart 27/260 -> 28/263")
write("README.md", README)

AGENTS = read("AGENTS.md")
AGENTS = apply(AGENTS, "unit suite (260 tests", "unit suite (263 tests", label="AGENTS commands 260 -> 263")
write("AGENTS.md", AGENTS)

CLAUDE = read("CLAUDE.md")
CLAUDE = apply(CLAUDE, "260 unit / 198 E2E (needs", "263 unit / 198 E2E (needs", label="CLAUDE commands 260 -> 263")
write("CLAUDE.md", CLAUDE)

SKILL = read("service-desk_SKILL.md")
SKILL = apply(SKILL, "project_state: 260 unit", "project_state: 263 unit", label="SKILL project_state 260 -> 263")
SKILL = apply(SKILL, "Vitest — 260 unit tests", "Vitest — 263 unit tests", label="SKILL appendix 260 -> 263")
write("service-desk_SKILL.md", SKILL)

# ---------- 3b. the corpus pin literal + lineage comment + BRIDGE ternary ----------
CORPUS = read("tests/corpus-count-contract.test.ts")
CORPUS = apply(CORPUS,
    """    // The current canonical (runtime-verified every session's gate): 260
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3. A
    // suite change without the doc move fails the consistency check above; a
    // doc move without the suite change fails the gate itself.
    expect(Number(n)).toBe(260);""",
    """    // The current canonical (runtime-verified every session's gate): 263
    // after the s48 6 pins + the s49 3 pad-testcount pins + the s50 quickstart
    // BRIDGE pin + the s51 prerequisites pins 2 + the s52 docdate pins 3 +
    // the s53 keyfiles pins 3. A suite change without the doc move fails the
    // consistency check above; a doc move without the suite change fails the
    // gate itself.
    expect(Number(n)).toBe(263);""",
    label="corpus pin toBe(260) -> toBe(263) + lineage")
CORPUS = apply(CORPUS,
    'listing.length === 27 ? "src 4 + tests 23"',
    'listing.length === 28 ? "src 4 + tests 24"',
    label="BRIDGE ternary 27/23 -> 28/24")
write("tests/corpus-count-contract.test.ts", CORPUS)

print("\nALL S53 DOC FIXES LANDED (each exactly-once)")
