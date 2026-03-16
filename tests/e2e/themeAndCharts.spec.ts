import { test, expect } from "@playwright/test";

test.describe("Theme persistence and chart sanity", () => {
  test("theme can be switched and persists after reload; analytics renders in both themes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\//);

    const toggle = page.getByRole("button", {
      name: /switch to light mode|switch to dark mode/i,
    });
    await expect(toggle).toBeVisible({ timeout: 10_000 });

    const aria = await toggle.getAttribute("aria-label");
    if (aria?.toLowerCase().includes("light")) {
      await toggle.click();
      await page.waitForTimeout(500);
    }

    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(600);

    const html = page.locator("html");
    await expect(html).toHaveClass(/light/);

    await page.goto("/analytics");
    await expect(
      page.getByRole("heading", { name: "Analytics", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Overview").first()).toBeVisible();

    await page.getByRole("button", { name: /switch to dark mode/i }).click();
    await page.waitForTimeout(400);
    await expect(html).toHaveClass(/dark/);

    await page.goto("/analytics");
    await expect(
      page.getByRole("heading", { name: "Analytics", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  });
});
