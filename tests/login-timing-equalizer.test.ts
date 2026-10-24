import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 86 — the login timing-equalizer pins (P1: the ENUMERATION-TIMING
// class — the family skill §16 contract)
//
// Contract under test: the login route's 401 envelope is enumeration-safe
// (one status, one body — the s21 backend-axis family), but the TIMING
// half of the channel was open: the pre-fix
// `!user || !verifyPassword(...)` short-circuit skipped the scrypt work
// entirely on the unknown-email branch, so response latency distinguished
// registered emails (one scryptSync, N=16384 via Node defaults with a
// 64-byte key — tens of milliseconds) from unknown ones (an indexed
// findUnique + the envelope, sub-millisecond). The family skill names the
// posture (skills/web-application/SKILL.md §16: "Login timing equalizer
// (miss branch burns the same scrypt)" — the checklist line, each line
// tracing to a real incident class), and the neo-crm sibling landed the
// same fix at its own session-163 (the digma S72-C port — the identical
// short-circuit defect, the identical lazy-memoized seam, described in the
// session plan; cross-repo hashes are never cited in this corpus, the
// lesson-121 doctrine).
//
// The fix under test: `timingEqualizerHash()` in src/lib/auth.ts — a
// LAZY-memoized hash of a throwaway constant in the SAME scrypt$salt$hash
// format the passwordHash column carries, burned by the route's miss
// branch (`if (!user) verifyPassword(input.password!, timingEqualizerHash())`)
// so both branches run one scryptSync before the SAME byte-identical 401.
//
// Pin style: the behavior seam (the FORMAT IS THE BURN GUARANTEE —
// verifyPassword structurally runs scryptSync against any valid-format
// stored hash, so a format-conformant equalizer cannot skip the work) +
// the wiring text pin on comment-STRIPPED source (a commented-out call can
// never satisfy a source pin — the s43 mutation-C doctrine) + the
// miss-branch behavior pin through the REAL route handler (the mocked-db
// form, the s42 forgot-password-logs precedent).
// ---------------------------------------------------------------------------

// The db mock: the route's only DB touch on this path is
// db.user.findUnique({ where: { email } }) — controlled per test (the s42
// pattern). The equalizer burn itself is pure crypto at the auth seam —
// never mocked; the pins below prove it structurally.
vi.mock("../src/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "../src/lib/db";
import { POST } from "../src/app/api/auth/login/route";
import { hashPassword, timingEqualizerHash, verifyPassword } from "../src/lib/auth";

/** The repo-relative source reader (the wiring pin's ground truth). */
function read(rel: string): string {
  return readFileSync(path.resolve(import.meta.dirname, "..", rel), "utf-8");
}

/** Strip both comment forms before any source-text assertion. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/** A login POST with a fresh rate-limit bucket per IP (the s38 XFF seam). */
function loginRequest(email: string, password: string, ip: string): Request {
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ email, password }),
  });
}

describe("the login timing equalizer (session 86 — the family skill §16 contract)", () => {
  it("the seam: a stable per-process scrypt$-format value (the format IS the burn guarantee — the lazy-memoization contract)", () => {
    const first = timingEqualizerHash();
    // The SAME format hashPassword mints (16-byte salt -> 32 hex, 64-byte
    // key -> 128 hex): verifyPassword runs scryptSync against ANY
    // valid-format stored hash, so a format-conformant equalizer
    // structurally cannot skip the work.
    expect(first).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(hashPassword("format-parity-probe")).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    // LAZY memoization: the second call answers the SAME value (never a
    // second cold scrypt burn).
    expect(timingEqualizerHash()).toBe(first);
  });

  it("the seam: verifies harmlessly — the burn target never authenticates ordinary passwords", () => {
    const equalizer = timingEqualizerHash();
    expect(verifyPassword("anything", equalizer)).toBe(false);
    expect(verifyPassword("hunter2", equalizer)).toBe(false);
    expect(verifyPassword("", equalizer)).toBe(false);
  });

  it("the route wiring: the miss branch burns the equalizer scrypt (the unknown-email branch runs the same work)", () => {
    const src = stripComments(read("src/app/api/auth/login/route.ts"));
    expect(src).toContain("timingEqualizerHash");
    expect(src).toContain(
      "if (!user) verifyPassword(input.password!, timingEqualizerHash());",
    );
  });

  it("the miss branch: unknown email answers the exact 401 envelope through the REAL handler (the burn never breaks the shape)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    const res = await POST(loginRequest("s86-unknown@nowhere.test", "s86-probe-password", "203.0.113.86"));
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("Invalid email or password");
  });
});
