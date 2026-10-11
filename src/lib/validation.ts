// Ticket input validation — plain guards, no schema library needed at this
// surface area. Every rule mirrors the reference app's form contract and is
// unit-tested (tests/ticket-validation.test.ts).

import {
  ATTACHMENT_ACCEPTED_TYPES,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  isTicketCategory,
  isTicketPriority,
  isTicketStatus,
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
  LIST_SCOPE_OPTIONS,
  LIST_SORT_OPTIONS,
} from "./constants";

export interface TicketInput {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

export function validateTicketInput(input: Partial<TicketInput>): ValidationResult {
  const errors: Record<string, string> = {};

  const title = (input.title ?? "").trim();
  if (!title) errors.title = "Issue title is required";
  else if (title.length < 5) errors.title = "Issue title must be at least 5 characters";
  else if (title.length > 120) errors.title = "Issue title must be at most 120 characters";

  const description = (input.description ?? "").trim();
  if (!description) errors.description = "Description is required";
  else if (description.length < 10)
    errors.description = "Description must be at least 10 characters";
  else if (description.length > 5000)
    errors.description = "Description must be at most 5000 characters";

  if (!isTicketCategory(input.category)) errors.category = "Select a valid category";
  if (!isTicketPriority(input.priority)) errors.priority = "Select a valid priority";

  return { ok: Object.keys(errors).length === 0, errors };
}

export interface CommentInput {
  content: string;
}

export function validateCommentInput(input: Partial<CommentInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const content = (input.content ?? "").trim();
  if (!content) errors.content = "Comment cannot be empty";
  else if (content.length > 2000) errors.content = "Comment must be at most 2000 characters";
  return { ok: Object.keys(errors).length === 0, errors };
}

export interface SignupInput {
  email: string;
  name: string;
  password: string;
}

export function validateSignupInput(input: Partial<SignupInput>): ValidationResult {
  const errors: Record<string, string> = {};
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email";

  const name = (input.name ?? "").trim();
  if (!name) errors.name = "Name is required";
  else if (name.length > 80) errors.name = "Name must be at most 80 characters";

  const password = input.password ?? "";
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    errors.password = "Password must contain letters and numbers";

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateLoginInput(input: Partial<{ email: string; password: string }>): ValidationResult {
  const errors: Record<string, string> = {};
  const email = (input.email ?? "").trim().toLowerCase();
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email";
  if (!input.password) errors.password = "Password is required";
  return { ok: Object.keys(errors).length === 0, errors };
}

export interface RawAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export function validateAttachments(
  files: RawAttachment[],
): { ok: true } | { ok: false; error: string } {
  if (files.length > ATTACHMENT_MAX_COUNT) {
    return { ok: false, error: `At most ${ATTACHMENT_MAX_COUNT} files can be attached` };
  }
  for (const f of files) {
    if (f.sizeBytes > ATTACHMENT_MAX_BYTES) {
      return { ok: false, error: `"${f.fileName}" exceeds the 2 MB per-file limit` };
    }
    if (!f.fileName || f.fileName.length > 200 || /[\\/]/.test(f.fileName)) {
      return { ok: false, error: `"${f.fileName}" has an invalid file name` };
    }
    // Session 23: the closed MIME allowlist is enforced HERE, not in the
    // picker — the accept attribute is a hint a user can bypass, and the
    // download route serves the stored content type inline (a stored-XSS
    // surface if an attacker-chosen type can be stored via the API).
    if (!ATTACHMENT_ACCEPTED_TYPES.includes(f.mimeType)) {
      return { ok: false, error: `"${f.fileName}" has an unsupported file type` };
    }
  }
  return { ok: true };
}

export interface ListParams {
  limit: number;
  skip: number;
}

// Session 24: the list-API pagination contract — `limit`/`skip` are the
// reference entity API's measured param names (its `offset` is not
// supported and yields an empty result). Our default ceiling (200) is the
// deliberate DoS-safety superset over their unbounded default; garbage
// values REJECT with 400 (the strict-validation doctrine — their platform
// silently ignores unknown params, ours never does). Empty-string values
// read as absent (an empty form input renders as a bare param).
export function parseListParams(
  searchParams: URLSearchParams,
): { ok: true; value: ListParams } | { ok: false; error: string } {
  let limit = LIST_DEFAULT_LIMIT;
  let skip = 0;

  const rawLimit = searchParams.get("limit");
  if (rawLimit !== null && rawLimit !== "") {
    const n = Number(rawLimit);
    if (!Number.isInteger(n) || n < 1 || n > LIST_MAX_LIMIT) {
      return { ok: false, error: `limit must be an integer between 1 and ${LIST_MAX_LIMIT}` };
    }
    limit = n;
  }

  const rawSkip = searchParams.get("skip");
  if (rawSkip !== null && rawSkip !== "") {
    const n = Number(rawSkip);
    if (!Number.isInteger(n) || n < 0) {
      return { ok: false, error: "skip must be a non-negative integer" };
    }
    skip = n;
  }

  return { ok: true, value: { limit, skip } };
}

export interface ListFilters {
  status?: import("./constants").TicketStatus;
  priority?: import("./constants").TicketPriority;
  sort: import("./constants").ListSort;
  scope: import("./constants").ListScope;
}

// Session 25: the list-API filter-vocabulary contract — the s24
// strict-validation doctrine extended from limit/skip to the whole list
// route. The four filter params accept ONLY their documented vocabulary;
// out-of-vocabulary values REJECT with 400 + a message naming the allowed
// set (the reference's platform silently ignores unknown param values —
// measured: ?sort=banana on their API returns the default order — ours
// never does). Empty-string values read as absent (the s24 convention);
// the UI's "All Status"/"All Priorities" select values are UI-only state
// that OMITS the param — "all" is not an API value and rejects like any
// other out-of-vocabulary input.
export function parseListFilters(
  searchParams: URLSearchParams,
): { ok: true; value: ListFilters } | { ok: false; error: string } {
  let sort: ListFilters["sort"] = "newest";
  let scope: ListFilters["scope"] = "mine";

  const rawStatus = searchParams.get("status");
  if (rawStatus !== null && rawStatus !== "" && !isTicketStatus(rawStatus)) {
    return { ok: false, error: "status must be one of: open, in_progress, resolved, closed" };
  }

  const rawPriority = searchParams.get("priority");
  if (rawPriority !== null && rawPriority !== "" && !isTicketPriority(rawPriority)) {
    return { ok: false, error: "priority must be one of: low, medium, high, urgent" };
  }

  const rawSort = searchParams.get("sort");
  if (rawSort !== null && rawSort !== "" && !(LIST_SORT_OPTIONS as readonly string[]).includes(rawSort)) {
    return { ok: false, error: "sort must be one of: newest, oldest, priority" };
  }
  if (rawSort) sort = rawSort as ListFilters["sort"];

  const rawScope = searchParams.get("scope");
  if (rawScope !== null && rawScope !== "" && !(LIST_SCOPE_OPTIONS as readonly string[]).includes(rawScope)) {
    return { ok: false, error: "scope must be one of: mine, all" };
  }
  if (rawScope) scope = rawScope as ListFilters["scope"];

  return {
    ok: true,
    value: {
      ...(rawStatus ? { status: rawStatus as ListFilters["status"] } : {}),
      ...(rawPriority ? { priority: rawPriority as ListFilters["priority"] } : {}),
      sort,
      scope,
    },
  };
}
