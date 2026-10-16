#!/usr/bin/env python3
"""S61: the language-symmetry syntax check for the scripts/ corpus.

The s61 scripts-integrity closure (P1: the LANGUAGE-SYMMETRY GAP — the s60
closure protected the .py family only; 275 of the 358 scripts — .sh 132,
.mjs 125, .ts 18 — carried no standing static-integrity check). This helper
extends the standing-check family beside scripts/check-undefined-names.py,
same CLI contract (--check: exit 0 clean / 1 offenders; --json: the
machine-readable report on stdout, the human-readable offender list on
stderr).

Per language, the standard static layer:
  scripts/*.sh   bash -n <file>          — the parse layer (bash has no type
                                           checker; --check validates syntax)
  scripts/*.mjs  node --check <file>     — the parse layer (node --check
                                           validates syntax, not bindings)
  scripts/*.ts   ONE bunx tsc invocation — the TYPE layer (deeper than parity
                                           with the other two; the honest
                                           asymmetry documented here, not
                                           hidden). Flags: --noEmit
                                           --skipLibCheck --esModuleInterop
                                           --moduleResolution bundler
                                           --module esnext --target es2017.

skills/ is excluded (the repo convention: the skills/ folder is outside code
checking and testing — nothing under skills/ is scanned).

The report shape (--json):
  {"ok": true, "scanned": {"sh": 132, "mjs": 125, "ts": 18}, "offenders": []}
with offenders shaped {"file", "tool", "message"} — one line each, the
offender NAMING its file + tool + the checker's first diagnostic line.
"""
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

S = Path(__file__).resolve().parent
ROOT = S.parent

TSC_FLAGS = [
    "--noEmit", "--skipLibCheck", "--esModuleInterop",
    "--moduleResolution", "bundler", "--module", "esnext", "--target", "es2017",
]


def first_line(stderr: str) -> str:
    for ln in (stderr or "").splitlines():
        ln = ln.strip()
        if ln:
            return ln
    return "(no diagnostic output)"


def rel(f: Path) -> str:
    """The repo-relative posix form (scripts/<name>) — cwd-independent."""
    return f.relative_to(ROOT).as_posix()


def _run_one(tool, f):
    r = subprocess.run([tool.split()[0], *(tool.split()[1:]), rel(f)],
                        capture_output=True, text=True, cwd=str(ROOT))
    if r.returncode != 0:
        # node resolves the given path before reporting — strip the
        # sandbox-absolute prefix so the offender message stays repo-relative
        msg = first_line(r.stderr).replace(f"{ROOT}/", "")
        return {"file": rel(f), "tool": tool, "message": msg}
    return None


def check_sh(files):
    # The per-file invocations are independent — a thread pool cuts the wall
    # time (~125 node spawns x ~40ms startup) without changing the semantics.
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(lambda f: _run_one("bash -n", f), files))
    return sorted([r for r in results if r], key=lambda o: o["file"])


def check_mjs(files):
    with ThreadPoolExecutor(max_workers=8) as ex:
        results = list(ex.map(lambda f: _run_one("node --check", f), files))
    return sorted([r for r in results if r], key=lambda o: o["file"])


def check_ts(files):
    if not files:
        return []
    r = subprocess.run(["bunx", "tsc", *TSC_FLAGS, *[rel(f) for f in files]],
                       capture_output=True, text=True, cwd=str(ROOT))
    if r.returncode == 0:
        return []
    offenders = []
    # tsc writes its diagnostics to STDOUT (stderr stays empty) — parsing
    # stderr alone would vacuous-pass every type-broken .ts (the observed
    # C-mutation lesson at the s61 observation pass).
    for ln in ((r.stdout or "") + (r.stderr or "")).splitlines():
        ln = ln.strip()
        if ln.startswith("scripts/") and ": error TS" in ln:
            offenders.append({"file": ln.split("(")[0], "tool": "tsc", "message": ln})
    if not offenders:
        # tsc failed without a per-file scripts/ error line (a flag/config
        # failure, or an unexpected output shape) — report it honestly
        # rather than passing vacuously.
        offenders.append({"file": "scripts/*.ts", "tool": "tsc",
                          "message": first_line((r.stdout or "") + (r.stderr or ""))})
    return offenders


def report():
    sh = sorted(S.glob("*.sh"))
    mjs = sorted(S.glob("*.mjs"))
    ts = sorted(S.glob("*.ts"))
    offenders = check_sh(sh) + check_mjs(mjs) + check_ts(ts)
    return {
        "ok": not offenders,
        "scanned": {"sh": len(sh), "mjs": len(mjs), "ts": len(ts)},
        "offenders": offenders,
    }


def main():
    args = set(sys.argv[1:])
    rep = report()
    if "--json" in args:
        print(json.dumps(rep))
    else:
        print(f"scanned: sh={rep['scanned']['sh']} mjs={rep['scanned']['mjs']} "
              f"ts={rep['scanned']['ts']}; offenders={len(rep['offenders'])}")
    if "--check" in args:
        for o in rep["offenders"]:
            print(f"{o['file']}: [{o['tool']}] {o['message']}", file=sys.stderr)
        sys.exit(1 if rep["offenders"] else 0)


if __name__ == "__main__":
    main()
