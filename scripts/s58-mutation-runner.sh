#!/usr/bin/env bash
# S58: the hardened mutation battery runner (the s57 lineage).
# For each mutation A–G: apply -> run the FULL suite -> expect a FAIL whose
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
  echo "$out" | grep -qE "Tests  +282 passed \(282\)" && return 0
  echo "FATAL: expected GREEN 282/282, got:" >&2
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
      echo "$out" | grep -E "AssertionError" | head -4 >&2
      return 1
    fi
  else
    echo "  $id: expected a FAIL, got GREEN — the mutation did not bite" >&2
    return 1
  fi
}

declare -a IDS=(A B C D E F G)
# the designed bite fragments (one distinctive fragment per mutation)
declare -a WANTS=(
  "doc-path references that do not resolve on the fs: AGENTS.md line 27: \`src/lib/db-pathz.ts\`"
  "the exclusion entry db/smoke.db (the SMOKE TRANSIENT — the trap removes it at the end of every run) is no longer backticked-cited"
  "the doc-path reference floor: expected >= 500 checked references across the five core docs, found 3"
  "bare commit citations that do not resolve in git: worklog.md line 2896: \`deadbeef\`"
  "found 279 & 282"
  "the §7.1 row for tests/doc-path-reachability-contract.test.ts claims 2 tests — the runtime count is 3"
  "the plan corpus floor: expected >= 58 plan files on the fs, found 57"
)

echo "=== the S58 mutation battery (7 mutations, each observed + reverted + re-verified) ==="
for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; want="${WANTS[$i]}"
  echo "--- mutation $id ---"
  python3 scripts/s58-mutations.py apply "$id" || exit 1
  out=$(run_suite)
  expect_fail_naming "$id" "$want" "$out" || { python3 scripts/s58-mutations.py revert "$id"; exit 1; }
  python3 scripts/s58-mutations.py revert "$id" || exit 1
  out2=$(run_suite)
  verify_green "$out2" || exit 1
  echo "  $id: reverted, re-verified GREEN 282/282"
done

echo "=== BATTERY CLEAN END-TO-END (7/7) ==="
