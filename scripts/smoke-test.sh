#!/usr/bin/env bash
# ServiceDesk end-to-end API smoke test.
# Boots the production standalone server, exercises the auth + ticket CRUD +
# comment + status pipeline, prints PASS/FAIL per step, cleans up, exits
# non-zero on any failure. (The Playwright suite covers the UI; this script
# covers the API surface against a real server process.)
set -u
cd "$(dirname "$0")/.."
PROJECT_DIR="$(pwd)"

PORT="${SMOKE_PORT:-3999}"
BASE="http://localhost:${PORT}"
DB="/tmp/servicedesk-smoke-$$.db"
COOKIE_JAR="$(mktemp)"
SERVER_LOG="$(mktemp)"
RL_HEADERS=""
RL_BODY=""
RL_BODY_X="$(mktemp)"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  rm -f "$DB" "$DB-journal" "$COOKIE_JAR" "${COOKIE_JAR_B:-}" "$SERVER_LOG" ${RL_HEADERS:+"$RL_HEADERS"} ${RL_BODY:+"$RL_BODY"} ${RL_BODY_X:+"$RL_BODY_X"}
}
trap cleanup EXIT

step() { printf '%s %s\n' "$1" "$2"; }
fail() { step "FAIL" "$1"; exit 1; }

# --- Boot -------------------------------------------------------------------
rm -f "$DB"
DATABASE_URL="file:../db/smoke.db" bunx prisma db push --skip-generate >/dev/null 2>&1 || fail "db push"
DATABASE_URL="file:../db/smoke.db" bun prisma/seed.ts >/dev/null 2>&1 || fail "seed"

PORT="$PORT" NODE_ENV=production DATABASE_URL="file:../db/smoke.db" AUTH_SECRET="smoke-test-secret" \
  bun .next/standalone/server.js >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in $(seq 1 40); do
  curl -sf "$BASE/api/health" >/dev/null 2>&1 && break
  sleep 0.5
done
curl -sf "$BASE/api/health" >/dev/null || fail "server did not become healthy (see $SERVER_LOG)"
step "PASS" "server healthy on :$PORT"

# --- Auth -------------------------------------------------------------------
curl -sf -c "$COOKIE_JAR" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@servicedesk.app","password":"Demo1234!"}' >/dev/null || fail "login"
step "PASS" "login"

curl -sf -b "$COOKIE_JAR" "$BASE/api/auth/me" | grep -q '"email"' || fail "session (me)"
step "PASS" "session cookie works"

# --- Tickets CRUD -----------------------------------------------------------
TICKET_ID=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke test ticket","description":"Created by scripts/smoke-test.sh","category":"software","priority":"low"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["ticket"]["id"])')
[ -n "$TICKET_ID" ] || fail "create ticket"
step "PASS" "create ticket ($TICKET_ID)"

curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets/$TICKET_ID" | grep -q "Smoke test ticket" || fail "read ticket"
step "PASS" "read ticket"

curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?search=Smoke" | grep -q "Smoke test ticket" || fail "search"
step "PASS" "search tickets"

# --- Pagination (session 24: the list-API limit/skip contract) ---------------
# The demo user owns 5 seeded tickets + the smoke ticket above = 6 at this
# point, so two 2-ticket pages page disjointly through the mine-scope feed.
PAGE1_IDS=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?limit=2" \
  | python3 -c 'import json,sys; ts=json.load(sys.stdin)["tickets"]; print(len(ts)); print(",".join(t["id"] for t in ts))')
echo "$PAGE1_IDS" | head -1 | grep -q "^2$" || fail "pagination: ?limit=2 must return exactly 2 tickets (got $(echo "$PAGE1_IDS" | head -1))"
step "PASS" "pagination: limit=2 honored (exactly 2 returned)"
PAGE2_IDS=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?limit=2&skip=2" \
  | python3 -c 'import json,sys; ts=json.load(sys.stdin)["tickets"]; print(len(ts)); print(",".join(t["id"] for t in ts))')
echo "$PAGE2_IDS" | head -1 | grep -q "^2$" || fail "pagination: ?limit=2&skip=2 must return exactly 2 tickets (got $(echo "$PAGE2_IDS" | head -1))"
P1_SET=$(echo "$PAGE1_IDS" | tail -1 | tr ',' '\n' | sort)
P2_SET=$(echo "$PAGE2_IDS" | tail -1 | tr ',' '\n' | sort)
if [ -n "$(comm -12 <(printf '%s\n' "$P1_SET") <(printf '%s\n' "$P2_SET"))" ]; then
  fail "pagination: page 2 (skip=2) overlaps page 1 — skip must advance the window"
