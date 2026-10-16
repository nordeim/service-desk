#!/usr/bin/env bash
# S62: the hardened mutation battery runner (the s58-s61 lineage).
# For each mutation A-H: apply -> run the FULL suite -> expect a FAIL whose
# message names the designed pin -> revert -> re-run -> expect GREEN.
# The re-verify helper greps the Tests summary ANYWHERE in the output (the
# s56 lesson: never in the last three lines).
set -o pipefail
cd /home/z/my-project/service-desk

run_suite() {
  bun run test 2>&1
}

verify_green() {
  # the Tests summary line, anywhere in the output (the s56 tail-3 lesson)
  local out="$1"
  echo "$out" | grep -qE "Tests  +287 passed \(287\)" && return 0
  echo "FATAL: expected GREEN 287/287, got:" >&2
  echo "$out" | grep -E "Test Files|Tests |FAIL" | head -5 >&2
  return 1
}

expect_fail_naming() {
  local id="$1"; shift
  local want="$1"; shift
  local out="$1"
  if echo "$out" | grep -qE "FAIL |AssertionError"; then
    if echo "$out" | grep -qF "$want"; then
      echo "  $id: BIT the designed pin (${want:0:60}...)"
      return 0
    else
      echo "  $id: FAILED but not with the designed message — want: $want" >&2
      echo "$out" | grep -E "AssertionError|Error:" | head -4 >&2
      return 1
    fi
  else
    echo "  $id: expected a FAIL, got GREEN — the mutation did not bite" >&2
    return 1
  fi
}

declare -a IDS=(A B C D E F G H)
# the designed bite fragments (one distinctive fragment per mutation, OBSERVED
# in the observation pass before this runner was written)
declare -a WANTS=(
  "02-dashboard.png: bad PNG magic (the declared .png format is not true)"
  "06-mobile-dashboard.png: missing IEND trailer (truncated)"
  "10-attachment-inline-view.png: bad PNG magic (the declared .png format is not true)"
  "the screenshots family floor: expected >= 10 members, found 9"
  "the screenshots family floor: expected >= 10 members, found 0"
  "found 286 & 287"
  "claims 4 tests — the runtime count is 5"
  "the plan corpus enumeration is not exact"
)

echo "S62 mutation battery: $(date -u +%H:%M:%S)UTC start"
FAILURES=0
for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; want="${WANTS[$i]}"
  echo "== mutation $id =="
  python3 scripts/s62-mutations.py apply "$id" || { echo "FATAL: apply $id failed" >&2; exit 1; }
  out=$(run_suite)
  expect_fail_naming "$id" "$want" "$out" || FAILURES=$((FAILURES+1))
  python3 scripts/s62-mutations.py revert "$id" || { echo "FATAL: revert $id failed" >&2; exit 1; }
  out2=$(run_suite)
  verify_green "$out2" || { echo "FATAL: the suite did not re-green after reverting $id" >&2; exit 1; }
done

if [ "$FAILURES" -ne 0 ]; then
  echo "BATTERY RESULT: $FAILURES mutation(s) did not bite as designed" >&2
  exit 1
fi
echo "BATTERY CLEAN END-TO-END (8/8): $(date -u +%H:%M:%S)UTC"
