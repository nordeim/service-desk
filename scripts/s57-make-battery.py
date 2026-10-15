#!/usr/bin/env python3
"""S57: generate the sweep battery from the s56 lineage (the 39th parity sweep).

Edits vs the s56 lineage:
  - S56 -> S57 renames, /tmp/s56-results -> /tmp/s57-results
  - sweep ordinal: 38th -> 39th
  - wave watch: TWENTY-SECOND -> TWENTY-THIRD (vs the s56 records)
  - standing entry figure: index-B8wmtmTR.js 105258 (the 22nd-wave figure)
  - logoutReturnPath ordinal: 39th -> 40th
  - the mapDeps baseline comparison held IN the lineage this time (the s56
    wave analysis was ad-hoc; the s54 in-lineage-fix lesson applied)
"""
import re, pathlib

S = pathlib.Path("/home/z/my-project/service-desk/scripts")


def w(name, text):
    (S / name).write_text(text)
    print(f"wrote {name} ({len(text.splitlines())} lines)")


# ---------- s57-ref-sweep.sh (from s56-ref-sweep.sh) ----------
sweep = (S / "s56-ref-sweep.sh").read_text()
sweep = sweep.replace(
    """# S56: the reference-side F1 bundle sweep (the 38th parity sweep — watch for a
# TWENTY-FIRST /login wave vs the s50/s51/s52 records):
#   entry      index-C-ulo5ek.js   200  105055   (s50 + s51 figures)
#   login CSS  index-BIWjBcok.css  200  904487   (s50 + s51 figures)
#   stable     logoutReturnPath-HjtsxsFd.js (39 sessions, live 200, referenced)
#   old chunks index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   topology   40-chunk rolldown""",
    """# S57: the reference-side F1 bundle sweep (the 39th parity sweep — watch for a
# TWENTY-THIRD /login wave vs the s56 records):
#   entry      index-B8wmtmTR.js   200  105258   (the s56 figure — the 22nd-wave entry)
#   login CSS  index-BIWjBcok.css  200  904487   (hash-stable through the 22nd wave)
#   stable     logoutReturnPath-HjtsxsFd.js (40 sessions, live 200, referenced)
#   old chunks index-C-ulo5ek.js 105055 (the 22nd-wave casualty) / index-CneaUv24.js
#              104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the mapDeps baseline comparison vs the s56-saved entry (in-lineage this time)""",
)
sweep = sweep.replace("OUT=/tmp/s56-results", "OUT=/tmp/s57-results")
sweep = sweep.replace(
    """for c in "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
    """for c in "/static/index-B8wmtmTR.js" \\
         "/static/index-C-ulo5ek.js" \\
         "/static/logoutReturnPath-HjtsxsFd.js" \\""",
)
sweep = sweep.replace(
    """echo "=== topology hash vs the s50/s51/s52 records (entry name in the HTML?) ==="
grep -c "index-C-ulo5ek.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"
grep -c "index-BIWjBcok.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)\"""",
    """echo "=== topology hash vs the s56 records (entry name in the HTML?) ==="
grep -c "index-B8wmtmTR.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"
grep -c "index-BIWjBcok.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"

echo "=== the mapDeps baseline comparison (vs the s56-saved entry) ==="
CUR=$(grep -oE '/static/index-[^"]+\\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  for F in "$OUT/cur-entry.js" /tmp/s56-results/new-entry.js; do
    [ -f "$F" ] && node -e "
      const s = require('fs').readFileSync('$F', 'utf8');
      const m = s.match(/\\\"m\\\":\\s*\\{[\\s\\S]*?\\}/);
      const keys = m ? [...m[0].matchAll(/\\\"([^\\\"]+)\\\":/g)].map(x => x[1]).sort() : [];
      require('fs').writeFileSync('$F.mapdeps.txt', keys.join('\\\\n'));
    " 2>/dev/null || true
  done
  if [ -f "$OUT/cur-entry.js.mapdeps.txt" ] && [ -f /tmp/s56-results/new-entry.js.mapdeps.txt ]; then
    echo "mapDeps now: $(wc -l < "$OUT/cur-entry.js.mapdeps.txt") vs s56: $(wc -l < /tmp/s56-results/new-entry.js.mapdeps.txt)"
    echo "ADDED:"; comm -13 /tmp/s56-results/new-entry.js.mapdeps.txt "$OUT/cur-entry.js.mapdeps.txt" | head -20
    echo "REMOVED:"; comm -23 /tmp/s56-results/new-entry.js.mapdeps.txt "$OUT/cur-entry.js.mapdeps.txt" | head -20
  else
    echo "mapDeps baseline unavailable (s56 entry missing) — the raw entry saved for ad-hoc diff"
  fi
fi""",
)
w("s57-ref-sweep.sh", sweep)

