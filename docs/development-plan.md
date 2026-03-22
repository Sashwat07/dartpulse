# Development Plan: DartPulse

## 1. Development Plan Overview
This document defines the highly structured, phase-wise execution plan for building the DartPulse application. 

It explicitly translates the decisions outlined in the Architecture, Tech Decisions, and Design System documents into an actionable path for development.

**This plan defines:**
- The strict **order of implementation**.
- Clear **dependencies** between architectural systems.
- Tangible **delivery milestones**.
- Which layers must be built and hardened before proceeding.

**Optimization:**
This plan is heavily optimized for a Next.js App Router (Server-Component first) architecture and for **Cursor-assisted AI development**. It focuses on safe, incremental implementation that builds domains layer-by-layer rather than vertically slicing prematurely.

---

## 2. Guiding Principles for Development
To ensure predictable execution and prevent AI hallucination driven tech-debt, all development must adhere to these governing sequences:

- **Backend & Domain Logic Before Complex UI:** Data models, schemas, repositories, and APIs must be implemented and stabilized before generating dynamic front-end views.
- **Types & Validation First:** Fully strict TypeScript interfaces and Zod validation schemas represent the contract; they must precede implementation.
- **Immutable Completed Matches:** Match History logic relies on finalized immutable records. Do not allow historical editing.
- **Persistence-First Live Scoring:** The application relies on immediate database state sync rather than pure client memory. Refreshing essentially recovers session state natively.
- **Stable APIs Before Analytics:** Do not attempt complex dashboards until the core data generation engine is completely stabilized.
- **Testable Milestones:** Feature phases must terminate in a testable, reliable milestone capable of standalone verification.

---

## 3. Phase-by-Phase Development Roadmap

### Phase 1 — Repository & Runtime Foundation
**Goal:** Set up the isolated Next.js project, pnpm, Tailwind, shadcn/ui, Prisma, MongoDB connection, env validation, test config, and app shell foundation.
**Scope:** Strictly structural configuration without domain logic.
**Dependencies:** None.
**Deliverables:**
- Initialized repository
- Baseline route structure
- Prisma connection working
- Environment config working
- App shell rendering

### Phase 2 — Domain Models & Validation Layer
**Goal:** Create core TypeScript types, Zod schemas, Prisma models, and repository interfaces.
**Scope:** Creating the schema contract that all future layers will consume. Match model must support `totalRounds`, `shotsPerRound`, and optional `playoffShotsPerRound` (defaults to `shotsPerRound` when absent). ThrowEvent remains per shot; round score is derived from sum of shots.
**Dependencies:** Phase 1.
**Deliverables:**
- Player model
- Match model (including shotsPerRound, optional playoffShotsPerRound; **basePlayerOrder** or equivalent persisted for rotating turn order)
- Round model
- ThrowEvent model (one per shot)
- PlayoffMatch model (including startingPlayerId, optional decidedByPlayerId)
- Achievement model
- Request/response schemas

### Phase 3 — Persistent Player Management
**Goal:** Implement persistent players in the database and expose player CRUD flows needed for match setup.
**Scope:** Basic data insertion, fetching, and simple selection UIs.
**Dependencies:** Phase 2.
**Deliverables:**
- Players API (Next.js Route Handlers)
- Player repository (Prisma abstractions)
- Player creation UI
- Player selection UI

### Phase 4 — Match Creation & Session Bootstrapping
**Goal:** Allow users to create a match, choose players (in base order), optionally shuffle before start, define rounds, shots per round, optional playoff shots per round, and initialize active match state.
**Scope:** Binding chosen players to a new Match record (totalRounds, shotsPerRound, optional playoffShotsPerRound, **basePlayerOrder** persisted). Base player order = user-selected order at setup; optional "Shuffle Players" before match start; once started, base order is fixed and persisted. Backward compatibility: matches without these fields behave as shotsPerRound = 1, playoffShotsPerRound = shotsPerRound; base order may be derived from matchPlayers order for legacy data.
**Dependencies:** Phase 3.
**Deliverables:**
- Match creation route (with shotsPerRound, optional playoffShotsPerRound)
- Base order capture; optional shuffle (before start only)
- Match initialization API
- Live match page bootstrapping
- Active match store initialization (Zustand shell)

