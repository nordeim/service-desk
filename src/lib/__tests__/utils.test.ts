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
    const d = new Date("2026-10-09T00:47:00");
    const out = formatDateTime(d);
    expect(out).toMatch(/^Oct 9, 2026 at \d{1,2}:\d{2} (AM|PM)$/);
  });
  it("accepts ISO strings", () => {
    expect(() => formatDateTime("2026-10-09T00:47:00.000Z")).not.toThrow();
  });
});

describe("formatDate", () => {
  it("formats the reference dashboard-row shape (date only, no time)", () => {
    expect(formatDate(new Date("2026-10-09T14:30:00"))).toBe("Oct 9, 2026");
  });
  it("accepts ISO strings", () => {
    expect(formatDate("2026-12-01T09:15:00.000Z")).toMatch(/^(Nov 30|Dec 1), 2026$/);
  });
  it("never includes a time component", () => {
    expect(formatDate(new Date("2026-10-09T23:59:59"))).not.toContain("at");
    expect(formatDate(new Date("2026-10-09T23:59:59"))).not.toMatch(/AM|PM/);
  });
});
