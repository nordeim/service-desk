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

The HYPHENATED grammar (the s72 extension — the third token vocabulary,
the lesson-125 limit one grammar further out): the s70/s71 derivations both
missed the hyphenated form — the capture script's fixture description
shipped committed reading "the session-69 screenshot" through the s70 AND
s71 derivations (the per-session label should have read session-70 at s70,
session-71 at s71), invisible to the s{M}/S{M} grammar because the hyphen
breaks the \b[sS]\d match (the letter never directly precedes the digits).
The assistant now enumerates the third vocabulary:
  OWN(session-hyphen)      a session-{N} token with N == the tag    — fine
  OTHER(session-hyphen-review)  any other session-{N} token      — REPORT
                           (the known intentional historical forms — the
                           "session-13 detail screenshot fixture" payload
                           pair, self-consistent across the base64 payload
                           and the INLINE_CHECK match — are reviewer-
                           classified, the never-gates shape)

The BASELINE-ENTRY shape (the s72 companion — the review-missed stale
label): `s71-ref-sweep.sh:20` shipped committed reading "vs the s68 entry"
while its own body reconstructed the s70 baseline — the checker DID flag
the token (plain OTHER) at s70 and s71, and the review classified it
intentional both times (the label reads plausible: the s68-era entry file
IS the same index-DCDf2KCA.js). The shape now carries its own
classification so the invariant surfaces in the kind:
  BASELINE                 an s{N-1} token in the "entry" shape     — fine
  OTHER(stale-baseline-entry)  an entry-shaped token at any other
                           value                            — REPORT
                           (the baseline-entry context demands the
                           previous session; the named kind makes the
                           review miss harder)

The UNDERSCORE-DOC grammar (the s73 extension — the FOURTH token vocabulary,
the lesson-126 limit one grammar further out): the derivation's substitution
vocabulary carries a fourth grammar the checker could not see — the
transcript-doc number in the underscore form (`session_{M}`). The RED proofs
(measured live at s73): the correct `session_134` token in the derived
s73-ci-status.py produced ZERO checker reports, and a reintroduced stale
`session_132` mutation produced ZERO flags — the class is structurally
blind because the underscore breaks both the [sS]-before-digits adjacency
(the TOKEN grammar) and the hyphenated `session-{N}` form. The form carries
a DERIVABLE invariant — the operator-transcript convention M = 2N-12 (the
seven-file lineage measured holding: s67->session_122, s68->session_124,
s69->session_126, s70->session_128, s71->session_130, s72->session_132,
s73->session_134). The assistant now enumerates the fourth vocabulary:
  OWN(transcript-doc)      a session_{M} token with M == 2N-12       — fine
  OTHER(transcript-doc-review)  any other session_{M} token       — REPORT
                           (the doc-align scripts' historical tokens
                           and any stale derivation carry — reviewer-
                           classified, the never-gates shape)