### Phase 5 — Core Live Scoring Engine
**Goal:** Implement the shot (throw) event engine, round progression (shotsPerRound shots per player per round), total scoring (round score = sum of shots; match total = sum of round scores), and **rotating turn order**: startingPlayerIndex = (roundNumber - 1) mod playerCount; within each round, each player completes all shots then the next player.
**Scope:** This is the most complex domain logic. Must handle configurable shots per round, **base order** (fixed at match start), **rotating starting player** per round, turn order within a round (all shots per player then next), and Undo correctly. The live scoring UI includes a selector-derived round-by-round scoreboard (players as rows, rounds as columns; each cell = sum of shots in that round); scoreboard rendering belongs to this phase, not to analytics.
**Dependencies:** Phase 4.
**Deliverables:**
- Add throw (shot) flow with correct shot index / turn progression (rotating round order)
- Round progression (round complete when every player has taken shotsPerRound shots)
- Save-on-throw / save-on-round (Prisma sync)
- Refresh-safe match recovery
- Undo support for active session
- Current turn handling (player + shot index within round as needed)

### Phase 6 — Match Leaderboard & Tie-Break Logic
**Goal:** Implement match leaderboard computation and tie-break handling for ranking.
**Scope:** Derived computations resulting from the Live Scoring Engine.
**Dependencies:** Phase 5.
**Deliverables:**
- Rank calculation (regular totalScore from regular throws only)
- `roundScore` and `totalScore` logic
- Tie-break rules; tie-break logic must support shrinking tied subsets (sudden death continues for still-tied subset until ranking resolved)
- Sudden-death trigger state
- Sudden-death score visibility in the live match UI (separate from regular round scoreboard)

### Phase 7 — Playoff Engine
**Goal:** Implement player-count-based qualification and playoff progression logic.
**Scope:** The bracketing engine, seeding logic, and match generation UI based on the finalized Leaderboard. Playoff matches have **one round**; each player takes **playoffShotsPerRound** (or **shotsPerRound**) shots in that round. Playoff tie-break: sudden death with **1 shot per player** per cycle. **Playoff first-throw decision:** before each playoff match, one player (by decision rights) chooses who throws first; this must be persisted as **startingPlayerId** (and optionally decidedByPlayerId) on PlayoffMatch for deterministic recovery.
**Dependencies:** Phase 6.
**Deliverables:**
- Player-count-based progression: 2 players → no playoffs/final, highest total wins (tie-break decides rank 1/2); 3 players → top 2 to final only (no qualifier/eliminator); 4+ players → top 4 to playoffs
- Top-4 seeding (4+ players only)
- Qualifier 1 & Eliminator (3rd vs 4th) in parallel (4+ players); Qualifier 2 then Final derived
- Final (3-player: top 2; 4+: winner Q1 vs winner Q2)
- Playoff match scoring: one round, playoffShotsPerRound (or shotsPerRound) shots per player; playoff sudden death = 1 shot per player per cycle
- Playoff first-throw: decision rights (rank 1 for 3-player final and Q1; rank 3 for eliminator; higher score in prior completed playoff match for Q2; winner Q1 for Final 4+); persist startingPlayerId (and optionally decidedByPlayerId)
- Playoff persistence
- Champion determination
- **Playoff undo:** Undo last throw for the active playoff match (regulation and sudden-death). Server must validate by checking the **downstream dependent match throw count**, not only whether the downstream match exists. Dependency flow: Qualifier 1 ↔ Eliminator (parallel opening); each blocks the other for immediate downstream; full reconcile deletes Q2 + Final after Q1 or Eliminator undo; Q2 → Final; Final has no downstream. Undo is allowed until the first throw of the next dependent playoff match is recorded; downstream match existence or first-throw choice alone must not block undo.

### Phase 7.5 — Completed Match Outcome Summary UI
**Goal:** Implement the Match Outcome Summary UI shown when the regular match is finished, before the user navigates to playoffs or the final.
**Scope:** Documentation-only alignment in this phase; implementation follows existing phases. No schema change required.
**Dependencies:** Phase 6 (leaderboard and final resolved ranking), Phase 7 (playoff engine and progression rules).
**Deliverables:**
- **Final ranking display** — Rank number and player name from the final resolved regular-match ranking (including sudden-death resolution when applicable).
- **Winner / qualification display** — For 2 players: winner; for 3 players: qualified for final (top 2); for 4+ players: qualified for playoffs (top 4).
- **Pairing preview for next stage** — 3 players: final pairing (rank 1 vs rank 2); 4+ players: Qualifier1 (rank 1 vs rank 2) and eliminator opening (rank 3 vs rank 4; DTO may still label this block for display).
- **Support for 2 / 3 / 4+ player outcomes** — All player counts covered with correct labels and pairings.
- **Use of final resolved ranking** — UI must consume the same derivation source as playoff creation (e.g. `deriveSuddenDeath` → `deriveLeaderboardFromThrowEvents` → `deriveMatchOutcome`); must not infer ranking from raw totals alone.
- **Placement** — Summary shown after match completion, before “Go to playoffs” or next-stage navigation.

