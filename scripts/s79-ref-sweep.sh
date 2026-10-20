#!/usr/bin/env bash
# S79: the reference-side F1 bundle sweep (the 61st parity sweep — found the
# FORTY-SECOND /login wave vs the s78 closeout records: the wave history
# carries FOUR per-wave records through the prior s78 window, the era's
# first TRIPLE-wave window (the reference in an active deploy cycle). The
# per-wave records: the 39th (measured vs the s77 entry Bt_cFPps by name)
# 6 added / 1 removed (all platform-infrastructure), 435 re-hashed / 269
# hash-stable; the 40th (measured vs the 39th-wave entry B2q8HDZS by name)
# 0 added / 1 removed (ArrowDownRightSmall, platform icon), 420 re-hashed /
# 289 hash-stable; the 41st (measured vs the 40th-wave entry EM0yvqO9 by
# name) 5 added / 2 removed (all platform-infrastructure builder surface),
# 409 re-hashed / 298 hash-stable; the 42nd (measured vs the 41st-wave
# entry CjDN-sir by name) 7 added / 4 removed (all
# platform-infrastructure), 432 re-hashed / 276 hash-stable. The next
# watch: the FORTY-THIRD wave vs the s79 closeout records below):
#   entry      index-D3ArZVPB.js  200  106608   (the s79 figure — the 42nd-wave entry, +4907 bytes)
#   login CSS  index-OJK0Y98H.css 200  897697  (the s79 figure; rotated at the 42nd wave, −2469 bytes —
#              the era's SIXTH CSS rotation)
#   stable     logoutReturnPath-HjtsxsFd.js (61 sessions at s79, live 200, referenced)
#   old chunks index-CjDN-sir.js 101701 (the 41st-wave entry — re-hashed to D3ArZVPB at
#              s79, +4907 bytes) / index-EM0yvqO9.js 101566 (the 40th-wave entry — re-hashed to CjDN-sir at
#              s78 at the live re-verification, +135 bytes) / index-B2q8HDZS.js 101615 (the 39th-wave entry — re-hashed to EM0yvqO9 at
#              s78 MID-SESSION, −49 bytes) / index-Bt_cFPps.js 101965 (the 38th-wave entry — re-hashed to B2q8HDZS at
#              s78, −350 bytes) / index-CpCk8Zmk.js 101965 (the 37th-wave entry — re-hashed to Bt_cFPps at
#              s77 at the SAME byte size 101965, the s67/s75 same-size precedent) / index-Bvf0emsG.js 101631 (the 36th-wave entry — re-hashed to CpCk8Zmk at
#              s76, +334 bytes) / index-C2ujlke6.js 101631 (the 35th-wave entry — re-hashed to Bvf0emsG at
#              s75 at the SAME byte size 101631, the s67 same-size precedent) / index-CimHfPLG.js 101582 (the 34th-wave entry — re-hashed to C2ujlke6 at
#              s73, +49 bytes) / index-DCDf2KCA.js 101540 (the 33rd-wave entry — re-hashed to CimHfPLG at
#              s72, +42 bytes) / index-CSVhrsEz.js 101540 (the 32nd-wave entry — re-hashed to DCDf2KCA at
#              s67 at the SAME byte size 101540) / index-DVq-lV7m.js 101558 (the 31st) /
#              index-BerEzxez.js 101558 (the 30th) / index-Cx5Yjs59.js 101558 (the 29th) /
#              index-Caa1O9wE.js 101558 (the 28th) / index-CRMsWLS1.js 101519 (the 27th) /
#              index-DRs9_-5K.js 101519 (the 26th) / index-OG0wzUXG.js 101339 (the 25th) /
#              index-Da5vh3Iz.js 105258 (the 24th) / index-BQ2gMrp1.js 105258 (the 23rd) /
#              index-B8wmtmTR.js 105258 (the 22nd) / index-C-ulo5ek.js 105055 /
#              index-CneaUv24.js 104739 / UserAppMain-DOZft9ba.js 58761 (200, unreferenced)
#   old CSS    index-CXcDyjBm.css 900166 (the 41st-wave login CSS — rotated to OJK0Y98H at
#              the 42nd wave (s79), −2469 bytes) / index-Cnzs7a7J.css 900238 (the 40th-wave login CSS — rotated to CXcDyjBm at
#              the 41st wave (s78), −72 bytes) / index-BaEceH-K.css 899767 (the 39th-wave login CSS — rotated to Cnzs7a7J at
#              the 40th wave (s78 mid-session), +471 bytes) / index-A8a43VEI.css 898471 (the 36th/37th/38th-wave login CSS — rotated to BaEceH-K at
#              the 39th wave (s78), +1296 bytes) / index-D5oCh2kx.css 900301 (the 35th/36th-wave login CSS — rotated to A8a43VEI at
#              the 37th wave (s76), −1830 bytes) / index-CpjiugAb.css 900190 (the 33rd/34th-wave login CSS — rotated to D5oCh2kx at
#              the 35th wave (s73), +111 bytes) / index-BWytzgpi.css 899521 (the 31st-wave login CSS — rotated to CpjiugAb at
#              the 32nd wave, +669 bytes) / index-NS4V-1t3.css 899631 (the 30th) /
#              index-e12PSDbU.css 899517 (the 29th) / index-DPOrvWRk.css 899411 (the 28th) /
#              index-BCfnIRWB.css 901951 (the 26th) / index-BIWjBcok.css 904487 (the 25th) /
#              index-D0Q6-tUz.css (s50 404 -> s51 200 edge-cache artifact, 900665)
#   + the chunk-ref baseline comparison vs the 41st-wave entry CjDN-sir
#     (re-fetched BY NAME — the re-fetch-by-name form is the standing
#     convention: /tmp baselines do not survive workspace resets; the
#     per-wave baseline is the second-to-last recorded entry — the 41st —
#     so the re-run reproduces the recorded 42nd-wave measurement)
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s79-results
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
for c in "/static/index-D3ArZVPB.js" \
         "/static/index-CjDN-sir.js" \
         "/static/index-EM0yvqO9.js" \
         "/static/index-B2q8HDZS.js" \
         "/static/index-Bt_cFPps.js" \
         "/static/index-CpCk8Zmk.js" \
         "/static/index-Bvf0emsG.js" \
         "/static/index-C2ujlke6.js" \
         "/static/index-CimHfPLG.js" \
         "/static/index-DCDf2KCA.js" \
         "/static/index-CSVhrsEz.js" \
         "/static/index-DVq-lV7m.js" \
         "/static/index-BerEzxez.js" \
         "/static/index-Cx5Yjs59.js" \
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
         "/static/index-OJK0Y98H.css" \
         "/static/index-CXcDyjBm.css" \
         "/static/index-Cnzs7a7J.css" \
         "/static/index-BaEceH-K.css" \
         "/static/index-A8a43VEI.css" \
         "/static/index-D5oCh2kx.css" \
         "/static/index-CpjiugAb.css" \
         "/static/index-BWytzgpi.css" \
         "/static/index-NS4V-1t3.css" \
         "/static/index-e12PSDbU.css" \
         "/static/index-DPOrvWRk.css" \
         "/static/index-BCfnIRWB.css" \
         "/static/index-BIWjBcok.css" \
         "/static/index-D0Q6-tUz.css"; do
  printf "%s " "$c"
  curl -sL --max-time 20 -o /dev/null -w "%{http_code} %{size_download}\n" "$REF$c" || echo "ERR"
