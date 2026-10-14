#!/usr/bin/env bash
# S49: the UI round-trip (fixed selectors — the s48 lesson: the title input's
# placeholder is "Brief summary of the problem", never Title/title-shaped)
set -o pipefail
cd /home/z/my-project/service-desk
BASE="http://127.0.0.1:3000"
OUT=/tmp/s49-results/s49-ourside
mkdir -p $OUT

# --- boot ---
NODE_ENV=production PORT=3000 DATABASE_URL='file:../db/custom.db' \
  bun .next/standalone/server.js > $OUT/server.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
for i in $(seq 1 20); do
  H=$(curl -s $BASE/api/health 2>/dev/null)
  if echo "$H" | grep -q '"status":"ok"'; then echo "BOOT OK"; break; fi
  sleep 1
done

agent-browser cookies clear > /dev/null 2>&1
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$BASE/login" > /dev/null 2>&1; sleep 2
agent-browser fill 'input[type="email"]' "demo@servicedesk.app" > /dev/null 2>&1
agent-browser fill 'input[type="password"]' 'Demo1234!' > /dev/null 2>&1
agent-browser click 'button[type="submit"]' > /dev/null 2>&1; sleep 3

echo "=== UI ROUND-TRIP (fixed selectors) ==="
agent-browser open "$BASE/submitticket" > /dev/null 2>&1; sleep 2
agent-browser fill 'input[placeholder="Brief summary of the problem"]' "S49 remediated probe ticket" > /dev/null 2>&1
agent-browser fill 'textarea' "The S49 verification probe — created through the real UI to confirm the create path end-to-end." > /dev/null 2>&1
SNAP3=$(agent-browser snapshot 2>&1)
CATREF=$(echo "$SNAP3" | grep -iE 'combobox|Category' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "category ref: $CATREF"
agent-browser click "@$CATREF" > /dev/null 2>&1; sleep 1
SNAP4=$(agent-browser snapshot 2>&1)
HWOPT=$(echo "$SNAP4" | grep -iE 'hardware' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "hardware ref: $HWOPT"
agent-browser click "@$HWOPT" > /dev/null 2>&1; sleep 1
SUBREF=$(agent-browser snapshot 2>&1 | grep -oE 'button "Submit[a-zA-Z ]*" \[ref=[a-z0-9]+\]' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "submit ref: $SUBREF"
agent-browser click "@$SUBREF" 2>&1 | tail -1; sleep 3
agent-browser eval "JSON.stringify({url: location.href})" 2>&1 | tail -1
echo "probe listed: $(agent-browser eval "document.body.innerText.includes('S49 remediated probe ticket')" 2>&1 | tail -1)"
echo "=== DONE (server killed by trap) ==="
