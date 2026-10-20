#!/usr/bin/env bash
# S81: the reference-side F2–F4 live probes (the 63rd sweep)
#   F2  chrome ledger: /login viewport-fit=cover + PWA trio; /dashboard plain viewport
#   F3  their desktop overflow (the s4–s80 records: scrollWidth 1328 vs clientWidth 1280)
#   F4  their mobile overflow (468 vs 375) + the toast-viewport blocking at the toggle rect
#   + capture their dashboard @1280x800 for the F5 paired VLM check
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s81-results
mkdir -p $OUT

agent-browser cookies clear > /dev/null 2>&1

echo "=== F4-pre: their mobile /login figures + capture @375 (the s77 P1 closure — the mobile pair, structural since s78 — carried forward verbatim) ==="
# S81: the mobile-login capture (the s77 P1 closure — the rotating login CSS styles
# the login page at EVERY width the product serves; captured PRE-auth at 375,
# before the desktop F2a flow resets the viewport)
agent-browser set viewport 375 667 > /dev/null 2>&1
agent-browser open "$REF/login" > /dev/null 2>&1; sleep 4
# S81 P1 fix: the settle-verified capture form (the capture-timing robustness
# closure — a fixed sleep is a race, not a guarantee; measured live at
# the 63rd sweep: the 46th-wave entry's restructured chunk graph slowed the
# reference's first meaningful paint and this F4-pre capture caught the
# hydration spinner, the paired mobile-login check reading LAYOUT-DIFF on a
# NON-DEFECT; poll the DOM for the rendered state — the h1 present + the
# spinner count 0 — before the screenshot, the ground-truth-verified
# re-capture form).
for i in 1 2 3 4 5 6 7 8; do
  ST="$(agent-browser eval "JSON.stringify({h1: document.querySelector('h1')?.textContent, sp: document.querySelectorAll('[class*=animate-spin]').length})" 2>/dev/null | tail -1)"
  echo "settle poll $i: $ST"
  SC="$(printf '%s' "$ST" | tr -d '\\')"
  if printf '%s' "$SC" | grep -q '"sp":0' && printf '%s' "$SC" | grep -q 'Welcome to ServiceDesk'; then break; fi
  sleep 2
done
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h1: document.querySelector('h1')?.textContent})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-login-mobile.png" > /dev/null 2>&1

echo "=== F2a: /login chrome ledger ==="
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$REF/login" > /dev/null 2>&1; sleep 4
# S81: the login-page capture (the s76 P1 closure — the login-pair VLM check needs
# the reference-side login page, the surface the rotating login CSS styles;
# captured PRE-auth at the F2a step, before the credential fill)
agent-browser eval "document.querySelector('h1')?.textContent" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-login.png" > /dev/null 2>&1
agent-browser eval "JSON.stringify({
  viewport: document.querySelector('meta[name=viewport]')?.content,
  manifest: !!document.querySelector('link[rel=manifest]'),
  theme: !!document.querySelector('meta[name=theme-color]'),
  apple: !!document.querySelector('link[rel=apple-touch-icon]')
})" 2>&1 | tail -1

echo "=== login ==="
agent-browser fill 'input[type="email"]' "sepnetflix2023@outlook.com" > /dev/null 2>&1
agent-browser fill 'input[type="password"]' '$Abcd1234' > /dev/null 2>&1
agent-browser click 'button[type="submit"]' > /dev/null 2>&1; sleep 5
agent-browser eval "JSON.stringify({url: location.href, h1: document.querySelector('h1')?.textContent?.slice(0,40)})" 2>&1 | tail -1

echo "=== F2b: /dashboard chrome ledger ==="
agent-browser eval "JSON.stringify({
  viewport: document.querySelector('meta[name=viewport]')?.content,
  manifest: !!document.querySelector('link[rel=manifest]'),
  theme: !!document.querySelector('meta[name=theme-color]'),
  apple: !!document.querySelector('link[rel=apple-touch-icon]')
})" 2>&1 | tail -1

echo "=== F3: their desktop overflow @1280 ==="
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

echo "=== F5 prep: their dashboard capture @1280x800 ==="
agent-browser screenshot "$OUT/ref-dashboard.png" 2>&1 | tail -1

echo "=== the standing surface probes (the computed-style spot ledger) ==="
agent-browser eval "JSON.stringify({
  sidebarBg: getComputedStyle(document.querySelector('aside') || document.querySelector('[data-sidebar]') || document.body).backgroundColor,
  h1size: getComputedStyle(document.querySelector('h1')).fontSize
})" 2>&1 | tail -1

