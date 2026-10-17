#!/usr/bin/env python3
"""The post-derivation label-audit assistant (the s70 mechanism closure for the
derived-script LABEL-DRIFT class — SKILL lesson 124).

The class: the per-session sed derivation of scripts/{TAG}-* from the prior
lineage structurally misses the substitution vocabulary it does not name —
the s69 closure removed the mechanism for the HARMFUL form (the roundtrip's
cleanup cross-reference now derives from the script's own basename), but the
COSMETIC layer (print labels, comment lineage ranges, docstring context
prose) walked into the same hole the very next session: s70's derivation
shipped three label defects (a print label, a lineage-range end, a docstring
context) that the manual audit caught only by careful reading. A prose warning
cannot bind the derivation moment (the s69 lesson-123 measured limit) — so the
audit gets a MECHANISM: this checker mechanically enumerates every session
token in every scripts/{TAG}-* file and classifies each, so the post-derivation
audit reviews a flagged list instead of re-reading every line.

Classification (per file named with session tag s{N}):
  OWN        M == N                                   — fine
  BASELINE   M == N-1 in the intentional backward
             shapes: s{M}-baseline* filenames, the
             literal phrases "vs the s{M} records" /
             "the s{M} lineage" / "the s{M} records" /
             "the s{M} pattern"                      — fine (the s69 doctrine:
                                                        the baseline just
                                                        measured is named)
  RANGE      part of s{A}[-\u2013]s{B} with B in {N, N-1} — fine (lineage
                                                        ranges end current)
  OTHER      anything else                            — REPORT for review

The ORDINAL grammar (the s71 extension — the audit-assistant's own measured
limit, one layer out): the s70 derivation bumped the session tokens but
MISSED the sweep ordinal, shipping the committed `s70-ref-surfaces.sh:2`
reading "the 51st sweep" for the 52nd — and this checker could not see it,
because its grammar extracted only s{M}/S{M} tokens. The derivation's
substitution vocabulary has TWO token grammars; the assistant now enumerates
both:
  OWN(sweep-ordinal)      an {N}st/nd/rd/th token followed by "sweep"
                          (within SWEEP_CONTEXT chars) with
                          N == session - SWEEP_OFFSET       — fine
  OTHER(stale-sweep-ordinal)  the same shape with a wrong N — REPORT
  OWN(sessions-at)        a "{K} sessions at s{M}" with
                          K == M - SWEEP_OFFSET and M == N   — fine
  OTHER(sessions-at-mismatch)  the shape at the current session tag
                          with K != M - SWEEP_OFFSET      — REPORT
  OTHER(ordinal-review)   every other {N}st/nd/rd/th token and every
                          spelled THIRTY-{word}/thirty-{word} form
                          (the wave-history ordinals and the watch
                          target) — REPORT for review

SWEEP_OFFSET = 18 is the four-session verified lineage (s68->50th,
s69->51st, s70->52nd, s71->53rd). If the sweep convention ever shifts, the
flags fire and the reviewer adjusts the constant — the checker narrows the
audit, it does not replace the reviewer.

The REPORT list is the audit's candidate set: false positives (intentional
historical references — "since s66", the class-history mentions, the
s36/s35/s34/s13 fix lineage) are self-evident on review; a true positive is a
missed substitution. The checker NEVER gates (exit 0 always unless usage
errors) — it narrows the audit, it does not replace the reviewer.

Usage: python3 scripts/check-session-refs.py [TAG]   # TAG like s70; default:
the newest s{N}- tag present in scripts/ (the post-derivation audit scope).
"""
import re
import sys
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent

TOKEN = re.compile(r"\b([sS])(\d{1,3})\b")
RANGE = re.compile(r"\b[sS](\d{1,3})\s*[\u2013-]\s*[sS](\d{1,3})\b")
BASELINE_SHAPES = (
    "baseline",   # s{M}-baseline-entry.js filenames and echoes
    "records",    # "vs the s{M} records"
    "lineage",    # "the s{M} lineage"
    "pattern",    # "the s{M} pattern"
)

# --- the ordinal grammar (the s71 extension) -----------------------------
SWEEP_OFFSET = 18        # sweep_ordinal = session - 18 (s68->50th observed
                         # through s71->53rd; adjust only with reviewer
                         # evidence — see the docstring)
SWEEP_CONTEXT = 24       # chars after an ordinal to find the word "sweep"
ORDINAL = re.compile(r"\b(\d{1,3})(st|nd|rd|th)\b")
SPELLED_ORDINAL = re.compile(r"\bthirty-[a-z]+\b", re.IGNORECASE)
SESSIONS_AT = re.compile(r"\b(\d{1,3}) sessions at s(\d{1,3})\b")


