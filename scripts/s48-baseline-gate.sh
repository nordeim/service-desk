#!/bin/bash
# S48: baseline gate — the s47 closeout state reproduction check
# Runs the full verification gate in the clean environment (ports free).
set -o pipefail
cd /home/z/my-project/service-desk

echo "=== LINT ==="
bun run lint 2>&1 | tail -3
LINT=$?

echo "=== TYPECHECK ==="
bun run typecheck 2>&1 | tail -3
TC=$?

echo "=== UNIT (expect 245) ==="
bun run test 2>&1 | tail -6
UNIT=$?

echo "=== BUILD ==="
bun run build 2>&1 | tail -5
BUILD=$?

echo "exit codes: lint=$LINT typecheck=$TC unit=$UNIT build=$BUILD"
