#!/usr/bin/env bash
# S57: the mutation battery runner (the s56 hardened pattern) — each mutation
# applied, the FULL suite observed failing on the expected pin, reverted,
# re-verified green. The re-verify helper greps the WHOLE vitest output (the
# s56 lesson: the Tests summary is never in the tail-3 lines).
set -o pipefail
cd /home/z/my-project/service-desk
PY="python3 scripts/s57-mutations.py"
RESULTS=/tmp/s57-results/mutations
mkdir -p "$RESULTS"

run_suite() { # $1 = label
  bun run test > "$RESULTS/$1.log" 2>&1
  # the whole-output form: the Tests summary line
  grep -E "Tests  [0-9]+ (passed|failed)" "$RESULTS/$1.log" | tail -1
}

echo "=== baseline (pre-battery) ==="
BASE=$(run_suite baseline)
echo "baseline: $BASE"
echo "$BASE" | grep -q "279 passed" || { echo "FATAL: baseline not green at 279"; exit 1; }

for M in A B C D E F G; do
  echo "=== mutation $M ==="
  $PY "$M" apply > /dev/null || { echo "FATAL: $M apply failed"; exit 1; }
  BIT=$(run_suite "mut-$M")
  echo "  bite:   $BIT"
  echo "$BIT" | grep -q "failed" || { echo "FATAL: $M did not bite (suite green)"; $PY "$M" revert > /dev/null; exit 1; }
  $PY "$M" revert > /dev/null || { echo "FATAL: $M revert failed"; exit 1; }
  REV=$(run_suite "rev-$M")
  echo "  revert: $REV"
  echo "$REV" | grep -q "279 passed" || { echo "FATAL: $M revert not green"; exit 1; }
done

echo "=== post-battery tree hygiene ==="
git status --short | grep -E "\.mutated|mutation-test" && { echo "FATAL: mutation residue"; exit 1; }
echo "clean"
echo "=== BATTERY CLEAN END-TO-END (7/7) ==="
