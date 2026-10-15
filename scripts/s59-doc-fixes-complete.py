#!/usr/bin/env python3
"""S59 doc-fixes completion: the two edits the first pass left (the PAD §7.1
in-place row update + the standing duties) — the first run FATALed on the
mis-anchored PAD row (the s56 first-pass precedent), the 9 family sites +
the quickstart + the corpus pin + the lineage already landed.
"""
import pathlib

R = pathlib.Path("/home/z/my-project/service-desk")


def sub(path, old, new, expect=1):
    p = R / path
    t = p.read_text()
    n = t.count(old)
    assert n == expect, f"{path}: expected {expect} of {old[:60]!r}..., found {n}"
    p.write_text(t.replace(old, new))
    print(f"  {path}: {old[:50]!r} -> {new[:50]!r}")


print("== the PAD §7.1 in-place row update (the artifact-existence row: 3 -> 4 tests) ==")
sub("Project_Architecture_Document.md",
    "the bare-citation reachability — every backticked hex commit citation resolves in git, the exact known-non-commit exclusion set + the needed-ness guard) | 1 | 3 | `tests/artifact-existence-contract.test.ts` | Vitest |",
    "the bare-citation reachability — every backticked hex commit citation resolves in git, the exact known-non-commit exclusion set + the needed-ness guard, the exclusion MATCH-scoped since s59 (never a line-level escape) — plus the s59 no-silent-skip parity: every bare-hex token claimed or excluded, never silently dropped, with the co-location shape floor) | 1 | 4 | `tests/artifact-existence-contract.test.ts` | Vitest |")

print("== the standing duties (the PAIRED bump) ==")
sub("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 58;", "const CURRENT_SESSION = 59;")
sub("tests/plan-status-contract.test.ts", "const PLAN_CORPUS_FLOOR = 57;", "const PLAN_CORPUS_FLOOR = 58;")
sub("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 58;", "const CURRENT_SESSION = 59;")

print("\nS59 doc-fixes completion done.")
