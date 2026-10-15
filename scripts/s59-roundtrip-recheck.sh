#!/usr/bin/env bash
# S59: re-check the probe listing on /mytickets with generous waits + content dump
set -o pipefail
cd /home/z/my-project/service-desk
BASE="http://127.0.0.1:3000"
OUT=/tmp/s59-results/s59-ourside
mkdir -p $OUT

NODE_ENV=production PORT=3000 DATABASE_URL='file:../db/custom.db' \
  bun .next/standalone/server.js > $OUT/server2.log 2>&1 &
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

echo "=== create the probe via the real UI ==="
agent-browser open "$BASE/submitticket" > /dev/null 2>&1; sleep 3
agent-browser fill 'input[placeholder="Brief summary of the problem"]' "S59 remediation probe ticket" > /dev/null 2>&1
agent-browser fill 'textarea' "The S59 verification probe — created through the real UI to confirm the create path end-to-end." > /dev/null 2>&1
SNAP3=$(agent-browser snapshot 2>&1)
CATREF=$(echo "$SNAP3" | grep -iE 'combobox|Category' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
agent-browser click "@$CATREF" > /dev/null 2>&1; sleep 1
SNAP4=$(agent-browser snapshot 2>&1)
HWOPT=$(echo "$SNAP4" | grep -iE 'hardware' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
agent-browser click "@$HWOPT" > /dev/null 2>&1; sleep 1
SUBREF=$(agent-browser snapshot 2>&1 | grep -oE 'button "Submit[a-zA-Z ]*" \[ref=[a-z0-9]+\]' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
agent-browser click "@$SUBREF" > /dev/null 2>&1; sleep 5

echo "=== the mytickets listing (generous wait + dump) ==="
agent-browser eval "location.href" 2>&1 | tail -1
sleep 3
agent-browser eval "document.body.innerText.slice(0, 1200)" 2>&1 | tail -1
echo ""
echo "=== probe listed (after wait) ==="
agent-browser eval "document.body.innerText.includes('S59 remediation probe ticket')" 2>&1 | tail -1
echo "=== ticket titles in the DOM ==="
agent-browser eval "JSON.stringify([...document.querySelectorAll('a,td,div,span,h3')].map(e=>e.textContent).filter(t=>t&&t.includes('probe')).slice(0,3))" 2>&1 | tail -1

echo "=== API cross-check: the mytickets data ==="
curl -s "$BASE/api/tickets?status=open" | head -c 400
echo ""
echo "=== PRISMA VERIFY + CLEANUP ==="
DATABASE_URL='file:../db/custom.db' bun scripts/s59-probe-cleanup.ts 2>&1 | tail -6
echo "=== DONE ==="
