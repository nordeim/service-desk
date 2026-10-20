#!/usr/bin/env python3
"""S81: robust basename-vs-hash comparison of the recorded-baseline entry
(the closeout freeze: the 47th-wave entry CBC3tM7A, the LAST RECORDED —
re-fetchable, no flaky edge observed; a no-wave re-run reads the 0/0
no-wave form; the next wave's comparison reproduces the per-wave record) vs the
current entry chunk refs — the honest-record form (the per-wave records:
the 39th vs Bt_cFPps 6/1/435/269; the 40th vs B2q8HDZS 0/1/420/289; the
41st vs EM0yvqO9 5/2/409/298; the 42nd vs CjDN-sir 7 added / 4 removed,
432 re-hashed / 276 hash-stable; the 43rd vs D3ArZVPB 0/0/423/292 (the
era's first zero-delta wave — a pure re-hash); the 44th vs BGDOjf3P
0/1/301/413 (importedProjects removed, platform-infrastructure); the 45th
45th vs BGDOjf3P 0/1/412/302 (the same importedProjects removal persisted
through the re-hash); the 46th vs z55NvmqA 10/3/638/73 (I18nProvider,
LayoutGallerySmall, UsageLogsAPI, app-preview.store, inputAssistSession,
promptGalleryData, static, useBillingPage, useWorkspaceMemberSuggestions,
visual-edit.store added; BookSmall, DisabledControlTooltip, planUtils
removed — all platform-infrastructure, the era's largest add-wave;
the 47th vs DwY57mhH 0/0/418/303 (the era's second zero-delta wave — a pure
re-hash, entry-only, the same byte size; the CSS unchanged) — user-facing
non-gap; the per-wave baseline frozen at the closeout: the 47th-wave entry
CBC3tM7A, the LAST RECORDED)."""


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


cur_b, cur_p = refs('/tmp/s81-results/cur-chunkrefs.txt')
found_b, found_p = refs('/tmp/s81-results/s81-found-entry.js.chunkrefs.txt')
print(f"basenames: now={len(cur_b)} recorded-baseline={len(found_b)}")
added = cur_b - found_b
removed = found_b - cur_b
print(f"ADDED basenames ({len(added)}):")
for b in sorted(added):
    print("  +", b)
print(f"REMOVED basenames ({len(removed)}):")
for b in sorted(removed):
    print("  -", b)
common = cur_b & found_b
rehashed = [b for b in common if cur_p[b] != found_p[b]]
print(f"common={len(common)} re-hashed={len(rehashed)} hash-stable={len(common) - len(rehashed)}")
stable = [b for b in common if cur_p[b] == found_p[b]]
print("hash-STABLE common refs (the interesting ones):")
for b in sorted(stable):
    print("  =", b, sorted(cur_p[b]))
