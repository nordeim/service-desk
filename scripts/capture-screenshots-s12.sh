#!/usr/bin/env bash
# Session-12 screenshot refresh (production standalone server on :3000, demo user).
# Captures the standing 7-shot set into docs/screenshots/.
# (Fixes the lineage bug the s11 plan CLAIMED but never landed: the committed
# s10 AND s11 scripts both carry the invalid 'aref*=' selector — querySelector
# throws, TID comes back empty, and shot 05 silently lands on the root
# redirect. This script uses the working a[href*="ticketdetails"] form and
# verifies the capture page before shooting.)
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

# The ticket-detail shot: first ticket link on mytickets. The s10/s11
# lineage used the invalid 'aref*=' selector (querySelector throws, TID
# empties, the shot silently lands on the root redirect). Working form:
TID="$(agent-browser eval "document.querySelector('main a[href*=\"ticketdetails\"]').getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ -z "$TID" ] || [ "$TID" = "null" ]; then
  echo "FATAL: no ticket link found on mytickets" >&2
  exit 1
fi
agent-browser open "$CLONE$TID" > /dev/null; sleep 3
# Guard: the page must actually be the detail route before shooting.
DETAIL_CHECK="$(agent-browser eval "location.pathname === '/ticketdetails' && document.querySelector('main .text-4xl') ? 'ok' : 'wrong:' + location.pathname" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${DETAIL_CHECK#ok}" != "$DETAIL_CHECK" ]; then
  echo "FATAL: detail shot page is not /ticketdetails ($DETAIL_CHECK)" >&2
  exit 1
fi
agent-browser screenshot "$OUT/05-ticket-detail.png" > /dev/null

# Mobile set at 375x812
agent-browser set viewport 375 812 > /dev/null
agent-browser open "$CLONE/dashboard" > /dev/null; sleep 4
agent-browser screenshot "$OUT/06-mobile-dashboard.png" > /dev/null
agent-browser eval "document.querySelector('header button').click()" > /dev/null; sleep 1.5
agent-browser screenshot "$OUT/07-mobile-menu-open.png" > /dev/null
agent-browser press Escape > /dev/null

ls -la "$OUT"
