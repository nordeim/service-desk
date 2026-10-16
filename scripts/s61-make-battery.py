#!/usr/bin/env python3
"""S61: generate the sweep battery from the s60 lineage (the 43rd parity sweep).

Edits vs the s60 lineage (the FIXED wave-analysis lineage — lesson 114):
  - S60 -> S61 renames, /tmp/s60-results -> /tmp/s61-results, s60-baselines -> s61-baselines
  - sweep ordinal: 42nd -> 43rd
  - wave watch: TWENTY-SIXTH -> TWENTY-SEVENTH (vs the s60 records)
  - standing entry figure: index-DRs9_-5K.js 101519 (the 26th-wave figure, the s60 record)
  - the login-CSS watch figure: index-DPOrvWRk.css 899411 (rotated at the 26th wave)
  - the 26th-wave casualties join the old lists: index-OG0wzUXG.js 101339 (the
    26th-wave entry casualty) + index-BCfnIRWB.css 901951 (the 26th-wave
    login-CSS casualty)
  - logoutReturnPath ordinal: 43rd -> 44th
  - the roundtrip fill AND check both carry the S61 title (the s58/s59/s60
    lineage convention held — no one-session-lag regression)
  - the chunk-ref baseline: /tmp/s60-results SURVIVED this session (no reset) —
    the s60 baseline entry re-fetched BY NAME anyway (index-DRs9_-5K.js, the
    standing re-fetch-by-name form kept)
  - the capture script saves its own /tmp/s61-baselines (the s58-s60 form kept)
  - POST-GENERATION DUTY (lesson 114): every generated script gets the
    undefined-name scan (scripts/check-undefined-names.py) BEFORE it runs
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


# ---------- 1. s61-ref-sweep.sh (from s60-ref-sweep.sh) ----------
sweep = (S / "s60-ref-sweep.sh").read_text()
sweep = sub(
    sweep,
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
    """# S61: the reference-side F1 bundle sweep (the 43rd parity sweep — watch for a
# TWENTY-SEVENTH /login wave vs the s60 records):
#   entry      index-DRs9_-5K.js   200  101519   (the s60 figure — the 26th-wave entry)
#   login CSS  index-DPOrvWRk.css  200  899411   (rotated at the 26th wave — the new standing figure)
#   stable     logoutReturnPath-HjtsxsFd.js (44 sessions, live 200, referenced)
#   old chunks index-OG0wzUXG.js 101339 (the 26th-wave casualty) / index-Da5vh3Iz.js
#              105258 (the 25th-wave casualty) / index-BQ2gMrp1.js 105258 (the
#              24th-wave casualty) / index-B8wmtmTR.js 105258 (the 23rd-wave
#              casualty) / index-C-ulo5ek.js 105055 / index-CneaUv24.js 104739 /
#              UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-BCfnIRWB.css 901951 (the 26th-wave login-CSS casualty) /
#              index-BIWjBcok.css 904487 (the 25th-wave login-CSS casualty) /
#              index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the s60 entry (re-fetched BY NAME —
#     /tmp/s60-results survived this session; the standing re-fetch form kept)""",
)
sweep = sub(sweep, "OUT=/tmp/s60-results", "OUT=/tmp/s61-results")
sweep = sub(
    sweep,
    """for c in "/static/index-OG0wzUXG.js" \\
         "/static/index-Da5vh3Iz.js" \\""",
    """for c in "/static/index-DRs9_-5K.js" \\
         "/static/index-OG0wzUXG.js" \\
         "/static/index-Da5vh3Iz.js" \\""",
)
sweep = sub(
    sweep,
    """         "/static/index-BCfnIRWB.css" \\
         "/static/index-BIWjBcok.css" \\""",
    """         "/static/index-DPOrvWRk.css" \\
         "/static/index-BCfnIRWB.css" \\
         "/static/index-BIWjBcok.css" \\""",
)
sweep = sub(sweep, 'echo "=== topology hash vs the s58 records (entry name in the HTML?) ==="',
                 'echo "=== topology hash vs the s59 records (entry name in the HTML?) ==="')
sweep = sub(sweep, 'grep -c "index-OG0wzUXG.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"',
                 'grep -c "index-DRs9_-5K.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"')
sweep = sub(sweep, 'grep -c "index-BCfnIRWB.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"',
                 'grep -c "index-DPOrvWRk.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"')
