#!/usr/bin/env python3
"""S60: generate the sweep battery from the s59 lineage (the 42nd parity sweep).

Edits vs the s59 lineage:
  - S59 -> S60 renames, /tmp/s59-results -> /tmp/s60-results, s59-baselines -> s60-baselines
  - sweep ordinal: 41st -> 42nd
  - wave watch: TWENTY-FIFTH -> TWENTY-SIXTH (vs the s59 records)
  - standing entry figure: index-OG0wzUXG.js 101339 (the 25th-wave figure, the s59 record)
  - the login-CSS watch figure: index-BCfnIRWB.css 901951 (FIRST rotated at the 25th wave)
  - the 25th-wave casualties join the old lists: index-Da5vh3Iz.js (the 24th-wave
    entry, already listed) + index-BIWjBcok.css 904487 (the login-CSS casualty)
  - logoutReturnPath ordinal: 42nd -> 43rd
  - the roundtrip fill AND check both carry the S60 title (the s58/s59 lineage
    convention held — no one-session-lag regression)
  - the chunk-ref baseline: /tmp/s59-results wiped by the workspace reset —
    the s59 baseline entry re-fetched BY NAME (index-OG0wzUXG.js), the
    s58/s59 re-fetch-by-name adaptation carried forward
  - the capture script saves its own /tmp/s60-baselines (the s58/s59 form kept)
"""
import pathlib

S = pathlib.Path("/home/z/my-project/service-desk/scripts")


def w(name, text):
    (S / name).write_text(text)
    print(f"wrote {name} ({len(text.splitlines())} lines)")


def sub(text, old, new, expect=1):
    n = text.count(old)
    assert n == expect, f"expected {expect} of {old!r}, found {n}"
    return text.replace(old, new)


# ---------- 1. s60-ref-sweep.sh (from s59-ref-sweep.sh) ----------
sweep = (S / "s59-ref-sweep.sh").read_text()
sweep = sub(
    sweep,
    """# S59: the reference-side F1 bundle sweep (the 41st parity sweep — watch for a
# TWENTY-FIFTH /login wave vs the s58 records):
#   entry      index-Da5vh3Iz.js   200  105258   (the s58 figure — the 24th-wave entry)
#   login CSS  index-BIWjBcok.css  200  904487   (hash-stable through the 24th wave)
#   stable     logoutReturnPath-HjtsxsFd.js (42 sessions, live 200, referenced)
#   old chunks index-BQ2gMrp1.js 105258 (the 24th-wave casualty) / index-B8wmtmTR.js
#              105258 (the 23rd-wave casualty) / index-C-ulo5ek.js 105055 /
#              index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761
#              (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the s58 entry (re-fetched BY NAME —
#     the workspace reset wiped /tmp/s58-results; the lineage form kept)""",
    """# S60: the reference-side F1 bundle sweep (the 42nd parity sweep — watch for a
# TWENTY-SIXTH /login wave vs the s59 records):
#   entry      index-OG0wzUXG.js   200  101339   (the s59 figure — the 25th-wave entry)
#   login CSS  index-BCfnIRWB.css  200  901951   (rotated at the 25th wave — the new standing figure)
#   stable     logoutReturnPath-HjtsxsFd.js (43 sessions, live 200, referenced)
#   old chunks index-Da5vh3Iz.js 105258 (the 25th-wave casualty) / index-BQ2gMrp1.js
#              105258 (the 24th-wave casualty) / index-B8wmtmTR.js 105258 (the
#              23rd-wave casualty) / index-C-ulo5ek.js 105055 / index-CneaUv24.js
#              104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-BIWjBcok.css 904487 (the 25th-wave login-CSS casualty) /
#              index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the s59 entry (re-fetched BY NAME —
#     the workspace reset wiped /tmp/s59-results; the lineage form kept)""",
)
sweep = sub(sweep, "OUT=/tmp/s59-results", "OUT=/tmp/s60-results")
sweep = sub(
    sweep,
    """for c in "/static/index-Da5vh3Iz.js" \\
         "/static/index-BQ2gMrp1.js" \\
         "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
    """for c in "/static/index-OG0wzUXG.js" \\
         "/static/index-Da5vh3Iz.js" \\
         "/static/index-BQ2gMrp1.js" \\
         "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
)
sweep = sub(
    sweep,
    """         "/static/index-BIWjBcok.css" \\
         "/static/index-D0Q6-tUz.css"; do""",
    """         "/static/index-BCfnIRWB.css" \\
         "/static/index-BIWjBcok.css" \\
         "/static/index-D0Q6-tUz.css"; do""",
)
sweep = sub(sweep, 'echo "=== topology hash vs the s57 records (entry name in the HTML?) ==="',
                 'echo "=== topology hash vs the s58 records (entry name in the HTML?) ==="')
