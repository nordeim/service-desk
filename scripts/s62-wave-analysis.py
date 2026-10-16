#!/usr/bin/env python3
"""S62: robust basename-vs-hash comparison of the s61 vs s62 entry chunk refs."""
import re


def refs(path):
    out = set()
    pairs = {}
    for line in open(path):
        line = line.strip().strip('"')
        if not line:
            continue
        m = re.match(r'^(.*)-([A-Za-z0-9_-]{8})\.(js|css|woff2?)$', line)
        if m:
            base, h = m.group(1), m.group(2)
            out.add(base)
            pairs.setdefault(base, set()).add(h)
    return out, pairs


cur_b, cur_p = refs('/tmp/s62-results/cur-chunkrefs.txt')
s61_b, s61_p = refs('/tmp/s62-results/s61-baseline-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s61={len(s61_b)}")
added = cur_b - s61_b
removed = s61_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s61_b
rehashed = [b for b in common if cur_p[b] != s61_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s61_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
