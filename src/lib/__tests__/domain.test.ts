import { describe, expect, it } from "vitest";
import {
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
  ATTACHMENT_ACCEPTED_TYPES,
  ATTACHMENT_ACCEPT_ATTR,
  CATEGORY_EMOJI,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_SELECT_CLASS,
  STATUS_LABELS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  isTicketCategory,
  isTicketPriority,
  isTicketStatus,
} from "@/lib/constants";
import {
  parseListParams,
  validateAttachments,
  validateCommentInput,
  validateLoginInput,
  validateSignupInput,
  validateTicketInput,
} from "@/lib/validation";

// The domain vocabulary + input guards. Every rule mirrors the reference
// app's form contract (categories, priorities, statuses) and the API's
// attachment limits.

describe("constants", () => {
  it("pins the six reference categories with emoji + labels", () => {
    expect([...TICKET_CATEGORIES]).toEqual([
      "hardware",
      "software",
      "network",
      "access",
      "email",
      "other",
    ]);
    // Session 6: the reference renders the emoji in its OWN span (gap-2
    // flex row) next to a plain label — the label map must be emoji-free
    // (the old emoji-prefixed values rendered "🖥️🖥️ Hardware Issue" in the
    // category trigger once the emoji span was added).
    expect(CATEGORY_LABELS.hardware).toBe("Hardware Issue");
    expect(CATEGORY_LABELS.other).toBe("Other");
    expect(CATEGORY_EMOJI.hardware).toBe("🖥️");
    expect(CATEGORY_EMOJI.other).toBe("📋");
    for (const label of Object.values(CATEGORY_LABELS)) {
      expect(label).not.toMatch(/[🖥️💿🌐🔐📧📋]/u);
    }
  });

  it("pins the four priorities and statuses", () => {
    expect([...TICKET_PRIORITIES]).toEqual(["low", "medium", "high", "urgent"]);
    expect([...TICKET_STATUSES]).toEqual(["open", "in_progress", "resolved", "closed"]);
    expect(PRIORITY_LABELS.urgent).toBe("Urgent - Critical");
    expect(STATUS_LABELS.in_progress).toBe("In Progress");
  });

  it("pins the per-priority select colors (session 6: reference renders each priority option + trigger value in its own color)", () => {
    expect(PRIORITY_SELECT_CLASS).toEqual({
      low: "text-slate-600",
      medium: "text-blue-600",
      high: "text-orange-600",
      urgent: "text-red-600",
    });
  });

  it("type-guards reject unknown values", () => {
    expect(isTicketStatus("open")).toBe(true);
    expect(isTicketStatus("deleted")).toBe(false);
    expect(isTicketPriority("")).toBe(false);
    expect(isTicketCategory("Hardware")).toBe(false); // case-sensitive
  });

  it("pins the attachment accept list incl. the reference's Word families (session 10)", () => {
    // The reference's picker accepts image/*,.pdf,.doc,.docx — ours missed
    // the Word families until session 10. The MIME list feeds the accept
    // attribute; svg stays excluded (XSS vector their wildcard permits).
    expect(ATTACHMENT_ACCEPTED_TYPES).toContain("application/msword");
    expect(ATTACHMENT_ACCEPTED_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    expect(ATTACHMENT_ACCEPTED_TYPES).toContain("image/png");
    expect(ATTACHMENT_ACCEPTED_TYPES).toContain("application/pdf");
    expect(ATTACHMENT_ACCEPTED_TYPES).not.toContain("image/svg+xml");
    // The picker attribute is derived from the same list — no drift.
    expect(ATTACHMENT_ACCEPT_ATTR).toContain(".docx");
    expect(ATTACHMENT_ACCEPT_ATTR).toContain(".pdf");
  });
});

describe("validateTicketInput", () => {
  const valid = {
    title: "Laptop battery not charging",
    description: "The battery drains even when plugged in.",
    category: "hardware",
    priority: "medium",
  };

  it("accepts a valid ticket", () => {
    expect(validateTicketInput(valid).ok).toBe(true);
  });

  it("requires a title of at least 5 characters", () => {
    const r = validateTicketInput({ ...valid, title: "no" });
    expect(r.ok).toBe(false);
    expect(r.errors.title).toBeDefined();
  });

  it("requires a description of at least 10 characters", () => {
    const r = validateTicketInput({ ...valid, description: "short" });
    expect(r.ok).toBe(false);
    expect(r.errors.description).toBeDefined();
  });

  it("rejects unknown category/priority values", () => {
    expect(validateTicketInput({ ...valid, category: "kitchen" }).ok).toBe(false);
    expect(validateTicketInput({ ...valid, priority: "meh" }).ok).toBe(false);
  });

  it("trims before validating", () => {
    const r = validateTicketInput({ ...valid, title: "   " });
    expect(r.ok).toBe(false);
  });
});

describe("validateCommentInput", () => {
  it("accepts a normal comment", () => {
    expect(validateCommentInput({ content: "Update: tried another charger." }).ok).toBe(true);
  });
  it("rejects empty and over-long comments", () => {
    expect(validateCommentInput({ content: "  " }).ok).toBe(false);
    expect(validateCommentInput({ content: "x".repeat(2001) }).ok).toBe(false);
  });
});

describe("validateSignupInput", () => {
  const valid = { email: "a@b.co", name: "Alice", password: "Passw0rd" };

  it("accepts a valid signup", () => {
    expect(validateSignupInput(valid).ok).toBe(true);
  });
  it("rejects bad emails", () => {
    expect(validateSignupInput({ ...valid, email: "not-an-email" }).ok).toBe(false);
  });
  it("requires 8+ chars with letters and numbers", () => {
    expect(validateSignupInput({ ...valid, password: "short1" }).ok).toBe(false);
    expect(validateSignupInput({ ...valid, password: "onlyletters" }).ok).toBe(false);
    expect(validateSignupInput({ ...valid, password: "12345678" }).ok).toBe(false);
  });
});

describe("validateLoginInput", () => {
  it("requires both fields with a valid email", () => {
    expect(validateLoginInput({ email: "a@b.co", password: "x" }).ok).toBe(true);
    expect(validateLoginInput({ email: "bad", password: "x" }).ok).toBe(false);
    expect(validateLoginInput({ email: "a@b.co", password: "" }).ok).toBe(false);
  });
});

describe("validateAttachments", () => {
  it("accepts within count/size limits", () => {
    expect(
      validateAttachments([
        { fileName: "a.png", mimeType: "image/png", sizeBytes: 1024 },
        { fileName: "b.pdf", mimeType: "application/pdf", sizeBytes: 2 * 1024 * 1024 },
      ]).ok,
    ).toBe(true);
  });
  it("rejects more than 3 files", () => {
    const files = Array.from({ length: 4 }, (_, i) => ({
      fileName: `f${i}.txt`,
      mimeType: "text/plain",
      sizeBytes: 10,
    }));
    expect(validateAttachments(files).ok).toBe(false);
  });
  it("rejects a file over 2 MiB", () => {
    expect(
      validateAttachments([
        { fileName: "big.png", mimeType: "image/png", sizeBytes: 2 * 1024 * 1024 + 1 },
      ]).ok,
    ).toBe(false);
  });
  it("rejects path-traversal file names", () => {
    expect(
      validateAttachments([{ fileName: "../evil.txt", mimeType: "text/plain", sizeBytes: 5 }]).ok,
    ).toBe(false);
  });
  it("rejects a mimeType outside the accepted list (s23: the server-side MIME guard)", () => {
    // The UI's accept attribute is a picker hint only; the seam must enforce
    // the closed allowlist or the download route serves attacker-chosen
    // content types inline from our origin (a stored-XSS surface).
    expect(
      validateAttachments([{ fileName: "evil.html", mimeType: "text/html", sizeBytes: 10 }]).ok,
    ).toBe(false);
    expect(
      validateAttachments([
        { fileName: "evil.exe", mimeType: "application/x-msdownload", sizeBytes: 10 },
      ]).ok,
    ).toBe(false);
    expect(
      validateAttachments([
        { fileName: "evil.js", mimeType: "application/javascript", sizeBytes: 10 },
      ]).ok,
    ).toBe(false);
  });
  it("accepts every MIME in the advertised accept list", () => {
    for (const mimeType of ATTACHMENT_ACCEPTED_TYPES) {
      expect(validateAttachments([{ fileName: "f.bin", mimeType, sizeBytes: 1 }]).ok).toBe(true);
    }
  });
});

describe("parseListParams (s24: the list-API pagination contract — limit/skip, the reference's measured param names)", () => {
  const parse = (qs: string) => parseListParams(new URLSearchParams(qs));

  it("defaults to the 200-ceiling / 0-skip when no params are sent", () => {
    const r = parse("");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ limit: LIST_DEFAULT_LIMIT, skip: 0 });
    }
  });

  it("honors limit and skip, alone and combined", () => {
    expect(parse("limit=5")).toMatchObject({ ok: true, value: { limit: 5, skip: 0 } });
    expect(parse("skip=10")).toMatchObject({ ok: true, value: { limit: LIST_DEFAULT_LIMIT, skip: 10 } });
    expect(parse("limit=25&skip=50")).toMatchObject({ ok: true, value: { limit: 25, skip: 50 } });
  });

  it("accepts the boundary values (limit 1 and 500, skip 0)", () => {
    expect(parse("limit=1")).toMatchObject({ ok: true, value: { limit: 1 } });
    expect(parse("limit=" + LIST_MAX_LIMIT)).toMatchObject({ ok: true, value: { limit: LIST_MAX_LIMIT } });
    expect(parse("skip=0")).toMatchObject({ ok: true, value: { skip: 0 } });
  });

  it("rejects limit=0, negative, over-ceiling, non-integer, and non-numeric values", () => {
    for (const qs of ["limit=0", "limit=-1", "limit=501", "limit=abc", "limit=1.5"]) {
      const r = parse(qs);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("limit must be an integer between 1 and " + LIST_MAX_LIMIT);
      }
    }
  });

  it("rejects negative and non-numeric skip values", () => {
    for (const qs of ["skip=-1", "skip=abc", "skip=1.5"]) {
      const r = parse(qs);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("skip must be a non-negative integer");
      }
    }
  });

  it("treats empty-string values as absent (an empty input renders as no param)", () => {
    expect(parse("limit=&skip=")).toMatchObject({
      ok: true,
      value: { limit: LIST_DEFAULT_LIMIT, skip: 0 },
    });
  });
});