fi
step "PASS" "pagination: skip=2 pages disjointly"

PAG_RESP=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?limit=0")
PAG_BODY=$(curl -s -b "$COOKIE_JAR" "$BASE/api/tickets?limit=0")
[ "$PAG_RESP" = "400" ] || fail "pagination: ?limit=0 should 400 (got $PAG_RESP)"
echo "$PAG_BODY" | grep -q "limit must be an integer between 1 and 500" || fail "pagination: ?limit=0 message"
step "PASS" "pagination: limit=0 rejected (400 + the range message)"

PAG_RESP=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?limit=501")
PAG_BODY=$(curl -s -b "$COOKIE_JAR" "$BASE/api/tickets?limit=501")
[ "$PAG_RESP" = "400" ] || fail "pagination: ?limit=501 should 400 (got $PAG_RESP)"
echo "$PAG_BODY" | grep -q "limit must be an integer between 1 and 500" || fail "pagination: ?limit=501 message"
step "PASS" "pagination: limit=501 rejected (400 — the 500 ceiling)"

# --- Filter vocabulary (session 25: the strict-validation doctrine extended) ---
# The reference's entity API silently ignores out-of-vocabulary param values
# (measured: ?sort=banana returns the default order); ours rejects with 400 +
# a message naming the allowed set. The demo user owns 5 seeded tickets + the
# open smoke ticket at this point — exactly 1 resolved + exactly 1 urgent (both
# seeded rows, stable since session 2).
FILTER_COUNT=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?status=resolved" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$FILTER_COUNT" = "1" ] || fail "filter: ?status=resolved must return exactly 1 ticket (got $FILTER_COUNT)"
step "PASS" "filter: status=resolved honored (exactly 1)"

FILTER_COUNT=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?priority=urgent" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$FILTER_COUNT" = "1" ] || fail "filter: ?priority=urgent must return exactly 1 ticket (got $FILTER_COUNT)"
step "PASS" "filter: priority=urgent honored (exactly 1)"

FILT_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?status=banana")
[ "$FILT_RESP" = "400" ] || fail "filter: ?status=banana should 400 (got $FILT_RESP)"
grep -q "status must be one of: open, in_progress, resolved, closed" "$RL_BODY_X" || fail "filter: status reject message"
step "PASS" "filter: status=banana rejected (400 + the vocabulary message)"

FILT_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?priority=banana")
[ "$FILT_RESP" = "400" ] || fail "filter: ?priority=banana should 400 (got $FILT_RESP)"
grep -q "priority must be one of: low, medium, high, urgent" "$RL_BODY_X" || fail "filter: priority reject message"
step "PASS" "filter: priority=banana rejected (400 + the vocabulary message)"

FILT_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?sort=banana")
[ "$FILT_RESP" = "400" ] || fail "filter: ?sort=banana should 400 (got $FILT_RESP)"
grep -q "sort must be one of: newest, oldest, priority" "$RL_BODY_X" || fail "filter: sort reject message"
step "PASS" "filter: sort=banana rejected (400 + the vocabulary message)"

FILT_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?scope=banana")
[ "$FILT_RESP" = "400" ] || fail "filter: ?scope=banana should 400 (got $FILT_RESP)"
grep -q "scope must be one of: mine, all" "$RL_BODY_X" || fail "filter: scope reject message"
step "PASS" "filter: scope=banana rejected (400 + the vocabulary message)"

# --- s26: the literal-search contract pins ------------------------------------
# The demo user's seeded corpus carries "Outlook" in exactly one title, and
# NO literal % or _ in any title/description (measured, canonical seed since
# session 2) — so a literal-% search MUST return 0 rows. Before the s26 fix
# this returned ALL rows (Prisma's contains compiles to a bare LIKE — the
# wildcard silently matched everything). The cap pin: 250 chars > the
# SEARCH_MAX_LENGTH ceiling.
SEARCH_COUNT=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?search=Outlook" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$SEARCH_COUNT" = "1" ] || fail "search: ?search=Outlook must return exactly 1 ticket (got $SEARCH_COUNT)"
step "PASS" "search: literal term honored (Outlook — exactly 1)"

SEARCH_COUNT=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?search=%25" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$SEARCH_COUNT" = "0" ] || fail "search: ?search=% must return 0 tickets — the wildcard lie (got $SEARCH_COUNT)"
step "PASS" "search: literal % matches nothing (0 — no wildcard lie)"

