#!/usr/bin/env python3
"""S60: the entry chunk-ref comparison (basenames vs hashes) — two args:
  s60-entry-compare.py CUR_CHUNKREFS.txt BASE_CHUNKREFS.txt
Prints ADDED/REMOVED basenames + the re-hash/stable counts (the wave shape).
"""
import re
import sys


def refs(path):
    out, pairs = set(), {}
    for line in open(path):
        line = line.strip().strip('"')
        if not line:
            continue
        m = re.match(r'^(.*)-([A-Za-z0-9_-]{8})\.js$', line)
        if m:
            base, h = m.group(1), m.group(2)
            out.add(base)
            pairs.setdefault(base, set()).add(h)
    return out, pairs


cur_b, cur_p = refs(sys.argv[1])
old_b, old_p = refs(sys.argv[2])
print(f"basenames: now={len(cur_b)} baseline={len(old_b)}")
added, removed = cur_b - old_b, old_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added)[:20]:
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed)[:20]:
    print("  -", b)
common = cur_b & old_b
rehashed = [b for b in common if cur_p[b] != old_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
if not added and not removed:
    print("(no topology change — a pure re-hash wave)")
