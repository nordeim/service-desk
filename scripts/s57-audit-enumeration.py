#!/usr/bin/env python3
"""S57: the enumeration-completeness recon — the numbered doc families held to
their index sequences (gaps, duplicates), + the s95 shortlist re-verification.

The s56 floors (plan corpus >= 55) guard MASS deletion; nothing asks whether the
NUMBERING is complete. Measure:
  1. remediation-plan-sessionN.md   N sequence
  2. sessionN.md (docs/)            N sequence (the odd/even convention)
  3. scripts/ sN-* battery          N sequence
  4. the s95 shortlist (the standing candidates, 10th consecutive)
"""
import re
import pathlib
import subprocess

DOCS = pathlib.Path("/home/z/my-project/service-desk/docs")
SCRIPTS = pathlib.Path("/home/z/my-project/service-desk/scripts")
ROOT = pathlib.Path("/home/z/my-project/service-desk")


def numbers(pat, folder):
    ns = []
    for f in folder.iterdir():
        m = re.match(pat, f.name)
        if m:
            ns.append(int(m.group(1)))
    return sorted(ns)


plans = numbers(r"remediation-plan-session(\d+)\.md", DOCS)
logs = numbers(r"session_(\d+)\.md", DOCS)
print(f"== plans: count={len(plans)} range={plans[0]}..{plans[-1]}" if plans else "no plans")
dupes = sorted({n for n in plans if plans.count(n) > 1})
gaps = [n for n in range(plans[0], plans[-1] + 1) if n not in plans]
print(f"   dupes={dupes} gaps={gaps}")

print(f"== session logs: count={len(logs)} range={logs[0]}..{logs[-1]}" if logs else "no logs")
dupes = sorted({n for n in logs if logs.count(n) > 1})
gaps = [n for n in range(logs[0], logs[-1] + 1) if n not in logs]
print(f"   dupes={dupes} gaps={gaps}")

# scripts: sN-prefixed families (the battery lineage)
sn = set()
for f in SCRIPTS.iterdir():
    m = re.match(r"s(\d+)-", f.name)
    if m:
        sn.add(int(m.group(1)))
sn = sorted(sn)
print(f"== scripts sN-*: count={len(sn)} range={sn[0]}..{sn[-1]}")
gaps = [n for n in range(sn[0], sn[-1] + 1) if n not in sn]
print(f"   gaps={gaps}")

# the s95 shortlist (10th consecutive): CLAUDE majors / rate limits / schema lines / versions
print("== s95 shortlist ==")
claude = (ROOT / "CLAUDE.md").read_text()
for claim, pat in [("Next 16", r"Next\.?js 16|Next 16"), ("React 19", r"React 19"), ("TS 5", r"TypeScript 5"), ("Tailwind 4", r"Tailwind (CSS )?v?4"), ("Prisma 6", r"Prisma 6")]:
    print(f"   CLAUDE {claim}: {'present' if re.search(pat, claude) else 'MISSING'}")
pkg = subprocess.run(["bun", "pm", "ls", "--depth", "0"], cwd=ROOT, capture_output=True, text=True).stdout
print("   installed next:", [l for l in pkg.splitlines() if " next@" in l or l.startswith("next@")][:1])
print("   installed prisma:", [l for l in pkg.splitlines() if "prisma" in l][:1])
schema = (ROOT / "prisma" / "schema.prisma").read_text().splitlines()
print(f"   schema.prisma lines: {len(schema)} (claim: 73)")
auth = (ROOT / "src" / "lib" / "auth.ts").read_text()
print("   rate-limit 10 default:", "10" in auth and "rateLimit" in auth)
print("   vitest/playwright devDeps:", [l for l in (ROOT / "package.json").read_text().splitlines() if "vitest" in l or "playwright" in l])
