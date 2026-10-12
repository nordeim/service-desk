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
S33_HEADERS="$(mktemp)"
S33_CATCHALL_HDRS="$(mktemp)"
S33_SIGNUP_HDRS="$(mktemp)"
S33_LOGOUT_HDRS="$(mktemp)"
S33_BODY="$(mktemp)"
S33_JAR_C="$(mktemp)"
S33_CONCURRENCY_CODE="$(mktemp)"
S34_HDRS="$(mktemp)"

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  rm -f "$DB" "$DB-journal" "$COOKIE_JAR" "${COOKIE_JAR_B:-}" "$SERVER_LOG" ${RL_HEADERS:+"$RL_HEADERS"} ${RL_BODY:+"$RL_BODY"} ${RL_BODY_X:+"$RL_BODY_X"} ${S33_HEADERS:+"$S33_HEADERS"} ${S33_CATCHALL_HDRS:+"$S33_CATCHALL_HDRS"} ${S33_SIGNUP_HDRS:+"$S33_SIGNUP_HDRS"} ${S33_LOGOUT_HDRS:+"$S33_LOGOUT_HDRS"} ${S33_BODY:+"$S33_BODY"} ${S33_JAR_C:+"$S33_JAR_C"} ${S33_CONCURRENCY_CODE:+"$S33_CONCURRENCY_CODE"} ${S34_HDRS:+"$S34_HDRS"}
  # Session 33 hardening: a FAILED mid-run exit used to leave db/smoke.db
  # behind (the removal lived only on the success path), and the leftover
  # mutated rows (probe tickets, PATCHed statuses) poisoned the NEXT run's
  # filter pins with failures far from the real bug — the idempotent seed
  # upserts the canonical rows but never deletes the residue. Remove it in
  # the trap so every run starts clean regardless of the previous outcome.
  rm -f "$(dirname "$0")/../db/smoke.db" "$(dirname "$0")/../db/smoke.db-journal"
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
# The s33 block pins the login set-cookie ATTRIBUTE set (Path, Max-Age,
# Secure, HttpOnly, SameSite) from this call's response headers — the -D
# dump adds zero requests, so the rate-limiter slot arithmetic at the
# bottom of this script is UNCHANGED (this login stays slot 1).
curl -sf -c "$COOKIE_JAR" -D "$S33_HEADERS" -X POST "$BASE/api/auth/login" \
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

# --- Request-body grammar + envelope + HEAD/OPTIONS contract (the s32 pins) --
# Session 32: the s51-directed request-BODY audit measured every write route
# silently accepting unknown top-level JSON keys (a create carrying banana:1
# stored the ticket; a login carrying banana logged in — the body-level
# variant of the s25 lesson-79 class; the reference's platform silently
# DROPS the extra keys, the Pydantic ignore-extras default). The parseBodyKeys
# seam closes it: every grammar pin below asserts 400 + the self-documenting
# message (the s27 doctrine at the body level). The block also pins the two
# companion axes the audit measured clean-but-unpinned: the error-envelope
# convention ({error} everywhere; {error, errors} ONLY on form-validation
# surfaces) and the HEAD/OPTIONS body surface (standard + header-gated).
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"s32 body grammar probe","description":"an unknown top-level key must reject","category":"software","priority":"low","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: create +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: title, description, category, priority, attachments)' \
  || fail "s32-body: create +banana message"
step "PASS" "s32-body: create +banana rejected (400 + the allowed-set message)"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@servicedesk.app","password":"Demo1234!","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: login +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: email, password)' \
  || fail "s32-body: login +banana message"
step "PASS" "s32-body: login +banana rejected (400 + the allowed-set message)"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"s32-grammar-probe@servicedesk.app","name":"Grammar Probe","password":"Passw0rd123","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: signup +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: email, name, password)' \
  || fail "s32-body: signup +banana message"
step "PASS" "s32-body: signup +banana rejected (400 + the allowed-set message)"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@servicedesk.app","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: forgot-password +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: email)' \
  || fail "s32-body: forgot +banana message"