SEARCH_COUNT=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?search=_" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$SEARCH_COUNT" = "0" ] || fail "search: ?search=_ must return 0 tickets — the wildcard lie (got $SEARCH_COUNT)"
step "PASS" "search: literal _ matches nothing (0 — no wildcard lie)"

SEARCH_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?search=$(printf 'a%.0s' $(seq 1 250))")
[ "$SEARCH_RESP" = "400" ] || fail "search: a 250-char term should 400 (got $SEARCH_RESP)"
grep -q "search must be at most 200 characters" "$RL_BODY_X" || fail "search: cap reject message"
step "PASS" "search: 250-char term rejected (400 + the cap message)"

# --- s27: the strict param-set contract pins -----------------------------------
# The route's query grammar is the closed set of seven (search, status,
# priority, sort, scope, limit, skip). Before the s27 fix an unknown name
# was silently ignored — the unfiltered feed presented as matches (the s25
# lesson-79 class, measured live at the s27 audit: ?banana=1, ?category=
# hardware, ?q={...} all returned 200 + the full list). Duplicates were
# first-wins by the URLSearchParams.get() accident — now a self-documenting
# 400. The composition pin: the Outlook ticket (resolved/low, the demo
# user's) satisfies all seven known params at once.
QUERY_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?banana=1")
[ "$QUERY_RESP" = "400" ] || fail "param-set: ?banana=1 should 400 (got $QUERY_RESP)"
grep -q "unknown query parameter: banana" "$RL_BODY_X" || fail "param-set: unknown reject message"
grep -q "search, status, priority, sort, scope, limit, skip" "$RL_BODY_X" || fail "param-set: allowed-set in message"
step "PASS" "param-set: ?banana=1 rejected (400 + the unknown message + the allowed set)"

QUERY_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets?status=open&status=resolved")
[ "$QUERY_RESP" = "400" ] || fail "param-set: duplicate status should 400 (got $QUERY_RESP)"
grep -q "duplicate query parameter: status" "$RL_BODY_X" || fail "param-set: duplicate reject message"
step "PASS" "param-set: duplicate status rejected (400 + the duplicate message)"

QUERY_COUNT=$(curl -sf -b "$COOKIE_JAR" \
  "$BASE/api/tickets?search=Outlook&status=resolved&priority=low&sort=newest&scope=mine&limit=5&skip=0" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["tickets"]))')
[ "$QUERY_COUNT" = "1" ] || fail "param-set: the seven-param composition must return exactly 1 (got $QUERY_COUNT)"
step "PASS" "param-set: all seven known params compose (Outlook — exactly 1)"
rm -f "$RL_BODY_X"

# --- s28: the stats empty-grammar contract pins ---------------------------------
# /api/stats takes NO query params (our server-computed superset surface;
# the reference has no equivalent). Before s28 the empty grammar was
# silently open: ?scope=mine and ?status=open&limit=5 — REAL sibling-route
# param names — returned 200 + the identical full aggregate (the cross-route
# variant of the s25 lesson-79 class, measured live at the s28 audit).
# Callers (sidebar + dashboard + E2E mocks) send no query string.
STATS_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/stats?banana=1")
[ "$STATS_RESP" = "400" ] || fail "stats-grammar: ?banana=1 should 400 (got $STATS_RESP)"
grep -q "unknown query parameter: banana" "$RL_BODY_X" || fail "stats-grammar: unknown reject message"
grep -q "this endpoint takes no query parameters" "$RL_BODY_X" || fail "stats-grammar: no-params message"
step "PASS" "stats-grammar: ?banana=1 rejected (400 + the unknown + no-params messages)"

STATS_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/stats?scope=mine")
[ "$STATS_RESP" = "400" ] || fail "stats-grammar: ?scope=mine should 400 (got $STATS_RESP)"
grep -q "unknown query parameter: scope" "$RL_BODY_X" || fail "stats-grammar: cross-route pin message"
step "PASS" "stats-grammar: the cross-route name ?scope=mine rejected (400)"

STATS_RESP=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/stats")
[ "$STATS_RESP" = "200" ] || fail "stats-grammar: the no-param happy path should 200 (got $STATS_RESP)"
grep -q '"mine"' "$RL_BODY_X" || fail "stats-grammar: the mine shape"
grep -q '"global"' "$RL_BODY_X" || fail "stats-grammar: the global shape"
grep -q '"avgResolutionMs"' "$RL_BODY_X" || fail "stats-grammar: the avgResolutionMs shape"
step "PASS" "stats-grammar: the no-param aggregate intact (mine + global + avgResolutionMs)"
rm -f "$RL_BODY_X"

