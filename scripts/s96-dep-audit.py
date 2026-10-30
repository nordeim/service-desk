#!/usr/bin/env python3
"""s96 dependency-surface audit: every package.json dependency claimed vs measured usage.

Class being measured (the s96 axis candidate): an unused dependency is a false
claim surface in package.json — every entry claims the app needs it. Ground
truth = import/require/reference scans across src/, tests/, scripts/, prisma/,
config files (postcss.config.mjs, components.json, next.config.ts,
playwright.config.ts, vitest.config.ts, tsconfig.json, eslint.config.mjs) and
the CSS layer (src/app/globals.css @import lines).

Usage classes:
  src          — imported in production source (the load-bearing class)
  tooling      — referenced only by scripts/ or tests/ (dev-time)
  css          — referenced via globals.css @import (production, resolved by tailwind)
  config       — referenced by a config file (build-time tooling)
  unused       — referenced NOWHERE outside package.json
"""
import json
import re
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

pkg = json.loads((REPO / "package.json").read_text())
deps = pkg.get("dependencies", {})
devdeps = pkg.get("devDependencies", {})

# Search surface: everything except node_modules, docs, skills, .next, .git
SEARCH_DIRS = ["src", "tests", "scripts", "prisma", "public"]
CONFIG_FILES = [
    "postcss.config.mjs", "components.json", "next.config.ts",
    "playwright.config.ts", "vitest.config.ts", "tsconfig.json",
    "eslint.config.mjs", "package.json",
]

# Gather the searchable text corpus
corpus: list[tuple[str, str]] = []  # (label, text)
for d in SEARCH_DIRS:
    p = REPO / d
    if not p.exists():
        continue
    for f in p.rglob("*"):
        if f.is_file() and f.suffix in {".ts", ".tsx", ".mjs", ".js", ".cjs", ".css", ".scss", ".json", ".prisma", ".sh"}:
            try:
                corpus.append((str(f.relative_to(REPO)), f.read_text(errors="ignore")))
            except OSError:
                pass
for cf in CONFIG_FILES:
    p = REPO / cf
    if p.exists():
        corpus.append((cf, p.read_text(errors="ignore")))

def find_refs(name: str) -> list[str]:
    """Return labels of files whose text references the package (import-ish or config-ish)."""
    hits = []
    # import forms: from 'name', from "name", import 'name', require('name')
    pat_import = re.compile(
        r"""(?:from\s+|import\s+|require\(\s*['"]|import\(\s*['"])""" + re.escape(name) + r"""(?=['"`/])"""
    )
    # bare-name references (config files, css @import, plugin arrays)
    pat_bare = re.compile(r"""['"]""" + re.escape(name) + r"""['"]""")
    for label, text in corpus:
        if label == "package.json":
            continue  # the declaration itself is not usage
        if pat_import.search(text) or pat_bare.search(text):
            hits.append(label)
    return hits

print(f"dependencies: {len(deps)} entries, devDependencies: {len(devdeps)} entries\n")

unused = []
tooling_only = []
for name in sorted(deps):
    refs = find_refs(name)
    # classify
    src_refs = [r for r in refs if r.startswith("src/")]
    css_refs = [r for r in refs if r.endswith(".css")]
    script_refs = [r for r in refs if r.startswith("scripts/")]
    test_refs = [r for r in refs if r.startswith("tests/")]
    config_refs = [r for r in refs if not (src_refs or css_refs or script_refs or test_refs)]
    if src_refs or css_refs:
        cls = "src" if src_refs else "css"
        where = src_refs or css_refs
    elif test_refs:
        cls, where = "tooling", test_refs
    elif script_refs:
        cls, where = "tooling", script_refs
    elif config_refs:
        cls, where = "config", config_refs
    else:
        cls, where = "UNUSED", []
        unused.append(name)
    loc = ", ".join(where[:2]) if where else "—"
    print(f"  [{cls:<7}] {name:<28} {loc}")

print("\n=== UNUSED (declared, referenced nowhere) ===")
for name in unused:
    print(f"  {name}  (resolved: {json.loads(subprocess.run(['bun','pm','pkg',name],capture_output=True,text=True).stdout or '{}').get('version','?') if False else ''})")

print("\n=== TOOLING-ONLY (scripts/tests only, but sitting in dependencies) ===")
for name, refs in [(n, find_refs(n)) for n in sorted(deps)]:
    if not any(r.startswith(("src/",)) or r.endswith(".css") for r in refs):
        if any(r.startswith(("scripts/", "tests/")) for r in refs):
            tooling_only.append((name, refs))
for name, refs in tooling_only:
    print(f"  {name}: {refs[:3]}")
