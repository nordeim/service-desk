#!/usr/bin/env python3
"""s59 own-side audit: measure the co-location hole in pin 3.

Pin 3 (tests/artifact-existence-contract.test.ts) implements a MATCH-scoped
exclusion (isKnownNonCommit) as a LINE-scoped escape (`return` inside the
forEach callback) — a citation co-located on the same line with an earlier
excluded token (pure-digit id / ed25519 / PNG-JPEG magic) silently escapes
the sweep.

Live proof: docs/session_106.md line 13 carries `2914125` (pure digits ->
excluded) BEFORE `deadbeef` on the same line — the pin caught only line 52
(where deadbeef sits alone).

This script measures, over the pin's exact DOC_FILES corpus:
  1. claims under the BUGGY semantics (return: skip rest of line)
  2. claims under the CORRECT semantics (continue: skip only the token)
  3. the delta — the shielded tokens (the hole's live surface)
  4. which shielded tokens are dangling (unreachable in git) — the damage
"""
import re
import subprocess
import os

REPO = "/home/z/my-project/service-desk"
os.chdir(REPO)

BARE_HEX = re.compile(r"`([0-9a-f]{7,40})`")


def is_known_non_commit(h: str) -> bool:
    if h == "ed25519":
        return True
    if h == "89504e470d0a1a0a":
        return True
    if h == "ffd8ffe000104a46":
        return True
    if h.isdigit():
        return True
    return False


def doc_files():
    files = []
    for f in sorted(os.listdir("docs")):
        if f.endswith(".md"):
            files.append(f"docs/{f}")
    files += ["worklog.md", "AGENTS.md", "CLAUDE.md", "README.md",
              "service-desk_SKILL.md", "Project_Architecture_Document.md"]
    return [f for f in files if os.path.exists(f)]


def collect(semantics: str):
    claims = []      # (file, line, h) non-excluded claims
    excluded = []    # (file, line, h) excluded tokens
    shielded = []    # tokens skipped by the buggy line-escape (only for 'return')
    for f in doc_files():
        with open(f, encoding="utf8") as fh:
            for i, line in enumerate(fh.read().split("\n"), 1):
                tokens = [m.group(1) for m in BARE_HEX.finditer(line)]
                if semantics == "return":
                    # the buggy form: forEach callback returns on the first
                    # excluded token, dropping the rest of the line
                    dropped_after_exclusion = False
                    for h in tokens:
                        if dropped_after_exclusion:
                            shielded.append((f, i, h))
                            continue
                        if is_known_non_commit(h):
                            excluded.append((f, i, h))
                            dropped_after_exclusion = True
                            continue
                        claims.append((f, i, h))
                else:
                    for h in tokens:
                        if is_known_non_commit(h):
                            excluded.append((f, i, h))
                        else:
                            claims.append((f, i, h))
    return claims, excluded, shielded


def git_reachable(hashes):
    uniq = sorted(set(hashes))
    out = {}
    if not uniq:
        return out
    # git cat-file --batch-check: one line per input, in order
    proc = subprocess.run(["git", "cat-file", "--batch-check"],
                          input="\n".join(uniq) + "\n",
                          capture_output=True, text=True)
    for h, line in zip(uniq, [l for l in proc.stdout.split("\n") if l.strip()]):
        kind = line.split(" ")[1] if " " in line else ""
        out[h] = kind in ("commit", "blob", "tree", "tag")
    return out


def main():
    buggy_claims, buggy_excl, shielded = collect("return")
    correct_claims, correct_excl, _ = collect("continue")

    print(f"BUGGY   semantics: {len(buggy_claims)} claims, {len(buggy_excl)} excluded")
    print(f"CORRECT semantics: {len(correct_claims)} claims, {len(correct_excl)} excluded")
    print(f"SHIELDED tokens (the hole): {len(shielded)}")
    for f, i, h in shielded:
        print(f"  shielded: {f} line {i}: `{h}`")

    # the damage: any shielded token that does NOT resolve in git?
    if shielded:
        reach = git_reachable([h for _, _, h in shielded])
        dangling = [(f, i, h) for f, i, h in shielded if not reach.get(h)]
        print(f"\nDANGLING among shielded: {len(dangling)}")
        for f, i, h in dangling:
            print(f"  DANGLING: {f} line {i}: `{h}`")
    else:
        print("\nNo shielded tokens — the hole has zero live surface right now.")

    # the corrected claims reachability (the full corpus check under fix)
    reach = git_reachable([h for _, _, h in correct_claims])
    dangling_correct = [(f, i, h) for f, i, h in correct_claims if not reach.get(h)]
    print(f"\nCORRECT-grammar dangling citations: {len(dangling_correct)}")
    for f, i, h in dangling_correct:
        print(f"  DANGLING: {f} line {i}: `{h}`")

    # the shielding-shape lines (2+ tokens, at least one excluded) — the
    # shape count for the co-location pin floor
    shape_lines = 0
    for f in doc_files():
        with open(f, encoding="utf8") as fh:
            for i, line in enumerate(fh.read().split("\n"), 1):
                tokens = [m.group(1) for m in BARE_HEX.finditer(line)]
                if len(tokens) >= 2 and any(is_known_non_commit(h) for h in tokens):
                    shape_lines += 1
    print(f"\nCo-location shape lines (2+ hex tokens, >=1 excluded): {shape_lines}")


if __name__ == "__main__":
    main()
