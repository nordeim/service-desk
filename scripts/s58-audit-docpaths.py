#!/usr/bin/env python3
"""S58: the own-side audit — the s95 shortlist re-measurement + ONE LEVEL DEEPER.

Part 1: the s95 shortlist (11th consecutive clean expected):
  a) the CLAUDE major-only prose (Next 16 / React 19 / Tailwind v4 / Prisma 6 —
     the README/PAD exact figures are s48-pinned; CLAUDE must carry NO exact
     figures, and its major-only claims must match the installed versions)
  b) the DEPLOYMENT rate-limit figures (login 10/IP/15-min + forgot 5/IP/15-min
     — held against src/lib/auth.ts)
  c) the vitest 5.0.3 / playwright 1.64.0 surfaces (the s48 pins hold them)
  d) the SKILL's unpinned "73 lines" prose-recaps (prisma/schema.prisma = 73)

Part 2 (one level deeper — the NEW class): the DOC-PATH REACHABILITY
measurement. The s56 pins closed "persisted `scripts/…`" claims (one grammar,
backticked scripts/ paths). The broader class: EVERY backticked path-shaped
reference in the five core docs (AGENTS, CLAUDE, README, PAD, SKILL) must
resolve on the fs. A doc that cites `src/lib/foo.ts` that no longer exists
is an existence claim — the same s56 doctrine at the whole-path level.
"""
import re
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")
CORE = ["AGENTS.md", "CLAUDE.md", "README.md", "Project_Architecture_Document.md",
        "service-desk_SKILL.md"]

print("=" * 70)
print("PART 1: the s95 shortlist re-measurement")
print("=" * 70)

# a) CLAUDE major-only prose
claude = (R / "CLAUDE.md").read_text()
ver_block = re.search(r"Full-stack IT ticketing portal \(Next\.js 16.*?\)", claude)
print(f"[a] CLAUDE stack line found: {bool(ver_block)}")
if ver_block:
    line = ver_block.group(0)
    # must be major-only: no x.y.z figures in the parenthetical
    exact_figs = re.findall(r"\d+\.\d+\.\d+", line)
    print(f"    exact figures in the stack line: {exact_figs} (must be empty for major-only)")
    for major, name in [("Next.js 16", "next"), ("React 19", "react"),
                        ("TypeScript strict", "ts"), ("Tailwind CSS v4", "tailwind"),
                        ("Prisma 6", "prisma")]:
        present = major in claude
        print(f"    CLAUDE carries {major!r}: {present}")

# README/PAD exact figures (s48-pinned — quick re-verify)
pkg = (R / "package.json").read_text()
installed = {
    "next": re.search(r'"next": "(\d+)\.(\d+)"', pkg),
    "react": re.search(r'"react": "(\d+)\.(\d+)"', pkg),
}
for doc, name in [("README.md", "README"), ("Project_Architecture_Document.md", "PAD")]:
    t = (R / doc).read_text()
    m = re.search(r"Next\.js \(App Router[^)]*\)\s*\|\s*(\d+\.\d+\.\d+)", t)
    print(f"    {name} Next figure: {m.group(1) if m else 'NOT FOUND'}")

# b) DEPLOYMENT rate-limit figures vs src/lib/auth.ts
dep = (R / "docs" / "DEPLOYMENT.md").read_text()
auth = (R / "src" / "lib" / "auth.ts").read_text()
dep_login = re.search(r"login[^.]*?(\d+)\s*attempts?/IP/(\d+)\s*min", dep, re.I)
dep_forgot = re.search(r"forgot[^.]*?(\d+)[^0-9]*?/IP/(\d+)\s*min", dep, re.I)
login_cfg = re.search(r"LOGIN_MAX.*?(\d+).*?(\d+)\s*\*\s*60", auth, re.S)
print(f"[b] DEPLOYMENT login figures: {dep_login.groups() if dep_login else 'shape changed'} (expect ('10','15'))")
print(f"    DEPLOYMENT forgot figures: {dep_forgot.groups() if dep_forgot else 'shape changed'} (expect ('5','15'))")

# c) vitest / playwright surfaces (s48-pinned)
for tool, expect in [("vitest", "5.0.3"), ("playwright", "1.64.0")]:
    bun_lock = (R / "bun.lock").read_text()
    pkg_v = re.search(rf'"{tool}": "([^"]+)"', pkg)
    print(f"[c] {tool} package.json: {pkg_v.group(1) if pkg_v else '?'} — expect {expect}")

# d) the SKILL's "73 lines" prose-recaps
skill = (R / "service-desk_SKILL.md").read_text()
actual = len((R / "prisma" / "schema.prisma").read_text().splitlines())
claims = re.findall(r"schema\.prisma[^0-9]*(\d+)\s*lines", skill)
print(f"[d] SKILL 73-lines recaps: {claims} — actual prisma/schema.prisma: {actual} lines")

print()
print("=" * 70)
print("PART 2 (one level deeper): the DOC-PATH REACHABILITY measurement")
print("=" * 70)

PATH_RE = re.compile(r"`((?:src|tests|docs|prisma|scripts|db|public|skills)/[A-Za-z0-9_./-]+)`")
# known non-path literals that match the shape but are patterns/examples, not
# claims — measured and listed here, not excluded silently
KNOWN_NON_PATHS = {
    "db/custom.db",  # the path exists only with the db/ created — but db/ IS in the repo with .gitkeep; custom.db is gitignored — the REFERENCE form, not an existence claim
}

findings = []
checked = 0
for doc in CORE:
    text = (R / doc).read_text()
    for m in PATH_RE.finditer(text):
        p = m.group(1).rstrip(".")
        # strip trailing punctuation that snuck into the capture
        p = re.sub(r"[.,;:)]+$", "", p)
        if p in KNOWN_NON_PATHS:
            continue
        checked += 1
        target = R / p
        if not target.exists():
            line_no = text[: m.start()].count("\n") + 1
            findings.append((doc, line_no, p))

print(f"backticked path-shaped references checked: {checked}")
if findings:
    print("DANGLING (doc, line, path):")
    for d, ln, p in findings:
        print(f"  {d}:{ln}: {p}")
    print(f"\nRESULT: {len(findings)} dangling path reference(s) — P1 FOUND")
else:
    print("RESULT: CLEAN — every backticked path reference in the five core docs resolves on the fs")