step "PASS" "s32-body: forgot-password +banana rejected (400 + the allowed-set message)"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
  -H "Content-Type: application/json" \
  -d '{"content":"s32 grammar probe comment","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: comment +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: content)' \
  || fail "s32-body: comment +banana message"
step "PASS" "s32-body: comment +banana rejected (400 + the allowed-set message)"

RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X PATCH "$BASE/api/tickets/$TICKET_ID" \
  -H "Content-Type: application/json" \
  -d '{"status":"in_progress","banana":1}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "s32-body: PATCH +banana should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: banana (allowed: status)' \
  || fail "s32-body: PATCH +banana message"
step "PASS" "s32-body: PATCH +banana rejected (400 + the allowed-set message)"

# The s23 server-controlled contract re-pinned on the happy path: a bare
# create (no status sent) still 201s with status:open.
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"s32 happy path status pin","description":"the bare create pins the server-controlled status","category":"software","priority":"low"}')
echo "$RESP" | tail -1 | grep -q "^201$" || fail "s32-body: bare create should 201 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q '"status":"open"' || fail "s32-body: bare create must come back status:open (the server-controlled contract)"
step "PASS" "s32-body: bare create still 201 + status:open (the s23 contract carried forward)"

# The error-envelope convention (the P2 axis): {error} exactly on every
# single-message family; {error, errors} ONLY on form-validation surfaces.
curl -s "$BASE/api/tickets" | python3 -c '
import json,sys
e = json.load(sys.stdin)
assert sorted(e) == ["error"], "401 envelope got %s" % sorted(e)
' || fail "s32-envelope: the 401 must be exactly {error}"
step "PASS" "s32-envelope: 401 carries exactly {error} (the single-message convention)"

curl -s -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"x","description":"y","category":"nope","priority":"low"}' | python3 -c '
import json,sys
e = json.load(sys.stdin)
assert sorted(e) == ["error","errors"], "form-400 envelope got %s" % sorted(e)
assert isinstance(e["errors"], dict) and e["errors"], "the errors field record must be non-empty"
' || fail "s32-envelope: the form-validation 400 must be exactly {error, errors}"
step "PASS" "s32-envelope: form-validation 400 carries {error, errors} (the field-record convention)"

curl -s -b "$COOKIE_JAR" "$BASE/api/tickets/nonexistent-ticket" | python3 -c '
import json,sys
e = json.load(sys.stdin)
assert sorted(e) == ["error"], "404 envelope got %s" % sorted(e)
' || fail "s32-envelope: the 404 must be exactly {error}"
step "PASS" "s32-envelope: 404 carries exactly {error} (the single-message convention)"

# The HEAD/OPTIONS body surface (the P3 axis): standard + header-gated.
S32_HEAD_HDRS="$(mktemp)"
curl -s -I -D "$S32_HEAD_HDRS" -o /dev/null "$BASE/api/health"
grep -qi '^HTTP' "$S32_HEAD_HDRS" || fail "s32-head: HEAD /api/health returned no status line"
grep -qi '^strict-transport-security: max-age=31536000' "$S32_HEAD_HDRS" \
  || fail "s32-head: HEAD /api/health must carry the s30 HSTS contract"
grep -qi '^x-powered-by:' "$S32_HEAD_HDRS" \
  && fail "s32-head: HEAD must NOT carry X-Powered-By"
step "PASS" "s32-head: HEAD /api/health 200 + the header set (HSTS, no X-Powered-By)"

S32_OPT_HDRS="$(mktemp)"
OPT_CODE=$(curl -s -o "$RL_BODY_X" -w "%{http_code}" -X OPTIONS -D "$S32_OPT_HDRS" "$BASE/api/health")
[ "$OPT_CODE" = "204" ] || fail "s32-head: OPTIONS /api/health should 204 (got $OPT_CODE)"
grep -qi '^allow: GET, HEAD, OPTIONS' "$S32_OPT_HDRS" \
  || fail "s32-head: OPTIONS must carry allow: GET, HEAD, OPTIONS"
