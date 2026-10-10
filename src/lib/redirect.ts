// Session 19 (F1): the auth-gate deep-link seam. The reference preserves the
// user's pre-auth destination via /login?from_url=<absolute url> and returns
// them to that page after sign-in. safeRedirectTarget turns the raw from_url
// param into a safe INTERNAL navigation target — the open-redirect guard the
// reference's platform doesn't need (their from_url is platform-generated)
// but our user-suppliable param does.
//
// Contract (unit-pinned in src/lib/__tests__/redirect.test.ts):
//   - missing/empty param            → "/dashboard" (the post-login default)
//   - same-origin absolute URL       → its pathname + search (hash dropped)
//   - relative internal path         → itself (query preserved)
//   - cross-origin absolute URL      → "/dashboard" (open-redirect guard)
//   - protocol-relative "//evil"     → "/dashboard"
//   - auth-page targets (/login,
//     /signup, /forgotpassword)      → "/dashboard" (login-loop prevention)
//   - unparseable input              → "/dashboard"
export function safeRedirectTarget(
  raw: string | null | undefined,
  origin: string
): string {
  const fallback = "/dashboard";
  if (!raw) return fallback;

  let url: URL;
  try {
    // The base handles both absolute URLs and bare relative paths.
    url = new URL(raw, origin);
  } catch {
    return fallback;
  }

  // Same-origin only: an absolute URL on another origin (or a look-alike
  // host like localhost:3000.evil.com) must not leak the redirect.
  if (url.origin !== origin) return fallback;

  const path = url.pathname;
  // Defense in depth: protocol-relative inputs already fail the origin
  // check, and every parsed pathname starts with "/" by construction —
  // but "//" path prefixes are the classic bypass shape, so reject them
  // explicitly.
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;

  // Never redirect back onto an auth page — a from_url pointing at /login
  // (or the signup / forgotpassword supersets) would loop the user straight
  // back into the card they just escaped.
  if (path === "/login" || path === "/signup" || path === "/forgotpassword") {
    return fallback;
  }

  // The query is part of the deep link (the ticketdetails ?id= case);
  // the hash is client-side-only state and never a server target.
  return path + url.search;
}
