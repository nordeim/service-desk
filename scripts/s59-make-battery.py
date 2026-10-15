#!/usr/bin/env python3
"""S59: generate the sweep battery from the s58 lineage (the 41st parity sweep).

Edits vs the s58 lineage:
  - S58 -> S59 renames, /tmp/s58-results -> /tmp/s59-results, s58-baselines -> s59-baselines
  - sweep ordinal: 40th -> 41st
  - wave watch: TWENTY-FOURTH -> TWENTY-FIFTH (vs the s58 records)
  - standing entry figure: index-Da5vh3Iz.js 105258 (the 24th-wave figure, the s58 record)
  - the 24th-wave casualty index-BQ2gMrp1.js joins the old-chunks list
  - logoutReturnPath ordinal: 41st -> 42nd
  - the roundtrip fill AND check both carry the S59 title (the s58 lineage
    convention held — no one-session-lag regression)
  - the chunk-ref baseline: /tmp/s58-results wiped by the workspace reset —
    the s58 baseline entry re-fetched BY NAME (index-Da5vh3Iz.js), the
    s58 re-fetch-by-name adaptation carried forward
  - the capture script saves its own /tmp/s59-baselines (the s58 form kept)
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


# ---------- 1. s59-ref-sweep.sh (from s58-ref-sweep.sh) ----------
sweep = (S / "s58-ref-sweep.sh").read_text()
sweep = sub(
    sweep,
    """# S58: the reference-side F1 bundle sweep (the 40th parity sweep — watch for a
# TWENTY-FOURTH /login wave vs the s57 records):
#   entry      index-BQ2gMrp1.js   200  105258   (the s57 figure — the 23rd-wave entry)
#   login CSS  index-BIWjBcok.css  200  904487   (hash-stable through the 23rd wave)
#   stable     logoutReturnPath-HjtsxsFd.js (41 sessions, live 200, referenced)
#   old chunks index-B8wmtmTR.js 105258 (the 23rd-wave casualty) / index-C-ulo5ek.js
#              105055 / index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761
#              (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the s57 entry (re-fetched BY NAME —
#     the workspace reset wiped /tmp/s57-results; the lineage form kept)""",
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
)
sweep = sub(sweep, "OUT=/tmp/s58-results", "OUT=/tmp/s59-results")
sweep = sub(
    sweep,
    """for c in "/static/index-BQ2gMrp1.js" \\
         "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
    """for c in "/static/index-Da5vh3Iz.js" \\
         "/static/index-BQ2gMrp1.js" \\
         "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
)
sweep = sub(sweep, 'grep -c "index-BQ2gMrp1.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"',
                 'grep -c "index-Da5vh3Iz.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"')
sweep = sub(
    sweep,
    """echo "=== the chunk-ref baseline comparison (vs the s57 entry, re-fetched BY NAME) ==="
# S58: the workspace reset wiped /tmp/s57-results — the s57 baseline entry is
# re-fetched by its known name (prior entries stay live per the s56 records).
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  curl -sL --max-time 30 "$REF/static/index-BQ2gMrp1.js" -o "$OUT/s57-baseline-entry.js"
  for F in "$OUT/cur-entry.js" "$OUT/s57-baseline-entry.js"; do
    [ -s "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s "$OUT/s57-baseline-entry.js.chunkrefs.txt" ]; then
    python3 "$(dirname "$0")/s58-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" "$OUT/s57-baseline-entry.js.chunkrefs.txt"
  else
    echo "chunk-ref baseline unavailable (the s57 entry no longer serves) — the raw entry saved for ad-hoc diff"
  fi
  cp "$OUT/cur-entry.js" "$OUT/new-entry.js" 2>/dev/null || true
fi""",
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
)
w("s59-ref-sweep.sh", sweep)

# ---------- 2. s59-ref-surfaces.sh (from s58-ref-surfaces.sh) ----------
surf = (S / "s58-ref-surfaces.sh").read_text()
surf = sub(surf, "# S58: the reference-side F2–F4 live probes (the 40th sweep)",
                "# S59: the reference-side F2–F4 live probes (the 41st sweep)")
surf = sub(surf, "#   F3  their desktop overflow (the s4–s57 records: scrollWidth 1328 vs clientWidth 1280)",
                "#   F3  their desktop overflow (the s4–s58 records: scrollWidth 1328 vs clientWidth 1280)")
