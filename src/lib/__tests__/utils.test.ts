import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatDuration } from "@/lib/utils";

describe("formatDuration", () => {
  it("returns N/A for null/negative", () => {
    expect(formatDuration(null)).toBe("N/A");
    expect(formatDuration(-1)).toBe("N/A");
  });
  it("formats minutes", () => {
    expect(formatDuration(45 * 60_000)).toBe("45m");
  });
  it("formats hours + minutes", () => {
    expect(formatDuration((2 * 60 + 15) * 60_000)).toBe("2h 15m");
  });
  it("formats days + hours", () => {
    expect(formatDuration((3 * 24 + 4) * 3600_000)).toBe("3d 4h");
  });
});

describe("formatDateTime", () => {
  it("formats the reference shape (Oct 9, 2026 at ...)", () => {
    // Z-suffixed instant (s15): the app's API always serializes Z-suffixed
    // ISO — a naive shorthand would shift under the UTC pin at non-UTC
    // runner timezones. Deterministic at every TZ.
    const out = formatDateTime(new Date("2026-10-09T00:47:00.000Z"));
    expect(out).toMatch(/^Oct 9, 2026 at \d{1,2}:\d{2} (AM|PM)$/);
    expect(out).toBe("Oct 9, 2026 at 12:47 AM");
  });
  it("accepts ISO strings", () => {
    expect(() => formatDateTime("2026-10-09T00:47:00.000Z")).not.toThrow();
  });
  // Session 15 (F2): the reference's API returns naive datetimes that the
  // browser parses-as-local and formats-as-local — the digits round-trip, so
  // every viewer sees the STORED UTC wall-clock. Our formatters pin
  // timeZone: "UTC" so a Z-suffixed instant renders the same digits at any
  // viewer timezone (the paired live measurement: reference "4:29 AM" for a
  // 04:29:35Z instant under Europe/Berlin; ours had rendered "6:29 AM").
  it("renders the stored UTC wall-clock at any viewer timezone (s15 parity)", () => {
    expect(formatDateTime("2026-10-09T23:47:00.000Z")).toBe("Oct 9, 2026 at 11:47 PM");
  });
});

describe("formatDate", () => {
  it("formats the reference dashboard-row shape (date only, no time)", () => {
    // Z-suffixed instant (s15): deterministic at every runner timezone.
    expect(formatDate(new Date("2026-10-09T14:30:00.000Z"))).toBe("Oct 9, 2026");
  });
  it("renders the stored UTC calendar day at any viewer timezone (s15 parity)", () => {
    // The tolerant /^Nov 30|Dec 1$/ regex this replaces was exactly the
    // timezone-dependence smell: 2026-12-01T09:15Z is Dec 1 only at UTC —
    // west-of-UTC viewers saw "Nov 30, 2026". The reference renders the
    // stored wall-clock (naive round-trip); we pin the same digits.
    expect(formatDate("2026-12-01T09:15:00.000Z")).toBe("Dec 1, 2026");
  });
  it("never includes a time component", () => {
    expect(formatDate(new Date("2026-10-09T23:59:59"))).not.toContain("at");
    expect(formatDate(new Date("2026-10-09T23:59:59"))).not.toMatch(/AM|PM/);
  });
});
