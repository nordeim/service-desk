import { expect, test } from "@playwright/test";

// Logged-out surface: the login page's form contract, then the sign-in and
// sign-up happy paths plus a wrong-password check. This file opts OUT of the
// shared authenticated storageState (auth endpoints are rate-limited — the
// real login attempts here stay well under the 10/15-min budget).

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("renders the reference login card", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Welcome to ServiceDesk" })).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    // Session 10: the reference's footer controls are BUTTONS that swap the
    // card in place (in-card reset/signup views) — no navigation.
    await expect(page.getByRole("button", { name: "Forgot password?" })).toBeVisible();
    // Session 6: the reference renders the WHOLE "Need an account? Sign up"
    // line as one control — the button's accessible name is the full line.
    await expect(page.getByRole("button", { name: /Need an account\?\s*Sign up/ })).toBeVisible();
  });

  test("rejects a wrong password with a visible error", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("DefinitelyWrong1");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    // Scoped to our error <p>: Next.js also injects a route-announcer div
    // with role=alert, so the bare role locator is ambiguous.
    await expect(page.locator('p[role="alert"]')).toContainText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login$/);
  });

  test("signs the demo user in and lands on the dashboard", async ({ page }) => {
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });

  test("unauthenticated /dashboard bounces to /login carrying the from_url deep link", async ({ page }) => {
    await page.goto("/dashboard");
    // Session 19 (F1): the reference's auth gate preserves the intended
    // destination — their SPA redirects to /login?from_url=<absolute url>
    // and signs the user back INTO that page after login. Our proxy now
    // decorates the bounce the same way (the old plain /login redirect
    // discarded the deep link).
    await page.waitForURL(/\/login\?from_url=/);
    const from = page.url().match(/from_url=([^&]*)/)?.[1];
    expect(from, "from_url param present").toBeTruthy();
    expect(decodeURIComponent(from ?? "")).toBe(
      "http://localhost:3100/dashboard"
    );
  });

  // Session 19 (F1): the strongest deep-link case — a shared ticket URL
  // opened while logged out must survive the auth gate: sign in from the
  // from_url-bearing login and land back ON the same URL. A NONEXISTENT
  // ticket id suffices — the proxy bounce precedes any data fetch, and the
  // landing assertion is about the URL (the page then renders the s10
  // not-found Alert, re-confirming that contract in the logged-in state).
  // This is the ONE new real login in the suite (7 of the 10/15-min total).
  test("signing in from a ticket-details deep link returns to the same URL", async ({ page }) => {
    await page.goto("/ticketdetails?id=e2e-nonexistent");
    await page.waitForURL(/\/login\?from_url=/);
    expect(
      decodeURIComponent(page.url().match(/from_url=([^&]*)/)?.[1] ?? "")
    ).toBe("http://localhost:3100/ticketdetails?id=e2e-nonexistent");

    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/ticketdetails?id=e2e-nonexistent");
    await expect(page.getByText("Ticket not found")).toBeVisible();
  });

  // Session 20 (F3): the compound deep-link path — a shared ticket URL opened
  // logged out, the user detours through the forgot-password view machine,
  // then signs in: the from_url must survive the detour and land ON the
  // ticket. This is the most common real-world path to a shared link
  // (open → forgot password → reset → sign in → expect THE ticket, not the
  // dashboard). The s10 view machine never changes the URL through the swaps
  // — that is WHY the from_url survives; this pin guards the interaction
  // between the view machine (s10) and the deep-link contract (s19).
  // A nonexistent id suffices (the s19 design): the proxy bounce precedes
  // any data fetch and the landing assertion is the URL. The reset POST
  // rides its own rate bucket (forgot:*, 1 of 5); the ONE real login puts
  // the suite at 8 of the 10/15-min total.
  test("signing in after the forgot-password detour returns to the deep link", async ({ page }) => {
    await page.goto("/ticketdetails?id=e2e-reset-detour");
    await page.waitForURL(/\/login\?from_url=/);

    // The in-card reset detour (session-10 view machine — no URL change).
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { name: "Reset your password" })).toBeVisible();
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();

    // The sign-in must return to the DEEP LINK, not the dashboard default.
    await page.getByLabel("Email").fill("demo@servicedesk.app");
    await page.getByLabel("Password").fill("Demo1234!");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/ticketdetails?id=e2e-reset-detour");
    await expect(page.getByText("Ticket not found")).toBeVisible();
  });

  // Session 10: the in-card signup view (the reference's login card swaps
  // in place on "Need an account? Sign up"). No name field — the account
  // name derives from the email local-part (base44 auth has no name
  // concept); our direct sign-in after create is the documented superset
  // over their base44 email-verification wall.
  test("the in-card signup creates an account and lands on the dashboard", async ({ page }) => {
    const email = `incare-${Date.now()}@servicedesk.app`;
    await page.getByRole("button", { name: /Need an account\?\s*Sign up/ }).click();
    await page.getByLabel("Email").fill(email);
    // Exact match — the Confirm Password label also contains "Password".
    await page.getByLabel("Password", { exact: true }).fill("Passw0rd123");
    await page.getByLabel("Confirm Password").fill("Passw0rd123");
    await page.getByRole("button", { name: /Create account/ }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });
});

test.describe("signup page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("creates an account and lands on the dashboard", async ({ page }) => {
    const email = `pw-${Date.now()}@servicedesk.app`;
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Playwright User");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("Passw0rd123");
    await page.getByRole("button", { name: "Sign up" }).click();
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible();
  });

  test("rejects a weak password", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Playwright User");
    await page.getByLabel("Email").fill(`weak-${Date.now()}@servicedesk.app`);
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.locator('p[role="alert"]')).toBeVisible();
  });
});
