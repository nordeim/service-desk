#!/usr/bin/env bash
# Session-13 screenshot refresh (production standalone server on :3000, demo
# user). Captures the standing 7-shot set into docs/screenshots/ plus two
# session-13 attachment shots (the remediated attached-file rows on the
# submit form + the detail-page attachment display).
# Lineage: the s12 selector fix (a[href*="ticketdetails"] + the FATAL
# capture-page guards) carried forward verbatim.
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

# Session-13 shot: the submit form with a file attached (the new row + the
# X icon button). Captured via the Playwright helper (setInputFiles — the
# agent-browser DataTransfer dispatch does NOT reach React's onChange, and
# the row sits below the 800px fold, so the helper scrolls it into view;
# both s13 lessons).
node scripts/s13-shot08-recapture.mjs > /dev/null

agent-browser open "$CLONE/mytickets" > /dev/null; sleep 3
agent-browser screenshot "$OUT/04-my-tickets.png" > /dev/null

# The ticket-detail shot: first ticket link on mytickets (the s12 fixed
# selector + the FATAL capture-page guard).
TID="$(agent-browser eval "document.querySelector('main a[href*=\"ticketdetails\"]').getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ -z "$TID" ] || [ "$TID" = "null" ]; then
  echo "FATAL: no ticket link found on mytickets" >&2
  exit 1
fi
agent-browser open "$CLONE$TID" > /dev/null; sleep 3
# Guard: the page must actually be the detail route before shooting.
# (Two s12-lineage bugs fixed here: (1) the condition was INVERTED — `!=`
# fires on "ok" and passes on "wrong:...", so the FATAL never fired;
# (2) the `.text-4xl` selector matched NOTHING on the detail page — the
# ticket-title h1 is `text-xl font-bold` (text-4xl is the page-heading
# scale on dashboard/mytickets/submit, not the detail title).)
DETAIL_CHECK="$(agent-browser eval "location.pathname === '/ticketdetails' && document.querySelector('main h1') ? 'ok' : 'wrong:' + location.pathname" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${DETAIL_CHECK#ok}" = "$DETAIL_CHECK" ]; then
  echo "FATAL: detail shot page is not /ticketdetails ($DETAIL_CHECK)" >&2
  exit 1
fi
agent-browser screenshot "$OUT/05-ticket-detail.png" > /dev/null

# Session-13 shot: the detail page of a ticket WITH attachments (the
# remediated neutral rows + the generic labels). A two-attachment fixture
# is created via the API with curl (a session cookie from a single login),
# captured, then removed again — the dev DB stays the canonical seed.
# (curl, not a browser fetch-eval: long inline JS bodies get mangled by the
# shell transmission layer — the s13 lesson.)
B64="$(printf 'session-13 detail screenshot fixture' | base64 -w0)"
COOKIE="$(mktemp)"
curl -s -c "$COOKIE" -X POST "$CLONE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"demo@servicedesk.app","password":"Demo1234!"}' > /dev/null
CREATED="$(curl -s -b "$COOKIE" -X POST "$CLONE/api/tickets" -H 'Content-Type: application/json' -d "{\"title\":\"S13 screenshot fixture (removed after capture)\",\"category\":\"other\",\"priority\":\"medium\",\"description\":\"Temporary two-attachment fixture for the session-13 screenshot. Deleted after the shot.\",\"attachments\":[{\"fileName\":\"first.txt\",\"mimeType\":\"text/plain\",\"sizeBytes\":44,\"data\":\"$B64\"},{\"fileName\":\"second.pdf\",\"mimeType\":\"application/pdf\",\"sizeBytes\":44,\"data\":\"$B64\"}]}" | python3 -c 'import json,sys; d = json.load(sys.stdin); print(d.get("ticket", {}).get("id", ""))')"
rm -f "$COOKIE"
if [ -z "$CREATED" ]; then
  echo "FATAL: attachment fixture ticket could not be created" >&2
  exit 1
fi
agent-browser open "$CLONE/ticketdetails?id=$CREATED" > /dev/null; sleep 3
ATT_CHECK="$(agent-browser eval "location.pathname === '/ticketdetails' && [...document.querySelectorAll('main a')].filter(a => (a.getAttribute('href') || '').includes('/attachments/')).length === 2 ? 'ok' : 'wrong:' + location.pathname" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${ATT_CHECK#ok}" = "$ATT_CHECK" ]; then
  echo "FATAL: attachment shot page shows no attachment rows ($ATT_CHECK)" >&2
  exit 1
fi
agent-browser screenshot "$OUT/09-ticket-detail-attachments.png" > /dev/null
# remove the fixture (keep the dev DB the canonical seed)
python3 - "$CREATED" << 'PYEOF'
import sqlite3, sys
db = sqlite3.connect("db/custom.db")
db.execute("DELETE FROM Attachment WHERE ticketId = ?", (sys.argv[1],))
db.execute("DELETE FROM Comment WHERE ticketId = ?", (sys.argv[1],))
db.execute("DELETE FROM Ticket WHERE id = ?", (sys.argv[1],))
db.commit()
db.close()
PYEOF

# Mobile set at 375x812
agent-browser set viewport 375 812 > /dev/null
agent-browser open "$CLONE/dashboard" > /dev/null; sleep 4
agent-browser screenshot "$OUT/06-mobile-dashboard.png" > /dev/null
agent-browser eval "document.querySelector('header button').click()" > /dev/null; sleep 1.5
agent-browser screenshot "$OUT/07-mobile-menu-open.png" > /dev/null
agent-browser press Escape > /dev/null

ls -la "$OUT"
