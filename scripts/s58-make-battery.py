#!/usr/bin/env python3
"""S58: generate the sweep battery from the s57 lineage (the 40th parity sweep).

Edits vs the s57 lineage:
  - S57 -> S58 renames, /tmp/s57-results -> /tmp/s58-results, s57-baselines -> s58-baselines
  - sweep ordinal: 39th -> 40th
  - wave watch: TWENTY-THIRD -> TWENTY-FOURTH (vs the s57 records)
  - standing entry figure: index-BQ2gMrp1.js 105258 (the 23rd-wave figure, the s57 record)
  - the 23rd-wave casualty index-B8wmtmTR.js joins the old-chunks list
  - logoutReturnPath ordinal: 40th -> 41st
  - THE ROUNDTRIP TITLE FIX: the s57 lineage's listing check greped the S56
    title while the fill used the S57 title (the one-session-lag bug behind
    the s57 "render-timing artifact"); the s58 fill AND check both use S58
  - the mapDeps baseline: /tmp was wiped by the workspace reset — the s57
    baseline entry is re-fetched BY NAME (index-BQ2gMrp1.js) instead of read
    from /tmp/s57-results (the lineage form kept, the provenance changed)
  - the capture script saves its own /tmp/s58-baselines from the pre-capture
    docs/screenshots set (the s57 lineage left this to the session; the s58
    form is self-contained — the shotdiff baselines can never go missing)
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


# ---------- 1. s58-ref-sweep.sh (from s57-ref-sweep.sh) ----------
sweep = (S / "s57-ref-sweep.sh").read_text()
sweep = sub(
    sweep,
    """# S57: the reference-side F1 bundle sweep (the 39th parity sweep — watch for a
# TWENTY-THIRD /login wave vs the s56 records):
#   entry      index-B8wmtmTR.js   200  105258   (the s56 figure — the 22nd-wave entry)
#   login CSS  index-BIWjBcok.css  200  904487   (hash-stable through the 22nd wave)
#   stable     logoutReturnPath-HjtsxsFd.js (40 sessions, live 200, referenced)
#   old chunks index-C-ulo5ek.js 105055 (the 22nd-wave casualty) / index-CneaUv24.js
#              104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the mapDeps baseline comparison vs the s56-saved entry (in-lineage this time)""",
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
)
sweep = sub(sweep, "OUT=/tmp/s57-results", "OUT=/tmp/s58-results")
sweep = sub(
    sweep,
    """for c in "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
    """for c in "/static/index-BQ2gMrp1.js" \\
         "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
)
sweep = sub(sweep, "echo \"=== topology hash vs the s56 records (entry name in the HTML?) ===\"",
                 "echo \"=== topology hash vs the s57 records (entry name in the HTML?) ===\"")
sweep = sub(sweep, 'grep -c "index-B8wmtmTR.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"',
                 'grep -c "index-BQ2gMrp1.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"')
sweep = sub(sweep, "echo \"=== the s50/s51 standing chunks (live status re-check — the /static/ paths) ===\"",
                 "echo \"=== the s50/s51 standing chunks (live status re-check — the /static/ paths) ===\"")  # kept, label only
sweep = sub(
    sweep,
    """echo "=== the mapDeps baseline comparison (vs the s56-saved entry) ==="
# S57: the chunk-ref basename-hash comparison (the s57-wave-analysis form —
# the s56 node mapDeps regex missed the entry's actual format; this lineage
# form extracts every -HASH.js reference and compares basenames vs hashes).
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  for F in "$OUT/cur-entry.js" /tmp/s56-results/new-entry.js; do
    [ -f "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s /tmp/s56-results/new-entry.js.chunkrefs.txt ]; then
    python3 "$(dirname "$0")/s57-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" /tmp/s56-results/new-entry.js.chunkrefs.txt
  else
    echo "chunk-ref baseline unavailable (s56 entry missing) — the raw entry saved for ad-hoc diff"
  fi
fi""",
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
)
w("s58-ref-sweep.sh", sweep)

# ---------- 2. s58-ref-surfaces.sh (from s57-ref-surfaces.sh) ----------
surf = (S / "s57-ref-surfaces.sh").read_text()
surf = sub(surf, "# S57: the reference-side F2–F4 live probes (the 39th sweep)",
                "# S58: the reference-side F2–F4 live probes (the 40th sweep)")
surf = sub(surf, "#   F3  their desktop overflow (the s4–s56 records: scrollWidth 1328 vs clientWidth 1280)",
                "#   F3  their desktop overflow (the s4–s57 records: scrollWidth 1328 vs clientWidth 1280)")
