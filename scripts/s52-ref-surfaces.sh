#!/usr/bin/env bash
# S52: the reference-side F2–F4 live probes (the 34th sweep)
#   F2  chrome ledger: /login viewport-fit=cover + PWA trio; /dashboard plain viewport
#   F3  their desktop overflow (the s4-33rd records: scrollWidth 1328 vs clientWidth 1280)
#   F4  their mobile overflow (468 vs 375) + the toast-viewport blocking at the toggle rect
#   + capture their dashboard @1280x800 for the F5 paired VLM check
set -o pipefail
REF="https://service-desk-332a5ae4.base44.app"
OUT=/tmp/s52-results
mkdir -p $OUT

agent-browser cookies clear > /dev/null 2>&1

echo "=== F2a: /login chrome ledger ==="
agent-browser set viewport 1280 800 > /dev/null 2>&1
agent-browser open "$REF/login" > /dev/null 2>&1; sleep 4
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

echo "=== F4: their mobile matrix @375 ==="
agent-browser set viewport 375 667 > /dev/null 2>&1; sleep 2
agent-browser eval "JSON.stringify({sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1

echo "=== F4b: the toast-viewport blocking probe (elementFromPoint at the toggle's own rect) ==="
agent-browser eval "JSON.stringify((function(){
  const btn = document.querySelector('button[aria-label*=\"Menu\" i]') ||
    [...document.querySelectorAll('button')].find(b => /menu|sidebar|toggle/i.test(b.getAttribute('aria-label') || '') || /menu/i.test(b.textContent || ''));
  if (!btn) return {found: false};
  const r = btn.getBoundingClientRect();
  const hit = document.elementFromPoint(r.x + r.width/2, r.y + r.height/2);
  return {found: true, rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(','),
    hitTag: hit ? hit.tagName : null,
    hitClass: hit ? (hit.className && hit.className.baseVal !== undefined ? hit.className.baseVal : String(hit.className)).slice(0,80) : null,
    isBtnOrInside: hit === btn || btn.contains(hit),
    dialogs: document.querySelectorAll('[role=dialog]').length};
})())" 2>&1 | tail -1

echo "=== F4c: real click attempt on their toggle ==="
agent-browser eval "JSON.stringify((function(){
  const btn = document.querySelector('button[aria-label*=\"Menu\" i]') ||
    [...document.querySelectorAll('button')].find(b => /menu|sidebar|toggle/i.test(b.getAttribute('aria-label') || '') || /menu/i.test(b.textContent || ''));
  if (!btn) return {clicked: false};
  btn.click();
  return {clicked: true};
})())" 2>&1 | tail -1
sleep 2
agent-browser eval "JSON.stringify({dialogs: document.querySelectorAll('[role=dialog]').length, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})" 2>&1 | tail -1
