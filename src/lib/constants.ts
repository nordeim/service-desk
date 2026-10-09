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
  hardware: "🖥️ Hardware Issue",
  software: "💿 Software Issue",
  network: "🌐 Network/Internet",
  access: "🔐 Access/Permissions",
  email: "📧 Email Issue",
  other: "📋 Other",
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
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "application/zip",
];
