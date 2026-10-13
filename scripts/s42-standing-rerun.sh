#!/usr/bin/env bash
# Session-42 standing re-run: the s24–s40 live-verify lineage against the
# s42-remediated build (the fresh-boot-between-batches doctrine, the s41
# pattern). Each batch = ONE script at a time, NO output pipes (each
# script's full output to its own log), exit codes checked, the seed
# canonical re-verified after every script.
set -u
cd "$(dirname "$0")/.."
PORT=3000
BASE="http://localhost:${PORT}"

BOOT_LOG=/tmp/s42-standing-boot.log
SERVER_PID=""

boot_server() {
  kill_server
  NODE_ENV=production PORT=${PORT} DATABASE_URL='file:../db/custom.db' \
    bun .next/standalone/server.js > "${BOOT_LOG}" 2>&1 &
  SERVER_PID=$!
  for _ in $(seq 1 40); do
    if curl -sf "${BASE}/api/health" >/dev/null 2>&1; then return 0; fi
    sleep 0.5
  done
  echo "FATAL: server failed to boot"; exit 1
}

kill_server() {
  if [ -n "${SERVER_PID}" ]; then kill "${SERVER_PID}" 2>/dev/null; wait "${SERVER_PID}" 2>/dev/null; fi
  local pid; pid=$(lsof -t -i:${PORT} 2>/dev/null)
  if [ -n "${pid}" ]; then kill ${pid} 2>/dev/null; sleep 1; fi
  SERVER_PID=""
}

seed_check() {
  # The direct PrismaClient invocation resolves `file:` URLs against the
  # generated client's schema anchor — use the ABSOLUTE path (the same
  # file the server opens via db-path.ts; see src/lib/db-path.ts).
  DATABASE_URL="file:$(pwd)/db/custom.db" node -e "
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    Promise.all([db.user.count(), db.ticket.count(), db.comment.count()])
      .then(async ([u, t, c]) => {
        const ok = u === 4 && t === 11 && c === 3;
        console.log((ok ? '[SEED OK] ' : '[SEED BAD] ') + u + '/' + t + '/' + c);
        await db.\$disconnect();
        process.exit(ok ? 0 : 1);
      })
      .catch(async () => { process.exit(1); });
  "
}

SCRIPTS=(
  s24-live-verify.mjs s25-live-verify.mjs s26-live-verify.mjs
  s27-live-verify.mjs s28-live-verify.mjs s29-live-verify.mjs
  s31-live-verify.mjs s32-live-verify.mjs s33-live-verify.mjs
  s34-live-verify.mjs s35-live-verify.mjs s36-live-verify.mjs
  s37-live-verify.mjs s38-live-verify.mjs s39-live-verify.mjs
  s40-live-verify.mjs
)

FAILED=0
for script in "${SCRIPTS[@]}"; do
  # FRESH BOOT before every script (the doctrine — the in-memory rate-limit
  # state resets on boot; a single long-lived server accumulates login
  # attempts across scripts and exhausts the 10/15min bucket by s33).
  boot_server
  log="/tmp/s42-standing-${script%.mjs}.log"
  if node "scripts/${script}" > "${log}" 2>&1; then
    tail -1 "${log}" | sed "s/^/[OK] ${script}: /"
  else
    echo "[FAIL] ${script} — exit $? (see ${log})"
    FAILED=1
  fi
  seed_check || FAILED=1
done
kill_server
if [ "${FAILED}" -ne 0 ]; then echo "STANDING RE-RUN: FAILED"; exit 1; fi
echo "STANDING RE-RUN: ALL GREEN (${#SCRIPTS[@]} scripts)"
