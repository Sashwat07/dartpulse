import { test, expect } from "@playwright/test";
import { createMatchThroughUI } from "./helpers/createMatch";

test.describe("Match lifecycle happy path", () => {
  test("user can create a match, enter throws, complete, and see it in history", async ({
    page,
  }) => {
    const matchUrl = await createMatchThroughUI(page, { totalRounds: 2 });
    expect(matchUrl).toContain("/match/");

    await expect(page.getByRole("heading", { name: "Current turn" })).toBeVisible({
      timeout: 10_000,
    });

    const scoreEntry = page.getByRole("group", { name: /score entry/i });
    await expect(scoreEntry).toBeVisible();

    const number20 = page.getByRole("button", { name: "Number: 20" });
    const number15 = page.getByRole("button", { name: "Number: 15" });
    const number18 = page.getByRole("button", { name: "Number: 18" });

    await number20.click();
    await page.waitForTimeout(400);
    await number15.click();
    await page.waitForTimeout(400);
    await number18.click();
    await page.waitForTimeout(400);
    await number20.click();

    await expect(page.getByText("Match complete").first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/history");
    await expect(
      page.getByRole("heading", { name: "Match History", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("E2E Match").first()).toBeVisible();

    await page.getByRole("link", { name: /E2E Match/i }).first().click();
    await expect(page).toHaveURL(/\/history\/[a-zA-Z0-9]+/);
    await expect(page.getByText("Completed")).toBeVisible();

    await expect(page.getByRole("button", { name: /undo last throw/i })).not.toBeVisible();
    await expect(page.getByRole("group", { name: /score entry/i })).not.toBeVisible();
  });
});
