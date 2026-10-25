#!/usr/bin/env bash
# S90: the REFERENCE-side touch-target census at 375 (the two-systems doctrine:
# classify our under-44 controls ONLY after measuring the reference's own).
# Surfaces: /login (public), /dashboard + /mytickets + /submitticket (authed),
# + the nav-sheet-open state (synthetic click form — their real-click is
# refused, the standing F4 record).
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s90-results/touch-census
mkdir -p $OUT

# The census expression (the same selector + skip logic as ours)
CENSUS_JS='(() => {
  const sel = ["button","a[href]","input:not([type=hidden])","select","textarea","[role=button]","[role=combobox]","[role=tab]","[role=switch]","[role=checkbox]"].join(",");
  const els = Array.from(document.querySelectorAll(sel));
  const out = [];
  for (const el of els) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (el.closest("[aria-hidden=true]")) continue;
    const inVp = r.bottom > 0 && r.top < window.innerHeight;
    const name = el.getAttribute("aria-label") || el.getAttribute("placeholder") || (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : "") || (el.textContent || "").trim().slice(0, 60);
    out.push({tag: el.tagName.toLowerCase(), type: el.getAttribute("type") || "", name: name.slice(0,70), w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10, inVp});
  }
  return JSON.stringify(out);
})()'

run_census() {
  local label="$1"
  agent-browser eval "$CENSUS_JS" 2>/dev/null | tail -1 > "$OUT/ref-$label.json"
  python3 -c "
import json,sys
try:
  rows = json.load(open('$OUT/ref-$label.json'))
  inv = [r for r in rows if r['inVp']]
  off = [r for r in inv if r['w'] < 44 or r['h'] < 44]
  print(f'[$label] total={len(rows)} inVp={len(inv)} under44={len(off)}')
  for r in off:
    print(f\"  UNDER44: {r['tag']}.{r['type']} [{r['w']}x{r['h']}] {r['name'][:50]!r}\")
except Exception as e:
  print(f'[$label] PARSE FAIL: {e}')
"
}

agent-browser cookies clear > /dev/null 2>&1
agent-browser set viewport 375 667 > /dev/null 2>&1

echo "=== ref /login @375 (public) ==="
agent-browser open "$REF/login" > /dev/null 2>&1; sleep 4
for i in 1 2 3 4 5 6; do
  ST="$(agent-browser eval "JSON.stringify({h1: document.querySelector('h1')?.textContent, sp: document.querySelectorAll('[class*=animate-spin]').length})" 2>/dev/null | tail -1)"
  SC="$(printf '%s' "$ST" | tr -d '\\')"
  if printf '%s' "$SC" | grep -q '"sp":0' && printf '%s' "$SC" | grep -q 'Welcome to ServiceDesk'; then echo "settled: $SC"; break; fi
  sleep 2
done
run_census login

echo "=== ref auth (login) ==="
agent-browser fill 'input[type="email"]' "sepnetflix2023@outlook.com" > /dev/null 2>&1
agent-browser fill 'input[type="password"]' '$Abcd1234' > /dev/null 2>&1
agent-browser click 'button[type="submit"]' > /dev/null 2>&1; sleep 5
agent-browser eval "JSON.stringify({url: location.href})" 2>&1 | tail -1

echo "=== ref /dashboard @375 ==="
agent-browser open "$REF/dashboard" > /dev/null 2>&1; sleep 4
run_census dashboard

echo "=== ref /mytickets @375 ==="
agent-browser open "$REF/mytickets" > /dev/null 2>&1; sleep 4
run_census mytickets

echo "=== ref /submitticket @375 ==="
agent-browser open "$REF/submitticket" > /dev/null 2>&1; sleep 4
run_census submitticket

echo "=== ref nav-sheet OPEN @375 (synthetic click form) ==="
agent-browser open "$REF/dashboard" > /dev/null 2>&1; sleep 4
agent-browser eval "(() => {
  const btn = [...document.querySelectorAll('button')].find(b => /toggle sidebar/i.test((b.textContent || '').trim()));
  if (btn) { btn.click(); return 'clicked'; }
  return 'not found';
})()" 2>&1 | tail -1
sleep 2
run_census navsheet
agent-browser screenshot "$OUT/ref-navsheet-375.png" > /dev/null 2>&1
echo "done — output in $OUT/"
