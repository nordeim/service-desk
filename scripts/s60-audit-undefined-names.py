#!/usr/bin/env python3
"""S60 audit: the undefined-name class in the committed scripts/ Python family.

The live event: scripts/s58-wave-analysis.py:24 and scripts/s59-wave-analysis.py:24
reference `s56_b` — a variable defined NOWHERE in those files (the make-battery
generators' blind .replace() vocabularies only covered the sNN names of THEIR
session pair; the s56-era leftover predates them and survived two generations).
The committed scripts crash with NameError the moment their /tmp inputs exist —
the s59 wave figures were produced from an in-flight-fixed copy that never
landed (the durability gap).

This audit mirrors, in Python, the static undefined-name check the s60 pin will
carry: every Name LOAD must resolve to a module-level/local definition, an
import, a builtin, or a dunder. skills/ is excluded (the repo convention).
"""
import ast
import builtins
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILTINS = set(dir(builtins)) | {"__file__", "__doc__", "__name__", "__builtins__"}


def undefined_names(path: pathlib.Path) -> list[tuple[int, str]]:
    """Return [(line, name)] for every loaded-but-never-defined name."""
    tree = ast.parse(path.read_text(encoding="utf-8"))
    errors: list[tuple[int, str]] = []

    # Walk nested scopes independently (function/class bodies see enclosing
    # names; a naive module-level set would false-positive on closures).
    def visit_scope(node: ast.AST, in_scope: set[str]):
        defined = set(in_scope)
        # collect this scope's own definitions first (hoisting: a function
        # may be called before its textual definition at module level)
        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                defined.add(child.name)
            elif isinstance(child, ast.Assign):
                for t in child.targets:
                    for n in ast.walk(t):
                        if isinstance(n, ast.Name):
                            defined.add(n.id)
            elif isinstance(child, (ast.AnnAssign, ast.AugAssign)):
                for n in ast.walk(child.target):
                    if isinstance(n, ast.Name):
                        defined.add(n.id)
            elif isinstance(child, (ast.Import, ast.ImportFrom)):
                for a in child.names:
                    defined.add(a.asname or a.name.split(".")[0])
            elif isinstance(child, ast.For):
                for n in ast.walk(child.target):
                    if isinstance(n, ast.Name):
                        defined.add(n.id)
            elif isinstance(child, ast.With):
                for item in child.items:
                    if item.optional_vars:
                        for n in ast.walk(item.optional_vars):
                            if isinstance(n, ast.Name):
                                defined.add(n.id)
            elif isinstance(child, ast.ExceptHandler):
                if child.name:
                    defined.add(child.name)
            elif isinstance(child, (ast.Global, ast.Nonlocal)):
                defined.update(child.names)
            elif isinstance(child, ast.Match):
                # match-case capture patterns are too niche for this family —
                # skipped (no script in the family uses match)
                pass

        for child in ast.iter_child_nodes(node):
            if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                inner = set(defined)
                args = child.args
                for a in (
                    list(args.posonlyargs) + list(args.args) + list(args.kwonlyargs)
                    + ([args.vararg] if args.vararg else [])
                    + ([args.kwarg] if args.kwarg else [])
                ):
                    inner.add(a.arg)
                for d in args.defaults + [d for d in args.kw_defaults if d]:
                    visit_loads(d, defined | inner)
                visit_scope(child, inner)
            elif isinstance(child, ast.ClassDef):
                visit_scope(child, set(defined))
            elif isinstance(child, (ast.Lambda,)):
                inner = set(defined)
                args = child.args
                for a in (
                    list(args.posonlyargs) + list(args.args) + list(args.kwonlyargs)
                    + ([args.vararg] if args.vararg else [])
                    + ([args.kwarg] if args.kwarg else [])
                ):
                    inner.add(a.arg)
                for d in args.defaults + [d for d in args.kw_defaults if d]:
                    visit_loads(d, defined | inner)
                visit_scope(child, inner)
            else:
                visit_scope(child, defined)

    def visit_loads(node: ast.AST, scope: set[str]):
        """Check every Name load under `node` against `scope`."""
        for n in ast.walk(node):
            if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load):
                if n.id not in scope and n.id not in BUILTINS:
                    errors.append((n.lineno, n.id))

    # A two-pass shape would be cleaner, but the recursive visit_scope above
    # already hoists definitions; loads are checked inline via visit_loads at
    # expression positions. To keep it simple and conservative, we check all
    # loads in the file against the module scope + per-scope additions —
    # collecting scopes via a wrapper.
    class Checker(ast.NodeVisitor):
        def __init__(self):
            self.scopes: list[set[str]] = []

    # Simpler robust shape: collect ALL stores (module + nested) into a global
    # "defined anywhere" set, and ALL loads — then flag loads that are defined
    # NOWHERE in the file. This over-accepts (a name defined in one function
    # and loaded in another passes), but the bug class (s56_b defined NOWHERE)
    # is caught exactly, and the false-negative surface (cross-function name
    # confusion) is not the observed class. The pin documents this boundary.
    all_defined: set[str] = set()
    all_loads: list[tuple[int, str]] = []
    for n in ast.walk(tree):
        if isinstance(n, ast.Name):
            if isinstance(n.ctx, ast.Store):
                all_defined.add(n.id)
            elif isinstance(n.ctx, ast.Load):
                all_loads.append((n.lineno, n.id))
        elif isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
            all_defined.add(n.name)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            for a in n.names:
                all_defined.add(a.asname or a.name.split(".")[0])
        elif isinstance(n, ast.ExceptHandler):
            if n.name:
                all_defined.add(n.name)
        elif isinstance(n, ast.arg):
            all_defined.add(n.arg)
        elif isinstance(n, (ast.Global, ast.Nonlocal)):
            all_defined.update(n.names)
    for lineno, name in all_loads:
        if name not in all_defined and name not in BUILTINS:
            errors.append((lineno, name))
    return sorted(errors)


def main() -> int:
    scripts = sorted(ROOT.joinpath("scripts").glob("*.py"))
    print(f"scanning {len(scripts)} scripts/*.py files (skills/ excluded — the convention)")
    total = 0
    for p in scripts:
        errs = undefined_names(p)
        if errs:
            total += len(errs)
            print(f"\n{p.name}: {len(errs)} undefined-name load(s)")
            for lineno, name in errs:
                print(f"  line {lineno}: {name!r} is loaded but never defined in the file")
    print(f"\nTOTAL: {total} undefined-name loads across the family")
    # the wave-analysis family specifically
    print("\nthe wave-analysis family (the live class):")
    for p in sorted(ROOT.joinpath("scripts").glob("s*-wave-analysis.py")):
        errs = undefined_names(p)
        status = "CLEAN" if not errs else f"{len(errs)} undefined: " + ", ".join(
            f"line {l}:{n!r}" for l, n in errs
        )
        print(f"  {p.name}: {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
