#!/usr/bin/env bash
# S66: our-side parity verification battery (one process lifetime — the s48–s65 pattern)
# Boots the standalone :3000 (inline DATABASE_URL pin, the s43/s44 doctrine),
# runs the desktop + mobile matrix, captures the dashboard for the F5 paired VLM,
# then kills the server. The UI round-trip runs in the dedicated s66-roundtrip.sh.
set -o pipefail
cd /home/z/my-project/service-desk
BASE="http://127.0.0.1:3000"
OUT=/tmp/s66-results/s66-ourside
mkdir -p $OUT

# --- boot ---
NODE_ENV=production PORT=3000 DATABASE_URL='file:../db/custom.db' \
  bun .next/standalone/server.js > $OUT/server.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
for i in $(seq 1 20); do
  H=$(curl -s $BASE/api/health 2>/dev/null)
  if echo "$H" | grep -q '"status":"ok"'; then echo "BOOT OK: $H"; break; fi
  sleep 1
done

# --- desktop 1280=1280 ---
agent-browser cookies clear > /dev/null 2>&1
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$BASE/login" > /dev/null 2>&1; sleep 2
agent-browser fill 'input[type="email"]' "demo@servicedesk.app" > /dev/null 2>&1
agent-browser fill 'input[type="password"]' 'Demo1234!' > /dev/null 2>&1
agent-browser click 'button[type="submit"]' > /dev/null 2>&1; sleep 3
echo "=== DESKTOP ==="
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

# --- mobile matrix ---
agent-browser set viewport 375 667 > /dev/null 2>&1; sleep 1
echo "=== MOBILE 375 ==="
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

# find the mobile toggle via snapshot refs
SNAP=$(agent-browser snapshot 2>&1)
REF=$(echo "$SNAP" | grep -oE 'button "Toggle Sidebar" \[ref=[a-z0-9]+\]' | grep -oE 'ref=[a-z0-9]+' | cut -d= -f2 | head -1)
echo "toggle ref: $REF"
echo "=== REAL CLICK ==="
agent-browser click "@$REF" 2>&1 | tail -1
sleep 1
agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length, rect: (function(){const d=document.querySelector('[role=dialog]'); if(!d) return null; const r=d.getBoundingClientRect(); return [r.x,r.y,r.width,r.height].join(',');})()})" 2>&1 | tail -1

echo "=== ESCAPE CLOSES ==="
agent-browser press Escape 2>&1 | tail -1; sleep 1
agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length})" 2>&1 | tail -1

echo "=== REOPEN + NAV-TAP ==="
agent-browser click "@$REF" > /dev/null 2>&1; sleep 1
SNAP2=$(agent-browser snapshot 2>&1)
MYT=$(echo "$SNAP2" | grep -iE 'My Tickets' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "mytickets ref: $MYT"
agent-browser click "@$MYT" 2>&1 | tail -1; sleep 2
agent-browser eval "JSON.stringify({url: location.href, title: document.title, dialogs: document.querySelectorAll('[role=dialog]').length})" 2>&1 | tail -1

# --- the s34/c44/s46 lesson: recapture OUR dashboard from /dashboard ---
echo "=== DASHBOARD RECAPTURE ==="
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$BASE/dashboard" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.href})" 2>&1 | tail -1
agent-browser screenshot $OUT/our-dashboard.png 2>&1 | tail -1

echo "=== DONE (server killed by trap) ==="
