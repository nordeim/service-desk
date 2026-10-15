#!/usr/bin/env python3
"""S57: measure the agent-log header convention — for which sessions N does
docs/session_(2N-11).md exist AND carry a 'session-N agent's log' header?
Establishes the correspondence pin's honest boundary."""
import re
import pathlib

DOCS = pathlib.Path("/home/z/my-project/service-desk/docs")
ok, bad_form, missing = [], [], []
for n in range(2, 58):
    doc = 2 * n - 11
    f = DOCS / f"session_{doc}.md"
    if not f.exists():
        missing.append((n, doc))
        continue
    head = f.read_text()[:300]
    if re.search(rf"session-?{n}\b.{0,40}(agent'?s)? ?log", head, re.I) or re.search(rf"session-?{n}\b", head, re.I):
        ok.append((n, doc))
    else:
        bad_form.append((n, doc, head.splitlines()[0][:60] if head.splitlines() else ""))

print(f"formula-doc exists + session-{n} identified: {len(ok)} sessions")
first_ok = ok[0][0] if ok else None
print(f"earliest session with the identified form: {first_ok}")
print(f"missing docs (session, expected_doc): {missing[:10]}")
print(f"exists but header doesn't identify the session (session, doc, first line):")
for s, d, l in bad_form[:12]:
    print(f"   s{s} doc{d}: {l!r}")
# contiguity of the ok-run from the tail
tail_run = []
for n in range(57, 1, -1):
    if any(n == x[0] for x in ok):
        tail_run.append(n)
    else:
        break
print(f"unbroken identified run from s57 down to: s{min(tail_run)} (length {len(tail_run)})")
