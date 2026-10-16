#!/usr/bin/env bash
# S64: the reference-side F1 bundle sweep (the 46th parity sweep — watch for a
# THIRTIETH /login wave vs the s63 records):
#   entry      index-Cx5Yjs59.js  200  101558   (the s63 figure — the 29th-wave entry, a pure re-hash)
#   login CSS  index-e12PSDbU.css 200  899517   (the s63 figure; survived the 29th wave unrotated)
#   stable     logoutReturnPath-HjtsxsFd.js (47 sessions at s64, live 200, referenced)
#   old chunks index-Caa1O9wE.js 101558 (the 28th-wave entry — re-hashed to Cx5Yjs59 at
#              s63 at the SAME byte size) / index-CRMsWLS1.js 101519 (the 27th) /
#              index-DRs9_-5K.js 101519 (the 26th) / index-OG0wzUXG.js 101339 (the 25th) /
#              index-Da5vh3Iz.js 105258 (the 24th) / index-BQ2gMrp1.js 105258 (the 23rd) /
#              index-B8wmtmTR.js 105258 (the 22nd) / index-C-ulo5ek.js 105055 /
#              index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-DPOrvWRk.css 899411 (the 28th-wave casualty) / index-BCfnIRWB.css 901951
#              (the 26th) / index-BIWjBcok.css 904487 (the 25th) / index-D0Q6-tUz.css (s50
#              404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the s63 entry (re-fetched BY NAME —
#     the re-fetch-by-name form is the standing convention: /tmp baselines do
#     not survive workspace resets)
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s64-results
mkdir -p $OUT

echo "=== F1: reference /login HTML fetch ==="
HTML="$OUT/login.html"
curl -sL --max-time 30 "$REF/login" -o "$HTML" || { echo "FATAL: reference unreachable"; exit 1; }
echo "html bytes: $(wc -c < "$HTML")"

echo "=== the referenced JS chunks ==="
grep -oE '/static/[^"]+\.js' "$HTML" | sort -u > "$OUT/chunks.txt"
echo "referenced chunks: $(wc -l < "$OUT/chunks.txt")"

echo "=== the referenced CSS ==="
grep -oE '/static/[^"]+\.css' "$HTML" | sort -u > "$OUT/css.txt" || true
cat "$OUT/css.txt"

echo "=== the entry + key figures (status + bytes, live) ==="
for u in $(cat "$OUT/chunks.txt" "$OUT/css.txt"); do
  url="$u"
  printf "%s " "$url"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$url" || echo "ERR"
done > "$OUT/live-figures.txt"
cat "$OUT/live-figures.txt"

echo "=== the standing chunks (live status re-check — the /static/ paths) ==="
for c in "/static/index-Cx5Yjs59.js" \
         "/static/index-Caa1O9wE.js" \
         "/static/index-CRMsWLS1.js" \
         "/static/index-DRs9_-5K.js" \
         "/static/index-OG0wzUXG.js" \
         "/static/index-Da5vh3Iz.js" \
         "/static/index-BQ2gMrp1.js" \
         "/static/index-B8wmtmTR.js" \
         "/static/index-C-ulo5ek.js" \
         "/static/index-CneaUv24.js" \
         "/static/UserAppMain-DOZft9ba.js" \
         "/static/logoutReturnPath-HjtsxsFd.js" \
         "/static/index-e12PSDbU.css" \
         "/static/index-DPOrvWRk.css" \
         "/static/index-BCfnIRWB.css" \
         "/static/index-BIWjBcok.css" \
         "/static/index-D0Q6-tUz.css"; do
  printf "%s " "$c"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$c" || echo "ERR"
done > "$OUT/standing-chunks.txt"
cat "$OUT/standing-chunks.txt"

echo "=== the s63 baseline reconstruction (the re-fetch-by-name form) ==="
curl -sL --max-time 30 "$REF/static/index-Cx5Yjs59.js" -o "$OUT/s63-baseline-entry.js" || { echo "FATAL: s63 entry fetch failed"; exit 1; }
echo "s63 entry bytes: $(wc -c < "$OUT/s63-baseline-entry.js")"
grep -oE '"[^"]*-([A-Za-z0-9_-]{8})\.(js|css|woff2?)"' "$OUT/s63-baseline-entry.js" | tr -d '"' | sort -u > "$OUT/s63-baseline-entry.js.chunkrefs.txt" || true
echo "s63 baseline chunkrefs: $(wc -l < "$OUT/s63-baseline-entry.js.chunkrefs.txt")"

echo "=== the current entry's chunkrefs (for the wave analysis) ==="
ENTRY=$(grep -oE '/static/index-[^"]+\.js' "$HTML" | head -1)
echo "current entry: $ENTRY"
curl -sL --max-time 30 "$REF$ENTRY" -o "$OUT/cur-entry.js"
grep -oE '"[^"]*-([A-Za-z0-9_-]{8})\.(js|css|woff2?)"' "$OUT/cur-entry.js" | tr -d '"' | sort -u > "$OUT/cur-chunkrefs.txt" || true
echo "current entry chunkrefs: $(wc -l < "$OUT/cur-chunkrefs.txt")"

echo "=== SWEEP DONE (run scripts/s64-wave-analysis.py next) ==="
