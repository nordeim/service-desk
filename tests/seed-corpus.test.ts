import { describe, expect, it } from "vitest";
import {
  SEED_TICKETS,
  SEED_USERS,
  type SeedTicket,
} from "../prisma/seed-data";
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/constants";

// The canonical seed-corpus contract (Session 43 — the fixture under
// everything, finally pinned): "4 users, 11 tickets, 3 comments" is
// claimed in the README quickstart, the AGENTS.md commands table, the
// PAD, and every worklog live-verify entry (the 4/11/3 checks after
// every standing re-run) — but until this test NOTHING in the
// automated suite asserted it. The seed logged the counts without
// asserting them; the E2E global-setup seeded without asserting; no
// E2E spec pinned the totals. A future edit to the corpus would drift
// the fixture under 198 E2E tests, the screenshot lineage, and the
// VLM-diff baselines silently.
//
// The structural fix that made this testable: the corpus data moved to
// prisma/seed-data.ts — a side-effect-free module (no PrismaClient, no
// main(), no crypto). prisma/seed.ts imports it; importing seed.ts
// itself from a unit test would EXECUTE the seed (main() runs at module
// scope), which is why the corpus was unpinnable for 42 sessions.
//
// The vocabulary cross-check guards the seed's intentionally-duplicated
// vocabulary against src/lib/constants.ts (the duplication is
// load-bearing — seed.ts must not import app code through the no-@/-
// alias constraint; the pin is the drift guard WITHOUT the import).
describe("the canonical corpus shape", () => {
  it("is exactly 4 users, 11 tickets, 3 comments (the canonical 4/11/3)", () => {
    expect(SEED_USERS).toHaveLength(4);
    expect(SEED_TICKETS).toHaveLength(11);
    const comments = SEED_TICKETS.reduce((n, t) => n + (t.comments?.length ?? 0), 0);
    expect(comments).toBe(3);
  });

  it("user emails are unique (the upsert natural key)", () => {
    const emails = SEED_USERS.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it("ticket titles are unique (the findFirst idempotency key — a duplicate would silently skip on re-seed)", () => {
    const titles = SEED_TICKETS.map((t) => t.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every ticket owner and comment author is a seeded user (the referential integrity the seed relies on)", () => {
    const emails = new Set(SEED_USERS.map((u) => u.email));
    for (const t of SEED_TICKETS) {
      expect(emails.has(t.owner), `ticket "${t.title}" owner ${t.owner}`).toBe(true);
      for (const c of t.comments ?? []) {
        expect(emails.has(c.author), `comment on "${t.title}" author ${c.author}`).toBe(true);
      }
    }
  });
});

describe("the corpus vocabulary (the intentional-duplication drift guard)", () => {
  it("every ticket category/priority/status is in the app vocabulary", () => {
    for (const t of SEED_TICKETS) {
      expect(TICKET_CATEGORIES).toContain(t.category);
      expect(TICKET_PRIORITIES).toContain(t.priority);
      expect(TICKET_STATUSES).toContain(t.status);
    }
  });

  it("all four statuses appear in the corpus (the QUICK STATS fixture — every counter renders nonzero)", () => {
    const present = new Set(SEED_TICKETS.map((t) => t.status));
    for (const s of TICKET_STATUSES) {
      expect(present.has(s), `status "${s}" present in the corpus`).toBe(true);
    }
  });
});

describe("the demo login contract (the README quickstart promise)", () => {
  it("demo@servicedesk.app exists with the documented password", () => {
    const demo = SEED_USERS.find((u) => u.email === "demo@servicedesk.app");
    expect(demo).toBeDefined();
    expect(demo?.password).toBe("Demo1234!");
  });

  it("the demo user owns tickets (the dashboard cards + My Tickets fixture)", () => {
    const owned = SEED_TICKETS.filter((t) => t.owner === "demo@servicedesk.app");
    expect(owned.length).toBeGreaterThanOrEqual(5);
    const others = SEED_TICKETS.filter((t) => t.owner !== "demo@servicedesk.app");
    expect(others.length).toBeGreaterThanOrEqual(5);
  });
});

describe("the seed-data module shape", () => {
  it("exports typed data only — no side effects (the pinning precondition)", () => {
    const tickets: SeedTicket[] = SEED_TICKETS;
    expect(tickets.every((t) => typeof t.title === "string" && t.title.length > 0)).toBe(true);
    expect(tickets.every((t) => Number.isFinite(t.ageDays) && t.ageDays >= 0)).toBe(true);
  });
});
