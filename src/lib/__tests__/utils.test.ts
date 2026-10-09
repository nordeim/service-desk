import { describe, expect, it } from "vitest";
import { formatDateTime, formatDuration } from "@/lib/utils";

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
