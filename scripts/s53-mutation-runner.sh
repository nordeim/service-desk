#!/usr/bin/env bash
# S53: the mutation runner — each mutation applied, observed failing EXACTLY its
# pin, reverse-replaced (never checkout), re-verified green. Hard-FATAL before
# any subsequent mutation can observe a contaminated tree (the s50-s52 lesson:
# a runner that dies mid-flight leaves a mutation applied).
set -o pipefail
cd /home/z/my-project/service-desk

run_keyfiles() {
  bunx vitest run tests/pad-keyfiles-contract.test.ts 2>&1
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
OUT=$(run_keyfiles); echo "keyfiles: $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_corpus);   echo "corpus:   $(echo "$OUT" | grep -E 'Tests ' | head -1)"
OUT=$(run_pad);      echo "pad:      $(echo "$OUT" | grep -E 'Tests ' | head -1)"

echo "=== MUTATION A: the §11 validation.ts figure reverted to the stale 120 — must bite pin 1 (the staleness direction) ==="
python3 scripts/s53-mutations.py apply A
OUT=$(run_keyfiles)
check_bites A "src/lib/validation\.ts\` claims 120 lines but the file measures 437" "$OUT"
python3 scripts/s53-mutations.py revert A
OUT=$(run_keyfiles)
check_green A 3 "$OUT"

echo "=== MUTATION B: the §11 db-path figure off-by-one (107->106) — must bite pin 1 (the exactness) ==="
python3 scripts/s53-mutations.py apply B
OUT=$(run_keyfiles)
check_bites B "src/lib/db-path\.ts\` claims 106 lines but the file measures 107" "$OUT"
python3 scripts/s53-mutations.py revert B
OUT=$(run_keyfiles)
check_green B 3 "$OUT"

echo "=== MUTATION C: the ~ hedge reintroduced on the auth row — must bite pin 1 (the form grammar) ==="
python3 scripts/s53-mutations.py apply C
OUT=$(run_keyfiles)
check_bites C "the Lines cell for \`src/lib/auth\.ts\` is \"~232\" — EXACT figures only" "$OUT"
python3 scripts/s53-mutations.py revert C
OUT=$(run_keyfiles)
check_green C 3 "$OUT"

echo "=== MUTATION D: one §11 row deleted (playwright.config.ts) — must bite pin 2 (the floor 18) ==="
python3 scripts/s53-mutations.py apply D
OUT=$(run_keyfiles)
check_bites D "the §11 table carries 17 rows — the floor is 18" "$OUT"
python3 scripts/s53-mutations.py revert D
OUT=$(run_keyfiles)
check_green D 3 "$OUT"

echo "=== MUTATION E: the seed-data row's path mutated (seed-data2.ts) — must bite pin 2 (the key-coverage direction, the floor held at 18) ==="
python3 scripts/s53-mutations.py apply E
OUT=$(run_keyfiles)
check_bites E "must name prisma/seed-data\.ts — the canonical seed-corpus data home" "$OUT"
python3 scripts/s53-mutations.py revert E
OUT=$(run_keyfiles)
check_green E 3 "$OUT"

echo "=== MUTATION F: the SKILL auth test figure reverted (20->11) — must bite pin 3 (the §7.1-chained claim) ==="
python3 scripts/s53-mutations.py apply F
OUT=$(run_keyfiles)
check_bites F "claims 11 unit tests for src/lib/auth\.ts but the PAD §7\.1 runtime-pinned row says 20" "$OUT"
python3 scripts/s53-mutations.py revert F
OUT=$(run_keyfiles)
check_green F 3 "$OUT"

echo "=== MUTATION G: the README badge revert 263->260 — must bite the s48 family pin + the s50 BRIDGE ==="
python3 scripts/s53-mutations.py apply G
OUT=$(run_corpus)
check_bites G "every live claim site must name ONE number.*found 260 & 263" "$OUT"
python3 scripts/s53-mutations.py revert G
OUT=$(run_corpus)
check_green G 5 "$OUT"

echo "=== MUTATION H: the §7.1 keyfiles row count 3->2 — must bite the s49 pad pin + the s50 BRIDGE (the sum 262) ==="
python3 - << 'PYEOF'
import sys
REPO = "/home/z/my-project/service-desk"
p = f"{REPO}/Project_Architecture_Document.md"
with open(p) as f: c = f.read()
old = "the SKILL's backticked-path size claims + the auth compound claim's test figure chained to this table's runtime-pinned auth row) | 1 | 3 | `tests/pad-keyfiles-contract.test.ts` | Vitest |"
new = old.replace("| 1 | 3 |", "| 1 | 2 |")
assert c.count(old) == 1
with open(p, "w") as f: f.write(c.replace(old, new))
print("OK: mutation H applied")
PYEOF
OUT=$(run_pad)
check_bites H "the §7\.1 row for tests/pad-keyfiles-contract\.test\.ts claims 2 tests — the runtime count is 3" "$OUT"
OUT=$(run_corpus)
check_bites H "quoted test count must name the §7\.1 Vitest rows' sum — the sum is 262" "$OUT"
python3 - << 'PYEOF'
REPO = "/home/z/my-project/service-desk"
p = f"{REPO}/Project_Architecture_Document.md"
with open(p) as f: c = f.read()
old = "the SKILL's backticked-path size claims + the auth compound claim's test figure chained to this table's runtime-pinned auth row) | 1 | 2 | `tests/pad-keyfiles-contract.test.ts` | Vitest |"
new = old.replace("| 1 | 2 |", "| 1 | 3 |")
assert c.count(old) == 1
with open(p, "w") as f: f.write(c.replace(old, new))
print("OK: mutation H reverted")
PYEOF
OUT=$(run_pad)
check_green H 3 "$OUT"
OUT=$(run_corpus)
check_green H 5 "$OUT"

echo ""
echo "=== ALL S53 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
