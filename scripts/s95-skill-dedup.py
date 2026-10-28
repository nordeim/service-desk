#!/usr/bin/env python3
"""S95: the SKILL duplicated-block removal (the s14 shell-layer mangling closure).

Removes the FIRST copy of the sections 13-20 + Appendix A/B block (file lines
421-676, the copy inserted at s14's cd18869 hunk @@ -400,6 +400,266 @@) plus
the orphaned lesson fragment at line 672 (the severed tail of s14's original
lesson-59 line — its complete corrected form lives at line 405). The second
copy (the ORIGINAL pre-s14 block) survives as the single indexed body; the
lesson ledger's split shape (1-69 in section 12, 70-148 at the tail) is
preserved — the post-s14 convention.

Guarded by exact boundary assertions — the removal fails loudly if the file
shape is not the measured one (never a blind line-range delete).
"""
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent / "service-desk_SKILL.md"

lines = SKILL.read_text(encoding="utf-8").split("\n")

# 1-indexed boundary assertions (the measured shape at the s95 open).
assert lines[420].startswith("## 13. Pitfalls to Avoid"), (
    f"line 421 is not the first section-13 heading: {lines[420]!r}"
)
assert lines[422].startswith("- Adding `tailwind.config.js`"), (
    f"line 423 is not section-13's first bullet: {lines[422]!r}"
)
assert lines[671] == "` expansion near a replacement string containing dollar-quote.", (
    f"line 672 is not the orphaned fragment: {lines[671]!r}"
)
assert lines[674] == "---", f"line 675 is not the separator: {lines[674]!r}"
assert lines[676].startswith("## 13. Pitfalls to Avoid"), (
    f"line 677 is not the second section-13 heading: {lines[676]!r}"
)
assert (
    sum(1 for l in lines if l.startswith("## 13. Pitfalls to Avoid")) == 2
), "expected exactly two section-13 copies before the removal"

# Remove lines 421-676 inclusive (0-indexed 420..675): copy 1 + the
# orphaned fragment + the seam separators.
new = lines[:420] + lines[676:]

assert (
    sum(1 for l in new if l.startswith("## 13. Pitfalls to Avoid")) == 1
), "expected exactly one section-13 after the removal"
assert (
    "` expansion near a replacement string containing dollar-quote."
    not in "\n".join(new)
), "the orphaned fragment must be gone"
assert new[420].startswith("## 13. Pitfalls to Avoid"), (
    "the surviving section-13 must directly follow the section-12 separator"
)
assert (
    sum(1 for l in new if l.startswith("## ")) == 23
), f"expected 23 ## headings after the removal, found {sum(1 for l in new if l.startswith('## '))}"

SKILL.write_text("\n".join(new), encoding="utf-8")
print(
    f"removed {len(lines) - len(new)} lines (the duplicate block + the fragment); "
    f"{len(lines)} -> {len(new)} lines; ## headings: "
    f"{sum(1 for l in new if l.startswith('## '))}"
)
