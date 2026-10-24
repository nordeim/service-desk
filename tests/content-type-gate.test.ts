import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Session 88 — the Content-Type CSRF gate pins (P1: the LOGIN-CSRF class —
// the family skill §16 contract)
//
// Contract under test: every write route parses its body with a bare
// req.json() — six parse sites (login, signup, forgot-password, the tickets
// CREATE, the ticket PATCH, the comments POST), none carrying a
// Content-Type gate. A JSON-parse seam blocks unparseable bodies, never
// form-originated transports: an HTML <form method="POST"
// enctype="text/plain"> (the classic name/value trick) posts a body that
// parses as valid JSON, so req.json() alone never barred the cross-site
// form POST — and the public auth family MINTS cookies on POST
// (login/signup): the login-CSRF class, the attacker's session planted in
// the victim's jar (SameSite=Lax gates cookie SENDING on cross-site POSTs,
// never cookie SETTING). The family skill names the posture
// (skills/web-application/SKILL.md §16: "Content-Type CSRF gate + bounded
// body reads on every JSON parse" — the bounded-body half closed at s35
// with parseBodySize; the Content-Type half was open at every site), and
// the neo-crm sibling carries the same fix in its committed src/lib/api.ts
// (the digma S148-A / B148-L1 port — Layer 1 of readBoundedJson, ahead of
// every byte read).
//
// The fix under test: `parseBodyContentType()` in src/lib/validation.ts —
// ok iff the value carries application/json case-insensitively (the
// "; charset=" suffix tolerated), otherwise the CONSTANT no-reflection
// message (the s33 catch-all doctrine); the routes wire it between
// parseBodySize and req.json() (both header reads at zero body cost — the
// s35 ordering) and return 415 (Unsupported Media Type — the semantic code,
// the s35 413 form; the envelope stays the family's {error}).
//
// Pin style: the pure-seam accept/reject families + THE MINT-BLOCKED pin
// through the REAL route handler (the mocked-db form, the s42/s86
// precedent — a text/plain POST carrying a JSON-parseable body with a
// REAL user mocked behind it: the pre-fix code MINTS the session, observed
// live at the RED) + the no-false-rejection boundary (the valid types reach
// the auth path) + the wiring text pin on comment-STRIPPED source, all six
// routes, with the s35 ordering invariant (a commented-out call can never
// satisfy a source pin — the s43 mutation-C doctrine).
// ---------------------------------------------------------------------------

// The db mock: the route's only DB touch on the mint path is
// db.user.findUnique({ where: { email } }) — controlled per test (the s42
// pattern; the s86 timing-equalizer battery's own form). The password
// verification + the session HMAC are the REAL seams — never mocked; the
// mint-blocked pin proves the gate structurally, before any auth runs.
vi.mock("../src/lib/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { db } from "../src/lib/db";
import { POST as loginPost } from "../src/app/api/auth/login/route";
import { hashPassword } from "../src/lib/auth";
import * as validation from "../src/lib/validation";

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
function loginRequest(contentType: string | null, body: string, ip: string): Request {
  const headers: Record<string, string> = { "x-forwarded-for": ip };
  if (contentType !== null) headers["content-type"] = contentType;
  return new Request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers,
    body,
  });
}

/** The standing wired user: the mock behind the mint path. */
function standingUser() {
  return {
    id: "s88-mint-probe-user",
    email: "s88-probe@servicedesk.app",
    name: "S88 Probe",
    passwordHash: hashPassword("s88-probe-password"),
  };
}

const WRITE_ROUTES = [
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/signup/route.ts",
  "src/app/api/auth/forgot-password/route.ts",
  "src/app/api/tickets/route.ts",
  "src/app/api/tickets/[id]/route.ts",
  "src/app/api/tickets/[id]/comments/route.ts",
];

describe("the Content-Type CSRF gate (session 88 — the family skill §16 contract)", () => {
  it("the seam: accepts the application/json family (charset + case variants tolerated)", () => {
    const gate = validation.parseBodyContentType;
    expect(gate("application/json").ok).toBe(true);
    expect(gate("application/json; charset=utf-8").ok).toBe(true);
    expect(gate("application/json;charset=UTF-8").ok).toBe(true);
    expect(gate("APPLICATION/JSON").ok).toBe(true);
    expect(gate("application/JSON; charset=utf-8").ok).toBe(true);
  });

  it("the seam: rejects the form-transport family with the constant no-reflection message", () => {
    const MESSAGE = "unsupported Content-Type (JSON API — send Content-Type: application/json)";
    const gate = validation.parseBodyContentType;
    for (const ct of [
      "text/plain",
      "text/plain; charset=utf-8",
      "application/x-www-form-urlencoded",
      "multipart/form-data; boundary=probe",
      "text/html",
      "",
    ]) {
      const verdict = gate(ct);
      expect(verdict.ok, `the seam must reject ${JSON.stringify(ct)}`).toBe(false);
      expect((verdict as { error: string }).error).toBe(MESSAGE);
    }
    const missing = gate(null);
    expect(missing.ok).toBe(false);
    expect((missing as { error: string }).error).toBe(MESSAGE);
  });

  it("THE MINT-BLOCKED pin: a text/plain form POST never mints a session (415 + no set-cookie through the REAL handler)", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(standingUser() as never);
    // The attack shape: the cross-site <form enctype="text/plain"> posts a
    // JSON-parseable body with the attacker's OWN credentials — the pre-fix
    // code parses it, finds the user, verifies the password, and MINTS the
    // session cookie into the victim's jar (the login-CSRF class: SameSite
    // gates cookie SENDING on cross-site POSTs, never cookie SETTING).
    const attack = loginRequest(
      "text/plain",
      JSON.stringify({ email: "s88-probe@servicedesk.app", password: "s88-probe-password" }),
      "203.0.113.88",
    );
    const res = await loginPost(attack);
    expect(res.status).toBe(415);
    expect(res.headers.get("set-cookie")).toBe(null);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("unsupported Content-Type (JSON API — send Content-Type: application/json)");
  });

  it("the no-false-rejection boundary: the valid types reach the auth path and mint normally", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(standingUser() as never);
    for (const ct of ["application/json", "application/json; charset=utf-8"]) {
      const res = await loginPost(
        loginRequest(
          ct,
          JSON.stringify({ email: "s88-probe@servicedesk.app", password: "s88-probe-password" }),
          `203.0.113.8${ct.length}`,
        ),
      );
      expect(res.status, `the ${ct} POST must reach the auth path`).toBe(200);
      expect(res.headers.get("set-cookie")).toContain("servicedesk_session=");
    }
  });

  it("the route wiring: all six write routes gate between the size ceiling and the body parse (the s35 ordering)", () => {
    for (const rel of WRITE_ROUTES) {
      const src = stripComments(read(rel));
      expect(src, `${rel} must import the gate`).toContain("parseBodyContentType");
      const gateCall = src.indexOf('parseBodyContentType(req.headers.get("content-type"))');
      expect(gateCall, `${rel} must call the gate with the content-type header`).toBeGreaterThan(-1);
      const sizeCall = src.indexOf('parseBodySize(req.headers.get("content-length"))');
      const parseCall = src.indexOf("await req.json()");
      expect(sizeCall, `${rel} must read the size ceiling first`).toBeGreaterThan(-1);
      expect(parseCall, `${rel} must parse the body`).toBeGreaterThan(-1);
      expect(
        sizeCall < gateCall && gateCall < parseCall,
        `${rel}: the gate must sit between the size ceiling and req.json() (the s35 header-read ordering)`,
      ).toBe(true);
    }
  });
});