[ ! -s "$RL_BODY_X" ] || fail "s32-head: OPTIONS body must be empty"
rm -f "$S32_HEAD_HDRS" "$S32_OPT_HDRS"
step "PASS" "s32-head: OPTIONS /api/health 204 + allow: GET, HEAD, OPTIONS + empty body"

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
# Server-controlled status: a client-sent status is NOT part of the create
# grammar (s32: the parseBodyKeys seam rejects it at the grammar level —
# `status` is the PATCH route's key, the cross-route shape the s27-analog
# exists to catch). Their create stores the "banana" (200, rendered). The
# s23 contract — the SERVER controls the status — is now doubly guarded:
# the grammar rejects the key here, and the s32 block below re-pins that a
# bare create still 201s with status:open.
RESP=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X POST "$BASE/api/tickets" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke banana status pin","description":"The client-sent status must be rejected at the grammar level.","category":"software","priority":"low","status":"banana"}')
echo "$RESP" | tail -1 | grep -q "^400$" || fail "banana-status create should 400 (got $(echo "$RESP" | tail -1))"
echo "$RESP" | head -1 | grep -q 'unknown request-body field: status (allowed: title, description, category, priority, attachments)' \
  || fail "banana-status create should name status as the unknown field"
step "PASS" "create-path guard: client-sent status rejected at the grammar level (400 + the field message)"

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

# --- Session 33: the API-namespace JSON 404 catch-all + the cookie-attribute
# + the concurrency pins -------------------------------------------------------
# P1 (the catch-all): before s33 every UNKNOWN path under /api/** served the
# framework's HTML 404 (content-type text/html) — the last non-JSON surface
# in the API namespace. The known routes' error paths already speak JSON
# (the s32 envelope pins); src/app/api/[[...path]]/route.ts extends the JSON
# contract to the unknown paths. P2/P3 (the cookie attributes + the
# concurrency) close the clean-but-unpinned axes measured this session.
# NONE of these probes touch the rate-limited routes (login/forgot) — the
# 429 slot arithmetic below is UNCHANGED.

# The catch-all matrix: unknown paths (nested + deep + bare) → 404 + JSON.
for S33_PATH in /api/banana /api/auth/banana /api/tickets/xyz/banana /api; do
  CODE=$(curl -s -o "$S33_BODY" -w "%{http_code}" -D "$S33_CATCHALL_HDRS" "$BASE$S33_PATH")
  [ "$CODE" = "404" ] || fail "s33-catchall: GET $S33_PATH should 404 (got $CODE)"
  grep -qi '^content-type: application/json' "$S33_CATCHALL_HDRS" \
    || fail "s33-catchall: GET $S33_PATH should be application/json"
  grep -q '"error":"API route not found"' "$S33_BODY" \
    || fail "s33-catchall: GET $S33_PATH body should say API route not found"
  grep -qi '^strict-transport-security: max-age=31536000' "$S33_CATCHALL_HDRS" \
    || fail "s33-catchall: GET $S33_PATH should carry HSTS (the s30 universal set)"
done
step "PASS" "s33-catchall: unknown API paths serve the JSON 404 (4-path matrix + HSTS)"

# The HEAD variant: 404 + the header set + an EMPTY body (the auto-HEAD on
# the GET handler — the HTTP layer strips the body; curl's -I writes the
# HEADERS as its output, so the body-size check uses %{size_download}).
CODE=$(curl -s -o /dev/null -w "%{http_code}" -I "$BASE/api/banana")
[ "$CODE" = "404" ] || fail "s33-catchall: HEAD /api/banana should 404 (got $CODE)"
S33_HEAD_SIZE=$(curl -s -o /dev/null -w "%{size_download}" -I "$BASE/api/banana")
[ "$S33_HEAD_SIZE" = "0" ] || fail "s33-catchall: HEAD /api/banana body should be empty (got $S33_HEAD_SIZE bytes)"
curl -sI "$BASE/api/banana" | grep -qi '^strict-transport-security: max-age=31536000' \
  || fail "s33-catchall: HEAD should carry HSTS"
