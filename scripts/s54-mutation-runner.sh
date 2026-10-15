#!/usr/bin/env bash
# S54: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green. Hard-FATAL before
# any subsequent mutation can observe a contaminated tree (the s50-s53 lesson:
# a runner that dies mid-flight leaves a mutation applied). The bite patterns
# below were OBSERVED against the pins first (the s53 lesson-at-H doctrine:
# never a guessed message shape).
set -o pipefail
cd /home/z/my-project/service-desk

run_coverage() {
  bunx vitest run tests/pad-coverage-contract.test.ts 2>&1
}
run_corpus() {
  bunx vitest run tests/corpus-count-contract.test.ts 2>&1
}
run_pad() {
  bunx vitest run tests/pad-testcount-contract.test.ts 2>&1
}
run_seam() {
  bunx vitest run src/lib/__tests__/route-head.test.ts 2>&1
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
  local key="$1"; local n="$2"; local out="$3"
  if echo "$out" | grep -q "Tests  $n passed"; then
    echo "REVERTED-GREEN $key"
  else
    echo "FATAL $key: the re-run is not green ($n expected)"
    echo "$out" | tail -10
    exit 1
  fi
}

echo "=== BASELINES ==="
OUT=$(run_coverage); echo "coverage: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_corpus);    echo "corpus:   $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_pad);       echo "pad:      $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_seam);      echo "seam:     $(echo "$OUT" | grep -E 'Tests ' | head -1)"

echo "=== MUTATION A: the route-head MAP entry commented out — must bite pin 1 (the fs boundary, the forward-guard direction) ==="
python3 scripts/s54-mutations.py apply A
OUT=$(run_coverage)
check_bites A "src/lib seams with no unit test.*to deeply equal \[\]" "$OUT"
python3 scripts/s54-mutations.py revert A
OUT=$(run_coverage)
check_green A 3 "$OUT"

echo "=== MUTATION B: a MAP entry's test path mutated to a nonexistent file — must bite pin 2's EXISTENCE check ==="
python3 scripts/s54-mutations.py apply B
OUT=$(run_coverage)
check_bites B "the mapped test tests/api-methods2\.test\.ts does not exist \(fs\) — src/lib/api-methods\.ts has no unit test" "$OUT"
python3 scripts/s54-mutations.py revert B
OUT=$(run_coverage)
check_green B 3 "$OUT"

echo "=== MUTATION C: a MAP entry pointed at an existing test that does not import the source — must bite pin 2's IMPORT-verification ==="
python3 scripts/s54-mutations.py apply C
OUT=$(run_coverage)
check_bites C "the mapped test tests/db-path\.test\.ts does not import the mapped source src/lib/auth\.ts — the map entry is dishonest" "$OUT"
python3 scripts/s54-mutations.py revert C
OUT=$(run_coverage)
check_green C 3 "$OUT"

echo "=== MUTATION D: a phantom exclusion added — must bite pin 3's fs-existence (the stale-exclusion direction) ==="
python3 scripts/s54-mutations.py apply D
OUT=$(run_coverage)
check_bites D "the exclusion src/lib/legacy-util\.ts is stale \(not on the fs\)" "$OUT"
python3 scripts/s54-mutations.py revert D
OUT=$(run_coverage)
check_green D 3 "$OUT"

echo "=== MUTATION E: the §7.1 route-head row figure 4 -> 2 — must bite the s49 pad pin AND the s50 BRIDGE (the sum 268) ==="
python3 scripts/s54-mutations.py apply E
OUT=$(run_pad)
check_bites E "the §7\.1 row for src/lib/__tests__/route-head\.test\.ts claims 2 tests — the runtime count is 4" "$OUT"
OUT=$(run_corpus)
check_bites E "the quoted test count must name the §7\.1 Vitest rows' sum — the sum is 268" "$OUT"
python3 scripts/s54-mutations.py revert E
OUT=$(run_pad)
check_green E 3 "$OUT"
OUT=$(run_corpus)
check_green E 5 "$OUT"

echo "=== MUTATION F: the README badge revert 270 -> 263 — must bite the s48 family pin + the s50 BRIDGE ==="
python3 scripts/s54-mutations.py apply F
OUT=$(run_corpus)
check_bites F "found 263 & 270" "$OUT"
python3 scripts/s54-mutations.py revert F
OUT=$(run_corpus)
check_green F 5 "$OUT"

echo "=== MUTATION G: the url field dropped from route-head.ts (a SOURCE mutation) — must bite the seam test's trio + completeness ==="
python3 scripts/s54-mutations.py apply G
OUT=$(run_seam)
check_bites G "og:url for /dashboard: expected undefined to be '/dashboard'" "$OUT"
python3 scripts/s54-mutations.py revert G
OUT=$(run_seam)
check_green G 4 "$OUT"

echo ""
echo "=== ALL S54 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