sweep = sub(sweep, 'grep -c "index-Da5vh3Iz.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"',
                 'grep -c "index-OG0wzUXG.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"')
sweep = sub(sweep, 'grep -c "index-BIWjBcok.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"',
                 'grep -c "index-BCfnIRWB.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"')
sweep = sub(
    sweep,
    """echo "=== the chunk-ref baseline comparison (vs the s58 entry, re-fetched BY NAME) ==="
# S59: the workspace reset wiped /tmp/s58-results — the s58 baseline entry is
# re-fetched by its known name (prior entries stay live per the s56 records).
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  curl -sL --max-time 30 "$REF/static/index-Da5vh3Iz.js" -o "$OUT/s58-baseline-entry.js"
  for F in "$OUT/cur-entry.js" "$OUT/s58-baseline-entry.js"; do
    [ -s "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s "$OUT/s58-baseline-entry.js.chunkrefs.txt" ]; then
    python3 "$(dirname "$0")/s59-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" "$OUT/s58-baseline-entry.js.chunkrefs.txt"
  else
    echo "chunk-ref baseline unavailable (the s58 entry no longer serves) — the raw entry saved for ad-hoc diff"
  fi
  cp "$OUT/cur-entry.js" "$OUT/new-entry.js" 2>/dev/null || true
fi""",
    """echo "=== the chunk-ref baseline comparison (vs the s59 entry, re-fetched BY NAME) ==="
# S60: the workspace reset wiped /tmp/s59-results — the s59 baseline entry is
# re-fetched by its known name (prior entries stay live per the s56 records).
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  curl -sL --max-time 30 "$REF/static/index-OG0wzUXG.js" -o "$OUT/s59-baseline-entry.js"
  for F in "$OUT/cur-entry.js" "$OUT/s59-baseline-entry.js"; do
    [ -s "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s "$OUT/s59-baseline-entry.js.chunkrefs.txt" ]; then
    python3 "$(dirname "$0")/s60-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" "$OUT/s59-baseline-entry.js.chunkrefs.txt"
  else
    echo "chunk-ref baseline unavailable (the s59 entry no longer serves) — the raw entry saved for ad-hoc diff"
  fi
  cp "$OUT/cur-entry.js" "$OUT/new-entry.js" 2>/dev/null || true
fi""",
)
w("s60-ref-sweep.sh", sweep)

# ---------- 2. s60-ref-surfaces.sh (from s59-ref-surfaces.sh) ----------
surf = (S / "s59-ref-surfaces.sh").read_text()
surf = sub(surf, "# S59: the reference-side F2–F4 live probes (the 41st sweep)",
                "# S60: the reference-side F2–F4 live probes (the 42nd sweep)")
surf = sub(surf, "#   F3  their desktop overflow (the s4–s58 records: scrollWidth 1328 vs clientWidth 1280)",
                "#   F3  their desktop overflow (the s4–s59 records: scrollWidth 1328 vs clientWidth 1280)")
surf = sub(surf, "OUT=/tmp/s59-results", "OUT=/tmp/s60-results")
w("s60-ref-surfaces.sh", surf)

# ---------- 3. s60-ourside-verify.sh (from s59-ourside-verify.sh) ----------
ours = (S / "s59-ourside-verify.sh").read_text()
ours = sub(ours, "# S59: our-side parity verification battery (one process lifetime — the s48-s58 pattern)",
                "# S60: our-side parity verification battery (one process lifetime — the s48-s59 pattern)")