step "PASS" "s33-catchall: HEAD /api/banana 404 + headers + empty body"

# The OPTIONS variant: 404 + the JSON body — NOT the framework's
# 204-with-allow (a nonexistent path has no method set; the explicit
# OPTIONS export exists precisely to prevent that implication).
CODE=$(curl -s -o "$S33_BODY" -w "%{http_code}" -X OPTIONS "$BASE/api/banana")
[ "$CODE" = "404" ] || fail "s33-catchall: OPTIONS /api/banana should 404 (got $CODE)"
grep -q '"error":"API route not found"' "$S33_BODY" \
  || fail "s33-catchall: OPTIONS /api/banana body should say API route not found"
step "PASS" "s33-catchall: OPTIONS /api/banana 404 + JSON (no allow header)"

# The non-shadow re-pins: the known routes stay in FRONT of the catch-all.
# (The unauth /api/auth/me returns 401 + {"user":null} — the known-route
# shape; the catch-all would answer 404, so the 401 + this body is the
# proof. NOTE: no -D dump here — $S33_HEADERS still holds the LOGIN
# response headers for the cookie-attribute pins below.)
CODE=$(curl -s -o "$S33_BODY" -w "%{http_code}" "$BASE/api/auth/me")
[ "$CODE" = "401" ] || fail "s33-shadow: /api/auth/me unauth should still 401 (got $CODE)"
grep -q '"user":null' "$S33_BODY" \
  || fail "s33-shadow: /api/auth/me should return the known-route shape ({\"user\":null}), not the catch-all"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" "$BASE/api/tickets/$TICKET_ID")
[ "$CODE" = "200" ] || fail "s33-shadow: the real-ticket detail GET should still 200 (got $CODE)"
step "PASS" "s33-shadow: known routes unaffected (me 401 JSON + real detail 200)"

# P2 (the cookie attributes): the login set-cookie from the top-of-script
# login (the -D dump — zero extra requests).
grep -i '^set-cookie: servicedesk_session=' "$S33_HEADERS" | grep -q 'Path=/' \
  || fail "s33-cookie: login set-cookie should carry Path=/"
grep -i '^set-cookie: servicedesk_session=' "$S33_HEADERS" | grep -q 'Max-Age=604800' \
  || fail "s33-cookie: login set-cookie should carry Max-Age=604800 (7-day TTL)"
grep -i '^set-cookie: servicedesk_session=' "$S33_HEADERS" | grep -q 'Secure' \
  || fail "s33-cookie: login set-cookie should carry Secure"
grep -i '^set-cookie: servicedesk_session=' "$S33_HEADERS" | grep -q 'HttpOnly' \
  || fail "s33-cookie: login set-cookie should carry HttpOnly"
grep -i '^set-cookie: servicedesk_session=' "$S33_HEADERS" | grep -q 'SameSite=lax' \
  || fail "s33-cookie: login set-cookie should carry SameSite=lax"
step "PASS" "s33-cookie: login set-cookie attribute set (Path/Max-Age/Secure/HttpOnly/SameSite)"

# The signup set-cookie: user C (signup is NOT rate-limited; the throwaway
# db user needs no cleanup — db/smoke.db is deleted at the end).
CODE=$(curl -s -o /dev/null -w "%{http_code}" -D "$S33_SIGNUP_HDRS" -c "$S33_JAR_C" \
  -X POST "$BASE/api/auth/signup" -H "Content-Type: application/json" \
  -d '{"email":"s33-smoke@servicedesk.app","name":"S33 Smoke","password":"Smoke1234!"}')
[ "$CODE" = "201" ] || fail "s33-cookie: signup should 201 (got $CODE)"
grep -i '^set-cookie: servicedesk_session=' "$S33_SIGNUP_HDRS" | grep -q 'Path=/' \
  || fail "s33-cookie: signup set-cookie should carry Path=/"
