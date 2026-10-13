import { describe, it, expect, vi } from "vitest";

// Session 41: the OPTIONS/allow single-source consistency pins.
//
// The s40 remediation shipped the 11-route stub matrix with honest allow
// lists — as ~56 DUPLICATED string literals (each route's string appears
// 5-6x: every stub + the explicit OPTIONS). The s69 log named the drift
// risk: "a future method addition must update both the stub set and the
// allow string" — every copy, in every file, or the advertisement becomes
// exactly the lie the s40 experiment measured (the auto-OPTIONS growing
// the stub methods). The s41 fix is the routeAllow derivation seam: each
// route declares its implemented methods ONCE and every string flows from
// it. These pins are the freeze: they import every route module (the
// tests/api-catchall.test.ts pattern — the stubs and OPTIONS handlers are
// importable pure functions; @/lib/db is mocked so the unit layer stays
// Prisma-free) and cross-check the module's ACTUAL export surface, the
// OPTIONS advertisement, and every 405 stub against the derived list.
//
// The LIVE surface stays pinned by the s40 block in scripts/smoke-test.sh
// (121 steps — the behavior-preservation proof: this refactor must keep
// it green without touching it).

// The db mock: the route modules import @/lib/db at module level (the
// login/tickets routes construct queries) — the stubs and OPTIONS never
// touch it. The mock keeps this file free of Prisma instantiation and
// the db.ts env mutation.
vi.mock("../src/lib/db", () => ({
  db: {
    $queryRaw: () =>
      Promise.reject(new Error("not used: stubs and OPTIONS never query")),
  },
}));

import { routeAllow } from "../src/lib/api-methods";
import * as healthRoute from "../src/app/api/health/route";
import * as meRoute from "../src/app/api/auth/me/route";
import * as loginRoute from "../src/app/api/auth/login/route";
import * as logoutRoute from "../src/app/api/auth/logout/route";
import * as signupRoute from "../src/app/api/auth/signup/route";
import * as forgotPasswordRoute from "../src/app/api/auth/forgot-password/route";
import * as statsRoute from "../src/app/api/stats/route";
import * as ticketsRoute from "../src/app/api/tickets/route";
import * as ticketDetailRoute from "../src/app/api/tickets/[id]/route";
import * as commentsRoute from "../src/app/api/tickets/[id]/comments/route";
import * as attachmentRoute from "../src/app/api/tickets/[id]/attachments/[attachmentId]/route";

// The canonical HTTP method order every allow string follows (the order
// the s40 measurements recorded on the framework's own auto-OPTIONS:
// OPTIONS last, HEAD right after GET).
const HTTP_METHODS = [
  "GET",
  "HEAD",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "OPTIONS",
] as const;

// The single source this file cross-checks against: each route's
// implemented methods (the s40 matrix, now declared once per route file
// as the routeAllow argument).
interface RouteEntry {
  name: string;
  // The module namespace object — indexed via the cast in the pin (the
  // per-route export shapes differ; only the method exports matter).
  mod: unknown;
  implemented: readonly string[];
}

const ROUTES: readonly RouteEntry[] = [
  { name: "/api/health", mod: healthRoute, implemented: ["GET"] },
  { name: "/api/auth/me", mod: meRoute, implemented: ["GET"] },
  {
    name: "/api/auth/login",
    mod: loginRoute,
    implemented: ["POST", "DELETE"],
  },
  { name: "/api/auth/logout", mod: logoutRoute, implemented: ["POST"] },
  { name: "/api/auth/signup", mod: signupRoute, implemented: ["POST"] },
  {
    name: "/api/auth/forgot-password",
    mod: forgotPasswordRoute,
    implemented: ["POST"],
  },
  { name: "/api/stats", mod: statsRoute, implemented: ["GET"] },
  {
    name: "/api/tickets",
    mod: ticketsRoute,
    implemented: ["GET", "POST"],
  },
  {
    name: "/api/tickets/[id]",
    mod: ticketDetailRoute,
    implemented: ["GET", "PATCH"],
  },
  {
    name: "/api/tickets/[id]/comments",
    mod: commentsRoute,
    implemented: ["POST"],
  },
  {
    name: "/api/tickets/[id]/attachments/[attachmentId]",
    mod: attachmentRoute,
    implemented: ["GET"],
  },
];

