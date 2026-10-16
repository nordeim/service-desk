#!/usr/bin/env bash
# S61: the reference-side F1 bundle sweep (the 43rd parity sweep — watch for a
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
#     /tmp/s60-results survived this session; the standing re-fetch form kept)
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s61-results
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
for c in "/static/index-DRs9_-5K.js" \
         "/static/index-OG0wzUXG.js" \
         "/static/index-Da5vh3Iz.js" \
         "/static/index-BQ2gMrp1.js" \
         "/static/index-B8wmtmTR.js" \
         "/static/index-C-ulo5ek.js" \
         "/static/logoutReturnPath-HjtsxsFd.js" \
         "/static/index-CneaUv24.js" \
         "/static/UserAppMain-DOZft9ba.js" \
         "/static/index-DPOrvWRk.css" \
         "/static/index-BCfnIRWB.css" \
         "/static/index-BIWjBcok.css" \
         "/static/index-D0Q6-tUz.css"; do
  printf "%s " "$c"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$c" || echo "ERR"
done

echo "=== the referenced-by-HTML check for the stable logoutReturnPath ==="
grep -c "logoutReturnPath-HjtsxsFd.js" "$HTML" || echo "0 (NOT referenced)"
echo "=== topology hash vs the s59 records (entry name in the HTML?) ==="
grep -c "index-DRs9_-5K.js" "$HTML" || echo "0 (entry ROTATED — a new wave?)"
grep -c "index-DPOrvWRk.css" "$HTML" || echo "0 (login CSS ROTATED — a new wave?)"

echo "=== the chunk-ref baseline comparison (vs the s60 entry, re-fetched BY NAME) ==="
# S61: /tmp/s60-results survived this session (no reset) — the s60 baseline
# entry is re-fetched by its known name anyway (the standing form).
CUR=$(grep -oE '/static/index-[^"]+\.js' "$HTML" | head -1)
if [ -n "$CUR" ]; then
  curl -sL --max-time 30 "$REF$CUR" -o "$OUT/cur-entry.js"
  curl -sL --max-time 30 "$REF/static/index-DRs9_-5K.js" -o "$OUT/s60-baseline-entry.js"
  for F in "$OUT/cur-entry.js" "$OUT/s60-baseline-entry.js"; do
    [ -s "$F" ] && grep -oE '"[^"]*-[A-Za-z0-9_-]{8}\.js"' "$F" | sort -u > "$F.chunkrefs.txt"
  done
  if [ -s "$OUT/cur-entry.js.chunkrefs.txt" ] && [ -s "$OUT/s60-baseline-entry.js.chunkrefs.txt" ]; then
    python3 "$(dirname "$0")/s61-entry-compare.py" "$OUT/cur-entry.js.chunkrefs.txt" "$OUT/s60-baseline-entry.js.chunkrefs.txt"
  else
    echo "chunk-ref baseline unavailable (the s60 entry no longer serves) — the raw entry saved for ad-hoc diff"
  fi
  cp "$OUT/cur-entry.js" "$OUT/new-entry.js" 2>/dev/null || true
fi
