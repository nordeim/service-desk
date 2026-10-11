// ServiceDesk domain constants — the single source of truth for the ticket
// vocabulary. SQLite has no enums, so these validated string unions are the
// contract between the API layer, the UI badges, and the tests.

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = [
  "hardware",
  "software",
  "network",
  "access",
  "email",
  "other",
] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

/** Label shown in dropdowns (matches the reference app's copy). */
export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  // Emoji-free labels (session 6): the reference renders the emoji in its
  // OWN span (flex gap-2) next to a plain label — both in the dropdown
  // options and the trigger value. Emoji-prefixed values here rendered
  // "🖥️🖥️ Hardware Issue" once the emoji span was added (the session-6
  // double-emoji bug).
  hardware: "Hardware Issue",
  software: "Software Issue",
  network: "Network/Internet",
  access: "Access/Permissions",
  email: "Email Issue",
  other: "Other",
};

/** Emoji tile rendered on ticket cards / detail pages. */
export const CATEGORY_EMOJI: Record<TicketCategory, string> = {
  hardware: "🖥️",
  software: "💿",
  network: "🌐",
  access: "🔐",
  email: "📧",
  other: "📋",
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low - Can wait",
  medium: "Medium - Normal",
  high: "High - Important",
  urgent: "Urgent - Critical",
};

/**
 * Per-priority text color for the submit form's priority select (session 6,
 * live-measured on the reference): each dropdown OPTION and the TRIGGER value
 * render in the priority's own color. The mytickets priority FILTER options
 * stay plain — the reference renders those without color.
 */
export const PRIORITY_SELECT_CLASS: Record<TicketPriority, string> = {
  low: "text-slate-600",
  medium: "text-blue-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  closed: "Closed",
};

export function isTicketStatus(v: unknown): v is TicketStatus {
  return typeof v === "string" && (TICKET_STATUSES as readonly string[]).includes(v);
}

export function isTicketPriority(v: unknown): v is TicketPriority {
  return typeof v === "string" && (TICKET_PRIORITIES as readonly string[]).includes(v);
}

export function isTicketCategory(v: unknown): v is TicketCategory {
  return typeof v === "string" && (TICKET_CATEGORIES as readonly string[]).includes(v);
}

/** Sort weight for priority ordering (higher = more urgent). */
export const PRIORITY_WEIGHT: Record<TicketPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
  urgent: 3,
};

/** Attachment limits enforced by the API (mirrored in the UI copy). */
export const ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB per file
export const ATTACHMENT_MAX_COUNT = 3;
export const ATTACHMENT_ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/zip",
];
// Session 10: the reference's picker accepts image/*,.pdf,.doc,.docx — the
// Word families were missing from ours (a .docx they accept was hidden by
// our file picker). Kept as a precise extension list rather than their
// image/* wildcard: svg stays excluded (an XSS vector the wildcard permits).
// Derived here so the picker attribute and the accepted-type list cannot
// drift apart again.
export const ATTACHMENT_ACCEPT_ATTR =
  ".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.md,.csv,.json,.zip";

/**
 * List-API pagination (session 24). The reference's entity APIs page with
 * `limit` + `skip` (their measured param names — `offset` is NOT supported
 * and yields `[]`); their DEFAULT is unbounded (all 121 tickets in one
 * response). Our default ceiling is the deliberate DoS-safety superset — a
 * cap without params would be a silent truncation, so the escape hatch ships
 * with the ceiling: callers can page the full corpus with limit (≤ 500) and
 * skip (≥ 0).
 */
export const LIST_DEFAULT_LIMIT = 200;
export const LIST_MAX_LIMIT = 500;

/**
 * List-API filter vocabularies (session 25). The strict-validation doctrine
 * (s24, applied there to limit/skip) extended to the whole list route: the
 * four filter params accept ONLY these values; out-of-vocabulary input
 * rejects with 400 + a message naming the allowed set, never a silent
 * default. The reference's platform silently ignores unknown param values
 * (measured s24/s25) — ours never does.
 *
 * - `sort` — the mytickets UI's sort control (the superset feature; the
 *   reference ships no sort UI and its entity API's own sort vocabulary —
 *   `created_date`/`-created_date` — is platform exhaust we deliberately do
 *   not adopt).
 * - `scope` — the My/All feed toggle (the documented superset over their
 *   admin-leak /alltickets surface, s24 F1).
 */
