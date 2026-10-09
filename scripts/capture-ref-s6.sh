#!/usr/bin/env bash
# Session-6 reference-site captures for the composite sweep (same pages as
# docs/screenshots/). Explicit origin — never derived from location.origin.
set -e
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s6-ref-shots
mkdir -p "$OUT"
agent-browser set viewport 1280 800 > /dev/null
agent-browser cookies clear > /dev/null
agent-browser open "$REF/login" > /dev/null; sleep 3
agent-browser screenshot "$OUT/01-login.png" > /dev/null
agent-browser fill 'input[type="email"]' "sepnetflix2023@outlook.com" > /dev/null
agent-browser fill 'input[type="password"]' '$Abcd1234' > /dev/null
agent-browser click 'button[type="submit"]' > /dev/null; sleep 4
agent-browser screenshot "$OUT/02-dashboard.png" > /dev/null
agent-browser open "$REF/submitticket" > /dev/null; sleep 3
agent-browser screenshot "$OUT/03-submit-ticket.png" > /dev/null
agent-browser open "$REF/mytickets" > /dev/null; sleep 3
agent-browser screenshot "$OUT/04-my-tickets.png" > /dev/null
TID="$(agent-browser eval "document.querySelector('main a[href*=ticketdetails]').getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
agent-browser open "$REF$TID" > /dev/null; sleep 3
agent-browser screenshot "$OUT/05-ticket-detail.png" > /dev/null
agent-browser set viewport 375 812 > /dev/null
agent-browser open "$REF/" > /dev/null; sleep 4
agent-browser screenshot "$OUT/06-mobile-dashboard.png" > /dev/null
agent-browser eval "document.querySelector('header button').click()" > /dev/null; sleep 1
agent-browser screenshot "$OUT/07-mobile-menu-open.png" > /dev/null
agent-browser press Escape > /dev/null
ls -la "$OUT"