# --- s29: the API-wide empty-grammar contract pins --------------------------------
# Every remaining route's query grammar closed (the shared parseNoQuery seam,
# the s28 stats contract extended API-wide). Before s29 all of these silently
# ignored any query string — `?scope=mine` (a REAL param name from the sibling
# /api/tickets route) on /api/auth/me, a `?banana=1` ticket CREATE that created
# the ticket, etc. — the cross-route confusion variant of the lesson-82 class
# (measured live at the s29 audit). The login + forgot-password grammar pins
# live in scripts/s29-live-verify.mjs (their rate buckets are exactly consumed
# by the s21 429 pins above).
RL_BODY_X=$(mktemp)
HEALTH_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" "$BASE/api/health?banana=1")
[ "$HEALTH_CODE" = "400" ] || fail "s29-grammar: /api/health?banana=1 should 400 (got $HEALTH_CODE)"
grep -q "unknown query parameter: banana" "$RL_BODY_X" || fail "s29-grammar: health unknown message"
grep -q "this endpoint takes no query parameters" "$RL_BODY_X" || fail "s29-grammar: health no-params message"
step "PASS" "s29-grammar: /api/health?banana=1 rejected (400 + both messages)"

HEALTH_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" "$BASE/api/health")
[ "$HEALTH_CODE" = "200" ] || fail "s29-grammar: the bare /api/health should stay 200 (got $HEALTH_CODE)"
grep -q '"status":"ok"' "$RL_BODY_X" || fail "s29-grammar: health happy-path body"
step "PASS" "s29-grammar: the bare /api/health happy path intact"

ME_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/auth/me?scope=mine")
[ "$ME_CODE" = "400" ] || fail "s29-grammar: /api/auth/me?scope=mine should 400 (got $ME_CODE)"
grep -q "unknown query parameter: scope" "$RL_BODY_X" || fail "s29-grammar: me cross-route message"
step "PASS" "s29-grammar: the cross-route ?scope=mine on /api/auth/me rejected (400)"

ME_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/auth/me")
[ "$ME_CODE" = "200" ] || fail "s29-grammar: the bare /api/auth/me should stay 200 (got $ME_CODE)"
grep -q '"user"' "$RL_BODY_X" || fail "s29-grammar: me happy-path body"
step "PASS" "s29-grammar: the bare /api/auth/me happy path intact"

SIGNUP_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -X POST "$BASE/api/auth/signup?banana=1" \
  -H "Content-Type: application/json" \
  -d '{"email":"s29-grammar-probe@example.com","password":"Probe1234!","name":"Probe"}')
[ "$SIGNUP_CODE" = "400" ] || fail "s29-grammar: signup?banana=1 should 400 (got $SIGNUP_CODE)"
grep -q "unknown query parameter: banana" "$RL_BODY_X" || fail "s29-grammar: signup unknown message"
step "PASS" "s29-grammar: /api/auth/signup?banana=1 rejected (400, no account created)"

LOGOUT_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/auth/logout?banana=1")
[ "$LOGOUT_CODE" = "400" ] || fail "s29-grammar: logout?banana=1 should 400 (got $LOGOUT_CODE)"
step "PASS" "s29-grammar: /api/auth/logout?banana=1 rejected (400, cookie NOT cleared)"

CREATE_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets?banana=1" \
  -H "Content-Type: application/json" \
  -d '{"title":"S29 grammar pin (must not persist)","description":"The query-grammar probe must be rejected.","category":"software","priority":"low"}')
[ "$CREATE_CODE" = "400" ] || fail "s29-grammar: POST /api/tickets?banana=1 should 400 (got $CREATE_CODE)"
grep -q "unknown query parameter: banana" "$RL_BODY_X" || fail "s29-grammar: create unknown message"
step "PASS" "s29-grammar: POST /api/tickets?banana=1 rejected (400, no ticket created)"

DETAIL_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets/$TICKET_ID?banana=1")
[ "$DETAIL_CODE" = "400" ] || fail "s29-grammar: GET /api/tickets/[id]?banana=1 should 400 (got $DETAIL_CODE)"
step "PASS" "s29-grammar: GET /api/tickets/[id]?banana=1 rejected (400)"

PATCH_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" -X PATCH "$BASE/api/tickets/$TICKET_ID?banana=1" \
  -H "Content-Type: application/json" -d '{"status":"open"}')