export const LIST_SORT_OPTIONS = ["newest", "oldest", "priority"] as const;
export type ListSort = (typeof LIST_SORT_OPTIONS)[number];

export const LIST_SCOPE_OPTIONS = ["mine", "all"] as const;
export type ListScope = (typeof LIST_SCOPE_OPTIONS)[number];

/**
 * The list-API query-param grammar (session 27). The strict-validation
 * doctrine completed at the SET level: these seven names are the ONLY
 * query params GET /api/tickets accepts. An unknown name rejects with
 * 400 + a message naming it and the allowed set; a name appearing more
 * than once rejects with 400 too (a duplicate is a caller bug — the
 * first-vs-last ambiguity is resolved honestly by refusing to pick).
 * Before s27 the unknown/duplicate surface was silently ignored
 * (measured live: `?banana=1` and `?category=hardware` returned the
 * unfiltered feed presented as matches — the s25 lesson-79 class, the
 * last open seam after the value families were closed: pagination s24,
 * vocabularies s25, free text s26).
 */
export const LIST_QUERY_PARAMS = [
  "search",
  "status",
  "priority",
  "sort",
  "scope",
  "limit",
  "skip",
] as const;
export type ListQueryParam = (typeof LIST_QUERY_PARAMS)[number];

/**
 * List-API search cap (session 26). The `search` param is free text — not a
 * vocabulary — but the s25 lesson applies verbatim: every param family needs
 * the same explicit strictness decision. A search term is capped at 200
 * characters (the title cap's scale — a term longer than any title matches
 * nothing); beyond it the API rejects with 400 + a self-documenting message
 * instead of running a wasteful unbounded pattern. The mytickets search input
 * mirrors the cap (`maxLength`) so the UI can never hit it. The semantics
 * contract (also s26): search is a LITERAL case-insensitive substring match —
 * `%` and `_` carry no wildcard meaning (the reference's measured client-side
 * `.toLowerCase().includes()` semantics), enforced at the route with an
 * `instr(lower(col), lower(?))` predicate because Prisma's SQLite `contains`
 * compiles to a bare `LIKE` with no `ESCAPE` clause (measured s26: a literal
 * `%` in the user's search silently matched the whole unfiltered feed).
 */
export const SEARCH_MAX_LENGTH = 200;

/**
 * The write-route request-BODY grammars (session 32). The s27 param-set
 * doctrine extended from the query level to the BODY level: every write
 * route accepts exactly its documented top-level field set, and an unknown
 * field rejects with 400 + a self-documenting message naming the field and
 * the allowed set. Before s32 the surface was silently open (measured live
 * on every write route: a create carrying `banana:1` stored the ticket, a
 * login carrying `banana` logged in — the body-level variant of the s25
 * lesson-79 class; the reference's platform silently DROPS unknown body
 * keys, the Pydantic ignore-extras default). Cross-route shapes are the
 * catch: a client-sent `status` on the CREATE route (the PATCH shape) or
 * a `name` on the LOGIN route (the signup shape) now rejects at the
 * grammar level instead of being silently ignored. The s23 server-
 * controlled-status contract carries forward on the happy path: a bare
 * create still 201s with `status: "open"`.
 *
 * Scope decisions (documented in docs/remediation-plan-session32.md):
 * non-object bodies pass the grammar through (the existing value-level
 * validators already 400 them — measured: array/null bodies reject);
 * nested keys inside attachment objects are narrowed-by-mapping (the
 * route's normalizer rebuilds each row field-by-field, so nothing
 * unknown is ever stored); GET/DELETE routes consume no body.
 */
export const TICKET_CREATE_BODY_FIELDS = [
  "title",
  "description",
  "category",
  "priority",
  "attachments",
] as const;
export const TICKET_PATCH_BODY_FIELDS = ["status"] as const;
export const COMMENT_CREATE_BODY_FIELDS = ["content"] as const;
export const LOGIN_BODY_FIELDS = ["email", "password"] as const;
export const SIGNUP_BODY_FIELDS = ["email", "name", "password"] as const;
export const FORGOT_PASSWORD_BODY_FIELDS = ["email"] as const;
