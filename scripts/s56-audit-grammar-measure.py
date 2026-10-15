#!/usr/bin/env python3
"""S56 audit: measure the exact claim-grammar sizes + locations.
Grammar 1: persisted `scripts/X`  (persistence claims)
Grammar 2: `A..B` backticked hex ranges (push-range citations)
Grammar 3: `X` backticked bare hex 7-40 (commit citations) + ed25519 false-pos
"""
import re, os, glob, subprocess

REPO = "/home/z/my-project/service-desk"
os.chdir(REPO)

doc_files = sorted(glob.glob("docs/*.md")) + [
    "worklog.md", "AGENTS.md", "CLAUDE.md", "README.md",
    "service-desk_SKILL.md", "Project_Architecture_Document.md",
]
doc_files = [f for f in doc_files if os.path.isfile(f)]

g1 = re.compile(r"persisted `scripts/([a-z0-9._\-]+)`")
g2 = re.compile(r"`([0-9a-f]{7,40})\.\.([0-9a-f]{7,40})`")
g3 = re.compile(r"`([0-9a-f]{7,40})`")

def git_has(h):
    return subprocess.run(["git", "cat-file", "-e", h], capture_output=True).returncode == 0

print("=== G1: persisted `scripts/X` claims (file:line) ===")
for f in doc_files:
    for i, line in enumerate(open(f, encoding="utf-8"), 1):
        for m in g1.finditer(line):
            exists = os.path.exists(f"scripts/{m.group(1)}")
            print(f"  {f}:{i}  scripts/{m.group(1)}  fs-exists={exists}")

print("=== G2: backticked hex ranges ===")
for f in doc_files:
    for i, line in enumerate(open(f, encoding="utf-8"), 1):
        for m in g2.finditer(line):
            ok = git_has(m.group(1)) and git_has(m.group(2))
            print(f"  {f}:{i}  {m.group(1)}..{m.group(2)}  both-reachable={ok}")

print("=== G3: backticked bare hex (excluding pure-digit + ed25519) ===")
fails, total = [], 0
for f in doc_files:
    for i, line in enumerate(open(f, encoding="utf-8"), 1):
        for m in g3.finditer(line):
            h = m.group(1)
            if re.fullmatch(r"[0-9]+", h) or h == "ed25519":
                continue
            total += 1
            if not git_has(h):
                fails.append((f, i, h))
print(f"  total bare-hex claims: {total}, unreachable: {len(fails)}")
for f, i, h in fails:
    print(f"  DANGLING {h} at {f}:{i}")
