#!/usr/bin/env python3
"""The standing undefined-name checker (the s60 scripts-integrity contract).

Every committed scripts/*.py file must pass the static AST-based scan: a
loaded name must be defined SOMEWHERE in its own file — an assignment, a
def/class, an import, a parameter, an exception-handler bind, a global/nonlocal
declaration — or be a builtin / dunder. A name loaded but defined nowhere is
the s56_b class: the make-battery generators derive each session's scripts
from the prior session's copies via .replace() on their OWN session-pair
vocabulary, and any older leftover name survives every generation untouched
(the live event: scripts/s58-wave-analysis.py:24 + scripts/s59-wave-analysis.py:24
both carried `s56_b` for two generations — the scripts crashed with NameError
the moment their /tmp inputs existed; measured by scripts/s60-audit-undefined-names.py).

The honest boundary (documented, shared with the pin): the check collects ALL
stores — module level AND nested scopes — into one defined-anywhere set, so a
name defined in one function and loaded in ANOTHER passes. The over-acceptance
is deliberate: the observed bug class is defined-NOWHERE, and a per-scope
walk would false-positive on this family's closure idioms. skills/ is excluded
(the repo convention: the skills/ folder is outside code checking and testing).

Usage:
  python3 scripts/check-undefined-names.py            # human summary (exit 1 on offenders)
  python3 scripts/check-undefined-names.py --check    # CI/pin form: exit 0/1 + the JSON report
  python3 scripts/check-undefined-names.py --check --json   # machine-readable only
"""
import ast
import builtins
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
BUILTINS = set(dir(builtins)) | {"__file__", "__doc__", "__name__", "__builtins__"}


def undefined_names(path: pathlib.Path) -> list[dict]:
    """Return [{line, name}] for every loaded-but-never-defined name."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    defined: set[str] = set()
    loads: list[tuple[int, str]] = []
    for n in ast.walk(tree):
        if isinstance(n, ast.Name):
            if isinstance(n.ctx, ast.Store):
                defined.add(n.id)
            elif isinstance(n.ctx, ast.Load):
                loads.append((n.lineno, n.id))
        elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            defined.add(n.name)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            for a in n.names:
                defined.add(a.asname or a.name.split(".")[0])
        elif isinstance(n, ast.ExceptHandler) and n.name:
            defined.add(n.name)
        elif isinstance(n, ast.arg):
            defined.add(n.arg)
        elif isinstance(n, (ast.Global, ast.Nonlocal)):
            defined.update(n.names)
    return [
        {"line": lineno, "name": name}
        for lineno, name in sorted(loads)
        if name not in defined and name not in BUILTINS
    ]


def main() -> int:
    args = set(sys.argv[1:])
    machine = "--json" in args
    check = "--check" in args or machine
    scripts = sorted(SCRIPTS.glob("*.py"))
    report: dict = {"scanned": len(scripts), "offenders": {}}
    total = 0
    for p in scripts:
        try:
            errs = undefined_names(p)
        except SyntaxError as e:
            errs = [{"line": e.lineno or 0, "name": f"SyntaxError: {e.msg}"}]
        if errs:
            total += len(errs)
            report["offenders"][p.name] = errs
    report["total"] = total
    if machine:
        print(json.dumps(report, indent=2))
    elif check:
        if total:
            for name, errs in report["offenders"].items():
                for e in errs:
                    print(f"FAIL {name}:{e['line']}: {e['name']!r} is loaded but never defined in the file")
            print(f"\n{total} undefined-name load(s) across {len(report['offenders'])} file(s)")
        else:
            print(f"OK: {report['scanned']} scripts scanned, zero undefined-name loads")
    else:
        print(f"scanned {report['scanned']} scripts/*.py (skills/ excluded — the convention)")
        for name, errs in report["offenders"].items():
            print(f"\n{name}: {len(errs)} undefined-name load(s)")
            for e in errs:
                print(f"  line {e['line']}: {e['name']!r}")
        print(f"\nTOTAL: {total} undefined-name loads")
    return 1 if (check and total) else 0


if __name__ == "__main__":
    sys.exit(main())