surf = sub(surf, "OUT=/tmp/s58-results", "OUT=/tmp/s59-results")
w("s59-ref-surfaces.sh", surf)

# ---------- 3. s59-ourside-verify.sh (from s58-ourside-verify.sh) ----------
ours = (S / "s58-ourside-verify.sh").read_text()
ours = sub(ours, "# S58: our-side parity verification battery (one process lifetime — the s48-s57 pattern)",
                "# S59: our-side parity verification battery (one process lifetime — the s48-s58 pattern)")
ours = sub(ours, "The UI round-trip runs in the dedicated s58-roundtrip.sh.",
                "The UI round-trip runs in the dedicated s59-roundtrip.sh.")
ours = sub(ours, "OUT=/tmp/s58-results/s58-ourside", "OUT=/tmp/s59-results/s59-ourside")
w("s59-ourside-verify.sh", ours)

# ---------- 4. s59-roundtrip.sh (from s58-roundtrip.sh) ----------
rt = (S / "s58-roundtrip.sh").read_text()
rt = sub(rt, "# S58: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's",
              "# S59: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's")
rt = sub(rt, "OUT=/tmp/s58-results/s58-ourside", "OUT=/tmp/s59-results/s59-ourside")
rt = sub(rt, 'The S58 verification probe — created through the real UI to confirm the create path end-to-end.',
              'The S59 verification probe — created through the real UI to confirm the create path end-to-end.')
rt = sub(rt, '"S58 remediation probe ticket"', '"S59 remediation probe ticket"', expect=1)
# the fill AND check both carry S59 (the s58 lineage convention — no lag)
rt = sub(rt, "document.body.innerText.includes('S58 remediation probe ticket')",
              "document.body.innerText.includes('S59 remediation probe ticket')")
rt = sub(rt, "bun scripts/s58-probe-cleanup.ts", "bun scripts/s59-probe-cleanup.ts")
w("s59-roundtrip.sh", rt)

# ---------- 5. s59-roundtrip-recheck.sh (from s58-roundtrip-recheck.sh) ----------
rtr = (S / "s58-roundtrip-recheck.sh").read_text()
rtr = sub(rtr, "# S58: re-check the probe listing on /mytickets with generous waits + content dump",
               "# S59: re-check the probe listing on /mytickets with generous waits + content dump")
rtr = sub(rtr, "OUT=/tmp/s58-results/s58-ourside", "OUT=/tmp/s59-results/s59-ourside")
rtr = sub(rtr, 'The S58 verification probe — created through the real UI to confirm the create path end-to-end.',
               'The S59 verification probe — created through the real UI to confirm the create path end-to-end.')
rtr = sub(rtr, '"S58 remediation probe ticket"', '"S59 remediation probe ticket"')
rtr = sub(rtr, "includes('S58 remediation probe ticket')", "includes('S59 remediation probe ticket')")
rtr = sub(rtr, "bun scripts/s58-probe-cleanup.ts", "bun scripts/s59-probe-cleanup.ts")
w("s59-roundtrip-recheck.sh", rtr)

# ---------- 6. s59-vlm-check.mjs (from s58-vlm-check.mjs) ----------
vlm = (S / "s58-vlm-check.mjs").read_text()
vlm = sub(vlm, "// S58: the paired desktop VLM parity check (the s45–s57 lineage — both dashboards in ONE prompt)",
               "// S59: the paired desktop VLM parity check (the s45–s58 lineage — both dashboards in ONE prompt)")
vlm = sub(vlm, "/tmp/s58-results/ref-dashboard.png", "/tmp/s59-results/ref-dashboard.png")
vlm = sub(vlm, "/tmp/s58-results/s58-ourside/our-dashboard.png", "/tmp/s59-results/s59-ourside/our-dashboard.png")
w("s59-vlm-check.mjs", vlm)

# ---------- 7. s59-vlm-shotdiff.mjs (from s58-vlm-shotdiff.mjs) ----------
sd = (S / "s58-vlm-shotdiff.mjs").read_text()
sd = sub(sd, "// S58: VLM-diff the changed screenshot shots vs the s57 baselines (the s49–s57",
               "// S59: VLM-diff the changed screenshot shots vs the s58 baselines (the s49–s58")
