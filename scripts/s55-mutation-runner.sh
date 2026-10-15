#!/usr/bin/env bash
# S55: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green. Hard-FATAL before
# any subsequent mutation can observe a contaminated tree (the s50–s54 lesson:
# a runner that dies mid-flight leaves a mutation applied). The bite patterns
# below were OBSERVED against the pins first (the s53 lesson-at-H doctrine:
# never a guessed message shape). TWO in-flight pin fixes were observed DURING
# the observation pass and are part of the final pin: the case-insensitive
# completion grammar (mutation B — the record's "COMPLETED/SUCCESS" form) and
# the corpus-floor recalibration 53 -> 54 (mutation D — the floor counts the
# corpus WITH the current session's plan).
set -o pipefail
cd /home/z/my-project/service-desk

run_plan() {
  bunx vitest run tests/plan-status-contract.test.ts 2>&1
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

check_passes() {
  local key="$1"; local pattern="$2"; local out="$3"
  if echo "$out" | grep -qE "$pattern"; then
    echo "PASS-OK $key: the pin correctly did NOT fire (the exemption held)"
  else
    echo "FATAL $key: the pin fired where it must NOT (pattern must be absent: $pattern)"
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
OUT=$(run_plan);   echo "plan:   $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_corpus); echo "corpus: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_pad);    echo "pad:    $(echo "$OUT" | grep -E 'Tests ' | head -1)"

echo "=== MUTATION A: the s38 box re-uncheck (shape A reintroduced) — must bite pin 1 AND pin 2 ==="
python3 scripts/s55-mutations.py apply A
OUT=$(run_plan)
check_bites A "plans from closed sessions carry unchecked execution-status boxes.*remediation-plan-session38\.md: line 136" "$OUT"
check_bites A "unchecked boxes whose own text asserts completion.*remediation-plan-session38\.md line 136" "$OUT"
python3 scripts/s55-mutations.py revert A
OUT=$(run_plan)
check_green A 3 "$OUT"

echo "=== MUTATION B: the s54 box re-uncheck (shape B, record text kept) — must bite pin 1 AND pin 2 (the case-insensitive grammar) ==="
python3 scripts/s55-mutations.py apply B
OUT=$(run_plan)
check_bites B "plans from closed sessions carry unchecked execution-status boxes.*remediation-plan-session54\.md: line 115" "$OUT"
check_bites B "unchecked boxes whose own text asserts completion.*remediation-plan-session54\.md line 115" "$OUT"
python3 scripts/s55-mutations.py revert B
OUT=$(run_plan)
check_green B 3 "$OUT"

echo "=== MUTATION C: a fresh shape-A line in the CURRENT session's plan — must bite pin 2 ONLY (pin 1 exempt by the constant) ==="
python3 scripts/s55-mutations.py apply C
OUT=$(run_plan)
check_bites C "unchecked boxes whose own text asserts completion.*remediation-plan-session55\.md line 84" "$OUT"
check_passes C "^ *✓ pin 1" "$OUT"
python3 scripts/s55-mutations.py revert C
OUT=$(run_plan)
check_green C 3 "$OUT"

echo "=== MUTATION D: a plan file renamed off the corpus — must bite pin 3 (the floor) ==="
python3 scripts/s55-mutations.py apply D
OUT=$(run_plan)
check_bites D "the plan corpus floor: expected >= 54 plan files on the fs, found 53" "$OUT"
python3 scripts/s55-mutations.py revert D
OUT=$(run_plan)
check_green D 3 "$OUT"

echo "=== MUTATION E: the README badge revert 273 -> 270 — must bite the s48 family pin AND the s50 BRIDGE (both the consistency direction: found 270 & 273) ==="
python3 scripts/s55-mutations.py apply E
OUT=$(run_corpus)
check_bites E "the unit count: every live claim site must name ONE number" "$OUT"
check_bites E "the unit count \(the s50 bridge\): every live claim site must name ONE number" "$OUT"
python3 scripts/s55-mutations.py revert E
OUT=$(run_corpus)
check_green E 5 "$OUT"

echo "=== MUTATION F: the §7.1 row's test count 3 -> 2 — must bite the s49 pad pin ==="
python3 scripts/s55-mutations.py apply F
OUT=$(run_pad)
check_bites F "the §7\.1 row for tests/plan-status-contract\.test\.ts claims 2 tests — the runtime count is 3" "$OUT"
python3 scripts/s55-mutations.py revert F
OUT=$(run_pad)
check_green F 3 "$OUT"

echo "=== MUTATION G: the boundary-transition simulation (CURRENT_SESSION 55 -> 56) — pin 1 must catch the s55 plan's mid-flight boxes, pin 3 must miss the s56 plan ==="
python3 scripts/s55-mutations.py apply G
OUT=$(run_plan)
check_bites G "plans from closed sessions carry unchecked execution-status boxes.*remediation-plan-session55\.md: line" "$OUT"
check_bites G "the current session's plan \(remediation-plan-session56\.md\) must exist" "$OUT"
python3 scripts/s55-mutations.py revert G
OUT=$(run_plan)
check_green G 3 "$OUT"

echo ""
echo "=== S55 MUTATION BATTERY: ALL 7 (A–G) BIT + REVERTED + RE-VERIFIED — CLEAN END-TO-END ==="