ours = sub(ours, "The UI round-trip runs in the dedicated s59-roundtrip.sh.",
                "The UI round-trip runs in the dedicated s60-roundtrip.sh.")
ours = sub(ours, "OUT=/tmp/s59-results/s59-ourside", "OUT=/tmp/s60-results/s60-ourside")
w("s60-ourside-verify.sh", ours)

# ---------- 4. s60-roundtrip.sh (from s59-roundtrip.sh) ----------
rt = (S / "s59-roundtrip.sh").read_text()
rt = sub(rt, "# S59: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's",
              "# S60: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's")
rt = sub(rt, "OUT=/tmp/s59-results/s59-ourside", "OUT=/tmp/s60-results/s60-ourside")
rt = sub(rt, 'The S59 verification probe — created through the real UI to confirm the create path end-to-end.',
              'The S60 verification probe — created through the real UI to confirm the create path end-to-end.')
rt = sub(rt, '"S59 remediation probe ticket"', '"S60 remediation probe ticket"', expect=1)
# the fill AND check both carry S60 (the s58/s59 lineage convention — no lag)
rt = sub(rt, "document.body.innerText.includes('S59 remediation probe ticket')",
              "document.body.innerText.includes('S60 remediation probe ticket')")
rt = sub(rt, "bun scripts/s59-probe-cleanup.ts", "bun scripts/s60-probe-cleanup.ts")
w("s60-roundtrip.sh", rt)

# ---------- 5. s60-roundtrip-recheck.sh (from s59-roundtrip-recheck.sh) ----------
rtr = (S / "s59-roundtrip-recheck.sh").read_text()
rtr = sub(rtr, "# S59: re-check the probe listing on /mytickets with generous waits + content dump",
               "# S60: re-check the probe listing on /mytickets with generous waits + content dump")
rtr = sub(rtr, "OUT=/tmp/s59-results/s59-ourside", "OUT=/tmp/s60-results/s60-ourside")
rtr = sub(rtr, 'The S59 verification probe — created through the real UI to confirm the create path end-to-end.',
               'The S60 verification probe — created through the real UI to confirm the create path end-to-end.')
rtr = sub(rtr, '"S59 remediation probe ticket"', '"S60 remediation probe ticket"')
rtr = sub(rtr, "includes('S59 remediation probe ticket')", "includes('S60 remediation probe ticket')")
rtr = sub(rtr, "bun scripts/s59-probe-cleanup.ts", "bun scripts/s60-probe-cleanup.ts")
w("s60-roundtrip-recheck.sh", rtr)

# ---------- 6. s60-vlm-check.mjs (from s59-vlm-check.mjs) ----------
vlm = (S / "s59-vlm-check.mjs").read_text()
vlm = sub(vlm, "// S59: the paired desktop VLM parity check (the s45–s58 lineage — both dashboards in ONE prompt)",
               "// S60: the paired desktop VLM parity check (the s45–s59 lineage — both dashboards in ONE prompt)")
vlm = sub(vlm, "/tmp/s59-results/ref-dashboard.png", "/tmp/s60-results/ref-dashboard.png")
vlm = sub(vlm, "/tmp/s59-results/s59-ourside/our-dashboard.png", "/tmp/s60-results/s60-ourside/our-dashboard.png")
w("s60-vlm-check.mjs", vlm)

# ---------- 7. s60-vlm-shotdiff.mjs (from s59-vlm-shotdiff.mjs) ----------
sd = (S / "s59-vlm-shotdiff.mjs").read_text()
sd = sub(sd, "// S59: VLM-diff the changed screenshot shots vs the s58 baselines (the s49–s58",
               "// S60: VLM-diff the changed screenshot shots vs the s59 baselines (the s49–s59")
sd = sub(sd, "// drift; 09 the S59 fixture title).",
               "// drift; 09 the S60 fixture title).")
