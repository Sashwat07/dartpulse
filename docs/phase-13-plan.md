# Phase 13 — Testing, Hardening, and Launch Readiness

**Status:** Refined before implementation.  
**Dependencies:** Phases 1–12 complete.  
**Principle:** Validate what exists; harden edge cases; prevent regressions; prepare for release. No new product features.

---

## 1. Repository / testing-state analysis

### Current test coverage and gaps

**Existing setup (keep and extend):**
- **Vitest** in `vitest.config.ts` (jsdom, `@` alias, `vitest.setup.ts` with jest-dom). Include: `tests/unit/**/*.{test,spec}.{ts,tsx}` and `tests/components/**/*.{test,spec}.{ts,tsx}`.
- **Playwright** in `playwright.config.ts` (`testDir: "tests/e2e"`, `baseURL: "http://localhost:3000"`).
- **Unit tests (3 files):** `tests/unit/validators/throwEvent.test.ts`, `match.test.ts`, `player.test.ts` — Zod schemas only.
- **E2E:** `tests/e2e` exists; only `.gitkeep`. **Components:** `tests/components` has `.gitkeep` only.

**Gaps:**
- No unit tests for domain logic (leaderboard, sudden death, turn derivation, progression, playoff undo).
- No API-level tests (throws, playoff throws/undo, match creation, state).
- No e2e flows; no chart smoke tests; no explicit test-data or golden-fixture strategy.
- No systematic build/hydration/production or read-only-history assertions in the plan.

### Most critical reliability risks

| Risk | Location / flow | Mitigation in Phase 13 |
|------|-----------------|------------------------|
| Scoring engine correctness | `app/api/matches/[matchId]/throws/route.ts`, `lib/regularMatchTurn.ts` | Unit: turn/round derivation; integration: POST throws + state |
| Tie-break and sudden death | `lib/suddenDeath.ts`, `lib/leaderboard.ts` | Unit: getRankedTiedGroups, deriveSuddenDeath, deriveLeaderboardFromThrowEvents |
| Playoff correctness | `lib/playoffEngine.ts`, `lib/playoffTurn.ts`, `lib/playoffUndo.ts` | Unit: deriveMatchOutcome, getDownstreamForBlocking/Reconcile; integration: playoff throw/undo APIs |
| State recovery / resume | Match state API, `store/useMatchStore.ts` | E2e: refresh and resume; integration: GET state payload |
| History vs resume; read-only history | Completed vs in-progress APIs, history detail page | E2e + integration: lists correct; history detail must not expose scoring/undo/confirm controls |
| Playoff final confirm / undo blocked | `lib/playoffUndo.ts`, complete-final API | Unit/integration: final_confirmed blocks undo |
| Charts / analytics stability | Recharts, `docs/charts-recharts.md` | Chart component smoke tests + e2e sanity; no heavy visual snapshots |
| Theme and responsive | `docs/design-system.md` | E2e: theme toggle and persistence; narrow viewport sanity |

---

## 2. Files to create or update

### Test configuration

- **vitest.config.ts:** Add include for integration (e.g. `tests/integration/**/*.{test,spec}.ts`) and for component/chart tests; single `pnpm test` run.
- **playwright.config.ts:** Add `webServer` (e.g. `pnpm dev`); optional `retries: 1` and timeout. No new browsers.

### Test folders and file layout