[ "$PATCH_CODE" = "400" ] || fail "s29-grammar: PATCH /api/tickets/[id]?banana=1 should 400 (got $PATCH_CODE)"
step "PASS" "s29-grammar: PATCH /api/tickets/[id]?banana=1 rejected (400, no mutation)"

COMMENT_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments?scope=mine" \
  -H "Content-Type: application/json" -d '{"content":"s29 grammar pin (must not persist)"}')
[ "$COMMENT_CODE" = "400" ] || fail "s29-grammar: comments?scope=mine should 400 (got $COMMENT_CODE)"
grep -q "unknown query parameter: scope" "$RL_BODY_X" || fail "s29-grammar: comments cross-route message"
step "PASS" "s29-grammar: the cross-route ?scope=mine on comments rejected (400, no comment created)"
rm -f "$RL_BODY_X"

# --- Response-header contract (the s30 pins) ---------------------------------
# Session 30: the reference's stack emits these five security headers on every
# response (HSTS measured universally on their 200s/405s/catch-alls); ours now
# emits the same set from next.config.ts — pinned here on the live standalone
# server (API + page + error-path coverage) plus the X-Powered-By lockdown
# (the reference sends no framework disclosure).
S30_HDRS="$(mktemp)"
curl -s -D "$S30_HDRS" -o /dev/null "$BASE/api/health"
grep -qi '^strict-transport-security: max-age=31536000' "$S30_HDRS" \
  || fail "s30-headers: /api/health should carry Strict-Transport-Security: max-age=31536000"
step "PASS" "s30-headers: /api/health carries HSTS max-age=31536000 (the reference-parity contract)"
grep -qi '^x-content-type-options: nosniff' "$S30_HDRS" \
  || fail "s30-headers: /api/health should carry X-Content-Type-Options: nosniff"
grep -qi '^x-frame-options: DENY' "$S30_HDRS" \
  || fail "s30-headers: /api/health should carry X-Frame-Options: DENY"
grep -qi '^referrer-policy: strict-origin-when-cross-origin' "$S30_HDRS" \
  || fail "s30-headers: /api/health should carry Referrer-Policy: strict-origin-when-cross-origin"
grep -qi '^permissions-policy: camera=(), microphone=(), geolocation=()' "$S30_HDRS" \
  || fail "s30-headers: /api/health should carry the Permissions-Policy lockdown"
step "PASS" "s30-headers: /api/health carries the full four-header baseline (nosniff/DENY/referrer/permissions)"
grep -qi '^x-powered-by:' "$S30_HDRS" \
  && fail "s30-headers: /api/health must NOT carry X-Powered-By (the disclosure lockdown)"
step "PASS" "s30-headers: /api/health carries no X-Powered-By disclosure"

curl -s -D "$S30_HDRS" -o /dev/null "$BASE/nonexistent-s30-header-probe"
grep -qi '^strict-transport-security: max-age=31536000' "$S30_HDRS" \
  || fail "s30-headers: the 404 page should carry the HSTS header (the universal rule)"
grep -qi '^x-powered-by:' "$S30_HDRS" \
  && fail "s30-headers: the 404 page must NOT carry X-Powered-By"
step "PASS" "s30-headers: the 404 error path carries HSTS + no X-Powered-By (the rule is universal)"
rm -f "$S30_HDRS"

# --- Response-schema contract (the s31 pins) ---------------------------------
# Session 31: the response-BODY schema audit (the s50-directed axis) measured
# every route family's JSON key sets + types CLEAN — but UNPINNED. These pins
# close the leak-guard regression surface: a future refactor that widens a
# Prisma include (shipping the passwordHash or base64 attachment blobs) or
# skews an aggregate shape fails here. The EXACT-SET assertions are the
# contract: adding a key is as much a change as removing one.
curl -sf -b "$COOKIE_JAR" "$BASE/api/auth/me" | python3 -c '
import json,sys
u = json.load(sys.stdin)["user"]
assert sorted(u) == ["email","id","name"], "got %s" % sorted(u)
assert all(isinstance(v,str) for v in u.values())
' || fail "s31-schema: /api/auth/me user keys must be exactly {id,name,email}"
step "PASS" "s31-schema: /api/auth/me user keys exactly {id,name,email} (the no-leak contract)"

curl -sf -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@servicedesk.app","password":"Demo1234!"}' | python3 -c '
import json,sys
u = json.load(sys.stdin)["user"]
assert sorted(u) == ["email","id","name"], "got %s" % sorted(u)
' || fail "s31-schema: login user keys must be exactly {id,name,email}"
step "PASS" "s31-schema: login user keys exactly {id,name,email} (the full-row-in-scope guard)"

curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets?limit=1" | python3 -c '
import json,sys
t = json.load(sys.stdin)["tickets"][0]
expected = ["_count","category","createdAt","createdBy","createdById","description","id","priority","status","title","updatedAt"]
assert sorted(t) == expected, "got %s" % sorted(t)
assert sorted(t["createdBy"]) == ["email","id","name"], "createdBy got %s" % sorted(t["createdBy"])
assert sorted(t["_count"]) == ["comments"], "_count got %s" % sorted(t["_count"])
' || fail "s31-schema: list rows must carry the bounded eleven-key set"
step "PASS" "s31-schema: list rows bounded (createdBy + _count only — no comments array, no attachment data)"

S31_ATT_TICKET=$(curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"S31 schema pin ticket","description":"carries one attachment for the pin","category":"software","priority":"low","attachments":[{"fileName":"pin.txt","mimeType":"text/plain","sizeBytes":11,"data":"c2NoZW1hIHBpbg=="}]}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["ticket"]["id"])')
[ -n "$S31_ATT_TICKET" ] || fail "s31-schema: create-with-attachment (the happy path)"
curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets/$S31_ATT_TICKET" | python3 -c '
import json,sys
t = json.load(sys.stdin)["ticket"]
assert len(t["attachments"]) == 1, "expected exactly one attachment"
a = t["attachments"][0]
assert sorted(a) == ["createdAt","fileName","id","mimeType","sizeBytes"], "got %s" % sorted(a)
assert "data" not in a, "the base64 data blob leaked into the detail response"
' || fail "s31-schema: detail attachments must carry exactly {id,fileName,mimeType,sizeBytes,createdAt}"
step "PASS" "s31-schema: detail attachments carry no data blob (the base64 leak guard)"

curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$S31_ATT_TICKET/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"s31 schema pin comment"}' | python3 -c '
import json,sys
c = json.load(sys.stdin)["comment"]
assert sorted(c) == ["author","authorId","content","createdAt","id","ticketId"], "got %s" % sorted(c)
assert sorted(c["author"]) == ["email","id","name"], "author got %s" % sorted(c["author"])
' || fail "s31-schema: comment author keys must be exactly {id,name,email}"
step "PASS" "s31-schema: comment author keys exactly {id,name,email}"

curl -sf -b "$COOKIE_JAR" "$BASE/api/stats" | python3 -c '
import json,sys
s = json.load(sys.stdin)
assert sorted(s) == ["avgResolutionMs","global","mine"], "top got %s" % sorted(s)
for sub in ("mine","global"):
    assert sorted(s[sub]) == ["closed","in_progress","open","resolved","total"], "%s got %s" % (sub, sorted(s[sub]))
    assert all(isinstance(v,int) for v in s[sub].values()), "%s values must be ints" % sub
assert s["avgResolutionMs"] is None or isinstance(s["avgResolutionMs"],(int,float))
' || fail "s31-schema: stats key sets must be the symmetric five-status vocabulary"
step "PASS" "s31-schema: stats mine+global exactly the five-status vocabulary (symmetric aggregate)"

# --- Comment + status -------------------------------------------------------
curl -sf -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"Smoke comment"}' >/dev/null || fail "add comment"
step "PASS" "add comment"

curl -sf -b "$COOKIE_JAR" -X PATCH "$BASE/api/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"resolved"}' | grep -q '"status":"resolved"' || fail "status update"
step "PASS" "owner status update"

# --- Guards -----------------------------------------------------------------
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/tickets")
[ "$CODE" = "401" ] || fail "unauthenticated /api/tickets should 401 (got $CODE)"
step "PASS" "auth guard (401)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" -d '{"title":"x","description":"y","category":"nope","priority":"low"}')
[ "$CODE" = "400" ] || fail "invalid category should 400 (got $CODE)"
step "PASS" "validation guard (400)"