sweep = sub(
    sweep,
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
    """echo "=== the chunk-ref baseline comparison (vs the s60 entry, re-fetched BY NAME) ==="
# S61: /tmp/s60-results survived this session (no reset) — the s60 baseline
# entry is re-fetched by its known name anyway (the standing form).
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  curl -sL --max-time 30 "$REF/static/index-DRs9_-5K.js" -o "$OUT/s60-baseline-entry.js"
  for F in "$OUT/cur-entry.js" "$OUT/s60-baseline-entry.js"; do
    [ -s "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s "$OUT/s60-baseline-entry.js.chunkrefs.txt" ]; then
    python3 "$(dirname "$0")/s61-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" "$OUT/s60-baseline-entry.js.chunkrefs.txt"
  else
    echo "chunk-ref baseline unavailable (the s60 entry no longer serves) — the raw entry saved for ad-hoc diff"
  fi
  cp "$OUT/cur-entry.js" "$OUT/new-entry.js" 2>/dev/null || true
fi""",
)
w("s61-ref-sweep.sh", sweep)

# ---------- 2. s61-ref-surfaces.sh (from s60-ref-surfaces.sh) ----------
surf = (S / "s60-ref-surfaces.sh").read_text()
surf = sub(surf, "# S60: the reference-side F2–F4 live probes (the 42nd sweep)",
                "# S61: the reference-side F2–F4 live probes (the 43rd sweep)")
surf = sub(surf, "#   F3  their desktop overflow (the s4–s59 records: scrollWidth 1328 vs clientWidth 1280)",
                "#   F3  their desktop overflow (the s4–s60 records: scrollWidth 1328 vs clientWidth 1280)")
surf = sub(surf, "OUT=/tmp/s60-results", "OUT=/tmp/s61-results")
w("s61-ref-surfaces.sh", surf)

# ---------- 3. s61-ourside-verify.sh (from s60-ourside-verify.sh) ----------
ours = (S / "s60-ourside-verify.sh").read_text()
ours = sub(ours, "# S60: our-side parity verification battery (one process lifetime — the s48-s59 pattern)",
                "# S61: our-side parity verification battery (one process lifetime — the s48-s60 pattern)")
ours = sub(ours, "The UI round-trip runs in the dedicated s60-roundtrip.sh.",
                "The UI round-trip runs in the dedicated s61-roundtrip.sh.")
ours = sub(ours, "OUT=/tmp/s60-results/s60-ourside", "OUT=/tmp/s61-results/s61-ourside")
w("s61-ourside-verify.sh", ours)

# ---------- 4. s61-roundtrip.sh (from s60-roundtrip.sh) ----------
rt = (S / "s60-roundtrip.sh").read_text()
rt = sub(rt, "# S60: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's",
              "# S61: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's")
rt = sub(rt, "OUT=/tmp/s60-results/s60-ourside", "OUT=/tmp/s61-results/s61-ourside")
rt = sub(rt, 'The S60 verification probe — created through the real UI to confirm the create path end-to-end.',
              'The S61 verification probe — created through the real UI to confirm the create path end-to-end.')
rt = sub(rt, '"S60 remediation probe ticket"', '"S61 remediation probe ticket"', expect=1)
# the fill AND check both carry S61 (the s58/s59/s60 lineage convention — no lag)
rt = sub(rt, "document.body.innerText.includes('S60 remediation probe ticket')",
              "document.body.innerText.includes('S61 remediation probe ticket')")
rt = sub(rt, "bun scripts/s60-probe-cleanup.ts", "bun scripts/s61-probe-cleanup.ts")
w("s61-roundtrip.sh", rt)

# ---------- 5. s61-roundtrip-recheck.sh (from s60-roundtrip-recheck.sh) ----------
rtr = (S / "s60-roundtrip-recheck.sh").read_text()
rtr = sub(rtr, "# S60: re-check the probe listing on /mytickets with generous waits + content dump",
               "# S61: re-check the probe listing on /mytickets with generous waits + content dump")
rtr = sub(rtr, "OUT=/tmp/s60-results/s60-ourside", "OUT=/tmp/s61-results/s61-ourside")
rtr = sub(rtr, 'The S60 verification probe — created through the real UI to confirm the create path end-to-end.',
               'The S61 verification probe — created through the real UI to confirm the create path end-to-end.')
rtr = sub(rtr, '"S60 remediation probe ticket"', '"S61 remediation probe ticket"')
rtr = sub(rtr, "includes('S60 remediation probe ticket')", "includes('S61 remediation probe ticket')")
rtr = sub(rtr, "bun scripts/s60-probe-cleanup.ts", "bun scripts/s61-probe-cleanup.ts")
w("s61-roundtrip-recheck.sh", rtr)

# ---------- 6. s61-vlm-check.mjs (from s60-vlm-check.mjs) ----------
vlm = (S / "s60-vlm-check.mjs").read_text()
vlm = sub(vlm, "// S60: the paired desktop VLM parity check (the s45–s59 lineage — both dashboards in ONE prompt)",
               "// S61: the paired desktop VLM parity check (the s45–s60 lineage — both dashboards in ONE prompt)")
vlm = sub(vlm, "/tmp/s60-results/ref-dashboard.png", "/tmp/s61-results/ref-dashboard.png")
vlm = sub(vlm, "/tmp/s60-results/s60-ourside/our-dashboard.png", "/tmp/s61-results/s61-ourside/our-dashboard.png")
w("s61-vlm-check.mjs", vlm)

