import { describe, expect, it } from "vitest";
import {
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
  LIST_SCOPE_OPTIONS,
  LIST_SORT_OPTIONS,
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
  LIST_QUERY_PARAMS,
  COMMENT_CREATE_BODY_FIELDS,
  FORGOT_PASSWORD_BODY_FIELDS,
  LOGIN_BODY_FIELDS,
  SIGNUP_BODY_FIELDS,
  TICKET_CREATE_BODY_FIELDS,
  TICKET_PATCH_BODY_FIELDS,
  isTicketCategory,
  isTicketPriority,
  isTicketStatus,
} from "@/lib/constants";
import {
  parseBodyKeys,
  parseListFilters,
  parseListParams,
  parseListQuery,
  parseListSearch,
  parseNoQuery,
  parseStatsQuery,
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
        {
          fileName: "a.png",
          mimeType: "image/png",
          sizeBytes: 1024,
          data: Buffer.alloc(1024, 65).toString("base64"),
        },
        {
          fileName: "b.pdf",
          mimeType: "application/pdf",
          sizeBytes: 2 * 1024 * 1024,
          data: Buffer.alloc(2 * 1024 * 1024, 66).toString("base64"),
        },
      ]).ok,
    ).toBe(true);
  });
  it("rejects more than 3 files", () => {
    const files = Array.from({ length: 4 }, (_, i) => ({
      fileName: `f${i}.txt`,
      mimeType: "text/plain",
      sizeBytes: 10,
      data: "",
    }));
    expect(validateAttachments(files).ok).toBe(false);
  });
  it("rejects a file over 2 MiB", () => {
    expect(
      validateAttachments([
        { fileName: "big.png", mimeType: "image/png", sizeBytes: 2 * 1024 * 1024 + 1, data: "" },
      ]).ok,
    ).toBe(false);
  });
  it("rejects path-traversal file names", () => {
    expect(
      validateAttachments([{ fileName: "../evil.txt", mimeType: "text/plain", sizeBytes: 5, data: "" }]).ok,
    ).toBe(false);
  });
  it("rejects a mimeType outside the accepted list (s23: the server-side MIME guard)", () => {
    // The UI's accept attribute is a picker hint only; the seam must enforce
    // the closed allowlist or the download route serves attacker-chosen
    // content types inline from our origin (a stored-XSS surface).
    expect(
      validateAttachments([{ fileName: "evil.html", mimeType: "text/html", sizeBytes: 10, data: "" }]).ok,
    ).toBe(false);
    expect(
      validateAttachments([
        { fileName: "evil.exe", mimeType: "application/x-msdownload", sizeBytes: 10, data: "" },
      ]).ok,
    ).toBe(false);
    expect(
      validateAttachments([
        { fileName: "evil.js", mimeType: "application/javascript", sizeBytes: 10, data: "" },
      ]).ok,
    ).toBe(false);
  });
  it("accepts every MIME in the advertised accept list", () => {
    for (const mimeType of ATTACHMENT_ACCEPTED_TYPES) {
      expect(
        validateAttachments([{ fileName: "f.bin", mimeType, sizeBytes: 1, data: "QQ==" }]).ok,
      ).toBe(true);
    }
  });
  it("s35: rejects a data payload that does not match its declared size (the divergence probe)", () => {
    // Measured live pre-fix: sizeBytes 11 declared + ~100 KB actual base64
    // → 201 stored — the per-file cap checked the DECLARED number (attacker
    // controlled) while the payload was stored unchecked. The honesty
    // contract: the declared size must be the true size.
    const hundredKb = Buffer.alloc(100 * 1024, 65).toString("base64");
    const r = validateAttachments([
      { fileName: "lie.txt", mimeType: "text/plain", sizeBytes: 11, data: hundredKb },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("does not match its declared size");
  });
  it("s35: rejects a non-canonical encoded payload (the garbage-base64 form hole)", () => {
    // Measured live pre-fix: 1 MB of '!' chars decodes to 0 bytes — with
    // sizeBytes: 0 a decoded-length-equality check alone passes (0 === 0)
    // while megabytes of garbage are stored verbatim. Node's decoder
    // silently DROPS non-alphabet characters, so the FORM must be checked:
    // canonical base64 (alphabet + 0-2 trailing pads) only.
    const garbage = "!".repeat(1024 * 1024);
    const r = validateAttachments([
      { fileName: "g.bin", mimeType: "text/plain", sizeBytes: 0, data: garbage },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("invalid encoded payload");
  });
  it("s35: rejects an overlong canonical payload via the declared-size interplay", () => {
    // An alphabet-only payload decoding past 2 MiB can only pass the
    // equality with a declared sizeBytes over the cap — which the first
    // guard already rejects; the direct path (declared within cap, payload
    // honest) is the accept-boundary test below.
    const overlong = "A".repeat(4 * Math.ceil((2 * 1024 * 1024 + 3) / 3));
    const r = validateAttachments([
      { fileName: "big.bin", mimeType: "text/plain", sizeBytes: 2 * 1024 * 1024 + 3, data: overlong },
    ]);
    expect(r.ok).toBe(false);
  });
  it("s35: accepts the honest boundary — a full 2 MiB attachment as canonical base64", () => {
    const twoMiB = 2 * 1024 * 1024;
    const r = validateAttachments([
      {
        fileName: "legit.txt",
        mimeType: "text/plain",
        sizeBytes: twoMiB,
        data: Buffer.alloc(twoMiB, 65).toString("base64"),
      },
    ]);
    expect(r.ok).toBe(true);
  });
  it("s35: rejects a zero-byte payload declared as non-zero (the empty-data lie)", () => {
    const r = validateAttachments([
      { fileName: "empty.txt", mimeType: "text/plain", sizeBytes: 10, data: "" },
    ]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("does not match its declared size");
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

describe("parseListFilters (s25: the list-API filter vocabulary — status/priority/sort/scope, the strict-validation doctrine extended to the whole list route)", () => {
  const parse = (qs: string) => parseListFilters(new URLSearchParams(qs));

  it("returns the documented defaults when no filter params are present", () => {
    expect(parse("")).toMatchObject({
      ok: true,
      value: { sort: "newest", scope: "mine" },
    });
    const r = parse("");
    if (r.ok) {
      expect(r.value.status).toBeUndefined();
      expect(r.value.priority).toBeUndefined();
    }
  });

  it("honors valid status and priority values", () => {
    for (const status of TICKET_STATUSES) {
      expect(parse(`status=${status}`)).toMatchObject({
        ok: true,
        value: { status },
      });
    }
    for (const priority of TICKET_PRIORITIES) {
      expect(parse(`priority=${priority}`)).toMatchObject({
        ok: true,
        value: { priority },
      });
    }
  });

  it("honors valid sort and scope values and combines all four params", () => {
    for (const sort of LIST_SORT_OPTIONS) {
      expect(parse(`sort=${sort}`)).toMatchObject({ ok: true, value: { sort } });
    }
    for (const scope of LIST_SCOPE_OPTIONS) {
      expect(parse(`scope=${scope}`)).toMatchObject({ ok: true, value: { scope } });
    }
    expect(parse("status=open&priority=urgent&sort=oldest&scope=all")).toMatchObject({
      ok: true,
      value: { status: "open", priority: "urgent", sort: "oldest", scope: "all" },
    });
  });

  it("rejects out-of-vocabulary status values (the UI's all sentinel is NOT an API value — the UI omits the param)", () => {
    for (const qs of ["status=banana", "status=all", "status=Resloved", "status=in-progress"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("status must be one of: open, in_progress, resolved, closed");
      }
    }
  });

  it("rejects out-of-vocabulary priority values", () => {
    for (const qs of ["priority=banana", "priority=all", "priority=ultra-critical"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("priority must be one of: low, medium, high, urgent");
      }
    }
  });

  it("rejects out-of-vocabulary sort values", () => {
    for (const qs of ["sort=banana", "sort=created_date", "sort=-created_date"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("sort must be one of: newest, oldest, priority");
      }
    }
  });

  it("rejects out-of-vocabulary scope values", () => {
    for (const qs of ["scope=banana", "scope=admin", "scope=mine tickets"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("scope must be one of: mine, all");
      }
    }
  });

  it("treats empty-string values as absent (the s24 convention — an empty input renders as no param)", () => {
    expect(parse("status=&priority=&sort=&scope=")).toMatchObject({
      ok: true,
      value: { sort: "newest", scope: "mine" },
    });
  });
});

describe("parseListSearch (s26: the literal-search contract — free text, trimmed, capped; the last unaudited param family on the list route)", () => {
  const parse = (qs: string) => parseListSearch(new URLSearchParams(qs));

  it("returns the empty string when the param is absent (no search)", () => {
    const r = parse("");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("");
  });

  it("trims to absent on whitespace-only input (the s24 empty-string-as-absent convention)", () => {
    const r = parse("search=%20%20%20"); // "   " URL-encoded
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("");
  });

  it("trims surrounding whitespace from the value", () => {
    const r = parse("search=%20%20Outlook%20%20"); // "  Outlook  "
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("Outlook");
  });

  it("accepts a value at exactly the cap (200 characters)", () => {
    const r = parse(`search=${"a".repeat(200)}`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toHaveLength(200);
  });

  it("rejects a value beyond the cap with the exact message", () => {
    for (const qs of [`search=${"a".repeat(201)}`, `search=${"a".repeat(250)}`]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("search must be at most 200 characters");
      }
    }
  });

  it("passes wildcard-bearing values through UNTOUCHED (the literal contract — the seam validates, it does not mangle)", () => {
    for (const raw of ["%", "_", "%signature%", "100% CPU", "file_name.txt", "50%_off"]) {
      const r = parse(`search=${encodeURIComponent(raw)}`);
      expect(r.ok, raw).toBe(true);
      if (r.ok) expect(r.value).toBe(raw);
    }
  });
});

describe("parseListQuery (s27: the strict param-set contract — the route's query grammar closed: unknown names rejected, duplicates rejected)", () => {
  const parse = (qs: string) => parseListQuery(new URLSearchParams(qs));

  it("accepts the no-param request (the default view)", () => {
    const r = parse("");
    expect(r.ok).toBe(true);
  });

  it("accepts every known param name (the closed set of seven)", () => {
    for (const name of LIST_QUERY_PARAMS) {
      const r = parse(`${name}=x`);
      expect(r.ok, name).toBe(true);
    }
  });

  it("accepts all seven known params at once (the composition the route documents)", () => {
    const r = parse("search=Outlook&status=resolved&priority=low&sort=newest&scope=mine&limit=5&skip=0");
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown param name with the exact message naming it and the allowed set", () => {
    for (const qs of ["banana=1", "category=hardware", "q=%7B%7D", "fields=id", "sort_dir=desc"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("unknown query parameter");
        expect(r.error).toContain(qs.split("=")[0]);
        expect(r.error).toContain("search, status, priority, sort, scope, limit, skip");
      }
    }
  });

  it("rejects an unknown param even when known params are present alongside it", () => {
    const r = parse("status=open&banana=1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown query parameter: banana");
  });

  it("rejects a duplicate param with the exact message (the first-vs-last ambiguity resolved honestly)", () => {
    for (const qs of [
      "status=open&status=resolved",
      "limit=2&limit=5",
      "search=a&search=b",
      "sort=newest&sort=oldest&sort=priority",
    ]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) expect(r.error).toContain("duplicate query parameter");
    }
  });

  it("accepts the s25 empty-string convention for KNOWN names (empty-as-absent is a value question, not a grammar question)", () => {
    const r = parse("status=&priority=&sort=&scope=");
    expect(r.ok).toBe(true);
  });
});

describe("parseStatsQuery (s28: the stats empty-grammar contract — the param-less route's cross-route confusion closed)", () => {
  const parse = (qs: string) => parseStatsQuery(new URLSearchParams(qs));

  it("accepts the no-param request (the only legal call — the sidebar + dashboard mount fetches)", () => {
    const r = parse("");
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown param name with the exact message naming it and the no-params contract", () => {
    for (const qs of ["banana=1", "fields=id", "force=1"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("unknown query parameter");
        expect(r.error).toContain(qs.split("=")[0]);
        expect(r.error).toContain("this endpoint takes no query parameters");
      }
    }
  });

  it("rejects the real sibling-route param names — the cross-route confusion pin (scope/status/limit are real params on /api/tickets, not here)", () => {
    for (const qs of ["scope=mine", "status=open&limit=5", "search=VPN", "sort=newest", "skip=0"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) expect(r.error).toContain("unknown query parameter");
    }
  });

  it("rejects an empty value too — the grammar precedes the value (an empty ?status= is still an unknown NAME here; there are no known names)", () => {
    const r = parse("status=");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown query parameter: status");
  });

  it("rejects a duplicated param with the unknown message — on an empty grammar the unknown subsumes the duplicate (the caller must drop the param, not dedupe it)", () => {
    const r = parse("scope=a&scope=b");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("unknown query parameter: scope");
      expect(r.error).toContain("this endpoint takes no query parameters");
    }
  });
});

describe("parseNoQuery (s29: the shared empty-grammar contract — every remaining route's query grammar closed API-wide)", () => {
  const parse = (qs: string) => parseNoQuery(new URLSearchParams(qs));

  it("accepts the no-param request (the only legal call — every UI/E2E/smoke caller is bare)", () => {
    const r = parse("");
    expect(r.ok).toBe(true);
  });

  it("rejects an unknown param name with the exact message naming it and the no-params contract", () => {
    for (const qs of ["banana=1", "_t=123", "fields=id"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("unknown query parameter");
        expect(r.error).toContain(qs.split("=")[0]);
        expect(r.error).toContain("this endpoint takes no query parameters");
      }
    }
  });

  it("rejects the real sibling-route param names — the cross-route confusion pin (scope/status/search are real params on /api/tickets, not on any of these routes)", () => {
    for (const qs of ["scope=mine", "status=open&limit=5", "search=VPN", "sort=newest"]) {
      const r = parse(qs);
      expect(r.ok, qs).toBe(false);
      if (!r.ok) expect(r.error).toContain("unknown query parameter");
    }
  });

  it("rejects an empty value too — the grammar precedes the value (an empty ?status= is still an unknown NAME here; there are no known names)", () => {
    const r = parse("status=");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown query parameter: status");
  });

  it("rejects a duplicated param with the unknown message — the unknown subsumes the duplicate (the caller must drop the param, not dedupe it)", () => {
    const r = parse("scope=a&scope=b");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("unknown query parameter: scope");
      expect(r.error).toContain("this endpoint takes no query parameters");
    }
  });

  it("names the first offending param when several are present", () => {
    const r = parse("banana=1&apple=2");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown query parameter: banana");
  });

  it("matches the s28 parseStatsQuery contract exactly (the stats seam delegates to the shared seam — one message, one behavior)", () => {
    for (const qs of ["", "banana=1", "scope=mine", "status="]) {
      const shared = parseNoQuery(new URLSearchParams(qs));
      const stats = parseStatsQuery(new URLSearchParams(qs));
      expect(stats.ok, qs).toBe(shared.ok);
      if (!shared.ok && !stats.ok) expect(stats.error).toBe(shared.error);
    }
  });
});

describe("parseBodyKeys (s32: the request-body grammar contract — the s27 param-set doctrine at the body level)", () => {
  it("rejects an unknown top-level field with the self-documenting message", () => {
    const r = parseBodyKeys(
      { title: "x", description: "y", category: "software", priority: "low", banana: 1 },
      TICKET_CREATE_BODY_FIELDS,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBe(
        "unknown request-body field: banana (allowed: title, description, category, priority, attachments)",
      );
    }
  });

  it("names the first offending field when several are present", () => {
    const r = parseBodyKeys({ banana: 1, apple: 2 }, LOGIN_BODY_FIELDS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown request-body field: banana");
  });

  it("passes a body whose keys are all in the allowed set", () => {
    const r = parseBodyKeys(
      { title: "x", description: "y", category: "software", priority: "low", attachments: [] },
      TICKET_CREATE_BODY_FIELDS,
    );
    expect(r.ok).toBe(true);
  });

  it("passes a subset body (every field is optional at the grammar level — the value level owns requiredness)", () => {
    const r = parseBodyKeys({ title: "x" }, TICKET_CREATE_BODY_FIELDS);
    expect(r.ok).toBe(true);
  });

  it("passes an empty object", () => {
    const r = parseBodyKeys({}, LOGIN_BODY_FIELDS);
    expect(r.ok).toBe(true);
  });

  it("passes non-object bodies through (the existing value-level validators own them)", () => {
    for (const body of [null, undefined, ["array"], "string", 42]) {
      expect(parseBodyKeys(body, LOGIN_BODY_FIELDS).ok, JSON.stringify(body)).toBe(true);
    }
  });

  it("pins each route's allowed set (the six write-route grammars)", () => {
    expect([...TICKET_CREATE_BODY_FIELDS]).toEqual([
      "title",
      "description",
      "category",
      "priority",
      "attachments",
    ]);
    expect([...TICKET_PATCH_BODY_FIELDS]).toEqual(["status"]);
    expect([...COMMENT_CREATE_BODY_FIELDS]).toEqual(["content"]);
    expect([...LOGIN_BODY_FIELDS]).toEqual(["email", "password"]);
    expect([...SIGNUP_BODY_FIELDS]).toEqual(["email", "name", "password"]);
    expect([...FORGOT_PASSWORD_BODY_FIELDS]).toEqual(["email"]);
  });

  it("rejects the cross-route shape: a client-sent status on the CREATE route (the s23 pin's evolved grammar)", () => {
    const r = parseBodyKeys(
      { title: "x", description: "y", category: "software", priority: "low", status: "resolved" },
      TICKET_CREATE_BODY_FIELDS,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown request-body field: status");
  });

  it("rejects a login body carrying a signup-route field (the cross-route confusion variant)", () => {
    const r = parseBodyKeys({ email: "a@b.co", password: "x", name: "Extra" }, LOGIN_BODY_FIELDS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("unknown request-body field: name");
  });
});
