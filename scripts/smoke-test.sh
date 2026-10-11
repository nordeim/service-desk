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

cleanup() {
  [ -n "${SERVER_PID:-}" ] && kill "$SERVER_PID" 2>/dev/null
  rm -f "$DB" "$DB-journal" "$COOKIE_JAR" "${COOKIE_JAR_B:-}" "$SERVER_LOG" ${RL_HEADERS:+"$RL_HEADERS"} ${RL_BODY:+"$RL_BODY"}
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

# --- Ownership + comment-validation (the write-path guards — the s22 pins) ----
# The reference's write path is UI-guarded only (s22 live measurements): their
# comment API accepts empty/whitespace/50k content and even a bogus ticket_id
# (all 200, stored), and their ticket-update PUT applies ANY authenticated
# user's mutation on ANY ticket (no ownership check — the UI merely hides the
# status control on non-owned detail pages). Ours validates and scopes at the
# route layer; these pins keep that contract from regressing toward theirs.
#
# Shared response-capture temp files (created once here; the rate-limiter
# block below reuses them and removes both at the end).
RL_HEADERS="$(mktemp)"
RL_BODY="$(mktemp)"
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
# these 9 wrong-password POSTs consume slots 2-10 (each 401)...
for _ in $(seq 1 9); do
  curl -s -o /dev/null -X POST "$BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@servicedesk.app","password":"wrong"}' >/dev/null
done
# ...so the 11th request must be throttled: 429 + Retry-After + the message.
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
