#!/usr/bin/env python3
"""S56 audit recon: the dangling-reference sweep.
Extract existence claims from the doc corpus (commit hashes, repo-relative
file paths) and verify each against git history / the fs.
Scope: docs/*.md (excluding skills/), worklog.md, AGENTS.md, CLAUDE.md,
README.md, service-desk_SKILL.md, Project_Architecture_Document.md.
"""
import re, subprocess, os, sys, glob

REPO = "/home/z/my-project/service-desk"
os.chdir(REPO)

doc_files = sorted(glob.glob("docs/*.md")) + [
    "worklog.md", "AGENTS.md", "CLAUDE.md", "README.md",
    "service-desk_SKILL.md", "Project_Architecture_Document.md",
]
doc_files = [f for f in doc_files if os.path.isfile(f)]

full_hash_re = re.compile(r"\b([0-9a-f]{40})\b")
short_hash_re = re.compile(r"(?<![0-9a-f])\b([0-9a-f]{7})\b(?![0-9a-f])")
# repo-relative path shapes actually used in the corpus
path_res = [
    re.compile(r"`(docs/[A-Za-z0-9._\-/]+\.(?:md|py|sh|ts|mjs|png|json))`"),
    re.compile(r"`(scripts/[A-Za-z0-9._\-/]+\.(?:py|sh|ts|mjs))`"),
    re.compile(r"`(src/[A-Za-z0-9._\-/]+\.(?:tsx?|css))`"),
    re.compile(r"`(tests/[A-Za-z0-9._\-/]+\.(?:tsx?|ts))`"),
    re.compile(r"`(prisma/[A-Za-z0-9._\-/]+\.(?:prisma|ts))`"),
]

hash_failures, path_failures = [], []
hash_count = path_count = 0

def git_has(h):
    r = subprocess.run(["git", "cat-file", "-e", h], capture_output=True)
    return r.returncode == 0

for f in doc_files:
    text = open(f, encoding="utf-8").read()
    # hashes
    hashes = set(full_hash_re.findall(text)) | set(short_hash_re.findall(text))
    for h in hashes:
        # skip things that are clearly not commit hashes (e.g. pure numbers, css hex colors)
        if re.fullmatch(r"[0-9]+", h):
            continue
        hash_count += 1
        if not git_has(h):
            hash_failures.append((f, h))
    # paths
    for rx in path_res:
        for p in set(rx.findall(text)):
            path_count += 1
            if not os.path.exists(p):
                path_failures.append((f, p))

print(f"docs swept: {len(doc_files)}")
print(f"commit-hash claims verified: {hash_count}  FAILURES: {len(hash_failures)}")
for f, h in hash_failures:
    print(f"  DANGLING HASH {h} in {f}")
print(f"file-path claims verified: {path_count}  FAILURES: {len(path_failures)}")
for f, p in path_failures:
    print(f"  DANGLING PATH {p} in {f}")