done > "$OUT/standing-chunks.txt"
cat "$OUT/standing-chunks.txt"

echo "=== the 41st-wave baseline reconstruction (the re-fetch-by-name form —"
echo "    the per-wave baseline: the second-to-last recorded entry) ==="
curl -sL --max-time 30 "$REF/static/index-CjDN-sir.js" -o "$OUT/s79-found-entry.js" || { echo "FATAL: 41st-wave entry fetch failed"; exit 1; }
echo "41st-wave entry bytes: $(wc -c < "$OUT/s79-found-entry.js")"
grep -oE '"[^"]*-([A-Za-z0-9_-]{8})\.(js|css|woff2?)"' "$OUT/s79-found-entry.js" | tr -d '"' | sort -u > "$OUT/s79-found-entry.js.chunkrefs.txt" || true
echo "41st-wave baseline chunkrefs: $(wc -l < "$OUT/s79-found-entry.js.chunkrefs.txt")"

echo "=== the current entry's chunkrefs (for the wave analysis) ==="
ENTRY=$(grep -oE '/static/index-[^"]+\.js' "$HTML" | head -1)
echo "current entry: $ENTRY"
curl -sL --max-time 30 "$REF$ENTRY" -o "$OUT/cur-entry.js"
grep -oE '"[^"]*-([A-Za-z0-9_-]{8})\.(js|css|woff2?)"' "$OUT/cur-entry.js" | tr -d '"' | sort -u > "$OUT/cur-chunkrefs.txt" || true
echo "current entry chunkrefs: $(wc -l < "$OUT/cur-chunkrefs.txt")"

echo "=== SWEEP DONE (run scripts/s79-wave-analysis.py next) ==="
