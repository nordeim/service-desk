#!/usr/bin/env bash
# S57: the reference-side F1 bundle sweep (the 39th parity sweep — watch for a
# TWENTY-THIRD /login wave vs the s56 records):
#   entry      index-B8wmtmTR.js   200  105258   (the s56 figure — the 22nd-wave entry)
#   login CSS  index-BIWjBcok.css  200  904487   (hash-stable through the 22nd wave)
#   stable     logoutReturnPath-HjtsxsFd.js (40 sessions, live 200, referenced)
#   old chunks index-C-ulo5ek.js 105055 (the 22nd-wave casualty) / index-CneaUv24.js
#              104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the mapDeps baseline comparison vs the s56-saved entry (in-lineage this time)
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s57-results
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
  # decode HTML entities in urls (rolldown names are plain, but be safe)
  url="$u"
  printf "%s " "$url"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$url" || echo "ERR"
done > "$OUT/live-figures.txt"
cat "$OUT/live-figures.txt"

echo "=== the s50/s51 standing chunks (live status re-check — the /static/ paths) ==="
for c in "/static/index-B8wmtmTR.js" \
         "/static/index-C-ulo5ek.js" \
         "/static/logoutReturnPath-HjtsxsFd.js" \
         "/static/index-CneaUv24.js" \
         "/static/UserAppMain-DOZft9ba.js" \
         "/static/index-BIWjBcok.css" \
         "/static/index-D0Q6-tUz.css"; do
  printf "%s " "$c"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$c" || echo "ERR"
done

echo "=== the referenced-by-HTML check for the stable logoutReturnPath ==="
grep -c "logoutReturnPath-HjtsxsFd.js" "$HTML" || echo "0 (NOT referenced)"
echo "=== topology hash vs the s56 records (entry name in the HTML?) ==="
grep -c "index-B8wmtmTR.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"
grep -c "index-BIWjBcok.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"

echo "=== the mapDeps baseline comparison (vs the s56-saved entry) ==="
# S57: the chunk-ref basename-hash comparison (the s57-wave-analysis form —
# the s56 node mapDeps regex missed the entry's actual format; this lineage
# form extracts every -HASH.js reference and compares basenames vs hashes).
CUR=$(grep -oE '/static/index-[^"]+\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  for F in "$OUT/cur-entry.js" /tmp/s56-results/new-entry.js; do
    [ -f "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s /tmp/s56-results/new-entry.js.chunkrefs.txt ]; then
    python3 "$(dirname "$0")/s57-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" /tmp/s56-results/new-entry.js.chunkrefs.txt
  else
    echo "chunk-ref baseline unavailable (s56 entry missing) — the raw entry saved for ad-hoc diff"
  fi
fi
