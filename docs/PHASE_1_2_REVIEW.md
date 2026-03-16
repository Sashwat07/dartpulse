# Phase 1 & Phase 2 Implementation Review

**Review date:** 2025-03-14  
**Scope:** Phase 1 (Repository & Runtime Foundation) and Phase 2 (Domain Models & Validation Layer)  
**Source of truth:** docs/prd.md, docs/architecture.md, docs/tech-decisions.md, docs/project-scaffolding.md, docs/design-system.md, docs/development-rules.md, docs/development-plan.md, docs/entity-model.md, .cursor/rules.md

---

## 1. Phase 1 status: **PASS**

Phase 1 scaffolding is implemented correctly and aligns with the docs.

**Verified:**
- **Repository structure:** `app/`, `components/`, `components/ui/`, `features/`, `hooks/`, `lib/`, `lib/config/`, `lib/repositories/`, `store/`, `types/`, `constants/`, `utils/`, `prisma/`, `public/`, `tests/` (with `tests/unit/`, `tests/components/`, `tests/e2e/`) and `docs/` exist. No unexpected top-level folders. Folder names use `store/` (not `stores/`) and `lib/validators/` (not top-level `validators/`) per approved plan.
- **Next.js App Router:** Root `app/layout.tsx` imports global styles, wraps children with `Providers`, uses `env` from `lib/config/env`; `app/page.tsx` is a minimal DartPulse home placeholder using AppShell, PageHeader, GlassCard. Both are Server Components.
- **App shell:** `AppShell`, `SidebarNav`, `TopBar`, `PageHeader` exist; dark-first, Tailwind-based, no Prisma or business logic.
- **Global styling:** `app/globals.css` defines dark-first baseline and CSS variables `primaryNeon`, `championGold`, `glassBackground`, `glassBorder`; base typography; compatible with Tailwind.
- **UI foundation:** `components/ui/button.tsx`, `components/ui/card.tsx`, `GlassCard`, `ThemeToggle` exist; GlassCard reflects design-system direction.
- **Environment:** `lib/config/env.ts` validates `NODE_ENV`, `MONGODB_URL`, `NEXT_PUBLIC_APP_NAME` with Zod and exports typed `env`; `.env.example` includes required variables.
- **Database:** `prisma/schema.prisma` is configured for MongoDB (Phase 2 expansion includes full entity set); `lib/db.ts` implements Prisma singleton for Next.js.
- **Providers:** `components/Providers.tsx` sets up TanStack Query `QueryClientProvider`; wired in `app/layout.tsx`.
- **Store:** `store/useMatchStore.ts`, `store/types.ts`, `store/selectors.ts`, `store/actions.ts` exist with placeholder state (activeMatch, matchPlayers, rounds, throwEvents, currentTurn, matchLeaderboard, playoffState, playoffMatches, suddenDeathState, analyticsFilters, globalPlayerStats, uiFlags) and stub actions only.
- **Route scaffolds:** Pages exist for `match/new`, `match/[matchId]`, `playoffs/[matchId]`, `leaderboard`, `history`, `history/[matchId]`, `analytics`, `players/[playerId]`; Server Components with AppShell/PageHeader where appropriate.
- **API placeholders:** Thin handlers for `api/players`, `api/matches`, `api/matches/[matchId]`, `api/throws`, `api/playoffs`, `api/leaderboard`; typed JSON placeholders, camelCase responses.
- **Tests:** Vitest and Playwright configs present; `tests/unit/`, `tests/components/`, `tests/e2e/` with .gitkeep; validator unit tests added in Phase 2.
- **Violations checked:** No Prisma or `lib/db` usage in any `.tsx` file; no business logic in UI; no incorrect folder placement.

---

## 2. Phase 2 status: **PASS**

Phase 2 domain models and validation layer are implemented correctly and align with docs/entity-model.md.

**Verified:**
- **Domain types:**  
  - **Player** (`types/player.ts`): playerId, name, avatarColor, createdAt, updatedAt, optional avatarUrl, status.  
  - **Match** (`types/match.ts`): matchId, name, mode, totalRounds, status, createdAt, startedAt?, completedAt?; **MatchMode** ("casual" | "tournament"); **MatchStatus** (full enum).  
  - **MatchPlayer**, **Round**, **ThrowEvent** (with **ThrowEventType**), **MatchLeaderboardEntry**, **SuddenDeathState** in `types/match.ts`.  
  - **PlayoffMatch** (`types/playoff.ts`): playoffMatchId, parentMatchId, stage, player1Id, player2Id, player1Score?, player2Score?, winnerId?, loserId?, status, resolvedBy?, createdAt, completedAt?; **PlayoffStage**, **PlayoffStatus**, **ResolvedBy**.  
  - **Achievement** (`types/achievement.ts`): achievementId, playerId, type, sourceMatchId?, awardedAt; **AchievementType**.