grep -i '^set-cookie: servicedesk_session=' "$S33_SIGNUP_HDRS" | grep -q 'Max-Age=604800' \
  || fail "s33-cookie: signup set-cookie should carry Max-Age=604800"
grep -i '^set-cookie: servicedesk_session=' "$S33_SIGNUP_HDRS" | grep -q 'Secure' \
  || fail "s33-cookie: signup set-cookie should carry Secure"
grep -i '^set-cookie: servicedesk_session=' "$S33_SIGNUP_HDRS" | grep -q 'HttpOnly' \
  || fail "s33-cookie: signup set-cookie should carry HttpOnly"
grep -i '^set-cookie: servicedesk_session=' "$S33_SIGNUP_HDRS" | grep -q 'SameSite=lax' \
  || fail "s33-cookie: signup set-cookie should carry SameSite=lax"
step "PASS" "s33-cookie: signup set-cookie attribute set (identical)"

# The logout clear-cookie: user C's session (logout is NOT rate-limited).
CODE=$(curl -s -o /dev/null -w "%{http_code}" -D "$S33_LOGOUT_HDRS" \
  -b "$S33_JAR_C" -X POST "$BASE/api/auth/logout")
[ "$CODE" = "200" ] || fail "s33-cookie: logout should 200 (got $CODE)"
grep -i '^set-cookie: servicedesk_session=;' "$S33_LOGOUT_HDRS" | grep -q 'Path=/' \
  || fail "s33-cookie: logout clear-cookie should carry Path=/"
grep -i '^set-cookie: servicedesk_session=;' "$S33_LOGOUT_HDRS" | grep -q 'Max-Age=0' \
  || fail "s33-cookie: logout clear-cookie should carry Max-Age=0"
grep -i '^set-cookie: servicedesk_session=;' "$S33_LOGOUT_HDRS" | grep -q 'Secure' \
  || fail "s33-cookie: logout clear-cookie should carry Secure"
grep -i '^set-cookie: servicedesk_session=;' "$S33_LOGOUT_HDRS" | grep -q 'HttpOnly' \
  || fail "s33-cookie: logout clear-cookie should carry HttpOnly"
grep -i '^set-cookie: servicedesk_session=;' "$S33_LOGOUT_HDRS" | grep -q 'SameSite=lax' \
  || fail "s33-cookie: logout clear-cookie should carry SameSite=lax"
step "PASS" "s33-cookie: logout clear-cookie attribute set (Max-Age=0 + the same tails)"

# P3 (the concurrency): 5 simultaneous comments on the smoke ticket, then
# the coherent-final-state assertion (the detail GET embeds comments).
# (NOTE: `wait` with no arguments would wait for the SERVER job too — the
# server was started with `&` and never exits — so the probe PIDs are
# collected and waited on explicitly.)
S33_COUNT_BEFORE=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets/$TICKET_ID" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["ticket"]["comments"]))')
S33_PIDS=""
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -b "$COOKIE_JAR" \
    -X POST "$BASE/api/tickets/$TICKET_ID/comments" \
    -H "Content-Type: application/json" \
    -d '{"content":"s33 concurrency comment"}' >> "$S33_CONCURRENCY_CODE" &
  S33_PIDS="$S33_PIDS $!"
done
wait $S33_PIDS
sort "$S33_CONCURRENCY_CODE" | uniq -c | grep -q '^ *5 201$' \
  || fail "s33-concurrency: all 5 parallel comments should 201 (got $(sort "$S33_CONCURRENCY_CODE" | uniq -c | tr '\n' ' '))"
: > "$S33_CONCURRENCY_CODE"
S33_COUNT_AFTER=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets/$TICKET_ID" \
  | python3 -c 'import json,sys; print(len(json.load(sys.stdin)["ticket"]["comments"]))')
[ "$S33_COUNT_AFTER" -eq $((S33_COUNT_BEFORE + 5)) ] \
  || fail "s33-concurrency: final comment count should be $((S33_COUNT_BEFORE + 5)) (got $S33_COUNT_AFTER)"
