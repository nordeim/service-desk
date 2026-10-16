#!/usr/bin/env python3
"""The standing commands-surface checker (the s64 execution-surface doc-truth
contract).

The repo's execution surface is documented in FOUR places: package.json (the
ground truth — the scripts dict), the AGENTS `## Commands` table (the canonical
documentation — the FIRST table every agent and contributor reads), the five
core docs' `bun run <x>` citations (AGENTS/CLAUDE/README/PAD/SKILL), and the
CI workflow's own `bun run <x>` invocations. Before s64 the surface was pinned
nowhere in EITHER direction:

  - the live drift (measured at s64): package.json carried 13 scripts, the
    AGENTS table documented 10 — db:generate (invoked by the CI workflow's
    own "Generate Prisma client" step in BOTH jobs), db:migrate, and
    test:watch were cited in ZERO of the five core docs;
  - the class (the s48 drift-watch doctrine): a RENAMED script leaves every
    doc citation stale with no gate failing, and a NEW script ships
    undocumented — exactly the live drift, standing since the scripts landed.

The invariants (each direction):
  1. documented-complete: every package.json script appears in the AGENTS
     `## Commands` table (the `bun run <x>` cell form or the bare `<x>`
     combined-cell form) — the undocumented list must be empty;
  2. citation-fresh: every `bun run <x>` citation across the five core docs
     AND the CI workflow resolves to a real package.json script — the stale
     list must be empty (each offender named with file + line);
  3. the vacuous-pass floors (the s56 mapDeps lesson): >= 13 scripts,
     >= 10 documented, >= 5 docs each carrying >= 1 citation, >= 6 workflow
     invocations — a neutered parse fails loudly.

Usage:
  python3 scripts/check-commands.py            # human summary (exit 1 on offenders)
  python3 scripts/check-commands.py --check    # CI/pin form: exit 0/1 + the report
  python3 scripts/check-commands.py --check --json   # machine-readable only
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

PACKAGE_JSON = ROOT / "package.json"
AGENTS_MD = ROOT / "AGENTS.md"
WORKFLOW = ROOT / ".github" / "workflows" / "ci.yml"

# The five core docs (the s48 corpus-count family's doc set).
CORE_DOCS = [
    "AGENTS.md",
    "CLAUDE.md",
    "README.md",
    "Project_Architecture_Document.md",
    "service-desk_SKILL.md",
]

# The vacuous-pass floors — the measured corpus at s64 (13 scripts, 13
# documented after the fix, 5 citing docs, 7 workflow invocations).
SCRIPT_FLOOR = 13
DOCUMENTED_FLOOR = 10
DOCS_CITING_FLOOR = 5
WORKFLOW_FLOOR = 6

# The citation grammar: `bun run <script>` — script names are lowercase with
# digits/colons/dashes/hyphens (test:e2e carries a digit; the s64 measurement
# lesson: a char class without digits truncates test:e2e to test:e).
CITATION_RE = re.compile(r"bun run ([a-z0-9][a-z0-9:_-]*)")

# A bare backticked token in the AGENTS table counts as documentation only
# when it names a REAL script (the `db:seed` combined-cell form; tokens like
# `dev.log` or `tsc --noEmit` are prose, never scripts).
BARE_TOKEN_RE = re.compile(r"`([^`\n]+)`")


def load_scripts():
    pkg = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    scripts = pkg.get("scripts", {})
    if not isinstance(scripts, dict):
        raise SystemExit("package.json scripts is not a dict — malformed")
    return sorted(scripts.keys())


def agents_commands_section():
    text = AGENTS_MD.read_text(encoding="utf-8")
    start = text.index("## Commands")
    rest = text[start:]
    nxt = rest.find("\n## ", 1)
    return rest if nxt == -1 else rest[:nxt]


def documented_in_table(scripts):
    """The scripts named in the AGENTS ## Commands table — either the
    `bun run <x>` cell form or the bare `<x>` combined-cell form."""
    section = agents_commands_section()
    found = set()
    for token in BARE_TOKEN_RE.findall(section):
        token = token.strip()
        if token.startswith("bun run "):
            name = token[len("bun run "):].strip()
            # `bun run lint typecheck test build` (the clean-check line)
            # names the FIRST word as the script; only exact matches count.
            if name in scripts:
                found.add(name)
        elif token in scripts:
            found.add(token)
    return sorted(found)


def collect_citations(path, scripts):
    """Every `bun run <x>` citation in a file — the resolved + the stale
    (each stale offender named with file + line)."""
    stale = []
    count = 0
    lines = path.read_text(encoding="utf-8").splitlines()
    for i, line in enumerate(lines, 1):
        for m in CITATION_RE.finditer(line):
            count += 1
            if m.group(1) not in scripts:
                stale.append({"file": str(path.relative_to(ROOT)), "line": i, "command": m.group(1)})
    return count, stale


def main() -> int:
    args = set(sys.argv[1:])
    machine = "--json" in args
    check = "--check" in args or machine

    scripts = load_scripts()
    documented = documented_in_table(set(scripts))
    undocumented = sorted(set(scripts) - set(documented))

    doc_counts = {}
    stale = []
    for name in CORE_DOCS:
        p = ROOT / name
        n, s = collect_citations(p, set(scripts))
        doc_counts[name] = n
        stale.extend(s)
    docs_citing = sum(1 for n in doc_counts.values() if n > 0)

    wf_count, wf_stale = collect_citations(WORKFLOW, set(scripts))
    stale.extend(wf_stale)
    workflow_commands = sorted(set(CITATION_RE.findall(WORKFLOW.read_text(encoding="utf-8"))))

    floors = {
        "scripts": len(scripts) >= SCRIPT_FLOOR,
        "documented": len(documented) >= DOCUMENTED_FLOOR,
        "docs_citing": docs_citing >= DOCS_CITING_FLOOR,
        "workflow": wf_count >= WORKFLOW_FLOOR,
    }

    offenders = []
    if undocumented:
        offenders.append(
            "undocumented scripts (package.json carries them; the AGENTS ## Commands "
            f"table does not): {', '.join(undocumented)}"
        )
    if stale:
        offenders.append(
            "stale bun-run citations (no such package.json script): "
            + "; ".join(f"{s['file']} line {s['line']}: `bun run {s['command']}`" for s in stale)
        )
    for label, ok_flag in floors.items():
        if not ok_flag:
            offenders.append(f"the {label} floor failed (a neutered parse or a corpus change — see the floors block)")

    report = {
        "ok": not offenders,
        "script_count": len(scripts),
        "scripts": scripts,
        "documented": documented,
        "documented_count": len(documented),
        "undocumented": undocumented,
        "doc_citations": doc_counts,
        "docs_citing": docs_citing,
        "stale_citations": stale,
        "workflow_commands": workflow_commands,
        "workflow_invocations": wf_count,
        "floors": floors,
        "offenders": offenders,
    }

    if machine:
        print(json.dumps(report, indent=2))
    else:
        print(f"scripts: {len(scripts)} — {', '.join(scripts)}")
        print(f"documented in the AGENTS table: {len(documented)} — {', '.join(documented)}")
        print(f"undocumented: {', '.join(undocumented) if undocumented else '(none)'}")
        print(f"doc citations: {doc_counts} ({docs_citing} docs citing)")
        print(f"workflow invocations: {wf_count} — {', '.join(workflow_commands)}")
        print(f"stale citations: {len(stale)}")
        if offenders:
            print("OFFENDERS:")
            for o in offenders:
                print(f"  - {o}")
        else:
            print("OK: the commands surface is complete and fresh both directions")

    if check and offenders:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
