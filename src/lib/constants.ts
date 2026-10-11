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
