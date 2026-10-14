#!/usr/bin/env bash
# S48: the UI round-trip (fixed selectors) + Prisma verification + cleanup
set -o pipefail
cd /home/z/my-project/service-desk
BASE="http://127.0.0.1:3000"
OUT=/tmp/s48-results/s48-ourside

NODE_ENV=production PORT=3000 DATABASE_URL='file:../db/custom.db' \
  bun .next/standalone/server.js > $OUT/server.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
for i in $(seq 1 20); do
  H=$(curl -s $BASE/api/health 2>/dev/null)
  if echo "$H" | grep -q '"status":"ok"'; then break; fi
  sleep 1
done

agent-browser cookies clear > /dev/null 2>&1
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$BASE/login" > /dev/null 2>&1; sleep 2
agent-browser fill 'input[type="email"]' "demo@servicedesk.app" > /dev/null 2>&1
agent-browser fill 'input[type="password"]' 'Demo1234!' > /dev/null 2>&1
agent-browser click 'button[type="submit"]' > /dev/null 2>&1; sleep 3
agent-browser open "$BASE/submitticket" > /dev/null 2>&1; sleep 2

echo "=== FILL ==="
agent-browser fill 'input[placeholder="Brief summary of the problem"]' "S48 remediated probe ticket" 2>&1 | tail -1
agent-browser fill 'textarea' "The S48 verification probe — created through the real UI to confirm the create path end-to-end." 2>&1 | tail -1

echo "=== CATEGORY (Radix, fresh refs) ==="
CATREF=$(agent-browser snapshot 2>&1 | grep -oE 'combobox "Category \*"[^]]*ref=[a-z0-9]+' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "cat ref: $CATREF"
agent-browser click "@$CATREF" > /dev/null 2>&1; sleep 1
HWOPT=$(agent-browser snapshot 2>&1 | grep -iE 'Hardware' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
if [ -z "$HWOPT" ]; then
  HWOPT=$(agent-browser snapshot 2>&1 | grep -oE 'option "Hardware"[^]]*ref=[a-z0-9]+' | grep -oE '[a-z0-9]+$')
fi
echo "hardware ref: $HWOPT"
agent-browser click "@$HWOPT" > /dev/null 2>&1; sleep 1

echo "=== SUBMIT ==="
SUBREF=$(agent-browser snapshot 2>&1 | grep -oE 'button "Submit Ticket" \[ref=[a-z0-9]+\]' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
agent-browser click "@$SUBREF" 2>&1 | tail -1; sleep 3
agent-browser eval "JSON.stringify({url: location.href})" 2>&1 | tail -1
echo "probe listed: $(agent-browser eval "document.body.innerText.includes('S48 remediated probe ticket')" 2>&1 | tail -1)"

echo "=== PRISMA VERIFY ==="
DATABASE_URL='file:../db/custom.db' bun -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.ticket.findFirst({ where: { title: 'S48 remediated probe ticket' }, select: { id: true, status: true, category: true } })
  .then(t => { console.log('probe:', JSON.stringify(t)); return t ? p.ticket.delete({ where: { id: t.id } }) : null; })
  .then(() => p.user.count().then(async () => { console.log('counts:', JSON.stringify({ u: await p.user.count(), t: await p.ticket.count(), c: await p.comment.count() })); }))
  .finally(() => p.\$disconnect());
" 2>&1 | tail -3
