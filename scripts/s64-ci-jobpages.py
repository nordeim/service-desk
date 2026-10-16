#!/usr/bin/env python3
"""S64: fetch the JOB pages for the failed runs to find the failed step."""
import re
import urllib.request

JOBS = {
    "#176 verify-ish": 116876428717,
    "#176 e2e-ish": 116876728938,
    "#175 job-a": 116875485505,
    "#175 job-b": 116875869097,
}

for name, jid in JOBS.items():
    url = f"https://github.com/nordeim/service-desk/actions/runs/0/job/{jid}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"})
    try:
        html = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"{name} job {jid}: FETCH FAILED {e}")
        continue
    title = re.search(r'<title>([^<]+)</title>', html)
    print(f"=== {name} job {jid} ===")
    print(f"  title: {title.group(1)[:110] if title else '?'}")
    # step names + statuses: look for the step list JSON
    steps = re.findall(r'"name":"([^"]{3,60})","status":"[^"]*","conclusion":"(\w+)"', html)
    if not steps:
        steps = re.findall(r'"step"[^}]*?"name":"([^"]{3,60})"[^}]*?"conclusion":"(\w+)"', html)
    for sname, sconc in steps:
        mark = " <<< FAILED" if sconc.upper() == "FAILURE" else ""
        print(f"  step: {sname} -> {sconc}{mark}")
    # annotation fragments
    ann = re.findall(r'##\[error\][^<]{0,200}', html)
    for a in ann[:6]:
        print(f"  ERROR: {a[:220]}")
    # raw failed text
    for m in re.finditer(r'(Test timed out[^<]{0,120}|Expected[^<]{0,80}|AssertionError[^<]{0,120}|FAIL [^<]{0,120})', html):
        print(f"  fail-frag: {m.group(0)[:200]}")
    print()
