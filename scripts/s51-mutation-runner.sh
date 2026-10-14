#!/usr/bin/env bash
# S51: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green. Hard-FATAL before
# any subsequent mutation can observe a contaminated tree (the s50 lesson:
# the first runner design died mid-flight leaving a mutation applied).
set -o pipefail
cd /home/z/my-project/service-desk

run_prereq() {
  bunx vitest run tests/prereq-contract.test.ts 2>&1
}
run_corpus() {
  bunx vitest run tests/corpus-count-contract.test.ts 2>&1
}
run_pad() {
  bunx vitest run tests/pad-testcount-contract.test.ts 2>&1
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
OUT=$(run_prereq); echo "prereq: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_corpus); echo "corpus: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_pad);    echo "pad:    $(echo "$OUT" | grep -E 'Tests ' | head -1)"

echo "=== MUTATION A: the false Python claim reintroduced into the enumeration — must bite pin 2 (the false-requirement guard) ==="
python3 scripts/s51-mutations.py apply A
OUT=$(run_prereq)
check_bites A "must not carry a Python requirement.*expected true to be false" "$OUT"
python3 scripts/s51-mutations.py revert A
OUT=$(run_prereq)
check_green A 2 "$OUT"

echo "=== MUTATION B: the Requires line deletion — must bite pin 2's floor (the dropped-site doctrine) ==="
python3 scripts/s51-mutations.py apply B
OUT=$(run_prereq)
check_bites B "the README Quick Start must carry the Requires line" "$OUT"
python3 scripts/s51-mutations.py revert B
OUT=$(run_prereq)
check_green B 2 "$OUT"

echo "=== MUTATION C: the seed's scryptSync import dropped — must bite pin 1 (the ground truth) ==="
python3 scripts/s51-mutations.py apply C
OUT=$(run_prereq)
check_bites C "must import its crypto from node:crypto.*expected false to be true" "$OUT"
python3 scripts/s51-mutations.py revert C
OUT=$(run_prereq)
check_green C 2 "$OUT"

echo "=== MUTATION D: the README badge revert 257→255 — must bite pin 1's family + the BRIDGE ==="
python3 scripts/s51-mutations.py apply D
OUT=$(run_corpus)
check_bites D "every live claim site must name ONE number.*found 255 & 257" "$OUT"
python3 scripts/s51-mutations.py revert D
OUT=$(run_corpus)
check_green D 5 "$OUT"

echo "=== MUTATION E: the §7.1 prereq row count 2→1 — must bite the s49 pad pin + the BRIDGE ==="
python3 scripts/s51-mutations.py apply E
OUT=$(run_pad)
check_bites E "the §7.1 row for tests/prereq-contract.test.ts claims 1 tests — the runtime count is 2" "$OUT"
OUT2=$(run_corpus)
check_bites E "the quoted test count must name the §7.1 Vitest rows' sum.*expected 257 to be 256" "$OUT2"
python3 scripts/s51-mutations.py revert E
OUT=$(run_pad)
check_green E 3 "$OUT"
OUT=$(run_corpus)
check_green E 5 "$OUT"

echo "=== MUTATION F: the §7.1 prereq row deletion — must bite the s49 pad pin (missing row) + the BRIDGE (the sum) ==="
python3 scripts/s51-mutations.py apply F
OUT=$(run_pad)
check_bites F "the suite runs tests/prereq-contract.test.ts \(2 tests\) with NO §7.1 row" "$OUT"
OUT2=$(run_corpus)
check_bites F "the quoted test count must name the §7.1 Vitest rows' sum.*expected 257 to be 255" "$OUT2"
python3 scripts/s51-mutations.py revert F
OUT=$(run_pad)
check_green F 3 "$OUT"
OUT=$(run_corpus)
check_green F 5 "$OUT"

echo "=== ALL 6 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
