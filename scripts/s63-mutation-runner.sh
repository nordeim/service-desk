#!/usr/bin/env bash
# S63: the hardened mutation battery runner (the s58-s62 lineage).
# For each mutation A-H: apply -> run the FULL suite -> expect a FAIL whose
# message names the designed pin -> revert -> re-run -> expect GREEN.
# The re-verify helper greps the Tests summary ANYWHERE in the output (the
# s56 lesson: never in the last three lines).
# The D revert is the BACKUP form (the block-append dup creates 2 identical
# strings — a string-replace revert cannot distinguish them; the s62
# binary-mutation backup lineage); the E neuter is the EMPTY-CORPUS form
# (zero entries AND zero separators — the 1:1 structure passes vacuously,
# only the floor catches it; the report-field neuter hit the structure
# check first).
set -o pipefail
cd /home/z/my-project/service-desk

run_suite() {
  bun run test 2>&1
}

verify_green() {
  # the Tests summary line, anywhere in the output (the s56 tail-3 lesson)
  local out="$1"
  echo "$out" | grep -qE "Tests  +288 passed \(288\)" && return 0
  echo "FATAL: expected GREEN 288/288, got:" >&2
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
  "NEW worklog task-number holes [198, 199]"
  "lacks Agent:"
  "an entry block carries 2 Task ID lines"
  "exact-duplicate worklog Task IDs: Task ID: 198-gap-s63"
  "the worklog entry floor: expected >= 200, found 0"
  "found 287 & 288"
  "claims 3 tests — the runtime count is 4"
  "the plan corpus enumeration is not exact"
)

echo "S63 mutation battery: $(date -u +%H:%M:%S)UTC start"
FAILURES=0
for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; want="${WANTS[$i]}"
  echo "== mutation $id =="
  python3 scripts/s63-mutations.py apply "$id" || { echo "FATAL: apply $id failed" >&2; exit 1; }
  out=$(run_suite)
  expect_fail_naming "$id" "$want" "$out" || FAILURES=$((FAILURES+1))
  python3 scripts/s63-mutations.py revert "$id" || { echo "FATAL: revert $id failed" >&2; exit 1; }
  out2=$(run_suite)
  verify_green "$out2" || { echo "FATAL: the suite did not re-green after reverting $id" >&2; exit 1; }
done

if [ "$FAILURES" -ne 0 ]; then
  echo "BATTERY RESULT: $FAILURES mutation(s) did not bite as designed" >&2
  exit 1
fi
echo "BATTERY CLEAN END-TO-END (8/8): $(date -u +%H:%M:%S)UTC"