def newest_tag() -> str:
    tags = [m.group(1) for p in SCRIPTS.iterdir()
            if (m := re.match(r"^(s\d+)-", p.name))]
    if not tags:
        print("no scripts/{TAG}-* files found")
        sys.exit(4)
    return max(tags, key=lambda t: int(t[1:]))


def tag_files(tag: str):
    return sorted(p for p in SCRIPTS.iterdir()
                  if p.name.startswith(f"{tag}-") or p.name.endswith(f"-{tag}.sh"))


def scan_file(path: Path, own: int):
    """Yield (line_no, token, kind) — session tokens in OWN/BASELINE/RANGE/
    OTHER, ordinals in OWN(sweep-ordinal)/OWN(sessions-at)/OTHER(...)."""
    text = path.read_text(encoding="utf-8", errors="replace")
    reports = []
    for i, line in enumerate(text.splitlines(), 1):
        # pass 1: find the ranges on this line, record their spans
        spans = []
        for m in RANGE.finditer(line):
            a, b = int(m.group(1)), int(m.group(2))
            spans.append((m.start(), m.end(), b))
        # pass 2: classify every session token, skipping range spans
        for m in TOKEN.finditer(line):
            letter, num = m.group(1), int(m.group(2))
            s, e = m.start(), m.end()
            inside = next((sp for sp in spans if sp[0] <= s < sp[1]), None)
            if inside is not None:
                # the token is part of a range: fine iff the range END is
                # current (N) or the just-measured baseline (N-1)
                end_num = inside[2]
                if end_num in (own, own - 1):
                    reports.append((i, m.group(0), "RANGE"))
                    continue
                reports.append((i, m.group(0), "OTHER(stale-range-end)"))
                continue
            if num == own:
                reports.append((i, m.group(0), "OWN"))
                continue
            if num == own - 1:
                rest = line[e:]
                if any(rest.lstrip(" ").startswith(w) or rest.startswith("-" + w)
                       for w in BASELINE_SHAPES):
                    reports.append((i, m.group(0), "BASELINE"))
                    continue
            reports.append((i, m.group(0), "OTHER"))
        # pass 3: the ordinal grammar (the s71 extension)
        sessions_at_spans = [(m.start(), m.end()) for m in SESSIONS_AT.finditer(line)]
        for m in SESSIONS_AT.finditer(line):
            k, sess = int(m.group(1)), int(m.group(2))
            if sess == own:
                kind = ("OWN(sessions-at)" if k == sess - SWEEP_OFFSET
                        else "OTHER(sessions-at-mismatch)")
            else:
                kind = "OTHER(ordinal-review)"  # a historical/stale session ref
            reports.append((i, f"{k} sessions at s{sess}", kind))
        for m in ORDINAL.finditer(line):
            if any(s <= m.start() < e for s, e in sessions_at_spans):
                continue  # already reported by the sessions-at shape
            num = int(m.group(1))
            rest = line[m.end():m.end() + SWEEP_CONTEXT]
            if "sweep" in rest:
                kind = ("OWN(sweep-ordinal)" if num == own - SWEEP_OFFSET
                        else "OTHER(stale-sweep-ordinal)")
            else:
                kind = "OTHER(ordinal-review)"
            reports.append((i, m.group(0), kind))
        for m in SPELLED_ORDINAL.finditer(line):
            reports.append((i, m.group(0), "OTHER(ordinal-review)"))
    return reports


def main() -> int:
    tag = sys.argv[1] if len(sys.argv) > 1 else newest_tag()
    m = re.match(r"^s(\d+)$", tag)
    if not m:
        print(f"usage: {sys.argv[0]} [sNN]   (got {tag!r})")
        return 2
    own = int(m.group(1))
    files = tag_files(tag)
    if not files:
        print(f"no scripts/{tag}-* files found")
        return 4
    print(f"post-derivation label audit — tag {tag} (own session {own}), "
          f"{len(files)} files")
    total_other = 0
    for p in files:
        reports = scan_file(p, own)
        others = [r for r in reports if r[2].startswith("OTHER")]
        total_other += len(others)
        counts = {}
        for _, _, kind in reports:
            counts[kind] = counts.get(kind, 0) + 1
        summary = " ".join(f"{k}={v}" for k, v in sorted(counts.items()))
        print(f"\n{p.name}: {summary or 'no session tokens'}")
        for ln, tok, kind in others:
            print(f"  REVIEW {p.name}:{ln}  {tok}  ({kind})")
    print(f"\nTOTAL review candidates: {total_other} "
          "(classify each: intentional historical reference, or a missed "
          "substitution to fix)")
    print("OK: the audit list is complete (the checker never gates — the "
          "reviewer decides)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