surf = sub(surf, "OUT=/tmp/s57-results", "OUT=/tmp/s58-results")
w("s58-ref-surfaces.sh", surf)

# ---------- 3. s58-ourside-verify.sh (from s57-ourside-verify.sh) ----------
ours = (S / "s57-ourside-verify.sh").read_text()
ours = sub(ours, "# S57: our-side parity verification battery (one process lifetime — the s48-s56 pattern)",
                "# S58: our-side parity verification battery (one process lifetime — the s48-s57 pattern)")
ours = sub(ours, "The UI round-trip runs in the dedicated s57-roundtrip.sh.",
                "The UI round-trip runs in the dedicated s58-roundtrip.sh.")
ours = sub(ours, "OUT=/tmp/s57-results/s57-ourside", "OUT=/tmp/s58-results/s58-ourside")
w("s58-ourside-verify.sh", ours)

# ---------- 4. s58-roundtrip.sh (from s57-roundtrip.sh) + THE TITLE FIX ----------
rt = (S / "s57-roundtrip.sh").read_text()
rt = sub(rt, "# S57: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's",
              "# S58: the UI round-trip (fixed selectors — the s48-s50 lesson: the title input's")
rt = sub(rt, "OUT=/tmp/s57-results/s57-ourside", "OUT=/tmp/s58-results/s58-ourside")
rt = sub(rt, 'The S57 verification probe — created through the real UI to confirm the create path end-to-end.',
              'The S58 verification probe — created through the real UI to confirm the create path end-to-end.')
rt = sub(rt, '"S57 remediation probe ticket"', '"S58 remediation probe ticket"', expect=1)
# THE FIX: the s57 lineage's listing check greped the S56 title (the
# one-session-lag bug) — the s58 check must match the s58 fill string.
rt = sub(rt, "document.body.innerText.includes('S56 remediation probe ticket')",
              "document.body.innerText.includes('S58 remediation probe ticket')")
rt = sub(rt, "bun scripts/s57-probe-cleanup.ts", "bun scripts/s58-probe-cleanup.ts")
w("s58-roundtrip.sh", rt)

# ---------- 5. s58-roundtrip-recheck.sh (from s57-roundtrip-recheck.sh) ----------
rtr = (S / "s57-roundtrip-recheck.sh").read_text()
rtr = sub(rtr, "# S57: re-check the probe listing on /mytickets with generous waits + content dump",
               "# S58: re-check the probe listing on /mytickets with generous waits + content dump")
rtr = sub(rtr, "OUT=/tmp/s57-results/s57-ourside", "OUT=/tmp/s58-results/s58-ourside")
rtr = sub(rtr, 'The S57 verification probe — created through the real UI to confirm the create path end-to-end.',
               'The S58 verification probe — created through the real UI to confirm the create path end-to-end.')
rtr = sub(rtr, '"S57 remediation probe ticket"', '"S58 remediation probe ticket"')
rtr = sub(rtr, "includes('S57 remediation probe ticket')", "includes('S58 remediation probe ticket')")
rtr = sub(rtr, "bun scripts/s57-probe-cleanup.ts", "bun scripts/s58-probe-cleanup.ts")
w("s58-roundtrip-recheck.sh", rtr)

# ---------- 6. s58-vlm-check.mjs (from s57-vlm-check.mjs) ----------
vlm = (S / "s57-vlm-check.mjs").read_text()
vlm = sub(vlm, "// S57: the paired desktop VLM parity check (the s45–s56 lineage — both dashboards in ONE prompt)",
               "// S58: the paired desktop VLM parity check (the s45–s57 lineage — both dashboards in ONE prompt)")
vlm = sub(vlm, "/tmp/s57-results/ref-dashboard.png", "/tmp/s58-results/ref-dashboard.png")
vlm = sub(vlm, "/tmp/s57-results/s57-ourside/our-dashboard.png", "/tmp/s58-results/s58-ourside/our-dashboard.png")
w("s58-vlm-check.mjs", vlm)

# ---------- 7. s58-vlm-shotdiff.mjs (from s57-vlm-shotdiff.mjs) ----------
sd = (S / "s57-vlm-shotdiff.mjs").read_text()
sd = sub(sd, "// S52: VLM-diff the changed screenshot shots vs the s51 baselines (the s49–s56",
               "// S52: VLM-diff the changed screenshot shots vs the s51 baselines (the s49–s57")
sd = sub(sd, "{ shot: '09-ticket-detail-attachments', why: 'the S57 fixture title (the per-session fixture ticket)' }",
               "{ shot: '09-ticket-detail-attachments', why: 'the S58 fixture title (the per-session fixture ticket)' }")
