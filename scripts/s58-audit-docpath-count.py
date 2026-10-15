#!/usr/bin/env python3
"""S58 audit companion: the exact doc-path reference count for the pin floor.

Counts with the FOUR-entry exclusion set (the runtime-target + transient +
replaced-static forms) that a fresh clone must classify:
  db/custom.db, db/e2e.db, db/smoke.db, public/robots.txt
"""
import re
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")
CORE = ["AGENTS.md", "CLAUDE.md", "README.md", "Project_Architecture_Document.md",
        "service-desk_SKILL.md"]
EXCLUSIONS = {"db/custom.db", "db/e2e.db", "db/smoke.db", "public/robots.txt"}

PATH_RE = re.compile(r"`((?:src|tests|docs|prisma|scripts|db|public|skills)/[A-Za-z0-9_./-]+)`")

total = 0
excluded = 0
per_doc = {}
for doc in CORE:
    text = (R / doc).read_text()
    n = 0
    for m in PATH_RE.finditer(text):
        p = re.sub(r"[.,;:)]+$", "", m.group(1).rstrip("."))
        total += 1
        if p in EXCLUSIONS:
            excluded += 1
        else:
            n += 1
    per_doc[doc] = n
checked = total - excluded
print(f"total path-shaped matches: {total}")
print(f"excluded (the 4-entry set): {excluded}")
print(f"checked (resolving-or-dangling): {checked}")
for d, n in per_doc.items():
    print(f"  {d}: {n} checked")
# also verify every exclusion entry is genuinely cited (needed-ness)
print("\nneeded-ness of each exclusion (must remain > 0 citations):")
for e in sorted(EXCLUSIONS):
    n = sum(t.count(f"`{e}`") for t in ((R / d).read_text() for d in CORE))
    print(f"  {e}: {n} backticked citations across the five core docs")
