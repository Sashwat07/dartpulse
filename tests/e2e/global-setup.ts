/**
 * Playwright global setup: seeds E2E auth and builds storageState for authenticated specs.
 * Run once before all projects. Creates tests/e2e/.auth/user.json for reuse.
 *
 * Requires: MONGODB_URL (same as app). Server (baseURL) must be reachable when setup runs.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

import { chromium, type FullConfig } from "@playwright/test";

const AUTH_DIR = path.join(process.cwd(), "tests", "e2e", ".auth");
const SESSION_FILE = path.join(AUTH_DIR, "session.json");
const STORAGE_STATE_FILE = path.join(AUTH_DIR, "user.json");

/** NextAuth database strategy cookie name. */
const SESSION_COOKIE_NAME = "next-auth.session-token";

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL ?? "http://localhost:3000";

  // 1. Seed test user + session into DB (same DB as app)
  const result = spawnSync("pnpm", ["exec", "tsx", "scripts/seed-e2e-auth.ts"], {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  });
  if (result.status !== 0) {
    throw new Error("E2E auth seed failed. Ensure MONGODB_URL is set and DB is reachable.");
  }

  // 2. Read session token
  const sessionJson = fs.readFileSync(SESSION_FILE, "utf-8");
  const { sessionToken } = JSON.parse(sessionJson) as { sessionToken: string };
  if (!sessionToken) {
    throw new Error("E2E auth: sessionToken missing in " + SESSION_FILE);
  }

  // 3. Create browser context, set cookie, save storage state
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  await context.addCookies([
    {
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      domain: new URL(baseURL).hostname,
      path: "/",
    },
  ]);
  await context.storageState({ path: STORAGE_STATE_FILE });
  await browser.close();

  console.log("E2E auth: storageState saved to", STORAGE_STATE_FILE);
}

export default globalSetup;
