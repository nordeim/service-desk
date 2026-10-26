#!/usr/bin/env bash
# S91: the REFERENCE-side visible-focus census (the two-systems doctrine:
# classify our focus-indication posture ONLY after measuring the
# reference's own). The same tab-walk + settled measurement as our side
# (scripts/s91-focus-census.mjs): real Tab presses (keyboard engages
# :focus-visible), a 400ms settle sleep before each read (their controls
# carry the same transition-all duration-200/300 classes — a mid-flight
# read shows the transparent start state), the honest verdict per control
# (a colored ring layer in box-shadow OR outline-style !== none — the
# default outline counts).
# Surfaces: /login (public, both bands) + the authed routes (both bands)
# + the nav-sheet-open state at 375 (synthetic click — their real-click is
# refused per the standing F4 record).
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s91-results/ref-focus-census
mkdir -p "$OUT"

# The measure expression (the same parser as our side).
MEASURE_JS='(() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return JSON.stringify(null);
  const cs = getComputedStyle(el);
  const name = el.getAttribute("aria-label") || el.getAttribute("placeholder") ||
    (el.labels && el.labels[0] ? el.labels[0].textContent.trim() : "") ||
    (el.textContent || "").trim().slice(0, 60);
  const ringLayers = [];
  const shadow = cs.boxShadow;
  if (shadow && shadow !== "none") {
    const parts = shadow.split(/,\s*(?=[a-z(])/g);
    for (const layer of parts) {
      const m = layer.match(/^\s*((?:rgba?|lab|oklch|hsl)a?\([^)]*\)|#[0-9a-f]+|transparent)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+(-?[\d.]+)px/i);
      if (!m) continue;
      const spread = Number(m[5]);
      if (spread > 0 && m[1] !== "transparent" && !/rgba\(0, 0, 0, 0\)/.test(m[1])) ringLayers.push({color: m[1], spread});
    }
  }
  const outlineStyle = cs.outlineStyle;
  const hasOutline = outlineStyle !== "none" && outlineStyle !== "";
  return JSON.stringify({
    tag: el.tagName.toLowerCase(), name: (name || "(unnamed)").slice(0, 70),
    role: el.getAttribute("role") || "",
    fv: el.matches(":focus-visible"),
    outlineStyle, outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor,
    boxShadow: shadow.slice(0, 220), ringLayers,
    visible: ringLayers.length > 0 || hasOutline,
    why: ringLayers.length > 0 ? "ring" : hasOutline ? "outline" : "NONE",
  });
})()'

# The walk: 40 Tab presses max, 400ms settle per step, JSONL out.
walk() {
  local label="$1" max="${2:-40}"
  : > "$OUT/ref-$label.jsonl"
  local last="" barren=0
  for ((i=0; i<max; i++)); do
    agent-browser press Tab >/dev/null 2>&1
    sleep 0.4
    local step
    step="$(agent-browser eval "$MEASURE_JS" 2>/dev/null | tail -1)"
    if [ -z "$step" ] || [ "$step" = "null" ]; then
      if [ $i -eq 0 ]; then echo "[$label] WARN: first step null"; continue; fi
      break
    fi
    if [ "$step" = "$last" ]; then
      barren=$((barren+1))
      if [ $barren -ge 8 ]; then break; fi
      continue
    fi
    last="$step"
    barren=0
    printf '%s\n' "$step" >> "$OUT/ref-$label.jsonl"
  done
  python3 - "$label" "$OUT/ref-$label.jsonl" <<'PYEOF'
import json, sys
label, path = sys.argv[1], sys.argv[2]
seen, keys = [], set()
try:
    for line in open(path):
        line = line.strip()
        if not line: continue
        try: r = json.loads(line)
        except Exception:
            # double-encoded artifacts: try one more decode
            try: r = json.loads(json.loads(line))
            except Exception: continue
        if r is None: continue
        k = f"{r['tag']}|{r['name']}"
        if k not in keys:
            keys.add(k); seen.append(r)
except FileNotFoundError:
    pass
noind = [c for c in seen if not c['visible']]
print(f"[{label}] controls={len(seen)} NO-INDICATION={len(noind)}")
for c in seen:
    mark = "NONE!!" if not c['visible'] else c['why']
    col = (c['ringLayers'][0]['color'] if c['ringLayers'] else c['outlineColor'])[:34]
    print(f"  {c['tag'].ljust(8)} {c['name'][:36].ljust(36)} fv={str(c['fv'])[:5]:5} {mark.ljust(8)} {col}")
PYEOF
}

