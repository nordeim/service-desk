#!/usr/bin/env bash
# S48: the mutation-driven RED checks (the s31/s45/s46/s47 doctrine).
# Each mutation: apply -> run the pin file (must FAIL) -> REVERSE-REPLACE
# revert (never git checkout — checkout would wipe the uncommitted
# remediation itself, the live lesson of this session's first run) ->
# re-run (must be GREEN). Any unexpected outcome aborts.
cd /home/z/my-project/service-desk
CORPUS=tests/corpus-count-contract.test.ts
VERSION=tests/version-contract.test.ts

run_pin() {
  bunx vitest run "$1" > /tmp/s48-mut-run.txt 2>&1
  grep -E "Tests  " /tmp/s48-mut-run.txt | tail -1
}

is_failed() { echo "$1" | grep -qE "[1-9][0-9]* failed"; }
is_green()  { echo "$1" | grep -qE "^[0-9]+ passed \([0-9]+\)$" || echo "$1" | grep -qE "Tests  [0-9]+ passed"; }

mutate() {
  local name="$1" file="$2" old="$3" new="$4" pin_file="$5"
  echo "=== MUTATION $name ==="
  # apply (count-anchored)
  python3 - "$file" "$old" "$new" <<'EOF' || { echo "FATAL: anchor missing"; exit 1; }
import sys
path, old, new = sys.argv[1:4]
t = open(path, encoding="utf-8").read()
assert t.count(old) == 1, f"anchor count != 1: {old!r}"
open(path, "w", encoding="utf-8").write(t.replace(old, new, 1))
EOF
  OUT="$(run_pin "$pin_file")"
  echo "  mutated run: $OUT"
  if is_failed "$OUT"; then
    echo "  BIT ✓ — expected failure observed"
  else
    echo "  FATAL: $name did NOT bite"
    python3 - "$file" "$new" "$old" <<'EOF'
import sys
path, new, old = sys.argv[1:4]
t = open(path, encoding="utf-8").read()
if new in t: open(path, "w", encoding="utf-8").write(t.replace(new, old, 1))
EOF
    exit 1
  fi
  # revert by REVERSE-REPLACE (the s48 live lesson)
  python3 - "$file" "$new" "$old" <<'EOF' || { echo "FATAL: revert anchor missing"; exit 1; }
import sys
path, new, old = sys.argv[1:4]
t = open(path, encoding="utf-8").read()
assert t.count(new) >= 1, f"revert anchor missing: {new!r}"
open(path, "w", encoding="utf-8").write(t.replace(new, old, 1))
EOF
  OUT2="$(run_pin "$pin_file")"
  echo "  reverted run: $OUT2"
  if is_green "$OUT2"; then
    echo "  GREEN restored ✓"
  else
    echo "  FATAL: revert did not restore green"; exit 1
  fi
}

# Corpus mutations (the stale-figure reverts + the dropped-site hardening)
mutate "A (SKILL appendix unit figure -> 54)" service-desk_SKILL.md \
  "Vitest — 251 unit tests" "Vitest — 54 unit tests" $CORPUS
mutate "B (README e2e figure -> 57)" README.md \
  "198 Playwright E2E tests" "57 Playwright E2E tests" $CORPUS
mutate "C (README parity figure -> 163)" README.md \
  "164 E2E parity tests" "163 E2E parity tests" $CORPUS
mutate "D (SKILL smoke figure -> 11-step)" service-desk_SKILL.md \
  "121-step API contract" "11-step API contract" $CORPUS
mutate "H (drop the README pyramid claim site)" README.md \
  "251 unit + 198 E2E tests + API smoke (121 steps)" "a full test pyramid + API smoke (121 steps)" $CORPUS

# Version mutations (the clean-contract pins — RED only by mutation)
mutate "E (README badge Next.js-16.4 -> 16.5)" README.md \
  "badge/Next.js-16.4-000000" "badge/Next.js-16.5-000000" $VERSION
mutate "F (PAD row 16.4.0 -> 16.5.0)" Project_Architecture_Document.md \
  "| 16.4.0 |" "| 16.5.0 |" $VERSION
mutate "G (bun.lock next@16.4.0 -> 16.4.1)" bun.lock \
  '"next@16.4.0"' '"next@16.4.1"' $VERSION

echo "=== ALL 8 MUTATIONS BIT + REVERTED + RE-VERIFIED ==="
echo "--- remaining uncommitted files (the s48 remediation set, mutations all reverted):"
git status --porcelain | head -10
