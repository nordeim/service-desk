#!/usr/bin/env python3
"""S62: the mutation battery definitions (A-H). Each mutation:
  apply <ID>   — apply the mutation (count-verified)
  revert <ID>   — reverse it (count-verified / backup-restored, never git checkout — the s53 doctrine)
  show <ID>     — print the definition

The bite map (designed, then OBSERVED in the observation pass — every bite
message below was produced by a live vitest run before this file landed):
  A  the magic corruption (the first 8 bytes of 02-dashboard.png overwritten)
                                                     -> s62 pin 5 naming the
                                                        file ("bad PNG magic")
  B  the truncation (the IEND chunk dropped from 06-mobile-dashboard.png)
                                                     -> s62 pin 5 naming the
                                                        file ("missing IEND
                                                        trailer")
  C  the text substitution (10-attachment-inline-view.png carrying text)
                                                     -> s62 pin 5 naming the
                                                        file ("bad PNG magic")
  D  the family deletion (09-ticket-detail-attachments.png renamed away)
                                                     -> s62 pin 5's family
                                                        floor (10 -> 9)
  E  the helper's scanned-count neutering (the --json report claims zero
     scanned — the vacuous shape)                  -> s62 pin 5's family
                                                        floor ("found 0" — the
                                                        s56 mapDeps lesson)
  F  the README badge revert 287 -> 286             -> s48 family + the s50 BRIDGE
                                                        ("found 286 & 287")
  G  the §7.1 row's test-count mutation 5 -> 4      -> s49 pad pin ("claims 4
                                                        tests — the runtime
                                                        count is 5")
  H  the paired-constant bump to 63                 -> plan-status 1+3 +
                                                        doc-enumeration 1+2+3
                                                        (the next-session-catch)
"""
import pathlib
import shutil
import sys

R = pathlib.Path("/home/z/my-project/service-desk")
BACKUP = pathlib.Path("/tmp/s62-mut-backups")
BACKUP.mkdir(exist_ok=True)

# The text mutations: (file, old, new, expect-on-apply)
MUTATIONS = {
    "E": (
        "scripts/check-screenshots.py",
        '"scanned": len(files),',
        '"scanned": 0,',
        1,
    ),
    "F": (
        "README.md",
        "tests-287%20unit",
        "tests-286%20unit",
        1,
    ),
    "G": (
        "Project_Architecture_Document.md",
        "the s17/s18 asset-truth doctrine extended to the parity-evidence surface) | 1 | 5 | `tests/artifact-existence-contract.test.ts` | Vitest |",
        "the s17/s18 asset-truth doctrine extended to the parity-evidence surface) | 1 | 4 | `tests/artifact-existence-contract.test.ts` | Vitest |",
        1,
    ),
}

# The binary mutations: (file, mode) — backup + byte-level apply
BINARY = {
    "A": ("docs/screenshots/02-dashboard.png", "magic"),
    "B": ("docs/screenshots/06-mobile-dashboard.png", "truncate-iend"),
    "C": ("docs/screenshots/10-attachment-inline-view.png", "text"),
}

# The rename mutations (family deletion)
RENAME = {
    "D": ("docs/screenshots/09-ticket-detail-attachments.png",
          "docs/screenshots/09-ticket-detail-attachments.png.mut"),
}

# The paired-constant mutations touch BOTH pin files (the paired-bump class)
PAIRED = {
    "H": [
        ("tests/plan-status-contract.test.ts", "const CURRENT_SESSION = 62;", "const CURRENT_SESSION = 63;"),
        ("tests/doc-enumeration-contract.test.ts", "const CURRENT_SESSION = 62;", "const CURRENT_SESSION = 63;"),
    ],
}


def apply_binary(mid: str) -> None:
    f, mode = BINARY[mid]
    src = R / f
    dst = BACKUP / f"{mid}.png"
    shutil.copy2(src, dst)
    data = src.read_bytes()
    if mode == "magic":
        src.write_bytes(b"XXXXXXXX" + data[8:])
    elif mode == "truncate-iend":
        src.write_bytes(data[:-12])
    elif mode == "text":
        src.write_bytes(b"not a png at all, just text content here")
    print(f"applied {id_label(mid)}: {f} ({mode}; backup at {dst})")


def revert_binary(mid: str) -> None:
    f, _ = BINARY[mid]
    src = R / f
    dst = BACKUP / f"{mid}.png"
    shutil.copy2(dst, src)
    print(f"reverted {id_label(mid)}: {f} restored from backup")


def id_label(mid: str) -> str:
    return mid


def apply_m(mid: str) -> None:
    if mid in BINARY:
        apply_binary(mid)
        return
    if mid in RENAME:
        src, dst = RENAME[mid]
        (R / src).rename(R / dst)
        print(f"applied {mid}: renamed {src} -> {dst}")
        return
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(old) == 1, f"{f}: {old!r} count {t.count(old)}"
            p.write_text(t.replace(old, new), encoding="utf-8")
        print(f"applied {mid}: the paired bump to 63 in BOTH pin files")
        return
    f, old, new, expect = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(old)
    assert n == expect, f"{f}: expected {expect} of {old!r}, found {n}"
    p.write_text(t.replace(old, new), encoding="utf-8")
    print(f"applied {mid}: {f}")


def revert_m(mid: str) -> None:
    if mid in BINARY:
        revert_binary(mid)
        return
    if mid in RENAME:
        src, dst = RENAME[mid]
        (R / dst).rename(R / src)
        print(f"reverted {mid}: renamed {dst} -> {src}")
        return
    if mid in PAIRED:
        for f, old, new in PAIRED[mid]:
            p = R / f
            t = p.read_text(encoding="utf-8")
            assert t.count(new) == 1, f"{f}: {new!r} count {t.count(new)}"
            p.write_text(t.replace(new, old), encoding="utf-8")
        print(f"reverted {mid}: the paired bump restored in BOTH pin files")
        return
    f, old, new, _ = MUTATIONS[mid]
    p = R / f
    t = p.read_text(encoding="utf-8")
    n = t.count(new)
    assert n == 1, f"{f}: expected 1 of {new!r}, found {n}"
    p.write_text(t.replace(new, old), encoding="utf-8")
    print(f"reverted {mid}: {f}")


def show(mid: str) -> None:
    if mid in MUTATIONS:
        print(mid, MUTATIONS[mid])
    elif mid in BINARY:
        print(mid, BINARY[mid])
    elif mid in RENAME:
        print(mid, RENAME[mid])
    elif mid in PAIRED:
        print(mid, PAIRED[mid])
    else:
        print(f"unknown mutation {mid}")


if __name__ == "__main__":
    if len(sys.argv) != 3 or sys.argv[1] not in {"apply", "revert", "show"}:
        print("usage: s62-mutations.py apply|revert|show <A-H>")
        sys.exit(2)
    {"apply": apply_m, "revert": revert_m, "show": show}[sys.argv[1]](sys.argv[2])
