#!/usr/bin/env bash
# S86: our-side parity verification battery (one process lifetime — the s48–s85 pattern)
# Boots the standalone :3000 (inline DATABASE_URL pin, the s43/s44 doctrine),
# runs the desktop + mobile matrix, captures the paired-VLM surface set (the login
# + mobile-login + dashboard + route + detail captures),
# then kills the server. The UI round-trip runs in the dedicated s86-roundtrip.sh.
set -o pipefail
cd /home/z/my-project/service-desk
BASE="http://127.0.0.1:3000"
OUT=/tmp/s86-results/s86-ourside
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
# S86: our login-page capture (the s76-lineage login pair — captured
# PRE-auth before the credential fill) + OUR mobile-login capture (the s77
# P1 — the same surface at 375, captured PRE-auth, then the viewport restored)
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-login.png" > /dev/null 2>&1
# S86: our mobile-login capture at 375 (the s77 P1 closure — the mobile pair)
agent-browser set viewport 375 667 > /dev/null 2>&1; sleep 1
# S86: the settle-verified capture form (the s81 P1 closure carried forward — the symmetric loop — our
# standalone build settles fast and never demonstrated the hydration race,
# but the paired measurement must not depend on WHICH SIDE hydrates faster;
# the same poll-then-screenshot form guards both captures).
for i in 1 2 3 4 5 6 7 8; do
  ST="$(agent-browser eval "JSON.stringify({h1: document.querySelector('h1')?.textContent, sp: document.querySelectorAll('[class*=animate-spin]').length})" 2>/dev/null | tail -1)"
  echo "settle poll $i: $ST"
  SC="$(printf '%s' "$ST" | tr -d '\\')"
  if printf '%s' "$SC" | grep -q '"sp":0' && printf '%s' "$SC" | grep -q 'Welcome to ServiceDesk'; then break; fi
  sleep 2
done
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1: document.querySelector('h1')?.textContent})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-login-mobile.png" > /dev/null 2>&1
agent-browser set viewport 1280 800 > /dev/null 2>&1
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

# --- the route-surface captures (the s78 P1 closure — the route pairs, structural since s79) ---
echo "=== ROUTE-SURFACE CAPTURES (the s78 P1 closure — the route pairs, structural since s79) ==="
agent-browser open "$BASE/mytickets" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-mytickets.png" > /dev/null 2>&1
# S86: our detail-surface capture (the s79 P1 — the detail pair: click the
# first ticketdetails link from our mytickets list — the canonical seed's
# first card is deterministic — capture POST-login @1280)
agent-browser eval "JSON.stringify((function(){ const a = document.querySelector('a[href*="ticketdetails"]'); if(!a) return {found:false}; a.click(); return {found:true, href: a.getAttribute('href')}; })())" 2>&1 | tail -1
sleep 2
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-ticketdetail.png" > /dev/null 2>&1
agent-browser open "$BASE/submitticket" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-submitticket.png" > /dev/null 2>&1


# --- the mobile-route captures (the s80 P1 closure — the route+width
# intersection pairs; the same three surfaces at 375, the s77 mobile axis
# applied to the s78/s79 route surfaces) ---
echo "=== MOBILE-ROUTE CAPTURES @375 (the s80 P1 closure) ==="
agent-browser set viewport 375 667 > /dev/null 2>&1
agent-browser open "$BASE/mytickets" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-mytickets-mobile.png" > /dev/null 2>&1
echo "capture: our-mytickets-mobile.png"
agent-browser eval "(() => { const a = document.querySelector('a[href*="ticketdetails"]'); if(!a) return {found:false}; a.click(); return {found:true, href: a.getAttribute('href')}; })()" 2>&1 | tail -1
sleep 2
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-ticketdetail-mobile.png" > /dev/null 2>&1
echo "capture: our-ticketdetail-mobile.png"
agent-browser open "$BASE/submitticket" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-submitticket-mobile.png" > /dev/null 2>&1
echo "capture: our-submitticket-mobile.png"

# --- the mobile-dashboard capture (the s82 P1 closure carried forward — the paired grid's
# last cell: the DASHBOARD at 375, the surface whose overflow figures the F4
# battery measures every session; ours the working fit 375=375, theirs the
# known 468 defect — the pair carries the defect-aware prompt) ---
echo "=== MOBILE-DASHBOARD CAPTURE @375 (the s82 P1 closure carried forward) ==="
agent-browser open "$BASE/dashboard" > /dev/null 2>&1; sleep 3
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/our-dashboard-mobile.png" > /dev/null 2>&1
echo "capture: our-dashboard-mobile.png"

echo "=== DONE (server killed by trap) ==="
