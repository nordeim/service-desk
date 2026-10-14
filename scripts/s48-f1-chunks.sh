#!/bin/bash
# S48 F1 part 2 (fixed): carrier chunk + CSS byte sizes + contract string counts
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s48-results/s48-f1

curl -s "$REF/static/index-CneaUv24.js" -o $OUT/entry.js
echo "entry bytes: $(wc -c < $OUT/entry.js)"

CARRIER=$(grep -oE 'UserAppMain-[A-Za-z0-9_-]+\.js' $OUT/entry.js | sort -u | head -1)
echo "carrier spec: $CARRIER"
if [ -n "$CARRIER" ]; then
  curl -s "$REF/static/$CARRIER" -o $OUT/carrier.js
  echo "carrier bytes: $(wc -c < $OUT/carrier.js)"
fi

curl -s "$REF/static/index-D0Q6-tUz.css" -o $OUT/login.css
echo "css bytes: $(wc -c < $OUT/login.css)"

curl -s -o /dev/null -w "logoutReturnPath HTTP: %{http_code}\n" "$REF/static/logoutReturnPath-HjtsxsFd.js"

echo "=== contract strings in carrier ==="
for s in 'from_url' 'Forgot password' 'Need an account' 'Password'; do
  echo "'$s': $(grep -o "$s" $OUT/carrier.js 2>/dev/null | wc -l)"
done

echo "=== chrome ledger (F2) ==="
grep -oE '<meta[^>]*viewport[^>]*>' login.html
echo "manifest: $(grep -c 'manifest' login.html)"
echo "theme-color: $(grep -c 'theme-color' login.html)"
echo "apple-touch-icon: $(grep -c 'apple-touch-icon' login.html)"