agent-browser cookies clear >/dev/null 2>&1

# --- Public: /login at both bands ---
for W in "375 667 m375" "1280 720 d1280"; do
  set -- $W
  agent-browser set viewport "$1" "$2" >/dev/null 2>&1
  agent-browser open "$REF/login" >/dev/null 2>&1
  sleep 4
  for i in 1 2 3 4 5; do
    ST="$(agent-browser eval "JSON.stringify({h1: document.querySelector('h1')?.textContent, sp: document.querySelectorAll('[class*=animate-spin]').length})" 2>/dev/null | tail -1)"
    SC="$(printf '%s' "$ST" | tr -d '\\')"
    if printf '%s' "$SC" | grep -q '"sp":0' && printf '%s' "$SC" | grep -q 'Welcome to ServiceDesk'; then echo "login settled"; break; fi
    sleep 2
  done
  walk "login-$3" 24
  agent-browser eval "document.activeElement && document.activeElement.blur()" >/dev/null 2>&1
done

# --- Auth (login once at 1280) ---
agent-browser set viewport 1280 720 >/dev/null 2>&1
agent-browser open "$REF/login" >/dev/null 2>&1
sleep 4
agent-browser type 'input[type="email"]' "sepnetflix2023@outlook.com" >/dev/null 2>&1
agent-browser type 'input[type="password"]' '$Abcd1234' >/dev/null 2>&1
agent-browser press Enter >/dev/null 2>&1
sleep 5
agent-browser eval "JSON.stringify({url: location.href})" 2>/dev/null | tail -1

# --- Authed surfaces: desktop band ---
for path_name in "dashboard" "mytickets" "submitticket"; do
  agent-browser open "$REF/$path_name" >/dev/null 2>&1
  sleep 4
  walk "$path_name-d1280" 40
  agent-browser eval "document.activeElement && document.activeElement.blur()" >/dev/null 2>&1
done

# ticketdetails via the first card (the seeded-id form)
agent-browser open "$REF/mytickets" >/dev/null 2>&1
sleep 4
agent-browser eval "(() => { const a = document.querySelector('a[href*=\"ticketdetails\"]') || document.querySelector('a[href*=\"/tickets/\"]'); if (a) { a.click(); return 'clicked'; } return 'no link'; })()" 2>/dev/null | tail -1
sleep 4
agent-browser eval "JSON.stringify({url: location.href})" 2>/dev/null | tail -1
walk "ticketdetails-d1280" 40
agent-browser eval "document.activeElement && document.activeElement.blur()" >/dev/null 2>&1

# --- Authed surfaces: mobile band + navsheet ---
agent-browser set viewport 375 667 >/dev/null 2>&1
for path_name in "dashboard" "mytickets" "submitticket"; do
  agent-browser open "$REF/$path_name" >/dev/null 2>&1
  sleep 4
  walk "$path_name-m375" 40
  agent-browser eval "document.activeElement && document.activeElement.blur()" >/dev/null 2>&1
done
agent-browser open "$REF/mytickets" >/dev/null 2>&1
sleep 4
agent-browser eval "(() => { const a = document.querySelector('a[href*=\"ticketdetails\"]') || document.querySelector('a[href*=\"/tickets/\"]'); if (a) { a.click(); return 'clicked'; } return 'no link'; })()" 2>/dev/null | tail -1
sleep 4
walk "ticketdetails-m375" 40
agent-browser eval "document.activeElement && document.activeElement.blur()" >/dev/null 2>&1

# The nav-sheet-open state at 375 (synthetic click — their real-click refused, the F4 record)
agent-browser open "$REF/dashboard" >/dev/null 2>&1
sleep 4
agent-browser eval "(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.getAttribute('aria-label')||'').includes('Toggle') || (x.textContent||'').includes('Toggle')); if (b) { b.click(); return 'toggled'; } return 'no toggle'; })()" 2>/dev/null | tail -1
sleep 1
walk "dashboard-navsheet-m375" 24
agent-browser press Escape >/dev/null 2>&1

echo "=== REFERENCE-SIDE FOCUS CENSUS COMPLETE ==="
