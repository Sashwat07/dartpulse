# E2E Tests (Playwright)

## Auth session setup (Phase G)

Protected routes (`/match/new`, `/resume`, `/history`, `/app`, etc.) require an authenticated user. The suite uses a **seeded session** so specs do not perform Google OAuth in the browser.

- **How it works:** Before any test run, `global-setup.ts` runs. It (1) seeds a test User and Session into the same DB as the app (`scripts/seed-e2e-auth.ts`), (2) builds a Playwright storage state with the session cookie, (3) saves it to `tests/e2e/.auth/user.json`.
- **Which specs use auth:** The `authenticated` project runs `matchLifecycle`, `historyResume`, and `suddenDeathPlayoff` with that storage state. The `unauthenticated` project runs `authProtectedRoutes`, `navigationAnalyticsProfiles`, and `themeAndCharts` without it.

## Running locally

1. **Env:** Ensure `.env` has `MONGODB_URL` (same as when you run `pnpm dev`).
2. **Server:** Either start the app yourself (`pnpm dev`) or let Playwright start it (default).
3. **Run all E2E:**
   ```bash
   pnpm test:e2e
   ```
4. **Run only authenticated specs:**
   ```bash
   pnpm test:e2e --project=authenticated
   ```
5. **Run only unauthenticated specs:**
   ```bash
   pnpm test:e2e --project=unauthenticated
   ```

## Running in CI

- Set `MONGODB_URL` (and any other required env) in the CI environment.
- Run `pnpm test:e2e`. The same global setup runs: it seeds the DB and builds storage state once; then both projects run.
- No Google OAuth or test account credentials are required.
- The config uses `reuseExistingServer: true`, so if nothing is listening on the base URL, Playwright starts `pnpm dev`; if something is already running (e.g. local), it reuses it.

## Refreshing the auth state

The seeded session is re-created on every full run by global setup. To refresh manually (e.g. after DB reset):

```bash
pnpm exec tsx scripts/seed-e2e-auth.ts
```

Then run E2E as above; global setup will overwrite `tests/e2e/.auth/user.json` on the next run.

## Test user

- **Email:** `e2e@test.dartpulse.local` (created by `scripts/seed-e2e-auth.ts`).
- Used only for E2E; no Google account or credentials required.