The FIGURE-SHAPE grammar (the s74 extension — the FIFTH token vocabulary,
the BASELINE_SHAPES completion, the s72 closure's own measured limit one
shape further out): the ref-sweep header's wave-entry figure labels —
"the s{M} figure" — were invisible to every named classification (plain
OTHER, the exact pool the s72 closure drained for the "entry" sibling
shape in the SAME header family; measured live at s74: the correct label
and a stale-label mutation reported IDENTICALLY). The label semantics is
an ATTRIBUTION: it names the session that MEASURED the current figure —
a FRESH figure (rotated at the previous session) carries M == N-1, a
hash-stable figure keeps its original measuring session (M < N-1, the
intentional historical form). The assistant now enumerates the fifth
vocabulary:
  BASELINE                 a figure-shaped token at M == N-1      — fine
  OTHER(baseline-figure-review)  a figure-shaped token at any
                           other value                        — REPORT
                           (the attribution case — reviewer-classified
                           against the wave ledger (the ref-sweep
                           header's retired-chunks history), the
                           never-gates shape held; the named kind makes
                           the review miss harder, the s72 form)

The CONTEXT-TOKEN remainder (the s73/s74/s75 honest record — no grammar, a
standing manual checklist): the derivation's substitution vocabulary
ALSO carries invariant-less tokens NO classification can check — the
s73 set (the operator-commit hash, the transcript-doc number, the
CI-run number, and the pin-3 line number: each an opaque per-session
value) PLUS the s74 additions (the WAVE-FIGURE pairs — the entry +
login-CSS hash/byte figures, opaque measured values labeled by the
figure attribution; the ERA ORDINAL — "the FIFTH of the era", the
red-at-pull count, event-driven not derivable; and the red-at-pull
PATTERN LIST — s67/s68/s72/s73, the event history) PLUS the s75
addition (the SESSION-DOC NEXT-WATCH ordinal — the closing line's
"watch for a THIRTY-{N}th /login wave" is DERIVABLE from the doc's own
closeout ledger: a found-wave closeout ("THE THIRTY-{M}th wave — a
REAL rotation") implies N == M+1, a no-wave closeout ("NO THIRTY-{M}th
wave") implies N == M; the s74 doc shipped THIRTY-SEVENTH against its
own "NO THIRTY-SIXTH" closeout — the off-by-one slip, corrected at
s75 (session_137.md line 30, the s75 remediation P1); every future
session-doc closeout derives its next-watch line from its own closeout
ledger, and if the slip class recurs the doc-scope extension of this
checker is the documented next step) PLUS the s76
addition (the LOGIN-PAIR sweep-coverage duty — the paired VLM check's
capture set derives from the SURFACE the rotated asset styles: the
s45–s75 battery compared post-login dashboards only, so the login
page (the surface the rotating login CSS directly styles) had NO
reference-side capture — the 37th-wave CSS rotation (the second in
three waves after the 35th at s73) exposed the coverage gap; the
s76-vlm-check.mjs login pair (the reference /login pre-auth capture +
our /login pre-auth capture, the same LAYOUT-OK form) is the closure,
and every future derivation carries the pair forward verbatim — when
the login CSS rotates, the login pair MUST run). No classification
can check them; the closure documents them HERE as the standing manual
derivation checklist — every future scripts/{TAG}-* derivation MUST
enumerate ALL of them to keep the derived context correct. (The
standing CI control-run constants #177/38948165037 are never bumped —
they are the calibration anchors, not per-session context.)

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
    "entry",      # "vs the s{M} entry" / "{M} entry fetch" (the s72
                  # baseline-entry shape — the context demands M == N-1)
    "figure",     # "the s{M} figure" (the s74 BASELINE_SHAPES completion —
                  # the wave-entry figure label; the FRESH figure carries
                  # M == N-1, the attribution case joins the review list)
)

# --- the ordinal grammar (the s71 extension) -----------------------------
SWEEP_OFFSET = 18        # sweep_ordinal = session - 18 (s68->50th observed
                         # through s71->53rd; adjust only with reviewer
                         # evidence — see the docstring)
SWEEP_CONTEXT = 24       # chars after an ordinal to find the word "sweep"
ORDINAL = re.compile(r"\b(\d{1,3})(st|nd|rd|th)\b")
SPELLED_ORDINAL = re.compile(r"\bthirty-[a-z]+\b", re.IGNORECASE)
SESSIONS_AT = re.compile(r"\b(\d{1,3}) sessions at s(\d{1,3})\b")

# --- the hyphenated grammar (the s72 extension — the third vocabulary) ---
HYPHENATED = re.compile(r"\bsession-(\d{1,3})\b")

# --- the underscore-doc grammar (the s73 extension — the fourth
# vocabulary: the transcript-doc number in the session_{M} form) ----------
UNDERSCORE = re.compile(r"\bsession_(\d{1,3})\b")
TRANSCRIPT_OFFSET = 12  # transcript_doc = 2N - 12 (the seven-file lineage
                        # session_122 at s67 measured through session_134
                        # at s73; adjust only with reviewer evidence —
                        # see the docstring)


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
            else:
                # the baseline-entry shape (the s72 companion): an
                # entry-shaped token at a value BELOW own-1 is the stale
                # baseline label — the named kind surfaces the invariant
                # (the context demands the previous session's entry)
                rest = line[e:]
                if rest.lstrip(" ").startswith("entry") or rest.startswith("-entry"):
                    reports.append((i, m.group(0), "OTHER(stale-baseline-entry)"))
                    continue
                # the figure shape (the s74 extension — the FIFTH token
                # vocabulary, the BASELINE_SHAPES completion): a
                # figure-shaped token at any value OTHER than own-1 is the
                # attribution case — the label names the session that
                # MEASURED the current figure (a hash-stable figure keeps
                # its original measuring session, a fresh figure carries
                # own-1). Reviewer-classified against the wave ledger (the
                # ref-sweep header's retired-chunks history), never gates.
                if rest.lstrip(" ").startswith("figure") or rest.startswith("-figure"):
                    reports.append((i, m.group(0), "OTHER(baseline-figure-review)"))
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
        # pass 4: the hyphenated grammar (the s72 extension — the third
        # vocabulary; no span overlap with TOKEN: the hyphen breaks the
        # [sS]-before-digits adjacency, so the two grammars are disjoint)
        for m in HYPHENATED.finditer(line):
            num = int(m.group(1))
            kind = ("OWN(session-hyphen)" if num == own
                    else "OTHER(session-hyphen-review)")
            reports.append((i, m.group(0), kind))
        # pass 5: the underscore-doc grammar (the s73 extension — the
        # FOURTH vocabulary; no span overlap with TOKEN or HYPHENATED: the
        # underscore breaks both the [sS]-adjacency and the session- form,
        # so the three grammars are disjoint)
        for m in UNDERSCORE.finditer(line):
            num = int(m.group(1))
            kind = ("OWN(transcript-doc)"
                    if num == 2 * own - TRANSCRIPT_OFFSET
                    else "OTHER(transcript-doc-review)")
            reports.append((i, m.group(0), kind))
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