# ---------- 7. s61-vlm-shotdiff.mjs (from s60-vlm-shotdiff.mjs) ----------
sd = (S / "s60-vlm-shotdiff.mjs").read_text()
sd = sub(sd, "// S60: VLM-diff the changed screenshot shots vs the s59 baselines (the s49–s59",
               "// S61: VLM-diff the changed screenshot shots vs the s60 baselines (the s49–s60")
sd = sub(sd, "// drift; 09 the S60 fixture title).",
               "// drift; 09 the S61 fixture title).")
sd = sub(sd, "{ shot: '09-ticket-detail-attachments', why: 'the S60 fixture title (the per-session fixture ticket) plus relative-time text' }",
               "{ shot: '09-ticket-detail-attachments', why: 'the S61 fixture title (the per-session fixture ticket) plus relative-time text' }")
sd = sub(sd, "/tmp/s60-baselines/", "/tmp/s61-baselines/")
w("s61-vlm-shotdiff.mjs", sd)

# ---------- 8. s61-probe-cleanup.ts (from s60-probe-cleanup.ts) ----------
pc = (S / "s60-probe-cleanup.ts").read_text()
pc = sub(pc, "// S60: verify the probe ticket + cleanup + the canonical seed check (the s45–s53 lineage)",
               "// S61: verify the probe ticket + cleanup + the canonical seed check (the s45–s54 lineage)")
pc = sub(pc, 'title: { contains: "S60" }', 'title: { contains: "S61" }')
w("s61-probe-cleanup.ts", pc)

# ---------- 9. s61-entry-compare.py (from s60-entry-compare.py) ----------
ec = (S / "s60-entry-compare.py").read_text()
ec = sub(ec, '"""S60: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s60-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt',
              '"""S61: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s61-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt')
w("s61-entry-compare.py", ec)

# ---------- 10. s61-wave-analysis.py (from s60-wave-analysis.py — the FIXED lineage) ----------
wa = (S / "s60-wave-analysis.py").read_text()
wa = sub(wa, '"""S60: robust basename-vs-hash comparison of the s59 vs s60 entry chunk refs."""',
              '"""S61: robust basename-vs-hash comparison of the s60 vs s61 entry chunk refs."""')
wa = sub(wa, "cur_b, cur_p = refs('/tmp/s60-results/cur-chunkrefs.txt')",
              "cur_b, cur_p = refs('/tmp/s61-results/cur-chunkrefs.txt')")
wa = sub(wa, "s59_b, s59_p = refs('/tmp/s60-results/s59-baseline-entry.js.chunkrefs.txt')",
              "s60_b, s60_p = refs('/tmp/s61-results/s60-baseline-entry.js.chunkrefs.txt')")
wa = wa.replace("s59_b", "s60_b").replace("s59_p", "s60_p")
wa = sub(wa, 'print(f"basenames: now={len(cur_b)} s59={len(s60_b)}")',
              'print(f"basenames: now={len(cur_b)} s60={len(s60_b)}")')  # the label after the var renames
w("s61-wave-analysis.py", wa)

# ---------- 11. capture-screenshots-s61.sh (from s60 lineage) ----------
cap = (S / "capture-screenshots-s60.sh").read_text()
cap = sub(cap, "# Session-48 screenshot refresh carried to s60 (production standalone server on :3000, demo",
               "# Session-48 screenshot refresh carried to s61 (production standalone server on :3000, demo")
cap = sub(cap, "# Lineage: the s45 script carried forward VERBATIM (the s60 lineage refresh noted) (which itself carries the",
               "# Lineage: the s45 script carried forward VERBATIM (the s61 lineage refresh noted) (which itself carries the")
cap = sub(cap, "# S60: boot the standalone server inside this script's process lifetime",
               "# S61: boot the standalone server inside this script's process lifetime")
cap = sub(cap, "/tmp/s60-capture-server.log", "/tmp/s61-capture-server.log")
cap = sub(cap, 'mkdir -p /tmp/s60-baselines\ncp docs/screenshots/*.png /tmp/s60-baselines/ 2>/dev/null || true',
               'mkdir -p /tmp/s61-baselines\ncp docs/screenshots/*.png /tmp/s61-baselines/ 2>/dev/null || true')
cap = sub(cap, '\\"S60 screenshot fixture (removed after capture)\\"', '\\"S61 screenshot fixture (removed after capture)\\"', expect=1)
cap = sub(cap, 'Temporary two-attachment fixture for the session-60 screenshot. Deleted after the shots.',
               'Temporary two-attachment fixture for the session-61 screenshot. Deleted after the shots.')
w("capture-screenshots-s61.sh", cap)

print("\nS61 battery generated: 11 scripts")
print("NEXT (lesson 114): run scripts/check-undefined-names.py --check before running any of them")
