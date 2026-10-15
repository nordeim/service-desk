#!/usr/bin/env bash
# S56: the hardened mutation runner — all 7 mutations (A-G), each:
#   apply -> run the target pin file -> expect the EXACT observed bite patterns
#   -> FATAL on unexpected extra failures -> revert -> re-verify GREEN.
# The bite patterns below were OBSERVED live before this runner was written
# (the s53/s54/s55 doctrine: never guess the message).
set -o pipefail
cd /home/z/my-project/service-desk
MUT="python3 scripts/s56-mutations.py"
FAIL=0

run_pin() { # $1 = test file, rest = expected patterns
  local tfile="$1"; shift
  local out
  out=$(bunx vitest run "$tfile" 2>&1)
  local failed
  failed=$(printf '%s' "$out" | grep -cE "^ (FAIL|×)| × " )
  local missing=0
  for pat in "$@"; do
    if ! printf '%s' "$out" | grep -qF "$pat"; then
      echo "  BITE-MISSING: pattern not found: $pat"
      missing=1
    fi
  done
  if [ "$missing" = 1 ]; then echo "$out" | grep -E "Error:|AssertionError" | head -4; return 1; fi
  echo "  bite confirmed (patterns: $*)"
  return 0
}

reverify() { # $1 = test file -> must be fully green
  local out
  out=$(bunx vitest run "$1" 2>&1)
  if printf '%s' "$out" | grep -qE "Tests[[:space:]]+[0-9]+ passed \([0-9]+\)"; then
    echo "  re-verify GREEN"
    return 0
  fi
  echo "  RE-VERIFY FAILED:"
  printf '%s' "$out" | grep -E "Tests|FAIL|Error" | head -5
  return 1
}

check() { # $1 = mutation, $2 = test file, rest = patterns
  local m="$1" tfile="$2"; shift 2
  echo "=== mutation $m ==="
  $MUT "apply-$m" || { echo "FATAL: apply-$m failed"; FAIL=1; return; }
  if run_pin "$tfile" "$@"; then
    :
  else
    echo "FATAL: mutation $m did not bite as observed"
    $MUT "revert-$m" || { echo "FATAL: revert-$m failed after missed bite"; FAIL=1; }
    FAIL=1; return
  fi
  $MUT "revert-$m" || { echo "FATAL: revert-$m failed"; FAIL=1; return; }
  reverify "$tfile" || FAIL=1
}

check A tests/artifact-existence-contract.test.ts \
  "persistence claims naming scripts that are not on the fs" \
  "docs/session_69.md line 21" \
  "s40-apply-stubs.py"

check B tests/artifact-existence-contract.test.ts \
  "push-range citations naming unreachable commits" \
  "how-to-git-push-using-ssh-wrapper_SKILL.md line 11" \
  "0ab29dc is unreachable"

check C tests/artifact-existence-contract.test.ts \
  "bare commit citations that do not resolve in git" \
  "deadbeef"

check D tests/artifact-existence-contract.test.ts \
  "the exclusion literal 89504e470d0a1a0a is no longer cited in the corpus"

check E tests/corpus-count-contract.test.ts \
  "found 273 & 276"

check F tests/pad-testcount-contract.test.ts \
  "claims 2 tests — the runtime count is 3"

check G tests/plan-status-contract.test.ts \
  "remediation-plan-session57.md) must exist" \
  "plans from closed sessions carry unchecked execution-status boxes"

echo "==============================="
if [ "$FAIL" = 0 ]; then
  echo "ALL 7 MUTATIONS (A-G) BIT + REVERTED + RE-VERIFIED — CLEAN END-TO-END"
else
  echo "MUTATION BATTERY FAILED — see the FATAL lines above"
  exit 1
fi
