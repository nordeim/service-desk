#!/usr/bin/env python3
"""S89: robust basename-vs-hash comparison of the recorded-baseline entry
(the closeout freeze: the 54th-wave entry 34zv7ZR0, the LAST RECORDED —
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
re-hash, entry-only, the same byte size; the CSS unchanged); the 48th vs
CBC3tM7A 0/0/431/290 (the era's THIRD zero-delta wave — a pure
re-hash, entry-only, the same byte size 95402; the CSS unchanged); the 49th
vs CK5oGEE- 9/5/422/294 (all platform-infrastructure; the entry rotated
CK5oGEE- -> CiBFwtqW at +2128 bytes AND the login CSS rotated BpSyi-cD ->
B9rzNd1e at +3924 bytes — the era's TENTH CSS rotation); the 50th
vs CiBFwtqW 8/10/439/276 (all platform-infrastructure; the entry rotated
CiBFwtqW -> BdweUDbT at -37 bytes AND the login CSS rotated B9rzNd1e ->
--4Ltml9o at +727 bytes — the era's ELEVENTH CSS rotation); the 51st
vs BdweUDbT 0/0/421/302 (the era's FOURTH zero-delta wave — a pure
re-hash: the entry rotated BdweUDbT -> DzlN4LV0 at the SAME byte size
97493, the s67/s75 same-size precedent, AND the login CSS rotated
--4Ltml9o -> BD8HgQNX at +786 bytes — the era's TWELFTH CSS rotation); the
68th sweep (s86) the NO-WAVE form — the entry identical to itself
(723=723, 0 added / 0 removed, 0 re-hashed / 723 hash-stable), the CSS
unchanged — user-facing
non-gap; the 69th sweep (s87) THE FIFTY-THIRD WAVE — the era's FIFTH
zero-delta re-hash: the entry rotated DzlN4LV0 -> D85FnEDL at the SAME
byte size 97493, 723=723, 0 added / 0 removed, 292 re-hashed / 431
hash-stable, the CSS unchanged; the 70th sweep (s88) THE FIFTY-FOURTH
WAVE — a REAL delta wave: the entry rotated D85FnEDL -> 34zv7ZR0 at
-264 bytes, 723->719, 4 added / 8 removed (all platform-
infrastructure), 436 re-hashed / 279 hash-stable, AND the login CSS
rotated BD8HgQNX -> BlYK4iZ6 at -7114 bytes (the era's THIRTEENTH CSS
rotation — the login-pair trigger FIRED); the 71st sweep (s89) the
NO-WAVE form — the entry identical to itself (719=719, 0 added / 0
removed, 0 re-hashed / 719 hash-stable), the CSS unchanged; the per-wave
baseline frozen at the closeout: the 54th-wave entry 34zv7ZR0, the
LAST RECORDED)."""


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


cur_b, cur_p = refs('/tmp/s89-results/cur-chunkrefs.txt')
found_b, found_p = refs('/tmp/s89-results/s89-found-entry.js.chunkrefs.txt')
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
