import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  globalSetup: "tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "authenticated",
      use: {
        storageState: "tests/e2e/.auth/user.json",
      },
      testMatch: [
        "**/matchLifecycle.spec.ts",
        "**/historyResume.spec.ts",
        "**/suddenDeathPlayoff.spec.ts",
      ],
    },
    {
      name: "unauthenticated",
      testMatch: [
        "**/authProtectedRoutes.spec.ts",
        "**/navigationAnalyticsProfiles.spec.ts",
        "**/themeAndCharts.spec.ts",
      ],
    },
  ],
});