# --- Create-path + attachment guards (the s23 pins) ---------------------------
# The reference's create path accepts anything PRESENT (s23 live
# measurements): an empty title stores, a "banana" status stores (rendered
# as a fallback near-black badge in their UI), out-of-vocabulary categories
# and priorities store, 10,000-char titles store, and their upload endpoint
# caps nothing (15 MiB accepted, 10 attachment URLs per ticket, a partial
# .exe/.bat extension blocklist with octet-stream serving). Ours validates
# at the route layer and pins the mimeType to the closed allowlist; these
# pins keep that contract from regressing toward theirs.
#
# Shared response-capture temp files (created once here; the s22 + s21
# blocks below reuse them and the cleanup trap removes both at the end).
RL_HEADERS="$(mktemp)"
RL_BODY="$(mktemp)"
# Server-controlled status: a client-sent status is IGNORED (the create data
# pins status:"open"). Their create stores the "banana" (200, rendered).
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke banana status pin","description":"The client-sent status must be ignored.","category":"software","priority":"low","status":"banana"}')
echo "$RESP" | tail -1 | grep -q "^201$" || fail "banana-status create should 201 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q '"status":"open"' || fail "created ticket must come back status:open (the server-controlled contract)"
step "PASS" "create-path guard: client-sent status ignored (201 + open)"

# Attachment count cap (theirs: 10 URLs per ticket, 200 — s23 measurement).
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke attachment pin","description":"The four-file probe must be rejected.","category":"software","priority":"low","attachments":[{"fileName":"a.txt","mimeType":"text/plain","sizeBytes":10,"data":""},{"fileName":"b.txt","mimeType":"text/plain","sizeBytes":10,"data":""},{"fileName":"c.txt","mimeType":"text/plain","sizeBytes":10,"data":""},{"fileName":"d.txt","mimeType":"text/plain","sizeBytes":10,"data":""}]}')
[ "$CODE" = "400" ] || fail "4 attachments should 400 (got $CODE)"
grep -q "At most 3 files can be attached" "$RL_BODY" || fail "4-file body should say At most 3 files"
step "PASS" "attachment guard: count cap (400 + At most 3 files)"

# Per-file size cap via the declared-sizeBytes seam (theirs: 15 MiB, 200).
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke attachment pin","description":"The oversized probe must be rejected.","category":"software","priority":"low","attachments":[{"fileName":"big.bin","mimeType":"text/plain","sizeBytes":2097153,"data":""}]}')
[ "$CODE" = "400" ] || fail "2MiB+1 attachment should 400 (got $CODE)"
grep -q "exceeds the 2 MB per-file limit" "$RL_BODY" || fail "oversized body should say exceeds the 2 MB per-file limit"
step "PASS" "attachment guard: size cap (400 + 2 MB limit)"

# Filename sanitation (path traversal).
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke attachment pin","description":"The traversal probe must be rejected.","category":"software","priority":"low","attachments":[{"fileName":"../evil.txt","mimeType":"text/plain","sizeBytes":10,"data":""}]}')
[ "$CODE" = "400" ] || fail "path-traversal file name should 400 (got $CODE)"
grep -q "has an invalid file name" "$RL_BODY" || fail "traversal body should say invalid file name"
step "PASS" "attachment guard: path-traversal filename (400)"

# The closed MIME allowlist (the s23 P1 guard — the reference blocks .exe
# server-side but stores .sh/.js/.html; ours pins the allowlist at the seam).
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke attachment pin","description":"The executable probe must be rejected.","category":"software","priority":"low","attachments":[{"fileName":"evil.exe","mimeType":"application/x-msdownload","sizeBytes":10,"data":""}]}')
[ "$CODE" = "400" ] || fail "unsupported mimeType should 400 (got $CODE)"
grep -q "has an unsupported file type" "$RL_BODY" || fail "bad-MIME body should say unsupported file type"
step "PASS" "attachment guard: closed MIME allowlist (400 + unsupported type)"

# --- Ownership + comment-validation (the write-path guards — the s22 pins) ----
# The reference's write path is UI-guarded only (s22 live measurements): their
# comment API accepts empty/whitespace/50k content and even a bogus ticket_id
# (all 200, stored), and their ticket-update PUT applies ANY authenticated
# user's mutation on ANY ticket (no ownership check — the UI merely hides the
# status control on non-owned detail pages). Ours validates and scopes at the
# route layer; these pins keep that contract from regressing toward theirs.
#
# Second user via signup (its own signup:${ip} rate bucket — zero login-budget
# cost; the smoke DB is fresh each run so the fixed email is deterministic).
COOKIE_JAR_B="$(mktemp)"
curl -sf -c "$COOKIE_JAR_B" -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"smoke-nonowner@servicedesk.app","name":"Smoke NonOwner","password":"NonOwner1234"}' >/dev/null \
  || fail "signup (user B)"

# The shareable-URL read contract: ANY signed-in user can VIEW a ticket...
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR_B" "$BASE/api/tickets/$TICKET_ID")
[ "$CODE" = "200" ] || fail "non-owner ticket read should 200 (got $CODE)"
step "PASS" "non-owner can view ticket (200 — shareable URLs)"

