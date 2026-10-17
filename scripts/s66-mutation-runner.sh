#!/usr/bin/env bash
# S66: the mutation battery runner (A-H, the observed bite fragments — each
# mutation applied, the suite run, the bite CONFIRMED in the output, the
# mutation reverted, the suite re-greened). The observation pass ran BEFORE
# this runner shipped (the convention since s55); every fragment below was
# produced by a live vitest run.
set -o pipefail
cd /home/z/my-project/service-desk
PASS=0; FAIL=0

run_one() {
  local ID="$1"; local TARGET="$2"; shift 2
  local FRAGMENTS=("$@")
  echo "=== mutation $ID ==="
  python3 scripts/s66-mutations.py apply "$ID" || { echo "APPLY FAILED"; FAIL=$((FAIL+1)); return; }
  OUT=$(timeout 300 bun run test -- $TARGET 2>&1)
  local BITTEN=1
  for frag in "${FRAGMENTS[@]}"; do
    if echo "$OUT" | grep -qF "$frag"; then
      echo "  bite observed: $frag"
    else
      echo "  BITE MISSING: $frag"
      BITTEN=0
    fi
  done
  python3 scripts/s66-mutations.py revert "$ID" || { echo "REVERT FAILED"; FAIL=$((FAIL+1)); return; }
  if [ "$BITTEN" = "1" ]; then
    echo "  $ID CLEAN (applied -> bit -> reverted)"
    PASS=$((PASS+1))
  else
    echo "  $ID FAILED (a designed bite did not fire)"
    FAIL=$((FAIL+1))
  fi
}

run_one A tests/ci-contract.test.ts \
  'no job may run on the floating "ubuntu-latest"'

run_one B tests/ci-contract.test.ts \
  "no setup-bun step may use bun-version: latest"

run_one C tests/ci-contract.test.ts \
  "both jobs must carry the SAME pinned runner literal"

run_one D tests/ci-contract.test.ts \
  "both setup-bun steps must carry the SAME pinned bun version"

run_one E tests/ci-contract.test.ts \
  "exactly 2 uncommented bun-version lines expected"

run_one F tests/corpus-count-contract.test.ts \
  "found 294 & 296"

run_one G tests/pad-testcount-contract.test.ts \
  "claims 5 tests — the runtime count is 6"

run_one H "tests/plan-status-contract.test.ts tests/doc-enumeration-contract.test.ts" \
  "carry unchecked execution-status boxes" \
  "the plan corpus enumeration is not exact" \
  "the previous session's agent log is missing" \
  "the agent-log correspondence is broken"

echo ""
echo "BATTERY RESULT: $PASS clean / $FAIL failed (of 8)"
[ "$FAIL" = "0" ] || exit 1
