#!/bin/bash
# session-7 hover probe: hover an element by JS locator, read computed styles
# usage: s7-hover.sh "<js locator returning an Element>" "<props csv>"
LOC="$1"
PROPS="${2:-backgroundColor,borderColor,color,boxShadow,backgroundImage}"
agent-browser eval "(() => { const el = (${LOC}); if (!el) return 'NOT FOUND'; el.scrollIntoView({block:'center'}); return 'OK ' + JSON.stringify(el.getBoundingClientRect()); })()"
sleep 1
COORDS=$(agent-browser eval "(() => { const el = (${LOC}); const r = el.getBoundingClientRect(); return JSON.stringify({x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2)}); })()" | tr -d '"')
X=$(echo "$COORDS" | python3 -c "import json,sys; print(json.load(sys.stdin)['x'])" 2>/dev/null)
Y=$(echo "$COORDS" | python3 -c "import json,sys; print(json.load(sys.stdin)['y'])" 2>/dev/null)
agent-browser mouse move "$X" "$Y"
sleep 1
agent-browser eval "(() => { const el = (${LOC}); const cs = getComputedStyle(el); const o = {hovering: el.matches(':hover')}; '${PROPS}'.split(',').forEach(p => { o[p] = String(cs[p]).slice(0,90); }); return JSON.stringify(o); })()"