step "PASS" "s33-concurrency: 5 parallel comments all 201 + coherent final state"

# 5 simultaneous PATCHes (interleaved status flips) — all 200.
S33_PIDS=""
for i in 1 2 3 4 5; do
  if [ $((i % 2)) -eq 0 ]; then S33_STATUS=in_progress; else S33_STATUS=resolved; fi
  curl -s -o /dev/null -w "%{http_code}\n" -b "$COOKIE_JAR" \
    -X PATCH "$BASE/api/tickets/$TICKET_ID" \
    -H "Content-Type: application/json" \
    -d "{\"status\":\"$S33_STATUS\"}" >> "$S33_CONCURRENCY_CODE" &
  S33_PIDS="$S33_PIDS $!"
done
wait $S33_PIDS
sort "$S33_CONCURRENCY_CODE" | uniq -c | grep -q '^ *5 200$' \
  || fail "s33-concurrency: all 5 parallel PATCHes should 200 (got $(sort "$S33_CONCURRENCY_CODE" | uniq -c | tr '\n' ' '))"
step "PASS" "s33-concurrency: 5 parallel PATCHes all 200 (no SQLITE_BUSY)"
rm -f "$S33_CONCURRENCY_CODE"

# --- Session 34: the API-namespace no-store contract + the s15 interplay -----
# The cache-behavior remediation: every authenticated JSON response under
# /api/** shipped with NO Cache-Control (measured live: /api/auth/me — the
# user's id/name/email — /api/tickets, /api/stats). Cookie sessions ride the
# Cookie header, which RFC 9111's mandatory shared-cache no-store (the
# Authorization-header rule) does NOT cover — a shared intermediary could
# store these responses keyed by URL and serve one user's identity JSON to
# another. The next.config.ts two-rule design closes it: the blanket
# /api/:path* no-store + the LATER-LISTED more-specific attachment exception
# (a headers() rule overrides route-level Cache-Control — measured empirically
# — so the exception must win by rule order). NONE of these probes touch the
# rate-limited routes (login/forgot) — the 429 slot arithmetic is UNCHANGED
# (every probe reuses the existing $COOKIE_JAR session; the attachment
# fixture reuses the s31 schema-pin ticket's attachment).

S34_HDRS="$(mktemp)"

# The identity-leak pin: the authenticated me response carries no-store.
curl -s -o /dev/null -D "$S34_HDRS" -b "$COOKIE_JAR" "$BASE/api/auth/me"
grep -qi '^cache-control: no-store' "$S34_HDRS" \
  || fail "s34-cache: /api/auth/me should carry Cache-Control: no-store (got $(grep -i '^cache-control' "$S34_HDRS" || echo 'NO HEADER'))"
step "PASS" "s34-cache: /api/auth/me no-store (the identity-leak pin)"

# The list + stats routes: the same no-store contract on the data surface.
curl -s -o /dev/null -D "$S34_HDRS" -b "$COOKIE_JAR" "$BASE/api/tickets"
grep -qi '^cache-control: no-store' "$S34_HDRS" \
  || fail "s34-cache: /api/tickets should carry Cache-Control: no-store"
curl -s -o /dev/null -D "$S34_HDRS" -b "$COOKIE_JAR" "$BASE/api/stats"
grep -qi '^cache-control: no-store' "$S34_HDRS" \
  || fail "s34-cache: /api/stats should carry Cache-Control: no-store"
step "PASS" "s34-cache: /api/tickets + /api/stats no-store (the data surface)"

# The error-path + public-surface pins: the catch-all 404 and health.
curl -s -o /dev/null -D "$S34_HDRS" "$BASE/api/banana"
grep -qi '^cache-control: no-store' "$S34_HDRS" \
  || fail "s34-cache: the catch-all 404 should carry no-store (error paths too)"
grep -qi '^content-type: application/json' "$S34_HDRS" \
  || fail "s34-cache: the catch-all 404 should still be JSON (the s33 contract)"
