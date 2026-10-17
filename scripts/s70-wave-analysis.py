#!/usr/bin/env python3
"""S70: robust basename-vs-hash comparison of the s69 vs s70 entry chunk refs."""


def refs(path):
    out = set()
    pairs = {}
    for line in open(path):
        line = line.strip().strip('"')
        if not line:
            continue
        import re
        m = re.match(r'^(.*)-([A-Za-z0-9_-]{8})\.(js|css|woff2?)$', line)
        if m:
            base, h = m.group(1), m.group(2)
            out.add(base)
            pairs.setdefault(base, set()).add(h)
    return out, pairs


cur_b, cur_p = refs('/tmp/s70-results/cur-chunkrefs.txt')
s69_b, s69_p = refs('/tmp/s70-results/s69-baseline-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} s69={len(s69_b)}")
added = cur_b - s69_b
removed = s69_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & s69_b
rehashed = [b for b in common if cur_p[b] != s69_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == s69_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
