#!/usr/bin/env bash
# S52: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green. Hard-FATAL before
# any subsequent mutation can observe a contaminated tree (the s50/s51 lesson:
# a runner that dies mid-flight leaves a mutation applied).
set -o pipefail
cd /home/z/my-project/service-desk

run_docdate() {
  bunx vitest run tests/docdate-contract.test.ts 2>&1
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
OUT=$(run_docdate); echo "docdate: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_corpus);  echo "corpus:  $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_pad);     echo "pad:     $(echo "$OUT" | grep -E 'Tests ' | head -1)"

echo "=== MUTATION A: the CLAUDE date reverted to the stale 2026-10-09 — must bite pin 1 (the staleness direction) ==="
python3 scripts/s52-mutations.py apply A
OUT=$(run_docdate)
check_bites A "claims 2026-10-09 but the file's git last-commit date is 2026-10-15" "$OUT"
python3 scripts/s52-mutations.py revert A
OUT=$(run_docdate)
check_green A 3 "$OUT"

echo "=== MUTATION B: the PAD date future-dated to 2026-10-16 — must bite pin 3 (the no-future-dating guard) ==="
python3 scripts/s52-mutations.py apply B
OUT=$(run_docdate)
check_bites B "a date after today .* is a future-dated freshness claim" "$OUT"
python3 scripts/s52-mutations.py revert B
OUT=$(run_docdate)
check_green B 3 "$OUT"

echo "=== MUTATION C: the SKILL description reverted to session-50 — must bite pin 2 (the ledger agreement) ==="
python3 scripts/s52-mutations.py apply C
OUT=$(run_docdate)
check_bites C "the description names session-50 but the file's LAST lesson is tagged \(Session 52\.\)" "$OUT"
python3 scripts/s52-mutations.py revert C
OUT=$(run_docdate)
check_green C 3 "$OUT"

echo "=== MUTATION D: the README badge revert 260→257 — must bite the s48 family pin + the s50 BRIDGE ==="
python3 scripts/s52-mutations.py apply D
OUT=$(run_corpus)
check_bites D "every live claim site must name ONE number.*found 257 & 260" "$OUT"
python3 scripts/s52-mutations.py revert D
OUT=$(run_corpus)
check_green D 5 "$OUT"

echo "=== MUTATION E: the §7.1 docdate row count 3→2 — must bite the s49 pad pin + the BRIDGE ==="
python3 scripts/s52-mutations.py apply E
OUT=$(run_pad)
check_bites E "the §7.1 row for tests/docdate-contract.test.ts claims 2 tests — the runtime count is 3" "$OUT"
OUT2=$(run_corpus)
check_bites E "the quoted test count must name the §7.1 Vitest rows' sum.*expected 260 to be 259" "$OUT2"
python3 scripts/s52-mutations.py revert E
OUT=$(run_pad)
check_green E 3 "$OUT"
OUT=$(run_corpus)
check_green E 5 "$OUT"

echo "=== MUTATION F: the §7.1 docdate row deletion — must bite the s49 pad pin (missing row) + the BRIDGE (the sum) ==="
python3 scripts/s52-mutations.py apply F
OUT=$(run_pad)
check_bites F "the suite runs tests/docdate-contract.test.ts \(3 tests\) with NO §7.1 row" "$OUT"
OUT2=$(run_corpus)
check_bites F "the quoted test count must name the §7.1 Vitest rows' sum.*expected 260 to be 257" "$OUT2"
python3 scripts/s52-mutations.py revert F
OUT=$(run_pad)
check_green F 3 "$OUT"
OUT=$(run_corpus)
check_green F 5 "$OUT"

echo "=== ALL 6 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