sd = sub(sd, "/tmp/s57-baselines/", "/tmp/s58-baselines/")
w("s58-vlm-shotdiff.mjs", sd)

# ---------- 8. s58-probe-cleanup.ts (from s57-probe-cleanup.ts) ----------
pc = (S / "s57-probe-cleanup.ts").read_text()
pc = sub(pc, "// S57: verify the probe ticket + cleanup + the canonical seed check (the s45–s50 lineage)",
               "// S58: verify the probe ticket + cleanup + the canonical seed check (the s45–s51 lineage)")
pc = sub(pc, 'title: { contains: "S57" }', 'title: { contains: "S58" }')
w("s58-probe-cleanup.ts", pc)

# ---------- 9. s58-entry-compare.py (from s57-entry-compare.py) ----------
ec = (S / "s57-entry-compare.py").read_text()
ec = sub(ec, '"""S57: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s57-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt',
              '"""S58: the entry chunk-ref comparison (basenames vs hashes) — two args:\n  s58-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt')
w("s58-entry-compare.py", ec)

# ---------- 10. s58-wave-analysis.py (from s57-wave-analysis.py) ----------
wa = (S / "s57-wave-analysis.py").read_text()
wa = sub(wa, '"""S57: robust basename-vs-hash comparison of the s56 vs s57 entry chunk refs."""',
              '"""S58: robust basename-vs-hash comparison of the s57 vs s58 entry chunk refs."""')
wa = sub(wa, "cur_b, cur_p = refs('/tmp/s57-results/cur-chunkrefs.txt')",
              "cur_b, cur_p = refs('/tmp/s58-results/cur-chunkrefs.txt')")
wa = sub(wa, "s56_b, s56_p = refs('/tmp/s57-results/s56-chunkrefs.txt')",
              "s57_b, s57_p = refs('/tmp/s58-results/s57-baseline-entry.js.chunkrefs.txt')")
wa = sub(wa, "print(f\"basenames: now={len(cur_b)} s56={len(s56_b)}\")",
              "print(f\"basenames: now={len(cur_b)} s57={len(s57_b)}\")")
wa = wa.replace("s56_b - cur_b", "s57_b - cur_b").replace("cur_b & s56_b", "cur_b & s57_b")
wa = wa.replace("cur_p[b] != s56_p[b]", "cur_p[b] != s57_p[b]")
wa = wa.replace("cur_p[b] == s56_p[b]", "cur_p[b] == s57_p[b]")
wa = sub(wa, 'print(f"basenames: now={len(cur_b)} s57={len(s57_b)}")',
              'print(f"basenames: now={len(cur_b)} s57={len(s57_b)}")')  # idempotent guard
w("s58-wave-analysis.py", wa)

# ---------- 11. capture-screenshots-s58.sh (from s57 lineage) ----------
cap = (S / "capture-screenshots-s57.sh").read_text()
cap = sub(cap, "# Session-48 screenshot refresh carried to s57 (production standalone server on :3000, demo",
               "# Session-48 screenshot refresh carried to s58 (production standalone server on :3000, demo")
cap = sub(cap, "# Lineage: the s45 script carried forward VERBATIM (the s57 mapDeps lineage fix noted) (which itself carries the",
               "# Lineage: the s45 script carried forward VERBATIM (the s58 roundtrip-title lineage fix noted) (which itself carries the")
cap = sub(cap, "# S57: boot the standalone server inside this script's process lifetime",
               "# S58: boot the standalone server inside this script's process lifetime")
cap = sub(cap, "/tmp/s57-capture-server.log", "/tmp/s58-capture-server.log")
# NEW in s58: save the pre-capture set as the shotdiff baselines (self-contained)
cap = sub(cap, 'CLONE="http://127.0.0.1:3000"',
               '''# S58: save the pre-capture set as the s58-baselines for the shotdiff
# (the s57 lineage left this to the session — the /tmp wipe made it fragile)
mkdir -p /tmp/s58-baselines
cp docs/screenshots/*.png /tmp/s58-baselines/ 2>/dev/null || true

CLONE="http://127.0.0.1:3000"''')
cap = sub(cap, '\\"S57 screenshot fixture (removed after capture)\\"', '\\"S58 screenshot fixture (removed after capture)\\"', expect=1)
cap = sub(cap, 'Temporary two-attachment fixture for the session-57 screenshot. Deleted after the shots.',
               'Temporary two-attachment fixture for the session-58 screenshot. Deleted after the shots.')
w("capture-screenshots-s58.sh", cap)

print("\nS58 battery generated: 11 scripts")
