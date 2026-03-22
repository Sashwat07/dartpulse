import { test, expect } from "@playwright/test";
import { createMatchThroughUI } from "./helpers/createMatch";

test.describe("Playoff critical path", () => {
  test("four-player match completes and Go to playoffs link leads to playoffs page", async ({
    page,
  }) => {
    await page.goto("/match/new");
    await page.getByRole("heading", { name: /new match/i }).waitFor({ state: "visible" });

    const checkboxes = page.getByRole("checkbox");
    const count = await checkboxes.count();
    if (count < 4) {
      const nameInput = page.getByLabel("Name", { exact: true }).or(page.locator("#new-player-name"));
      for (const name of ["P1", "P2", "P3", "P4"]) {
        await nameInput.fill(name);
        await page.getByRole("button", { name: /add player/i }).click();
        await page.waitForTimeout(200);
      }
    }

    for (let i = 0; i < 4; i++) {
      await page.getByRole("checkbox").nth(i).check();
    }
    await page.getByLabel("Total rounds").fill("1");
    await page.getByRole("button", { name: /create match/i }).click();

    await page.waitForURL(/\/match\/[a-zA-Z0-9]+/);
    const scoreEntry = page.getByRole("group", { name: /score entry/i });
    await expect(scoreEntry).toBeVisible({ timeout: 10_000 });

    const number60 = page.getByRole("button", { name: "Number: 20" });
    const number50 = page.getByRole("button", { name: "Number: 19" });
    const number40 = page.getByRole("button", { name: "Number: 18" });
    const number30 = page.getByRole("button", { name: "Number: 15" });

    await number60.click();
    await page.waitForTimeout(300);
    await number50.click();
    await page.waitForTimeout(300);
    await number40.click();
    await page.waitForTimeout(300);
    await number30.click();

    await expect(page.getByText("Match complete").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /go to playoffs/i }).first()).toBeVisible();

    await page.getByRole("link", { name: /go to playoffs/i }).click();
    await expect(page).toHaveURL(/\/playoffs\/[a-zA-Z0-9]+/);
    await expect(page.getByRole("heading", { name: "Playoffs", exact: true })).toBeVisible({
      timeout: 5000,
    });

    // New format: opening round shows Q1 and Eliminator (3v4) in parallel; not legacy Q1+Q2 first.
    await expect(page.getByText(/Qualifier 1/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Eliminator/i).first()).toBeVisible();
  });
});