sd = sub(sd, "{ shot: '09-ticket-detail-attachments', why: 'the S59 fixture title (the per-session fixture ticket) plus relative-time text' }",
               "{ shot: '09-ticket-detail-attachments', why: 'the S60 fixture title (the per-session fixture ticket) plus relative-time text' }")
sd = sub(sd, "/tmp/s59-baselines/", "/tmp/s60-baselines/")
w("s60-vlm-shotdiff.mjs", sd)

# ---------- 8. s60-probe-cleanup.ts (from s59-probe-cleanup.ts) ----------
pc = (S / "s59-probe-cleanup.ts").read_text()
pc = sub(pc, "// S59: verify the probe ticket + cleanup + the canonical seed check (the s45–s52 lineage)",
               "// S60: verify the probe ticket + cleanup + the canonical seed check (the s45–s53 lineage)")
pc = sub(pc, 'title: { contains: "S59" }', 'title: { contains: "S60" }')
w("s60-probe-cleanup.ts", pc)

# ---------- 9. s60-entry-compare.py (from s59-entry-compare.py) ----------
ec = (S / "s59-entry-compare.py").read_text()
ec = sub(ec, '"""S59: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s59-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt',
              '"""S60: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s60-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt')
w("s60-entry-compare.py", ec)

# ---------- 10. s60-wave-analysis.py (from s59-wave-analysis.py) ----------
wa = (S / "s59-wave-analysis.py").read_text()
wa = sub(wa, '"""S59: robust basename-vs-hash comparison of the s58 vs s59 entry chunk refs."""',
              '"""S60: robust basename-vs-hash comparison of the s59 vs s60 entry chunk refs."""')
wa = sub(wa, "cur_b, cur_p = refs('/tmp/s59-results/cur-chunkrefs.txt')",
              "cur_b, cur_p = refs('/tmp/s60-results/cur-chunkrefs.txt')")
wa = sub(wa, "s58_b, s58_p = refs('/tmp/s59-results/s58-baseline-entry.js.chunkrefs.txt')",
              "s59_b, s59_p = refs('/tmp/s60-results/s59-baseline-entry.js.chunkrefs.txt')")
wa = wa.replace("s58_b", "s59_b").replace("s58_p", "s59_p")
wa = sub(wa, 'print(f"basenames: now={len(cur_b)} s58={len(s59_b)}")',
              'print(f"basenames: now={len(cur_b)} s59={len(s59_b)}")')  # the label after the var renames
w("s60-wave-analysis.py", wa)

# ---------- 11. capture-screenshots-s60.sh (from s59 lineage) ----------
cap = (S / "capture-screenshots-s59.sh").read_text()
cap = sub(cap, "# Session-48 screenshot refresh carried to s59 (production standalone server on :3000, demo",
               "# Session-48 screenshot refresh carried to s60 (production standalone server on :3000, demo")
cap = sub(cap, "# Lineage: the s45 script carried forward VERBATIM (the s59 lineage refresh noted) (which itself carries the",
               "# Lineage: the s45 script carried forward VERBATIM (the s60 lineage refresh noted) (which itself carries the")
cap = sub(cap, "# S59: boot the standalone server inside this script's process lifetime",
               "# S60: boot the standalone server inside this script's process lifetime")
cap = sub(cap, "/tmp/s59-capture-server.log", "/tmp/s60-capture-server.log")
cap = sub(cap, 'mkdir -p /tmp/s59-baselines\ncp docs/screenshots/*.png /tmp/s59-baselines/ 2>/dev/null || true',
               'mkdir -p /tmp/s60-baselines\ncp docs/screenshots/*.png /tmp/s60-baselines/ 2>/dev/null || true')
cap = sub(cap, '\\"S59 screenshot fixture (removed after capture)\\"', '\\"S60 screenshot fixture (removed after capture)\\"', expect=1)
cap = sub(cap, 'Temporary two-attachment fixture for the session-59 screenshot. Deleted after the shots.',
               'Temporary two-attachment fixture for the session-60 screenshot. Deleted after the shots.')
w("capture-screenshots-s60.sh", cap)

print("\nS60 battery generated: 11 scripts")