# ---------- s57-ref-surfaces.sh (from s56-ref-surfaces.sh) ----------
surf = (S / "s56-ref-surfaces.sh").read_text()
surf = surf.replace(
    "# S56: the reference-side F2–F4 live probes (the 38th sweep)",
    "# S57: the reference-side F2–F4 live probes (the 39th sweep)",
)
surf = surf.replace(
    "#   F3  their desktop overflow (the s4-33rd records: scrollWidth 1328 vs clientWidth 1280)",
    "#   F3  their desktop overflow (the s4–s56 records: scrollWidth 1328 vs clientWidth 1280)",
)
surf = surf.replace("OUT=/tmp/s56-results", "OUT=/tmp/s57-results")
surf = surf.replace("# S56: the s53-refined TEXT-matching form", "# S57: the s53-refined TEXT-matching form")
w("s57-ref-surfaces.sh", surf)

# ---------- s57-ourside-verify.sh (from s56-ourside-verify.sh) ----------
our = (S / "s56-ourside-verify.sh").read_text()
our = our.replace(
    "# S56: our-side parity verification battery (one process lifetime — the s48-s52 pattern)",
    "# S57: our-side parity verification battery (one process lifetime — the s48-s56 pattern)",
)
our = our.replace("The UI round-trip runs in the dedicated s56-roundtrip.sh.",
                  "The UI round-trip runs in the dedicated s57-roundtrip.sh.")
our = our.replace("OUT=/tmp/s56-results/s56-ourside", "OUT=/tmp/s57-results/s57-ourside")
w("s57-ourside-verify.sh", our)

# ---------- s57-roundtrip.sh (from s56-roundtrip.sh) ----------
rt = (S / "s56-roundtrip.sh").read_text()
rt = rt.replace("# S56: the UI round-trip (fixed selectors", "# S57: the UI round-trip (fixed selectors")
rt = rt.replace("OUT=/tmp/s56-results/s56-ourside", "OUT=/tmp/s57-results/s57-ourside")
rt = rt.replace('"S56 remediation probe ticket"', '"S57 remediation probe ticket"')
rt = rt.replace('"The S56 verification probe — created through the real UI to confirm the create path end-to-end."',
                '"The S57 verification probe — created through the real UI to confirm the create path end-to-end."')
rt = rt.replace("bun scripts/s56-probe-cleanup.ts", "bun scripts/s57-probe-cleanup.ts")
w("s57-roundtrip.sh", rt)

# ---------- s57-vlm-check.mjs (from s56-vlm-check.mjs) ----------
vlm = (S / "s56-vlm-check.mjs").read_text()
vlm = vlm.replace("// S56: the paired desktop VLM parity check (the s45–s52 lineage",
                  "// S57: the paired desktop VLM parity check (the s45–s56 lineage")
vlm = vlm.replace("'/tmp/s56-results/ref-dashboard.png'", "'/tmp/s57-results/ref-dashboard.png'")
vlm = vlm.replace("'/tmp/s56-results/s56-ourside/our-dashboard.png'", "'/tmp/s57-results/s57-ourside/our-dashboard.png'")
w("s57-vlm-check.mjs", vlm)

# ---------- s57-probe-cleanup.ts (from s56-probe-cleanup.ts) ----------
pc = (S / "s56-probe-cleanup.ts").read_text()
pc = pc.replace("// S56: verify the probe ticket", "// S57: verify the probe ticket")
pc = pc.replace('contains: "S56"', 'contains: "S57"')
w("s57-probe-cleanup.ts", pc)

print("\nAll s57 battery scripts generated. chmod:")
import os
for f in ["s57-ref-sweep.sh", "s57-ref-surfaces.sh", "s57-ourside-verify.sh", "s57-roundtrip.sh"]:
    os.chmod(S / f, 0o755)
print("done")