### Phase 8 — Match Completion & History
**Goal:** Finalize completed matches, persist immutable history, and expose history/detail views.
**Scope:** Transitioning from active Zustand state heavily into TanStack Query historical state.
**Dependencies:** Phase 7.
**Deliverables:**
- Match completion flow
- Immutable completed match record
- Match history API
- Match detail page
- Completed playoff bracket display

### Phase 9 — Analytics Foundation
**Goal:** Implement basic analytics queries computed from persisted data.
**Scope:** Server-side aggregation and fundamental TanStack UI integrations.
**Dependencies:** Phase 8.
**Deliverables:**
- `averageRoundScore`
- `bestThrow`
- `totalScore` stats
- Leaderboard summaries
- Per-player stats
- Analytics API surface

### Global Leaderboard (`/leaderboard`)
**Goal:** Cross-player ranking across completed matches only (separate from per-match live leaderboard).
**Scope:** See [global-leaderboard.md](./global-leaderboard.md): final resolved placement as ranking basis; tabs (Overall default, Wins, Avg Score, Total Points); Phase 9–aligned throw metrics; optional future weighted-score tab documented only.
**Dependencies:** Phase 8–9, canonical `getFinalPlacementFromPayload` in history layer.
**Deliverables:**
- `/leaderboard` Server Component + read-only tabbed table
- Shared final-placement helper covering all players per match (playoff ranks 1–4; non-qualifiers keep regular ranks 5+)

### Phase 10 — Advanced Analytics & Gamification
**Goal:** Implement richer insights and player-facing achievements.
**Scope:** Complex heuristics analyzing match momentum and badge rewarding.
**Dependencies:** Phase 9.
**Scoring rule:** Perfect Round = round score === shotsPerRound × 60 (maximum single throw = 60). Defined in `constants/scoringLimits.ts` via getMaxRoundScore(shotsPerRound).
**Deliverables:**
- Momentum timeline
- Comeback detection
- Clutch performance
- Round heatmap
- Match energy meter
- Achievements
- Player archetypes

### Phase 11 — UI Polish & Motion
**Goal:** Apply the design system fully and add motion where it improves UX.
**Scope:** Integrating Framer Motion, standardizing tokens, and aesthetic alignments.
**Dependencies:** All prior phases.
**Deliverables:**
- GlassCard polish
- Animated leaderboard changes
- Score pulse interactions
- Bracket transitions
- Final dashboard polish

### Phase 12 — Charts & Data Visualization
**Goal:** Introduce a reusable chart system (Recharts) across Analytics and Player Profile with consistent spacing, typography, and color tokens; no new backend unless required.
**Scope:** Chart system foundation, analytics page charts, player profile charts (existing data only), heatmap enhancement, responsiveness verification. Charts integrate with GlassCard; no new container components.
**Dependencies:** Phase 11.
**Detailed plan:** See [Phase 12 plan (Charts & Data Visualization)](./phase-12-plan.md) for task groups, implementation order, verification criteria, and step-by-step breakdown.
**Deliverables:** (See phase-12-plan.md.)
- Recharts-based chart system with shared wrappers and theme
- Analytics page charts using existing data
- Player profile charts using existing analytics only
- Round heatmap enhancement
- Responsive behavior documented and verified

### Phase 13 — Testing, Hardening, and Launch Readiness
**Goal:** Turn DartPulse from feature-complete into launch-ready: test coverage (unit, integration, e2e), edge-case hardening, regression protection, release checklist. No new product features.
**Scope:** Test-data strategy; golden fixtures; unit tests (domain); chart smoke tests; integration tests (APIs); e2e with scope discipline; read-only history assertions; build/hydration/production readiness.
**Dependencies:** Phase 12.
**Detailed plan:** See [Phase 13 plan (Testing, Hardening, and Launch Readiness)](./phase-13-plan.md).
**Deliverables:** (See phase-13-plan.md.) Unit tests for leaderboard, sudden death, turn, progression, playoff undo; chart component smoke tests; integration tests for match/playoff APIs; e2e specs (lifecycle, sudden death/playoff, history/resume/read-only, analytics/leaderboard/players, theme/charts); golden fixtures; launch checklist.