echo "=== F5-route: their route-surface captures @1280 (the s78 P1 closure — the route pairs, structural since s79) ==="
# S81: the route-surface captures (the s78 P1 closure carried forward — the rotating app CSS styles
# every ROUTE the product serves: the reference-side mytickets + submitticket
# surfaces (the other nav-served routes), captured POST-login at 1280, join
# the paired battery as the FOURTH + FIFTH pairs)
agent-browser open "$REF/mytickets" > /dev/null 2>&1; sleep 4
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-mytickets.png" > /dev/null 2>&1
# S81: the detail-surface capture (the s79 P1 closure — the paired battery's
# coverage derives from the routes the rotation styles INCLUDING the
# click-through detail route: click the FIRST ticketdetails link from
# their mytickets list (their rows churn — data-dependent; whatever the
# first card is that day), capture POST-login @1280 — joins the paired
# battery as the SIXTH pair)
agent-browser eval "JSON.stringify((function(){ const a = document.querySelector('a[href*="ticketdetails"]'); if(!a) return {found:false}; a.click(); return {found:true, href: a.getAttribute('href')}; })())" 2>&1 | tail -1
sleep 3
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-ticketdetail.png" 2>&1 | tail -1
agent-browser open "$REF/submitticket" > /dev/null 2>&1; sleep 4
agent-browser eval "JSON.stringify({url: location.href, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-submitticket.png" > /dev/null 2>&1
# back to the dashboard root — the F4 mobile probes measure the post-login
# dashboard surface (the s77 flow's page state restored before the viewport
# switch)
agent-browser open "$REF/" > /dev/null 2>&1; sleep 3

echo "=== F4: their mobile matrix @375 ==="
agent-browser set viewport 375 667 > /dev/null 2>&1; sleep 2
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

echo "=== F4b: the toast-viewport blocking probe (elementFromPoint at the toggle's own rect) ==="
# S57: the s53-refined TEXT-matching form — their toggle carries NO aria-label,
# only the "Toggle Sidebar" text content (the s52 aria-label selector silently
# found nothing; the s53 lesson, held in the lineage since).
agent-browser eval "JSON.stringify((function(){
  const btn = [...document.querySelectorAll('button')].find(b => /toggle sidebar/i.test((b.textContent || '').trim()));
  if (!btn) return {found: false};
  const r = btn.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return {found: true, text: (btn.textContent || '').trim(), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','),
    hitTag: hit ? hit.tagName : null,
    hitClass: hit ? (hit.className && hit.className.baseVal !== undefined ? hit.className.baseVal : String(hit.className)).slice(0,80) : null,
    isBtnOrInside: hit === btn || btn.contains(hit),
    dialogs: document.querySelectorAll('[role=dialog]').length};
})())" 2>&1 | tail -1

echo "=== F4c: synthetic click attempt on their toggle ==="
agent-browser eval "JSON.stringify((function(){
  const btn = [...document.querySelectorAll('button')].find(b => /toggle sidebar/i.test((b.textContent || '').trim()));
  if (!btn) return {clicked: false};
  btn.click();
  return {clicked: true, text: (btn.textContent || '').trim()};
})())" 2>&1 | tail -1
sleep 2
agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

echo "=== F4d: Escape closes their sheet (then the REAL-click refusal probe) ==="
agent-browser press Escape > /dev/null 2>&1; sleep 1
agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length})" 2>&1 | tail -1

echo "=== F4e: REAL click attempt (the guarded snapshot-ref form) ==="
SNAP=$(agent-browser snapshot 2>&1)
TOGREF=$(echo "$SNAP" | grep -iE 'Toggle Sidebar' | grep -oE 'ref=[a-z0-9]+' | head -1 | cut -d= -f2)
echo "their toggle ref: $TOGREF"
if [ -n "$TOGREF" ]; then
  agent-browser click "@$TOGREF" 2>&1 | tail -2
  sleep 1
  agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length})" 2>&1 | tail -1
else
  echo "toggle not found in snapshot — their sheet may already be open or the toggle hidden"
fi

echo "=== F6-mobile-routes: their MOBILE route surfaces @375 (the s80 P1 closure — the route+width intersection pairs, structural since s80) ==="
# S81: the s77 mobile closure paired the LOGIN page only; the s78/s79 route
# closures measured at desktop 1280 only. The intersection — the route
# surfaces at the mobile width — had NO reference-side capture. The captures
# take the DIRECT-URL form (their F4 real-click refusal blocks their nav-tap
# path; the route surfaces are URL-reachable — the measurement does not
# depend on their broken toggle). Their 468-vs-375 overflow is
# DASHBOARD-scoped (the s80 precision): all three route surfaces measure
# sw=375=cw clean.
agent-browser open "$REF/mytickets" > /dev/null 2>&1; sleep 4
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-mytickets-mobile.png" > /dev/null 2>&1
echo "capture: ref-mytickets-mobile.png"
agent-browser eval "(() => { const l = document.querySelector('a[href*="ticketdetails"]'); if (l) { l.click(); return 'clicked'; } return 'none'; })()" 2>&1 | tail -1
sleep 4
agent-browser eval "JSON.stringify({url: location.pathname.slice(0,30), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-ticketdetail-mobile.png" > /dev/null 2>&1
echo "capture: ref-ticketdetail-mobile.png"
agent-browser open "$REF/submitticket" > /dev/null 2>&1; sleep 4
agent-browser eval "JSON.stringify({url: location.pathname, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
agent-browser screenshot "$OUT/ref-submitticket-mobile.png" > /dev/null 2>&1
echo "capture: ref-submitticket-mobile.png"