- **DTOs** (`types/dto.ts`): CreatePlayerPayload, CreateMatchPayload, AddThrowPayload; ListPlayersResponse, ListMatchesResponse, GetMatchResponse; ApiResponse<T>. camelCase; no raw MongoDB _id in API shapes.
- **Zod validators** (`lib/validators/`): playerSchema, createPlayerPayloadSchema; matchStatusSchema, matchModeSchema, createMatchPayloadSchema, roundSchema; throwEventTypeSchema, addThrowPayloadSchema (score 1–60, using constants); playoffStageSchema, playoffStatusSchema, resolvedBySchema, playoffMatchSchema; achievementTypeSchema, achievementSchema; index re-exports. Dart score rules (bullseye = 50, valid range 1–60) enforced in addThrowPayloadSchema and addPlayoffThrowPayloadSchema.
- **Prisma schema:** Player, Match, MatchPlayer, Round, ThrowEvent, PlayoffMatch, Achievement models present; camelCase fields; MongoDB `@db.ObjectId` and `@map("_id")` used appropriately; relations match entity-model.
- **Repositories** (`lib/repositories/`): playerRepository, matchRepository, roundRepository, throwEventRepository, playoffMatchRepository, achievementRepository with create/list/get-style methods; use `lib/db` only; no UI or app imports; matchRepository.createMatch is a stub (throws); others provide real Prisma read/write where applicable.
- **Constants:** `constants/gameRules.ts` defines BULLSEYE_SCORE (50), DART_SCORE_MIN (1), DART_SCORE_MAX (60) for throw validation. `constants/scoringLimits.ts` defines MAX_SINGLE_SHOT (60), BIG_THROW_THRESHOLD (50), and getMaxRoundScore(shotsPerRound) for analytics and achievements.
- **API alignment:** Players and matches routes use DTO types for response shapes; throws route parses body with addThrowPayloadSchema and returns 400 on validation failure, 501 for not implemented. Handlers remain thin; no full CRUD or match/throw workflows.
- **Store type alignment:** `store/types.ts` imports PlayoffMatch from `@/types/playoff` and other state types from `@/types/match`; all store state uses domain types.
- **Validator tests:** `tests/unit/validators/throwEvent.test.ts`, `player.test.ts`, `match.test.ts` cover schema validation and score constraints.

---

## 3. What is implemented correctly

- Root folder structure matches project scaffolding; `store/` and `lib/validators/` used as specified.
- Docs filenames are lowercase (e.g. prd.md, architecture.md).
- App Router, layout, and page are Server Components; global styles and design tokens in place.
- App shell (AppShell, SidebarNav, TopBar, PageHeader) and UI primitives (button, card, GlassCard, ThemeToggle) are present and minimal.
- Env validation with Zod and typed `env`; Prisma singleton; TanStack Query provider; Zustand store scaffold with correct state shape and stubs only.
- All required route scaffolds and API placeholder routes; responses typed and camelCase.
- Phase 2: Full set of domain types, DTOs, Zod schemas, Prisma models, and repository modules; shared game constants; validator tests; no Phase 3+ logic in store or API.

---

## 4. Problems found

| # | Item | Severity |
|---|------|----------|
| 1 | **Missing API route** `app/api/players/[playerId]/route.ts`: docs/project-scaffolding.md §4 lists "app/api/players/route.ts & [playerId]/route.ts". Only the collection route exists. A placeholder for GET (and optionally PATCH/DELETE) by playerId is missing. | **Low** |
| 2 | **Store action signature vs. implementation:** `MatchStoreActions.addThrow` is typed as `(score: number) => void`, but the implementation in `useMatchStore` ignores the argument. Behavior is correct for a stub but the implementation could accept the parameter for consistency (e.g. `addThrow: (_score) => set((s) => s)`). | **Cosmetic** |

No other issues found. No Prisma in UI, no snake_case, no raw _id in API types, no scoring/leaderboard/playoff/analytics logic implemented.

---

## 5. Severity of each problem

- **Problem 1 (missing `api/players/[playerId]/route.ts`):** Low. Phase 1 plan explicitly listed only `app/api/players/route.ts`; scaffolding doc mentions both. Adding a thin placeholder for GET (and optionally PATCH) by playerId would align with the doc and prepare for Phase 3.
- **Problem 2 (addThrow parameter):** Cosmetic. Type contract is correct; only the stub implementation does not use the argument. No functional impact.

---

## 6. Exact fixes recommended

**Fix 1 (optional but recommended):** Add a thin placeholder route for single-player API.

- Create `app/api/players/[playerId]/route.ts`.
- Implement `GET`: return `NextResponse.json({ player: null, playerId: <from params> })` or similar typed placeholder (e.g. using a small DTO type for “get player response”).
- Optionally add `PATCH` and/or `DELETE` returning 501 with a “Not implemented” message.
- Keep handlers thin; no repository or DB calls required until Phase 3.

**Fix 2 (optional):** In `store/useMatchStore.ts`, change the addThrow stub to accept the parameter for consistency:

```ts
addThrow: (_score: number) => {
  // Phase 1: intentionally not implemented.
  set((s) => s);
},
```

(Or keep as-is; no functional change.)

---

## 7. Final verdict

**Safe to proceed to Phase 3.**

Phase 1 and Phase 2 are correctly implemented. The only finding that touches the “required” checklist is the missing `app/api/players/[playerId]/route.ts` placeholder; it is low severity and can be added in a short follow-up or at the start of Phase 3. The addThrow parameter is a cosmetic consistency detail. No blocking or high-severity issues were found; naming, layer separation, and phase boundaries are respected.
