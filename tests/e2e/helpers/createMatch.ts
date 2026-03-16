import { type Page } from "@playwright/test";

/**
 * Ensure at least two players exist on the New Match page, then create a match
 * with 2 players and the given number of rounds. Returns the match URL after redirect.
 * Call from /match/new (navigates there if needed).
 */
export async function createMatchThroughUI(
  page: Page,
  options: { totalRounds?: number; matchName?: string } = {},
): Promise<string> {
  const { totalRounds = 2, matchName = "E2E Match" } = options;

  await page.goto("/match/new");
  await page.getByRole("heading", { name: /new match/i }).waitFor({ state: "visible" });

  const playerCheckboxes = page.getByRole("checkbox");
  const count = await playerCheckboxes.count();

  if (count < 2) {
    const nameInput = page.getByLabel("Name", { exact: true }).or(page.locator("#new-player-name"));
    await nameInput.fill("E2E Alice");
    await page.getByRole("button", { name: /add player/i }).click();
    await page.waitForTimeout(300);
    await nameInput.fill("E2E Bob");
    await page.getByRole("button", { name: /add player/i }).click();
    await page.waitForTimeout(300);
  }

  const checkboxes = page.getByRole("checkbox");
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();

  await page.locator("#match-name").fill(matchName);
  await page.locator("#total-rounds").fill(String(totalRounds));
  await page.getByRole("button", { name: /create match/i }).click();

  await page.waitForURL(/\/match\/[a-zA-Z0-9]+/);
  return page.url();
}
