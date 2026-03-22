# DartPulse Release Readiness

## 1. Overview

DartPulse is **feature-complete** for the current release scope and has completed Phases 11–13 (testing and hardening). This checklist is for engineers preparing the application for production use. Use it to verify build, tests, core flows, and operational readiness before launch.

---

## 2. Test Status

- [ ] **Unit tests** — `pnpm test` (or equivalent) passes; no failing unit tests.
- [ ] **Integration tests** — Integration test suite passes (match history, playoffs, history vs resume, analytics/leaderboard).
- [ ] **E2E tests** — `pnpm test:e2e` passes; Playwright specs for match lifecycle, playoff path, history/resume, navigation (analytics/leaderboard/player profile), and theme/charts all green.
- [ ] **Chart smoke** — Analytics and player-profile chart surfaces load without crash; no chart-related runtime errors on key pages.
- [ ] **Theme persistence** — Theme toggle and reload persistence verified (e.g. via e2e or manual check); no theme-related console errors.

---

## 3. Build / Quality Checks

- [ ] **Build** — `pnpm build` completes successfully.
- [ ] **TypeScript** — No TypeScript errors (`tsc` or build output); strict mode respected.
- [ ] **ESLint** — No ESLint errors on the codebase (or only documented exceptions).
- [ ] **Hydration** — No hydration mismatch warnings on Home, Live Match, History, Analytics, Leaderboard, or Player profile.
- [ ] **Console** — No critical (blocking or repeated) console errors on major routes during normal usage.

---

## 4. Core Product Integrity

- [ ] **Match creation** — New match flow works; players can be added/selected; match starts and redirects to live match.
- [ ] **Live scoring** — Throws can be entered; scoreboard and leaderboard update; turn order and round progression correct.
- [ ] **Sudden death** — Tie-break triggers and resolves; sudden-death scores visible and separate from regular rounds; ranking resolves correctly.
- [ ] **Playoff flow** — For 4+ players, “Go to playoffs” appears and navigates to bracket; **Qualifier 1** and **Eliminator** (parallel), then **Qualifier 2**, then **Final**, progress correctly.
- [ ] **Final confirm** — Final match completion and champion confirmation work; no stuck or inconsistent state.
- [ ] **History read-only** — Match history detail shows no score entry, no undo, no playoff/final editing controls.
- [ ] **Resume / History separation** — In-progress matches appear only under Resume; completed matches appear only under History; resume links go to correct surface.
- [ ] **Analytics / Leaderboard / Player profile** — Pages load without error; leaderboard and analytics derive from data; player profile and links from leaderboard/players work.

---

## 5. UI / Theme / Responsiveness

- [ ] **Dark mode** — Full UI usable in dark theme; contrast and readability acceptable.
- [ ] **Light mode** — Full UI usable in light theme; no broken contrast or invisible elements.
- [ ] **Theme persistence** — Selected theme persists after page reload (e.g. `dartpulse-theme` in localStorage).
- [ ] **Charts in both themes** — Analytics and profile chart sections render in dark and light without crash or layout break.
- [ ] **Narrow / mobile** — Key pages (Home, Live Match, History, Leaderboard, Analytics, Players) usable at narrow/mobile widths; no horizontal overflow or unreadable content.
- [ ] **Navigation** — Sidebar/nav works on desktop; mobile navigation (if present) works; active state and links correct.

---

## 6. Data / Trust Guarantees

- [ ] **History** — Only completed matches appear in Match History list and detail.
- [ ] **Resume** — Only in-progress (non-finished) matches appear in Resume list.
- [ ] **No edit on completed** — Completed match history detail has no scoring, undo, or playoff-editing actions.
- [ ] **Leaderboard / Analytics source** — Leaderboard and analytics are derived from persisted match/player data only; no synthetic or test-only data in production views.
- [ ] **Charts with low data** — Charts and stat cards degrade gracefully when there is little or no data (empty states, no crashes).

---

## 7. Operational / Launch Notes

- [ ] **Environment variables** — Required env vars (e.g. `DATABASE_URL`, any API keys) documented and verified for target environment.
- [ ] **Database** — Database (e.g. MongoDB) is accessible from the deployment environment; connection and migrations (if any) verified.
- [ ] **Production build** — Production build (`pnpm build`) run and tested locally (or in staging); app runs correctly with `pnpm start` (or equivalent).
- [ ] **Deployment procedure** — Steps to deploy (build, env, start command, optional reverse proxy) documented and repeatable.
- [ ] **Rollback strategy** — Rollback steps (e.g. previous image/deploy, DB considerations) known and documented.
- [ ] **Post-launch monitoring** — Owner identified for monitoring (errors, performance, uptime); logging/alerting in place or planned.

---

## 8. Sign-off

| Role              | Name | Date | Notes |
|-------------------|------|------|-------|
| Engineering       |      |      |       |
| QA                |      |      |       |
| Product           |      |      |       |

- **Release date:** _________________
- **Notes:** _________________________________________________
