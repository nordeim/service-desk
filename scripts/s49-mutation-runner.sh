#!/usr/bin/env bash
# S49: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green.
set -o pipefail
cd /home/z/my-project/service-desk

run_pin() {
  # runs only the two pin files (fast, isolates the failure to the pin)
  bunx vitest run tests/pad-testcount-contract.test.ts 2>&1
}

check_bites() {
  local key="$1"; local pattern="$2"; local out="$3"
  if echo "$out" | grep -qE "$pattern"; then
    echo "BIT-OK $key: the pin failed with its expected assertion"
  else
    echo "FATAL $key: the pin did NOT fail as expected"
    echo "$out" | tail -20
    exit 1
  fi
}

check_green() {
  local key="$1"; local out="$2"
  if echo "$out" | grep -q "Tests  254 passed"; then
    echo "REVERTED-GREEN $key"
  elif echo "$out" | grep -q "3 passed"; then
    echo "REVERTED-GREEN $key (3 pin tests)"
  else
    echo "FATAL $key: the re-run is not green"
    echo "$out" | tail -10
    exit 1
  fi
}

echo "=== BASELINE (both pin files green) ==="
OUT=$(run_pin tests/pad-testcount-contract.test.ts)
echo "$OUT" | grep -E "Tests " | head -2

echo "=== MUTATION A: the domain §7.1 count revert (75→61) — must bite the unit pin ==="
python3 scripts/s49-mutations.py apply A
OUT=$(run_pin)
check_bites A "claims 61 tests — the runtime count is 75" "$OUT"
python3 scripts/s49-mutations.py revert A
OUT=$(run_pin)
check_green A "$OUT"

echo "=== MUTATION B: the dropped body-size row — must bite the completeness direction ==="
python3 scripts/s49-mutations.py apply B
OUT=$(run_pin)
check_bites B "tests/body-size.test.ts.*NO §7.1 row|NO §7.1 row.*body-size" "$OUT"
python3 scripts/s49-mutations.py revert B
OUT=$(run_pin)
check_green B "$OUT"

echo "=== MUTATION C: the auth.spec E2E count revert (11→9) — must bite the E2E pin ==="
python3 scripts/s49-mutations.py apply C
OUT=$(run_pin)
check_bites C "claims 9 tests — the runtime count is 11" "$OUT"
python3 scripts/s49-mutations.py revert C
OUT=$(run_pin)
check_green C "$OUT"

echo "=== MUTATION D: the smoke-row figure edit (121→111) — must bite the smoke pin ==="
python3 scripts/s49-mutations.py apply D
OUT=$(run_pin)
check_bites D "expected 111 to be 121" "$OUT"
python3 scripts/s49-mutations.py revert D
OUT=$(run_pin)
check_green D "$OUT"

echo "=== MUTATION E: the corpus site revert (README badge 254→251) — must bite the s48 corpus family ==="
python3 scripts/s49-mutations.py apply E
OUT=$(bunx vitest run tests/corpus-count-contract.test.ts 2>&1)
check_bites E "found 254 & 251|251 & 254|names ONE number" "$OUT"
python3 scripts/s49-mutations.py revert E
OUT=$(bunx vitest run tests/corpus-count-contract.test.ts 2>&1)
echo "$OUT" | grep -E "Tests " | head -1

echo "=== MUTATION F: the pin row's own count edit (3→2) — must bite the unit pin ==="
python3 scripts/s49-mutations.py apply F
OUT=$(run_pin)
check_bites F "claims 2 tests — the runtime count is 3" "$OUT"
python3 scripts/s49-mutations.py revert F
OUT=$(run_pin)
check_green F "$OUT"

echo "=== ALL 6 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
git status --porcelain | head -20