---

## 4. Detailed Workstreams
To effectively organize tasks, parallelize when appropriate across these independent workstreams:

- **Frontend Shell & Routing:** Setup, layouts, basic navigation.
- **Domain Logic & Repositories:** Zod validation, TS interfaces, Prisma repos.
- **Persistence & Database:** MongoDB tuning, migrations, seeding operations.
- **State Management:** Zustand store mapping, TanStack provider hooks.
- **APIs:** Next.js Route handlers consuming the repos.
- **Analytics:** Data-aggregation pipeline algorithms.
- **Testing:** Unit configurations and E2E playwright definitions.

*Note: Domain Logic must completely precede APIs, and APIs must completely precede State Management bindings.*

---

## 5. Dependency Graph Between Phases
- **Player Persistence** (Phase 3) must exist before **Match Setup** (Phase 4) is finalized.
- **Match Engine** (Phase 5) must exist before **Leaderboard** (Phase 6).
- **Leaderboard** (Phase 6) must exist before **Playoff Engine** (Phase 7).
- **Immutable Completion** (Phase 8) must exist before stable **Analytics** (Phase 9 & 10).
- **Analytics API** should exist before **Analytics UI** polish.

---

## 6. Cursor-Oriented Implementation Strategy
When delegating chunks of this project to Cursor or an AI coding assistant, enforce this strict order:

1. **Generate shared types BEFORE repositories.**
2. **Generate repositories BEFORE route handlers.**
3. **Generate route handlers BEFORE TanStack hooks.**
4. **Generate hooks BEFORE feature pages.**
5. **Generate UI in thin layers over stable domain logic.**

**Prohibitions for AI:**
- Do not start analytics pages before analytics APIs and repository aggregate queries exist.
- Do not start playoff UI before the strict playoff engine domain formula is implemented.

---

## 7. Milestones and Exit Criteria

### Milestone A — Scaffolding Complete
**Exit Criteria:** Project runs locally without errors, database connects perfectly, baseline Tailwind shell loads on standard routing.

### Milestone B — Core Match Playable
**Exit Criteria:** User can comfortably create a match, attach real players, enter standard throws, randomly refresh the page, and comfortably resume scoring without data loss.

### Milestone C — Tournament Playable
**Exit Criteria:** A finalized leaderboard accurately spawns a Top 4 Playoff bracket, which properly resolves into a final Champion logic path.

### Milestone D — History Stable
**Exit Criteria:** Completed matches can be robustly retrieved via API and reviewed visually. Attempts to edit historical match records are systematically blocked.

### Milestone E — Analytics Usable
**Exit Criteria:** Users can view reliable, high-performance player and general match analytics generated completely by Server Components.

---

## 8. Risk Areas and Mitigations

- **Backward compatibility:** Matches created without `shotsPerRound` or `playoffShotsPerRound` must be treated as `shotsPerRound = 1` and `playoffShotsPerRound = shotsPerRound` so existing match behaviour is preserved.
- **Risk:** State drift between DB and client Zustand memory.
  - **Mitigation:** Rely on "Persistence-First" architectures. The DB writes heavily authorize the local store confirmation.
- **Risk:** Route handler logic becoming bloated.
  - **Mitigation:** Strictly enforce thin handlers; heavily utilize isolated `/lib/repositories/` slices.
- **Risk:** Analytics queries freezing the Node.js boundary under load.
  - **Mitigation:** Process analytics entirely server-side. Invest in database indexing early for aggregate paths.
- **Risk:** Tie-break rules generating broken matrices.
  - **Mitigation:** Unit test the tie-break algorithm in absolute isolation away from Next.js.
- **Risk:** Overbuilding UI before backend.
  - **Mitigation:** Explicitly restrict prompt iterations strictly to Domain and Repository layers before moving to front-end construction.

---

## 9. Suggested First Development Tasks
To immediately kickstart development aligning with this document:

1. Initialize Next.js project with pnpm (App Router + TS).
2. Configure Tailwind, shadcn/ui, and Framer Motion baselines.
3. Initialize Prisma with MongoDB adapter.
4. Add environment validation layers.
5. Create base folder structure explicitly matching the architecture rules.
6. Scaffold the App Shell (Top header, dark styling).
7. Define core domain TS Types mapping entities.
8. Define initial Prisma schema models bridging the TS types.
9. Create the isolated repository interfaces.
10. Create the localized Player API and Match Bootstrap setup wrappers.