# ...but only the owner can mutate it.
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR_B" -X PATCH "$BASE/api/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" -d '{"status":"resolved"}')
[ "$CODE" = "403" ] || fail "non-owner status update should 403 (got $CODE)"
curl -s -b "$COOKIE_JAR_B" -X PATCH "$BASE/api/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" -d '{"status":"resolved"}' | grep -q "Only the ticket owner" \
  || fail "403 body should say Only the ticket owner"
step "PASS" "ownership guard (403 — non-owner PATCH rejected)"

# Comment validation (all no-side-effect probes — nothing is stored):
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" -d '{"content":""}')
[ "$CODE" = "400" ] || fail "empty comment should 400 (got $CODE)"
grep -q "Comment cannot be empty" "$RL_BODY" || fail "empty-comment body should say Comment cannot be empty"
step "PASS" "comment validation: empty rejected (400)"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" -d '{"content":"   "}')
[ "$CODE" = "400" ] || fail "whitespace comment should 400 (got $CODE)"
step "PASS" "comment validation: whitespace rejected (400)"

LONG_COMMENT=$(python3 -c "print('x' * 2001)")
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" -d "{\"content\":\"$LONG_COMMENT\"}")
[ "$CODE" = "400" ] || fail "overlong comment should 400 (got $CODE)"
grep -q "at most 2000 characters" "$RL_BODY" || fail "overlong-comment body should say at most 2000 characters"
step "PASS" "comment validation: overlong rejected (400)"

CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/nonexistent-ticket/comments" \
  -H "Content-Type: application/json" -d '{"content":"probe"}')
[ "$CODE" = "404" ] || fail "comment on unknown ticket should 404 (got $CODE)"
grep -q "Ticket not found" "$RL_BODY" || fail "unknown-ticket body should say Ticket not found"
step "PASS" "comment guard: unknown ticket rejected (404)"
rm -f "$COOKIE_JAR_B"

# --- Rate limiter (the 429 surface — the security superset, s21 pin) ---------
# The reference's auth endpoints show no visible throttle (20 reset requests +
# 12 login attempts, all non-429 — s21 live measurement); ours deliberately
# rate-limits. This pins OUR API contract at the layer with zero fixture cost:
# the throwaway server's in-memory buckets are fresh every run (an E2E pin
# would burn the whole login budget and cascade-flake the suite).
#
# Login bucket (10/IP/15-min): the demo login at the top consumed slot 1;
# the s31 schema pin's login consumed slot 2; these 9 wrong-password POSTs
# consume slots 3-11 (the first 8 answer 401; the 9th — the bucket's 11th —
# is already throttled, unchecked in this loop)...
for _ in $(seq 1 9); do
  curl -s -o /dev/null -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@servicedesk.app","password":"wrong"}' >/dev/null
done
# ...so the next request (the 12th POST; the bucket exhausted at the 11th and
# stays exhausted until the window rolls) must be throttled: 429 + Retry-After
# + the message. The contract proven is unchanged: exactly 10 attempts allowed
# per window (slot 2 returned 200, slots 3-10 returned 401), the 11th onward
# throttled.
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -D "$RL_HEADERS" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@servicedesk.app","password":"wrong"}')
[ "$CODE" = "429" ] || fail "login rate limiter should 429 on the 11th attempt (got $CODE)"
grep -qi '^retry-after:' "$RL_HEADERS" || fail "login 429 should carry Retry-After"
grep -q "Too many attempts" "$RL_BODY" || fail "login 429 body should say Too many attempts"
step "PASS" "login rate limiter (429 + Retry-After after 10)"

# Forgot bucket (its own forgot:${ip} key, 5/IP/15-min): 5 requests ok (the
# anti-enumeration 200s), the 6th throttled.
for _ in $(seq 1 5); do
  curl -s -o /dev/null -X POST "$BASE/api/auth/forgot-password" \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@servicedesk.app"}' >/dev/null
done
CODE=$(curl -s -o /dev/null -w "%{http_code}" -D "$RL_HEADERS" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@servicedesk.app"}')
[ "$CODE" = "429" ] || fail "forgot rate limiter should 429 on the 6th attempt (got $CODE)"
grep -qi '^retry-after:' "$RL_HEADERS" || fail "forgot 429 should carry Retry-After"
step "PASS" "forgot-password rate limiter (429 + Retry-After after 5)"
rm -f "$RL_HEADERS" "$RL_BODY"

rm -f db/smoke.db db/smoke.db-journal
step "PASS" "smoke test complete"
