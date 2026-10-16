#!/usr/bin/env python3
"""The standing screenshots asset-truth checker (the s62 family-integrity contract).

Every docs/screenshots/*.png file must be structurally valid — the PNG magic
(\\x89PNG\\r\\n\\x1a\\n), a parseable IHDR (width/height > 0), the IEND trailer,
and a 4 KiB size floor against the truncated/empty class — AND the family must
carry the recorded lineage shape: the ten canonical names (01-login …
10-attachment-inline-view), the family floor (>= 10), and the desktop/mobile
split (8 desktop at 1280x800 + 2 mobile at 375x812 — the capture-script
viewports).

Why this exists: the s17/s18 asset-truth doctrine (an asset's declared format
must be true — the favicon + og:image magic-byte pins) was never extended to
the parity-evidence surface; every session plan cites "the 10-shot set" as the
visual-parity evidence, yet a committed corrupted/truncated/text-substituted
PNG passed every standing gate. The family counts also drifted live at s62:
the PAD §3.2 claimed "7 dev-server captures" (stale by three) and the AGENTS
reference list claimed "desktop x 7" (stale by one) — the s48 corpus-count
family never watched the screenshots family.

Usage:
  python3 scripts/check-screenshots.py            # human summary (exit 1 on offenders)
  python3 scripts/check-screenshots.py --check    # CI/pin form: exit 0/1 + the report
  python3 scripts/check-screenshots.py --check --json   # machine-readable only
"""
import json
import pathlib
import struct
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / "docs" / "screenshots"

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
IEND = b"IEND"
SIZE_FLOOR = 4096  # the smallest true member (the inline view) is ~7.5 KiB

# The recorded lineage: the ten canonical names with their capture viewports
# (scripts/capture-screenshots-sNN.sh — the s10 base set + the s13 attachment
# pair + the s14 inline view + the s10-era mobile pair).
NAMED_SET = [
    ("01-login.png", "desktop"),
    ("02-dashboard.png", "desktop"),
    ("03-submit-ticket.png", "desktop"),
    ("04-my-tickets.png", "desktop"),
    ("05-ticket-detail.png", "desktop"),
    ("06-mobile-dashboard.png", "mobile"),
    ("07-mobile-menu-open.png", "mobile"),
    ("08-submit-attachment-row.png", "desktop"),
    ("09-ticket-detail-attachments.png", "desktop"),
    ("10-attachment-inline-view.png", "desktop"),
]
EXPECTED_SPLIT = {"desktop": 8, "mobile": 2}
EXPECTED_DIMS = {"desktop": (1280, 800), "mobile": (375, 812)}


def validate(path: pathlib.Path) -> dict:
    """Structural validation of one PNG: magic, IHDR, IEND, size floor."""
    out = {"name": path.name, "bytes": 0, "width": 0, "height": 0, "errors": []}
    try:
        data = path.read_bytes()
    except OSError as e:
        out["errors"].append(f"unreadable: {e}")
        return out
    out["bytes"] = len(data)
    if len(data) < 8 or data[:8] != PNG_MAGIC:
        out["errors"].append("bad PNG magic (the declared .png format is not true)")
        return out
    if len(data) < SIZE_FLOOR:
        out["errors"].append(f"size {len(data)}b below the {SIZE_FLOOR}b floor (truncated/empty class)")
    if len(data) >= 24:
        w, h = struct.unpack(">II", data[16:24])
        out["width"], out["height"] = w, h
        if w == 0 or h == 0:
            out["errors"].append("IHDR parses to a zero dimension")
    else:
        out["errors"].append("too short for an IHDR")
    if IEND not in data[-12:]:
        out["errors"].append("missing IEND trailer (truncated)")
    return out


def main() -> int:
    args = set(sys.argv[1:])
    machine = "--json" in args
    check = "--check" in args or machine

    files = sorted(SHOTS.glob("*.png")) if SHOTS.is_dir() else []
    report: dict = {
        "scanned": len(files),
        "files": [],
        "counts": {"desktop": 0, "mobile": 0, "unknown": 0},
        "named_set_missing": [],
        "unexpected": [],
        "offenders": [],
    }
    named = {n for n, _ in NAMED_SET}
    for p in files:
        v = validate(p)
        report["files"].append(v)
        if v["errors"]:
            report["offenders"].append({"name": v["name"], "errors": v["errors"]})
        if p.name in named:
            kind = dict(NAMED_SET)[p.name]
            report["counts"][kind] += 1
            ew, eh = EXPECTED_DIMS[kind]
            if not v["errors"] and (v["width"], v["height"]) != (ew, eh):
                report["offenders"].append({
                    "name": v["name"],
                    "errors": [f"dimensions {v['width']}x{v['height']} — the {kind} lineage is {ew}x{eh}"],
                })
        else:
            report["counts"]["unknown"] += 1
            report["unexpected"].append(p.name)
    report["named_set_missing"] = sorted(named - {f.name for f in files})
    if report["named_set_missing"]:
        report["offenders"].append({
            "name": "(family)",
            "errors": [f"named-set member missing: {m}" for m in report["named_set_missing"]],
        })
    if len(files) < 10:
        report["offenders"].append({
            "name": "(family)",
            "errors": [f"family floor: expected >= 10 members, found {len(files)}"],
        })
    for kind, want in EXPECTED_SPLIT.items():
        got = report["counts"][kind]
        if got != want:
            report["offenders"].append({
                "name": "(family)",
                "errors": [f"the {kind} split is {got}, the recorded lineage is {want}"],
            })
    report["ok"] = not report["offenders"]

    if machine:
        print(json.dumps(report, indent=2))
    elif check:
        if report["offenders"]:
            for o in report["offenders"]:
                for e in o["errors"]:
                    print(f"FAIL {o['name']}: {e}")
            print(f"\n{len(report['offenders'])} offender group(s) across {report['scanned']} screenshots")
        else:
            print(f"OK: {report['scanned']} screenshots valid — "
                  f"{report['counts']['desktop']} desktop + {report['counts']['mobile']} mobile, the named set complete")
    else:
        print(f"scanned {report['scanned']} docs/screenshots/*.png")
        for o in report["offenders"]:
            for e in o["errors"]:
                print(f"  {o['name']}: {e}")
        print(f"counts: {report['counts']}")
    return 1 if (check and not report["ok"]) else 0


if __name__ == "__main__":
    sys.exit(main())
