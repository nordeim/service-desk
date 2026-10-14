#!/usr/bin/env bash
# S50: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green.
set -o pipefail
cd /home/z/my-project/service-desk

run_corpus() {
  bunx vitest run tests/corpus-count-contract.test.ts 2>&1
}

check_bites() {
  local key="$1"; local pattern="$2"; local out="$3"
  if echo "$out" | grep -qE "$pattern"; then
    echo "BIT-OK $key: the pin failed with its expected assertion"
  else
    echo "FATAL $key: the pin did NOT fail as expected (pattern: $pattern)"
    echo "$out" | tail -20
    exit 1
  fi
}

check_green() {
  local key="$1"; local out="$2"
  if echo "$out" | grep -q "Tests  5 passed"; then
    echo "REVERTED-GREEN $key"
  else
    echo "FATAL $key: the re-run is not green"
    echo "$out" | tail -10
    exit 1
  fi
}

echo "=== BASELINE (the corpus pin file green at 5/5) ==="
OUT=$(run_corpus)
echo "$OUT" | grep -E "Tests " | head -2

echo "=== MUTATION A: the quickstart tests figure one-behind (255→254) — must bite my pin's assertion 2 (the §7.1 sum) ==="
python3 scripts/s50-mutations.py apply A
OUT=$(run_corpus)
check_bites A "the quoted test count must name the §7.1 Vitest rows' sum.*expected 254 to be 255" "$OUT"
python3 scripts/s50-mutations.py revert A
OUT=$(run_corpus)
check_green A "$OUT"

echo "=== MUTATION B: the quickstart files figure revert (25→4) — must bite my pin's assertion 1 (the fs listing) ==="
python3 scripts/s50-mutations.py apply B
OUT=$(run_corpus)
check_bites B "the quoted file count must name the vitest include listing.*expected 4 to be 25" "$OUT"
python3 scripts/s50-mutations.py revert B
OUT=$(run_corpus)
check_green B "$OUT"

echo "=== MUTATION C: the family site revert (README badge 255→254) — must bite pin 1's family + my BRIDGE ==="
python3 scripts/s50-mutations.py apply C
OUT=$(run_corpus)
check_bites C "found 254 & 255|found 255 & 254" "$OUT"
python3 scripts/s50-mutations.py revert C
OUT=$(run_corpus)
check_green C "$OUT"

echo "=== MUTATION D: the §7.1 corpus row revert (5→4) — must bite the s49 pad pin + my pin (the sum) ==="
python3 scripts/s50-mutations.py apply D
OUT=$(run_corpus)
check_bites D "the quoted test count must name the §7.1 Vitest rows' sum.*expected 255 to be 254|the s48 blind spot closed" "$OUT"
OUT2=$(bunx vitest run tests/pad-testcount-contract.test.ts 2>&1)
check_bites D-pad "claims 4 tests — the runtime count is 5" "$OUT2"
python3 scripts/s50-mutations.py revert D
OUT=$(run_corpus)
check_green D "$OUT"

echo "=== MUTATION E: the quickstart LINE deletion — must bite my pin's floor (the dropped-site doctrine) ==="
python3 scripts/s50-mutations.py apply E
OUT=$(run_corpus)
check_bites E "the README Quick Start must carry the verify-setup output line" "$OUT"
python3 scripts/s50-mutations.py revert E
OUT=$(run_corpus)
check_green E "$OUT"

echo "=== MUTATION F: the §7.1 corpus row DELETION — must bite the s49 pad pin (missing-row) + my pin (the sum) ==="
python3 scripts/s50-mutations.py apply F
OUT=$(run_corpus)
check_bites F "the quoted test count must name the §7.1 Vitest rows' sum.*expected 255 to be 250|the s48 blind spot closed" "$OUT"
OUT2=$(bunx vitest run tests/pad-testcount-contract.test.ts 2>&1)
check_bites F-pad "corpus-count-contract.test.ts \(5 tests\) with NO §7.1 row" "$OUT2"
python3 scripts/s50-mutations.py revert F
OUT=$(run_corpus)
check_green F "$OUT"

echo "=== ALL 6 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
echo "=== the full-suite confirmation (all 25 files / 255 tests) ==="
OUT=$(bun run test 2>&1)
echo "$OUT" | grep -E "Test Files|Tests " | head -2
git status --porcelain | head -20
