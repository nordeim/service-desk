#!/usr/bin/env bash
# S53: the reference-side F1 bundle sweep (the 35th parity sweep — watch for a
# TWENTY-FIRST /login wave vs the s50/s51/s52 records):
#   entry      index-C-ulo5ek.js   200  105055   (s50 + s51 figures)
#   login CSS  index-BIWjBcok.css  200  904487   (s50 + s51 figures)
#   stable     logoutReturnPath-HjtsxsFd.js (34 sessions, live 200, referenced)
#   old chunks index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   topology   40-chunk rolldown
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s53-results
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
for c in "/static/index-C-ulo5ek.js" \
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
echo "=== topology hash vs the s50/s51/s52 records (entry name in the HTML?) ==="
grep -c "index-C-ulo5ek.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"
grep -c "index-BIWjBcok.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"
