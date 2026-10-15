#!/usr/bin/env python3
"""S53 audit: sweep every backtick-quoted path-like token in the six docs,
verify existence against the fs. The PATH-shaped claim class (no pin family
sweeps it — s48 counts, s49 rows, s50 outputs, s51 requirements, s52 dates)."""
import re, os, sys

DOCS = ["AGENTS.md", "CLAUDE.md", "README.md", "Project_Architecture_Document.md",
        "service-desk_SKILL.md", "docs/DEPLOYMENT.md"]
PATH_RE = re.compile(r"`([a-zA-Z0-9_@()/.-]+(?:/[a-zA-Z0-9_@()/.-]+)*)`")

def is_pathlike(tok):
    if "/" in tok: return True
    return bool(re.match(r"^[a-zA-Z0-9_.-]+\.(tsx?|css|prisma|sh|md|mjs|cjs|js|json|png|txt|py|ts|yaml|yml|lock|webmanifest|example|gitkeep|db)$", tok))

missing = {}
total = 0
for doc in DOCS:
    with open(doc) as f:
        text = f.read()
    for m in PATH_RE.finditer(text):
        tok = m.group(1)
        if not is_pathlike(tok):
            continue
        if tok.startswith("http") or re.match(r"^[0-9]", tok):
            continue
        if tok.startswith("node:") or tok.startswith("bun:"):
            continue
        if "*" in tok:
            import glob as g
            total += 1
            if not g.glob(tok):
                missing.setdefault(doc, []).append(tok)
            continue
        if "." not in tok and "/" not in tok:
            continue
        total += 1
        if not os.path.exists(tok):
            missing.setdefault(doc, []).append(tok)

print(f"checked {total} path-like tokens across {len(DOCS)} docs")
for doc, toks in missing.items():
    uniq = sorted(set(toks))
    print(f"\n{doc}: {len(uniq)} MISSING")
    for t in uniq:
        print(f"  - {t}")
if not missing:
    print("ALL PATH CLAIMS EXIST")
