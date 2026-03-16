import { test, expect } from "@playwright/test";

/**
 * Phase F: Auth & ownership test coverage.
 * These tests verify that protected routes redirect signed-out users to /login.
 * They do not require an authenticated session.
 *
 * Notes:
 * - E2E flows that create matches (matchLifecycle, historyResume) require an
 *   authenticated user; run those with a seeded session or auth fixture if needed.
 * - Sign-out redirect to / is implemented in TopBar; full sign-out E2E would
 *   require an authenticated session (e.g. storageState from a prior login).
 */

test.describe("Protected route redirects (signed-out)", () => {
  test("visiting /app redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/app", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /match/new redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/match/new", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /resume redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/resume", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /history redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/history", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /match/[id] redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/match/000000000000000000000000", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /playoffs/[id] redirects to /login when not signed in", async ({ page }) => {
    await page.goto("/playoffs/000000000000000000000000", { waitUntil: "commit" });
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Public routes (signed-out)", () => {
  test("visiting / shows landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /track every throw/i })).toBeVisible();
  });

  test("visiting /login shows login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });
});

test.describe("Sign-in destination and redirects", () => {
  test("login page has Continue with Google and does not redirect when signed out", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
  });

  test("signed-out user at / stays on landing", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
  });
});