// The expected exported method names for an implemented set: every
// method is either implemented or stubbed, EXCEPT HEAD on GET-bearing
// routes (the framework auto-derives a 200-empty HEAD there — never
// stubbed, the s32/s40 contract) — plus the always-explicit OPTIONS.
function expectedExportedMethods(implemented: readonly string[]): string[] {
  const stubbed = HTTP_METHODS.filter(
    (m) =>
      m !== "OPTIONS" &&
      !implemented.includes(m) &&
      !(m === "HEAD" && implemented.includes("GET")),
  );
  return [...implemented, ...stubbed, "OPTIONS"];
}

describe("routeAllow derivation (s41 — the single-source seam)", () => {
  it("derives a GET-only route: the auto-HEAD + OPTIONS in canonical order", () => {
    expect(routeAllow(["GET"])).toBe("GET, HEAD, OPTIONS");
  });

  it("derives a GET+POST route", () => {
    expect(routeAllow(["GET", "POST"])).toBe("GET, HEAD, POST, OPTIONS");
  });

  it("derives a GET+PATCH route", () => {
    expect(routeAllow(["GET", "PATCH"])).toBe("GET, HEAD, PATCH, OPTIONS");
  });

  it("derives a POST-only route: no HEAD (no GET to derive it from)", () => {
    expect(routeAllow(["POST"])).toBe("POST, OPTIONS");
  });

  it("derives the POST+DELETE pair (the login route's shape)", () => {
    expect(routeAllow(["POST", "DELETE"])).toBe("POST, DELETE, OPTIONS");
  });

  it("is input-order independent (the canonical order wins)", () => {
    expect(routeAllow(["DELETE", "POST"])).toBe("POST, DELETE, OPTIONS");
  });
});

describe("the per-route single-source consistency (s41)", () => {
  it.each(ROUTES)(
    "$name: the export surface, the OPTIONS advertisement, and every 405 stub derive from the implemented set",
    async ({ mod, implemented }) => {
      const moduleNs = mod as unknown as Record<
        string,
        () => Promise<Response>
      >;
      const allow = routeAllow(implemented);

      // (a) The export-key pin: every method is either implemented or
      // stubbed (except auto-HEAD on GET routes) + the explicit OPTIONS.
      // Catches a MISSING stub (the framework's empty 405 returns — the
      // exact s40 regression class) and an unexpected extra export.
      const exported = Object.keys(moduleNs).filter((k) =>
        (HTTP_METHODS as readonly string[]).includes(k),
      );
      expect(new Set(exported)).toEqual(
        new Set(expectedExportedMethods(implemented)),
      );

      // (b) The advertisement pin: the explicit OPTIONS answers 204 with
      // exactly the derived honest list (a stub export alone would make
      // the auto-OPTIONS lie — the s40 experiment).
      const options = await moduleNs.OPTIONS();
      expect(options.status).toBe(204);
      expect(options.headers.get("allow")).toBe(allow);

      // (c) The stub-shape pin: every stubbed method answers the 405 +
      // {error} envelope + the same derived Allow (RFC 9110 §15.5.6).
      for (const m of expectedExportedMethods(implemented)) {
        if (m === "OPTIONS" || implemented.includes(m)) continue;
        const res = await moduleNs[m]();
        expect(res.status).toBe(405);
        expect(res.headers.get("allow")).toBe(allow);
        const body = (await res.json()) as Record<string, unknown>;
        expect(body).toEqual({ error: "Method not allowed" });
      }
    },
  );
});
