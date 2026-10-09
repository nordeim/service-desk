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
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible();
    // Session 6: the reference renders the WHOLE "Need an account? Sign up"
    // line as one control — our anchor's accessible name is the full line.
    await expect(page.getByRole("link", { name: /Need an account\?\s*Sign up/ })).toBeVisible();
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

  test("unauthenticated /dashboard bounces to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login");
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