sd = sub(sd, "// drift; 09 the S58 fixture title).",
               "// drift; 09 the S59 fixture title).")
sd = sub(sd, "{ shot: '09-ticket-detail-attachments', why: 'the S58 fixture title (the per-session fixture ticket) plus relative-time text' }",
               "{ shot: '09-ticket-detail-attachments', why: 'the S59 fixture title (the per-session fixture ticket) plus relative-time text' }")
sd = sub(sd, "/tmp/s58-baselines/", "/tmp/s59-baselines/")
w("s59-vlm-shotdiff.mjs", sd)

# ---------- 8. s59-probe-cleanup.ts (from s58-probe-cleanup.ts) ----------
pc = (S / "s58-probe-cleanup.ts").read_text()
pc = sub(pc, "// S58: verify the probe ticket + cleanup + the canonical seed check (the s45–s51 lineage)",
               "// S59: verify the probe ticket + cleanup + the canonical seed check (the s45–s52 lineage)")
pc = sub(pc, 'title: { contains: "S58" }', 'title: { contains: "S59" }')
w("s59-probe-cleanup.ts", pc)

# ---------- 9. s59-entry-compare.py (from s58-entry-compare.py) ----------
ec = (S / "s58-entry-compare.py").read_text()
ec = sub(ec, '"""S58: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s58-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt',
              '"""S59: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s59-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt')
w("s59-entry-compare.py", ec)

# ---------- 10. s59-wave-analysis.py (from s58-wave-analysis.py) ----------
wa = (S / "s58-wave-analysis.py").read_text()
wa = sub(wa, '"""S58: robust basename-vs-hash comparison of the s57 vs s58 entry chunk refs."""',
              '"""S59: robust basename-vs-hash comparison of the s58 vs s59 entry chunk refs."""')
wa = sub(wa, "cur_b, cur_p = refs('/tmp/s58-results/cur-chunkrefs.txt')",
              "cur_b, cur_p = refs('/tmp/s59-results/cur-chunkrefs.txt')")
wa = sub(wa, "s57_b, s57_p = refs('/tmp/s58-results/s57-baseline-entry.js.chunkrefs.txt')",
              "s58_b, s58_p = refs('/tmp/s59-results/s58-baseline-entry.js.chunkrefs.txt')")
wa = wa.replace("s57_b", "s58_b").replace("s57_p", "s58_p")
wa = sub(wa, 'print(f"basenames: now={len(cur_b)} s57={len(s58_b)}")',
              'print(f"basenames: now={len(cur_b)} s58={len(s58_b)}")')  # the label after the var renames
w("s59-wave-analysis.py", wa)

# ---------- 11. capture-screenshots-s59.sh (from s58 lineage) ----------
cap = (S / "capture-screenshots-s58.sh").read_text()
cap = sub(cap, "# Session-48 screenshot refresh carried to s58 (production standalone server on :3000, demo",
               "# Session-48 screenshot refresh carried to s59 (production standalone server on :3000, demo")
cap = sub(cap, "# Lineage: the s45 script carried forward VERBATIM (the s58 roundtrip-title lineage fix noted) (which itself carries the",
               "# Lineage: the s45 script carried forward VERBATIM (the s59 lineage refresh noted) (which itself carries the")
cap = sub(cap, "# S58: boot the standalone server inside this script's process lifetime",
               "# S59: boot the standalone server inside this script's process lifetime")
cap = sub(cap, "/tmp/s58-capture-server.log", "/tmp/s59-capture-server.log")
cap = sub(cap, 'mkdir -p /tmp/s58-baselines\ncp docs/screenshots/*.png /tmp/s58-baselines/ 2>/dev/null || true',
               'mkdir -p /tmp/s59-baselines\ncp docs/screenshots/*.png /tmp/s59-baselines/ 2>/dev/null || true')
cap = sub(cap, '\\"S58 screenshot fixture (removed after capture)\\"', '\\"S59 screenshot fixture (removed after capture)\\"', expect=1)
cap = sub(cap, 'Temporary two-attachment fixture for the session-58 screenshot. Deleted after the shots.',
               'Temporary two-attachment fixture for the session-59 screenshot. Deleted after the shots.')
w("capture-screenshots-s59.sh", cap)

print("\nS59 battery generated: 11 scripts")
