#!/usr/bin/env python3
"""The standing worklog protocol checker (the s63 coordination-surface contract).

worklog.md is the corpus' coordination backbone — the FIRST file every session
reads and the LAST every session writes. Its protocol (the --- separator, the
Task ID:/Agent:/Task:/Work Log:/Stage Summary: field set) was defined only in
the operator's prompt, documented in NEITHER AGENTS.md NOR the PAD, and
followed by convention alone: measured ad-hoc, pinned nowhere, while the task
numbers are cited by every commit message and session log ("the worklog tasks
195-197").

The measured structure (born-green at s63, with frozen historical drift):
202 entries / 202 --- separators (1:1, every Task ID preceded by its
separator; the 2-line header block before the first), 188 distinct task
numbers, max 197, and NINE frozen historical holes — the numbering slips of
the session-boundary eras. A future slip of the same class (a session
numbering its first entry max+2 after the previous session's max) passed
every standing gate before this checker existed.

The frozen holes (the documented exclusion set — each an era's numbering
slip, frozen history, expected to stay ABSENT):
  50, 54            the early free-form era (the s26/s28 session boundaries)
  110, 115          the s40/s41 era (109 -> 111-gap-s40; 114 -> 116-gap-s41)
  164, 168, 171     the s52-s54 era (163-push-s52 -> 165-remediation-s53;
                    167-push-s53 -> 169-remediation-s54; 170-verify-s54 ->
                    172-push-s54)
  179, 181          the s56/s57 era (178-push-s56 -> 180-session-s57; the
                    s57 closeout's own slip)

A frozen hole that GAINS an entry (a deliberate backfill) is reported as
holes_filled — informational, never a failure (filling a hole is an
improvement; the honest response is to shrink this exclusion set in BOTH the
helper and the pin's paired copy).

Usage:
  python3 scripts/check-worklog.py            # human summary (exit 1 on offenders)
  python3 scripts/check-worklog.py --check    # CI/pin form: exit 0/1 + the report
  python3 scripts/check-worklog.py --check --json   # machine-readable only
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORKLOG = ROOT / "worklog.md"

# The frozen historical holes (the documented exclusion set — see the module
# docstring for each hole's era). The pin (tests/doc-enumeration-contract
# .test.ts pin 4) carries its own copy of this list; a mismatch fails BOTH
# directions (a neutered helper that grows the list to hide a new hole fails
# the pin's paired comparison).
FROZEN_HOLES = [50, 54, 110, 115, 164, 168, 171, 179, 181]

# The protocol field set (the operator's prompt template, documented repo-side
# in the AGENTS.md Session-63 contracts section).
FIELDS = ["Agent:", "Task:", "Work Log:", "Stage Summary:"]

# The vacuous-pass guard: the measured corpus at s63 is 202 entries; a parse
# that returns fewer than 200 has been neutered (or the corpus mass-deleted).
ENTRY_FLOOR = 200

TASK_ID_RE = re.compile(r"^Task ID: (\d+)(?:-\S.*)?$")


def main() -> int:
    args = set(sys.argv[1:])
    machine = "--json" in args
    check = "--check" in args or machine

    report = {
        "entries": 0,
        "separators": 0,
        "header_lines": 0,
        "distinct_numbers": 0,
        "max": 0,
        "holes_expected": list(FROZEN_HOLES),
        "holes_found": [],
        "new_holes": [],
        "holes_filled": [],
        "missing_fields": [],
        "dup_ids": [],
        "structure_errors": [],
        "entry_floor": ENTRY_FLOOR,
        "floor_ok": False,
        "offenders": [],
    }

    if not WORKLOG.is_file():
        report["structure_errors"].append("worklog.md not found at the repo root")
        report["ok"] = False
        if machine:
            print(json.dumps(report, indent=2))
        else:
            print("FAIL: worklog.md not found at the repo root")
        return 1 if check else 0

    lines = WORKLOG.read_text(encoding="utf-8").split("\n")

    # --- the separator/entry structure: split on exact --- lines ---
    sep_idx = [i for i, l in enumerate(lines) if l.strip() == "---"]
    report["separators"] = len(sep_idx)
    blocks: list[list[str]] = []
    start = 0
    for i in sep_idx:
        blocks.append(lines[start:i])
        start = i + 1
    blocks.append(lines[start:])
    # blocks[0] = the header (before the first ---); blocks[1:] = the entries
    header = blocks[0]
    report["header_lines"] = len([l for l in header if l.strip()])
    if any(l.startswith("Task ID: ") for l in header):
        report["structure_errors"].append(
            "the header block (before the first ---) carries a Task ID line — "
            "the header is the file title, not an entry"
        )

    numbers: set[int] = set()
    id_lines: list[str] = []
    for b in blocks[1:]:
        task_lines = [l for l in b if l.startswith("Task ID: ")]
        if not task_lines:
            report["structure_errors"].append(
                "an entry block (after a --- separator) carries NO Task ID line — "
                "every separator-delimited block after the header is an entry"
            )
            continue
        if len(task_lines) > 1:
            report["structure_errors"].append(
                f"an entry block carries {len(task_lines)} Task ID lines — exactly one per entry"
            )
        tid = task_lines[0]
        id_lines.append(tid)
        m = TASK_ID_RE.match(tid)
        if not m:
            report["structure_errors"].append(
                f"Task ID grammar: {tid!r} does not match 'Task ID: <number>' or "
                "'Task ID: <number>-<suffix>'"
            )
            continue
        numbers.add(int(m.group(1)))
        # the protocol fields
        for f in FIELDS:
            if not any(l.startswith(f) for l in b):
                report["missing_fields"].append({"task_id": tid, "field": f})

    report["entries"] = len(id_lines)
    report["distinct_numbers"] = len(numbers)
    report["max"] = max(numbers) if numbers else 0

    # separator/entry 1:1 (the header block aside)
    if report["separators"] != report["entries"]:
        report["structure_errors"].append(
            f"separator/entry mismatch: {report['separators']} --- lines vs "
            f"{report['entries']} Task ID lines — every entry needs exactly one separator"
        )

    # exact-duplicate Task IDs (the same ID string twice — distinct suffixed
    # forms at the same number are the intentional correction/addendum class
    # and pass)
    seen: dict[str, int] = {}
    for t in id_lines:
        seen[t] = seen.get(t, 0) + 1
    report["dup_ids"] = sorted(t for t, c in seen.items() if c > 1)

    # the coverage invariant: every number in {1..max} present except the frozen nine
    if numbers:
        report["holes_found"] = sorted(n for n in range(1, report["max"] + 1) if n not in numbers)
        frozen = set(FROZEN_HOLES)
        report["new_holes"] = [n for n in report["holes_found"] if n not in frozen]
        report["holes_filled"] = [n for n in FROZEN_HOLES if n not in set(report["holes_found"])]

    # the vacuous-pass guard
    report["floor_ok"] = report["entries"] >= ENTRY_FLOOR

    # --- the offenders rollup ---
    if report["new_holes"]:
        report["offenders"].append(
            f"NEW task-number holes {report['new_holes']} — not in the frozen historical "
            f"set {FROZEN_HOLES} (a session-boundary numbering slip; the coverage contract "
            f"is {{1..{report['max']}}} minus the frozen nine)"
        )
    for mf in report["missing_fields"]:
        report["offenders"].append(f"entry {mf['task_id']!r} missing the {mf['field']} field")
    if report["dup_ids"]:
        report["offenders"].append(f"exact-duplicate Task IDs: {report['dup_ids']}")
    report["offenders"].extend(report["structure_errors"])
    if not report["floor_ok"]:
        report["offenders"].append(
            f"entry floor: {report['entries']} < {ENTRY_FLOOR} (the vacuous-pass guard — "
            "a neutered parse or a mass deletion)"
        )
    report["ok"] = not report["offenders"]

    if machine:
        print(json.dumps(report, indent=2))
    elif check:
        if report["offenders"]:
            for o in report["offenders"]:
                print(f"FAIL {o}")
            print(f"\n{len(report['offenders'])} offender(s) across {report['entries']} entries")
        else:
            print(
                f"OK: {report['entries']} entries / {report['separators']} separators, "
                f"{report['distinct_numbers']} distinct task numbers (max {report['max']}), "
                f"the frozen nine holes intact, zero new holes, the protocol fields complete"
            )
    else:
        print(f"parsed {report['entries']} worklog entries (max task number {report['max']})")
        for o in report["offenders"]:
            print(f"  {o}")
        print(f"holes found: {report['holes_found']}")
        print(f"new holes: {report['new_holes']}")
    return 1 if (check and not report["ok"]) else 0


if __name__ == "__main__":
    sys.exit(main())
