import { test, expect } from "@playwright/test";
import { createMatchThroughUI } from "./helpers/createMatch";

test.describe("History vs resume separation and read-only", () => {
  test("in-progress match appears in Resume and completed match in History; detail is read-only", async ({
    page,
  }) => {
    const uniqueName = `E2E Resume ${Date.now()}`;
    await createMatchThroughUI(page, {
      totalRounds: 2,
      matchName: uniqueName,
    });

    await page.getByRole("group", { name: /score entry/i }).waitFor({ state: "visible", timeout: 10_000 });

    await page.goto("/resume");
    await expect(page.getByRole("heading", { name: "Resume", exact: true })).toBeVisible();
    await expect(page.getByText(uniqueName).first()).toBeVisible();
    await page.getByRole("link", { name: new RegExp(uniqueName) }).first().click();
    await expect(page).toHaveURL(/\/match\/[a-zA-Z0-9]+/);
    await expect(page.getByRole("group", { name: /score entry/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: "Number: 20" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Number: 15" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Number: 18" }).click();
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Number: 20" }).click();
    await expect(page.getByText("Match complete").first()).toBeVisible({ timeout: 15_000 });

    await page.goto("/resume", { waitUntil: "load" });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Resume", exact: true })).toBeVisible();
    await expect(page.getByText(uniqueName)).not.toBeVisible();

    await page.goto("/history");
    await expect(page.getByText(uniqueName).first()).toBeVisible();
    await page.getByRole("link", { name: new RegExp(uniqueName) }).first().click();
    await expect(page).toHaveURL(/\/history\/[a-zA-Z0-9]+/);

    await expect(page.getByRole("button", { name: /undo last throw/i })).not.toBeVisible();
    await expect(page.getByRole("group", { name: /score entry/i })).not.toBeVisible();
  });
});