curl -s -o /dev/null -D "$S34_HDRS" "$BASE/api/health"
grep -qi '^cache-control: no-store' "$S34_HDRS" \
  || fail "s34-cache: /api/health should carry no-store (caching defeats the liveness probe)"
step "PASS" "s34-cache: the catch-all 404 + /api/health no-store (error + public surfaces)"

# THE INTERPLAY PIN — the s15 attachment contract survives the blanket rule:
# the download still carries the year-long immutable private window (a Next.js
# precedence change that lets the blanket clobber the exception — or the route
# code — FAILS HERE instead of silently shipping a broken contract).
S34_ATT_ID=$(curl -sf -b "$COOKIE_JAR" "$BASE/api/tickets/$S31_ATT_TICKET" \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["ticket"]["attachments"][0]["id"])')
[ -n "$S34_ATT_ID" ] || fail "s34-interplay: fetch the s31 fixture attachment id"
curl -s -o /dev/null -D "$S34_HDRS" -b "$COOKIE_JAR" \
  "$BASE/api/tickets/$S31_ATT_TICKET/attachments/$S34_ATT_ID"
grep -qi '^cache-control: private, max-age=31536000, immutable' "$S34_HDRS" \
  || fail "s34-interplay: the attachment download must keep the s15 window (got $(grep -i '^cache-control' "$S34_HDRS" || echo 'NO HEADER'))"
grep -qi '^content-disposition: inline' "$S34_HDRS" \
  || fail "s34-interplay: the attachment download must keep the s14 inline disposition"
step "PASS" "s34-interplay: attachment download keeps s15 (immutable window + inline) under the blanket no-store"
rm -f "$S34_HDRS"

# --- Rate limiter (the 429 surface — the security superset, s21 pin) ---------
# The reference's auth endpoints show no visible throttle (20 reset requests +
# 12 login attempts, all non-429 — s21 live measurement); ours deliberately
# rate-limits. This pins OUR API contract at the layer with zero fixture cost:
# the throwaway server's in-memory buckets are fresh every run (an E2E pin
# would burn the whole login budget and cascade-flake the suite).
#
# Login bucket (10/IP/15-min): the demo login at the top consumed slot 1;
# the s31 schema pin's login consumed slot 2; the s32 body-grammar login
# probe consumed slot 3 (the limiter runs first — the grammar 400 still
# burns the attempt); these 9 wrong-password POSTs consume slots 4-12 (the
# first 7 answer 401; the 8th and 9th — the bucket's 11th and 12th — are
# already throttled, unchecked in this loop)...
for _ in $(seq 1 9); do
  curl -s -o /dev/null -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@servicedesk.app","password":"wrong"}' >/dev/null
done
# ...so the next request (the 13th POST; the bucket exhausted at the 11th
# and stays exhausted until the window rolls) must be throttled: 429 +
# Retry-After + the message. The contract proven is unchanged: exactly 10
# attempts allowed per window (slots 1-3 answered 200/200/400, slots 4-10
# returned 401), the 11th onward throttled.
CODE=$(curl -s -o "$RL_BODY" -w "%{http_code}" -D "$RL_HEADERS" -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"nobody@servicedesk.app","password":"wrong"}')
[ "$CODE" = "429" ] || fail "login rate limiter should 429 on the 11th attempt (got $CODE)"
grep -qi '^retry-after:' "$RL_HEADERS" || fail "login 429 should carry Retry-After"
grep -q "Too many attempts" "$RL_BODY" || fail "login 429 body should say Too many attempts"
step "PASS" "login rate limiter (429 + Retry-After after 10)"

# Forgot bucket (its own forgot:${ip} key, 5/IP/15-min): the s32 body-grammar
# probe consumed slot 1 (the 400 burns the attempt); these 5 requests land on
# slots 2-6 — the 6th is already throttled (unchecked) — so the asserted request
# (the 7th) must 429. The contract proven is unchanged: 5 attempts per window,
# the 6th onward throttled.
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
