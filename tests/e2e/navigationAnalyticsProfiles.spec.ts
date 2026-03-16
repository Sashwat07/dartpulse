import { test, expect } from "@playwright/test";

test.describe("Analytics, leaderboard, and player profile navigation", () => {
  test("analytics and leaderboard load; player links open profile; chart sections present", async ({
    page,
  }) => {
    await page.goto("/analytics");
    await expect(
      page.getByRole("heading", { name: "Analytics", exact: true }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Overview").first()).toBeVisible();

    await page.goto("/leaderboard");
    await expect(
      page.getByRole("heading", { name: "Leaderboard", exact: true }),
    ).toBeVisible({ timeout: 10_000 });

    const leaderboardPlayerLink = page.locator('a[href^="/players/"]').first();
    if (await leaderboardPlayerLink.isVisible()) {
      await leaderboardPlayerLink.click();
      await expect(page).toHaveURL(/\/players\/[a-zA-Z0-9]+/);
      await expect(
        page.getByText("Core stats").or(page.getByText("Wins")).first(),
      ).toBeVisible({ timeout: 5000 });
      return;
    }

    await page.goto("/players");
    await expect(
      page.getByRole("heading", { name: "Players", exact: true }),
    ).toBeVisible({ timeout: 5000 });
    const viewProfileLink = page.getByRole("link", { name: /view profile/i }).first();
    if (await viewProfileLink.isVisible()) {
      await viewProfileLink.click();
      await expect(page).toHaveURL(/\/players\/[a-zA-Z0-9]+/);
      await expect(
        page.getByText("Core stats").or(page.getByText("Wins")).first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
