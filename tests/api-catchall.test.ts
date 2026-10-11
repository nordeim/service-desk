import { describe, expect, it } from "vitest";

// Session 33: the API-namespace JSON 404 catch-all contract.
//
// Before s33 every UNKNOWN path under /api/** served the framework's HTML
// 404 page (content-type text/html) — /api/banana, /api/auth/banana,
// /api/tickets/xyz/banana, /api bare — the last non-JSON surface in the API
// namespace (the content-type-level variant of the s27/s32 grammar
// doctrine: a JSON client hitting a mistyped route got an HTML body it
// could not parse). The known routes' 404s already spoke JSON ({error});
// the catch-all extends that contract to the unknown paths.
//
// These pins import the route module and call the exported handlers with a
// synthetic Request — the handler is pure (no db, no auth dependency), so
// the seam is the handler signature itself. The smoke script's s33 block
// pins the same contract live (through the real server, with the s30
// header set + the HEAD/OPTIONS behavior + the non-shadow re-pins).

import {
  DELETE,
  GET,
  OPTIONS,
  PATCH,
  POST,
  PUT,
} from "@/app/api/[[...path]]/route";

const METHODS = { GET, POST, PUT, PATCH, DELETE, OPTIONS } as const;

function request() {
  return new Request("http://localhost:3000/api/banana");
}

describe("the API-namespace catch-all 404 (s33)", () => {
  it.each(Object.keys(METHODS))(
    "%s answers 404 with the JSON content type",
    async (method) => {
      const res = await METHODS[method as keyof typeof METHODS](request());
      expect(res.status).toBe(404);
      expect(res.headers.get("content-type")).toContain("application/json");
    },
  );

  it.each(Object.keys(METHODS))(
    "%s carries the {error} envelope exactly (the s32 convention — single message, no extra keys)",
    async (method) => {
      const res = await METHODS[method as keyof typeof METHODS](request());
      const body = await res.json();
      expect(Object.keys(body).sort()).toEqual(["error"]);
    },
  );

  it.each(Object.keys(METHODS))(
    "%s says API route not found (the constant message — no path reflection)",
    async (method) => {
      const res = await METHODS[method as keyof typeof METHODS](request());
      const body = await res.json();
      expect(body.error).toBe("API route not found");
    },
  );

  it("GET ignores the query string entirely (the 404-by-path precedes grammar — measured live: /api/banana?x=1 404s, no param parsing)", async () => {
    const res = await GET(
      new Request("http://localhost:3000/api/banana?scope=mine&banana=1"),
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("API route not found");
  });
});
