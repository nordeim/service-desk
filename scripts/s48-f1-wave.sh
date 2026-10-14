#!/bin/bash
# S48 parity sweep F1: the /login bundle wave check (the 30th sweep)
# Ground truth: the reference's live /login HTML + chunk bytes vs the s47 records.
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s48-results/s48-f1
mkdir -p $OUT

echo "=== /login HTML fetch ==="
curl -s "$REF/login" -o $OUT/login.html
echo "bytes: $(wc -c < $OUT/login.html)"

echo "=== entry chunk + contract carrier + CSS ==="
for pat in 'index-[A-Za-z0-9_-]*\.js' 'UserAppMain-[A-Za-z0-9_-]*\.js' 'index-[A-Za-z0-9_-]*\.css' 'logoutReturnPath-[A-Za-z0-9_-]*\.js'; do
  grep -oE "$pat" $OUT/login.html | sort -u | head -3
done

echo "=== contract string counts (from the login HTML + carrier) ==="
for s in 'from_url' 'Forgot password' 'Need an account' 'Password'; do
  echo "'$s' in login.html: $(grep -o "$s" $OUT/login.html | wc -l)"
done