- **tests/unit/** — Existing validators; add: `leaderboard.test.ts`, `suddenDeath.test.ts`, `regularMatchTurn.test.ts`, `progression.test.ts`, `playoffUndo.test.ts`. Use **pure fixtures only** (see Test-data strategy).
- **tests/integration/** — `api/match-throws.test.ts`, `api/playoff-throws-undo.test.ts`, `api/match-creation.test.ts`. Use **isolated test DB or mocked repos**; state reset between tests.
- **tests/e2e/** — One spec per core flow (see E2E scope discipline):
  - `match-lifecycle.spec.ts` — Happy path: create → score → finish → playoffs → final confirm.
  - `sudden-death-playoff.spec.ts` — Critical path: tie → sudden death → playoff path including provisional result and final confirmation.
  - `history-resume-readonly.spec.ts` — History list, resume list, routing; **read-only history detail assertions**.
  - `analytics-leaderboard-players.spec.ts` — Navigation and chart/report rendering sanity.
  - `theme-and-charts.spec.ts` — Theme persistence, chart rendering sanity in both themes.
- **tests/components/** — **Chart smoke tests** (see Chart smoke tests below): ChartContainer, WinsAndTotalPointsChart, AverageRoundScoreChart, PlayerVolumeChart, PlayerScoringChart, RoundHeatmap. Optional: one or two high-impact UI tests (e.g. EmptyState).
- **tests/fixtures/** — Golden scenario data (see Golden fixture scenarios) for reuse in unit and integration tests; optional seed for e2e.

### Helpers

- **tests/helpers/** or **tests/fixtures/** — Shared TS/JSON for unit and integration; no shared dev data.
- **tests/integration/helpers/** — Test DB seed or API helpers; state reset between tests.

### Docs and checklists

- **docs/phase-13-plan.md** — This document. Link from `docs/development-plan.md`.
- **docs/launch-checklist.md** (or section below) — Release-readiness including build, hydration, production, read-only history, and theme/charts.

---

## 3. Test-data strategy

Implementation must follow this data strategy so tests stay deterministic and isolated.

### Unit tests

- **Pure fixtures only.** In-memory data only (plain objects, arrays).
- **No database.** No Prisma, no MongoDB, no file I/O.
- **No network.** No fetch, no API calls.
- **Deterministic.** Same input always yields same output; no dates or IDs that change run-to-run except where explicitly parameterized.
- Prefer **golden fixtures** (see below) for match/players/throws so unit tests align with integration and e2e scenarios.

### Integration tests

- Use **either** mocked repositories **or** a dedicated isolated test database.
- **Do not depend on shared or dev data.** Tests must not assume existing matches, players, or throws in the DB.
- **State reset between tests.** Each test or describe block should start from a known state (e.g. truncate/create fixtures, or reset mocks). No test may rely on another test’s side effects.
- Use **golden scenarios** where possible (same two-player, four-player-tie, four-player-playoff data) so behavior is comparable across layers.

### E2E tests

- **Tests seed or create their own data** via UI flows or safe setup helpers (e.g. create match + players in-spec, or run a minimal seed script that the e2e suite owns).
- **Must not depend on existing manual data.** E2e must be runnable in CI or on a clean install without pre-seeded dev data.
- **Isolated and repeatable.** Each spec should be able to run alone or in parallel without ordering; avoid shared browser state beyond what Playwright manages per test.

---

## 4. Golden fixture scenarios

Define a small set of **canonical scenarios** and reuse them across unit, integration, and (where useful) e2e to keep coverage coherent and maintainable.

### Scenario 1 — Two-player normal finish

- **Purpose:** No tie-break, no playoffs; match completes after regular rounds.
- **Contents:** 2 players, N rounds, M shots per round; throws that fill all rounds with no ties; final ranking clear.
- **Use in:** Unit (leaderboard, turn derivation, progression for 2 players); integration (match creation, add throws, match complete, state); e2e (optional simple lifecycle).

### Scenario 2 — Four-player tie leading to sudden death

- **Purpose:** Tie at end of regular rounds; sudden death resolves ranking before playoff bootstrap.
- **Contents:** 4 players, throws such that two or more are tied at end of final round; sudden-death throws that resolve to a unique top 4 order.
- **Use in:** Unit (sudden death helpers, getRankedTiedGroups, deriveLeaderboardFromThrowEvents with resolvedTieOrders); integration (POST throws into sudden death, state reflects sudden death); e2e (sudden-death/playoff spec).

### Scenario 3 — Four-player playoff path (provisional result and final confirm)

- **Purpose:** Full playoff path: Q1 ∥ Eliminator → Q2 → Final; includes provisional result and final confirmation.
- **Contents:** 4 players, completed regular (and if needed sudden death) rounds; playoff matches with throws; final match in provisionalCompleted then completed (champion confirmed).
- **Use in:** Unit (deriveMatchOutcome, getDownstreamForBlocking/Reconcile, playoff undo rules); integration (playoff throw API, undo blocked after downstream throws or final confirm); e2e (playoff critical path and read-only history after confirm).

### Fixture ownership and format

- **Location:** `tests/fixtures/` (e.g. `twoPlayerNormal.ts`, `fourPlayerSuddenDeath.ts`, `fourPlayerPlayoffFull.ts` or JSON).
- **Shape:** Typed structures (Match, MatchPlayer, ThrowEvent, PlayoffMatch, etc.) that mirror app types so unit and integration tests can import and use them without DB.
- **Documentation:** See **tests/fixtures/README.md** for where fixtures live, how to reuse them, and why these scenarios are canonical.

---

## 5. Chart component smoke tests

Add **lightweight component-level tests** for chart components so chart stability is not only verified by e2e. Keep tests practical; avoid heavy visual snapshot complexity unless clearly justified.

### Goals

- Renders without crashing.
- Renders empty / zero-data state correctly (no thrown errors, sensible fallback or message).
- Handles low or empty data safely (e.g. one point, empty array).
- Where practical, respect theme-safe rendering (e.g. component accepts or reads theme-relevant props/variables without crashing).

### Target components

- **ChartContainer** — Renders with title/description; wraps content without crash; empty children or minimal content.
- **WinsAndTotalPointsChart** — Renders with minimal/empty data; does not throw.
- **AverageRoundScoreChart** — Same.
- **PlayerVolumeChart** — Same; low/empty data.
- **PlayerScoringChart** — Same.
- **RoundHeatmap** — Same.

### Implementation notes

- Use React Testing Library; render with minimal props and empty or small data arrays.
- Do not add pixel-perfect or screenshot snapshots unless a specific regression justifies it.
- Mock Recharts or use real Recharts in jsdom; prefer “renders” and “handles empty” over visual diffing.

---

## 6. Ideal architecture for Phase 13

### Layering (unit → integration → e2e)

- **Unit:** Pure domain and validators only; pure fixtures; no Next, DB, or fetch.
- **Integration:** Route handlers with test DB or mocks; golden fixtures where useful; state reset between tests.
- **E2E:** Real browser and app; one primary flow per spec; data created or seeded by the suite.

### Avoiding brittle tests

- Prefer behavior and data over DOM structure; use test IDs only where needed for e2e.
- Stable seeds and golden fixtures; no sleep in e2e—use Playwright auto-waiting and assertions.

### What to cover where

| Layer   | Core logic | API contract | UI / flows |
|--------|------------|--------------|------------|
| Unit    | Leaderboard, sudden death, turn, progression, playoff undo (pure) | — | — |
| Integration | — | Throws, playoff throws/undo, match create, state | — |
| E2E    | — | — | Lifecycle, sudden death/playoff, history/resume/read-only, analytics/leaderboard/players, theme/charts |

---

## 7. E2E scope discipline

E2E specs must stay **focused**. One spec should validate **one core flow**; avoid overlong mega-flows that are brittle and hard to maintain.

### Recommended separation

1. **match-lifecycle.spec.ts** — Match lifecycle happy path only: create match (with players) → enter throws → match finished → go to playoffs → complete bracket → confirm champion. No need to also validate sudden death or history in this file.
2. **sudden-death-playoff.spec.ts** — Critical path where a tie leads to sudden death and then full playoff path, including **provisional result** and **final confirmation**. Focus on tie resolution and playoff correctness.
3. **history-resume-readonly.spec.ts** — History list, resume list, correct routing to live/playoffs; **explicit read-only history assertions** (see Read-only history assertions). No scoring or playoff actions in this spec beyond navigating to history/resume.
4. **analytics-leaderboard-players.spec.ts** — Navigation and smoke: analytics page, leaderboard, players list, one player profile; charts/reports render without crash; minimal assertions (e.g. links work, no error shell).
5. **theme-and-charts.spec.ts** — Theme toggle; reload; theme persists; chart pages (e.g. analytics, player profile) render in both themes without crash.

### Rules

- **One primary flow per spec.** Do not combine “full lifecycle + sudden death + history + theme” in one spec.
- **Avoid brittle overlong scenarios.** Prefer shorter, stable flows with clear assertions over one 50-step test.
- **Data:** Each spec creates or seeds its own data; no dependency on manual dev data.

---

## 8. Read-only history assertions

Completed match **history** (list and detail) must be **read-only**. The plan explicitly requires tests to enforce this.

### What history detail must NOT expose

Tests must verify that the **history detail page** (completed match) does **not** expose:

- **Score input** — No control to add or edit throws.
- **Undo** — No “undo last throw” or equivalent.
- **Playoff scoring actions** — No controls to submit playoff throws or choose first throw for playoff matches.
- **Match-complete controls** — No button to “complete match” or change match status.
- **Final-confirm controls** — No button to “confirm champion” or confirm final result.

### Where to assert

- **E2E:** In `history-resume-readonly.spec.ts`, after opening a completed match’s detail page, assert that the above elements are absent (or that known read-only elements are present and actionable controls are not). Use role/label or test IDs only where necessary.
- **Integration (optional):** If history detail is rendered in a test, same checks; or assert that the API does not return editing capabilities for completed matches.

This is a **trust guarantee**: completed matches are immutable and must be tested as such.

---

## 9. Build / hydration / production readiness

Add these to the **verification and release checklist** so launch readiness is explicit.

### Build and runtime

- **pnpm build** passes with no errors.
- **No hydration mismatch** on key pages: home, new match, live match, playoffs, history (list and detail), analytics, leaderboard, players (list and profile). Verify in dev and, where feasible, in production build (e.g. manual or a single e2e run against production build).
- **No obvious console errors** on key routes when loading and performing one primary action (e.g. open page, submit one throw, open history detail). Can be manual or automated (e2e with console error collection).

### Theme and motion

- **Theme persistence** works after reload (e.g. dark/light stored and re-applied); covered by theme e2e spec.
- **Page-level motion** (PageTransition) does not introduce client/server mismatch or hydration errors; key pages render without hydration warnings.

### Charts and production build

- **Chart pages** (analytics, player profile) render correctly in **production build** (e.g. `pnpm build && pnpm start` then open analytics and player profile); no blank or crashed chart areas for normal data.

### Checklist placement

- These items appear in **Section 10 (Verification / release checklist)** under a “Build / hydration / production” sub-bullet so implementers and reviewers can confirm them before release.

---

## 10. Verification / release checklist

### How to know Phase 13 is done

- All new **unit** tests pass (validators, leaderboard, sudden death, regularMatchTurn, progression, playoff undo pure).
- **Integration** tests pass: match creation, match throws and state, playoff throws and undo (including blocked undo when downstream has throws or final confirmed).
- **E2E** tests pass: match lifecycle; sudden death/playoff path; history/resume and **read-only history assertions**; analytics/leaderboard/players; theme and charts.
- **Chart component** smoke tests pass (renders, empty/low data).
- **Build / hydration / production:** `pnpm build` passes; no hydration mismatch on key pages; no obvious console errors on key routes; theme persistence; chart pages and page-level motion do not introduce hydration or client/server mismatch.
- No regressions; docs (phase-13-plan, launch-checklist) updated and linked.

### Release-readiness (launch checklist)

- **Tests:** Unit, integration, e2e, and chart smoke green; no skipped critical tests.
- **Build / hydration / production:** As in Section 9 (build passes, hydration clean, console clean on key routes, theme persistence, charts and motion safe).
- **Environment:** Production env vars documented; no secrets in repo.
- **Known limitations:** Documented (e.g. no offline support, data in MongoDB only).
- **Theme and responsive:** Dark and light work; key pages usable on narrow viewport.
- **Error and empty states:** EmptyState / ErrorState / LoadingCard where specified; history detail and completed matches not editable.
- **Read-only history:** Assertions in place; history detail does not expose score input, undo, playoff actions, match-complete, or final-confirm controls.
- **P0 bugs:** None open for launch-critical flows.

---

## 11. Minimal implementation strategy

### Implementation order

1. **Test-data strategy and golden fixtures** — Document and add `tests/fixtures/` with the three golden scenarios (data only; no tests yet).
2. **Unit tests (domain)** — Leaderboard, sudden death, regularMatchTurn, progression, playoff undo (pure); use pure fixtures and golden data where applicable.
3. **Chart smoke tests** — ChartContainer and listed chart components (renders, empty/low data).
4. **Integration tests** — Match creation; match throws and state; playoff throws and undo; isolated DB or mocks; state reset; golden scenarios where useful.
5. **E2E setup** — Playwright webServer; one smoke spec to validate setup.
6. **E2E specs** — One spec per flow (lifecycle, sudden death/playoff, history/resume/read-only, analytics/leaderboard/players, theme/charts).
7. **Hardening** — Fix any bugs found; add tests for edge cases (turn derivation, sudden death subset, playoff undo).
8. **Build / hydration / production** — Run production build and key-page checks; add to checklist.
9. **Docs** — phase-13-plan (this doc), launch-checklist, link from development-plan.

### What to test first

- Unit: leaderboard, sudden death, turn derivation, progression, playoff undo (pure).
- Then: integration for throws and playoff/undo; chart smoke tests.
- Then: e2e flows with read-only history and build/hydration checks.

---

## 12. Out of scope (reminder)

- No new product features (leagues, social, new analytics).
- No new motion or UI phase.
- No replacement of Vitest/Playwright.
- Gameplay surfaces are protected by tests, not redesigned.

---

## Summary

Phase 13 adds: **test-data strategy** (unit = pure fixtures only; integration = isolated DB or mocks with reset; e2e = self-seeded data); **golden fixture scenarios** (two-player normal, four-player sudden death, four-player playoff full) for reuse; **unit** tests for leaderboard, sudden death, turn, progression, playoff undo; **chart component smoke tests** (ChartContainer and main charts; render and empty/low data); **integration** tests for match creation, throws, state, playoff throw/undo; **e2e** specs with **scope discipline** (one flow per spec) and **read-only history assertions** (no score input, undo, playoff actions, match-complete, or final-confirm on history detail); **build / hydration / production readiness** in the verification and release checklist. This keeps the same direction (unit, integration, e2e, hardening, launch readiness) while making data strategy, fixtures, charts, production checks, history immutability, and e2e focus explicit and implementable.
