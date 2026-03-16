/**
 * Seeds a test User and Session for E2E authenticated runs.
 * Writes sessionToken to tests/e2e/.auth/session.json for use by Playwright global-setup.
 * Uses the same DB as the app (MONGODB_URL). Safe for local and CI; no Google OAuth.
 *
 * Run: pnpm exec tsx scripts/seed-e2e-auth.ts
 * Or invoked by tests/e2e/global-setup.ts before building storageState.
 */

import "dotenv/config";
import * as fs from "node:fs";
import * as path from "node:path";

import { db } from "@/lib/db";

const E2E_USER_EMAIL = "e2e@test.dartpulse.local";
const E2E_SESSION_TOKEN = "e2e-session-token-playwright";
const AUTH_DIR = path.join(process.cwd(), "tests", "e2e", ".auth");
const SESSION_FILE = path.join(AUTH_DIR, "session.json");

/** Session valid for 30 days. */
const EXPIRES = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

async function seed() {
  if (!process.env.MONGODB_URL) {
    throw new Error("MONGODB_URL is not set. Use .env or export it.");
  }

  const user = await db.user.upsert({
    where: { email: E2E_USER_EMAIL },
    create: {
      email: E2E_USER_EMAIL,
      name: "E2E Test User",
    },
    update: {},
  });

  await db.session.upsert({
    where: { sessionToken: E2E_SESSION_TOKEN },
    create: {
      sessionToken: E2E_SESSION_TOKEN,
      userId: user.id,
      expires: EXPIRES,
    },
    update: { expires: EXPIRES, userId: user.id },
  });

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(
    SESSION_FILE,
    JSON.stringify({ sessionToken: E2E_SESSION_TOKEN, userId: user.id }, null, 2),
    "utf-8",
  );

  console.log("E2E auth seed complete. Session token written to", SESSION_FILE);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
