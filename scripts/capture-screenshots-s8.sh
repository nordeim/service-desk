#!/usr/bin/env bash
# Session-8 screenshot refresh (production standalone server on :3000, demo user).
# Captures the standing 7-shot set into docs/screenshots/.
set -e
cd "$(dirname "$0")/.."
CLONE="http://localhost:3000"
OUT="$(pwd)/docs/screenshots"
mkdir -p "$OUT"

# Desktop set at 1280x800
agent-browser set viewport 1280 800 > /dev/null
agent-browser cookies clear > /dev/null
agent-browser open "$CLONE/login" > /dev/null; sleep 3
agent-browser screenshot "$OUT/01-login.png" > /dev/null
agent-browser fill 'input[type="email"]' "demo@servicedesk.app" > /dev/null
agent-browser fill 'input[type="password"]' 'Demo1234!' > /dev/null
agent-browser click 'button[type="submit"]' > /dev/null; sleep 4
agent-browser screenshot "$OUT/02-dashboard.png" > /dev/null
agent-browser open "$CLONE/submitticket" > /dev/null; sleep 3
agent-browser screenshot "$OUT/03-submit-ticket.png" > /dev/null
agent-browser open "$CLONE/mytickets" > /dev/null; sleep 3
agent-browser screenshot "$OUT/04-my-tickets.png" > /dev/null
TID="$(agent-browser eval "document.querySelector('main a[href*=ticketdetails]').getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
agent-browser open "$CLONE$TID" > /dev/null; sleep 3
agent-browser screenshot "$OUT/05-ticket-detail.png" > /dev/null

# Mobile set at 375x812
agent-browser set viewport 375 812 > /dev/null
agent-browser open "$CLONE/dashboard" > /dev/null; sleep 4
agent-browser screenshot "$OUT/06-mobile-dashboard.png" > /dev/null
agent-browser eval "document.querySelector('header button').click()" > /dev/null; sleep 1
agent-browser screenshot "$OUT/07-mobile-menu-open.png" > /dev/null
agent-browser press Escape > /dev/null

ls -la "$OUT"
