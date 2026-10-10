#!/usr/bin/env bash
# Session-20 screenshot refresh (production standalone server on :3000, demo
# user). Captures the standing 10-shot set into docs/screenshots/.
# Lineage: the s19 script carried forward VERBATIM (which itself carries the
# s18/s17/s16/s15/s14/s13 fixes: FATAL guards, the curl fixture pattern, the
# setInputFiles helper, the corrected mytickets ticket-link selector). The
# s20 session's change is flow-internal (the reset-detour deep-link pin) —
# the captured surfaces are unchanged; the login flow the script drives
# exercises the same plain /login -> /dashboard default path (no from_url),
# verified separately by scripts/s20-live-verify.mjs.
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

# Session-13 shot: the submit form with a file attached (the row + the
# X icon button) — captured via the Playwright helper (setInputFiles; the
# agent-browser DataTransfer dispatch does NOT reach React's onChange, and
# the row sits below the 800px fold — both s13 lessons).
node scripts/s13-shot08-recapture.mjs > /dev/null

agent-browser open "$CLONE/mytickets" > /dev/null; sleep 3
agent-browser screenshot "$OUT/04-my-tickets.png" > /dev/null

# The ticket-detail shot: first ticket link on mytickets — the s18-fixed
# selector (the s12-lineage guards: condition polarity + the text-xl
# detail h1).
TID="$(agent-browser eval "document.querySelector('main a[href*=\"ticketdetails\"]').getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ -z "$TID" ] || [ "$TID" = "null" ]; then
  echo "FATAL: no ticket link found on mytickets" >&2
  exit 1
fi
agent-browser open "$CLONE$TID" > /dev/null; sleep 3
DETAIL_CHECK="$(agent-browser eval "location.pathname === '/ticketdetails' && document.querySelector('main h1') ? 'ok' : 'wrong:' + location.pathname" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${DETAIL_CHECK#ok}" = "$DETAIL_CHECK" ]; then
  echo "FATAL: detail shot page is not /ticketdetails ($DETAIL_CHECK)" >&2
  exit 1
fi
agent-browser screenshot "$OUT/05-ticket-detail.png" > /dev/null

# Session-13 shot: the detail page of a ticket WITH attachments. The
# two-attachment fixture is created via curl, captured, then removed —
# the dev DB stays the canonical seed.
B64="$(printf 'session-13 detail screenshot fixture' | base64 -w0)"
COOKIE="$(mktemp)"
curl -s -c "$COOKIE" -X POST "$CLONE/api/auth/login" -H 'Content-Type: application/json' -d '{"email":"demo@servicedesk.app","password":"Demo1234!"}' > /dev/null
CREATED="$(curl -s -b "$COOKIE" -X POST "$CLONE/api/tickets" -H 'Content-Type: application/json' -d "{\"title\":\"S20 screenshot fixture (removed after capture)\",\"category\":\"other\",\"priority\":\"medium\",\"description\":\"Temporary two-attachment fixture for the session-20 screenshot. Deleted after the shots.\",\"attachments\":[{\"fileName\":\"first.txt\",\"mimeType\":\"text/plain\",\"sizeBytes\":44,\"data\":\"$B64\"},{\"fileName\":\"second.pdf\",\"mimeType\":\"application/pdf\",\"sizeBytes\":44,\"data\":\"$B64\"}]}" | python3 -c 'import json,sys; d = json.load(sys.stdin); print(d.get("ticket", {}).get("id", ""))')"
if [ -z "$CREATED" ]; then
  echo "FATAL: attachment fixture ticket could not be created" >&2
  rm -f "$COOKIE"; exit 1
fi
agent-browser open "$CLONE/ticketdetails?id=$CREATED" > /dev/null; sleep 3
ATT_CHECK="$(agent-browser eval "location.pathname === '/ticketdetails' && [...document.querySelectorAll('main a')].filter(a => (a.getAttribute('href') || '').includes('/attachments/')).length === 2 ? 'ok' : 'wrong:' + location.pathname" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${ATT_CHECK#ok}" = "$ATT_CHECK" ]; then
  echo "FATAL: attachment shot page shows no attachment rows ($ATT_CHECK)" >&2
  rm -f "$COOKIE"; exit 1
fi
agent-browser screenshot "$OUT/09-ticket-detail-attachments.png" > /dev/null

# Session-14 shot: the FIRST attachment opened from the row — the download
# URL serves Content-Disposition: inline, so the tab RENDERS the text
# file (the reference's CDN behavior).
ATT_URL="$(agent-browser eval "[...document.querySelectorAll('main a')].find(a => (a.getAttribute('href') || '').includes('/attachments/')).getAttribute('href')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
agent-browser open "$CLONE$ATT_URL" > /dev/null; sleep 2
INLINE_CHECK="$(agent-browser eval "document.body && document.body.innerText.includes('session-13 detail screenshot fixture') ? 'ok' : 'wrong:' + (document.body ? document.body.innerText.slice(0, 40) : 'nobody')" | python3 -c 'import json,sys; print(json.load(sys.stdin))')"
if [ "${INLINE_CHECK#ok}" = "$INLINE_CHECK" ]; then
  echo "FATAL: the inline shot did not render the attachment text ($INLINE_CHECK)" >&2
  rm -f "$COOKIE"; exit 1
fi
agent-browser screenshot "$OUT/10-attachment-inline-view.png" > /dev/null

# remove the fixture (keep the dev DB the canonical seed)
rm -f "$COOKIE"
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
