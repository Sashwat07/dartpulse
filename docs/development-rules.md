# Development Rules: DartPulse

## 1. Purpose of This Document
This document defines the strict engineering standards and coding rules for the DartPulse application. It must be followed by **both human developers and AI coding tools (such as Cursor)**. 

The goal of these rules is to ensure a radically consistent architecture, clean and predictable code organization, enforce maintainable long-term development patterns, and prevent AI assistants from generating out-of-bounds tech debt. 

This document acts as an implementation rulebook extending the finalized PRD, Architecture, Tech Decisions, Project Scaffolding, and Design System documents.

---

## 2. Core Next.js Architecture Rules
DartPulse strictly adheres to the Next.js App Router paradigms.

- **Prefer Server Components by default.** 
- **Use Client Components (`"use client"`) only when strictly necessary.**

### Server / Client Component Boundary

Server Components must never import client-only libraries such as:
- Zustand
- Framer Motion
- browser APIs (window, document, localStorage)

Client Components should only exist when interactivity or client state is required.

Server Components should remain the default rendering mechanism because they avoid unnecessary client JavaScript and improve performance.

**Client boundaries should only be enacted for:**
- UI interactivity (stateful hovers, forms).
- Browser APIs (LocalStorage, window width).
- Animations using Framer Motion.
- Zustand usage.
- Local React UI state (`useState`, `useRef`).

*Pages and layouts must remain as lightweight as possible to ensure fast initial loads and favorable metrics.*

---

## 3. Folder Organization Rules
The repository enforces a **feature-first organization** to limit global bloat.

**Key Rules:**
- Shared global components are physically separated from feature-specific components.
- Domain logic is decoupled from UI presentation.
- Pure utilities are comprehensively isolated.

**Structure Context:**
- `app/` → strictly Next.js routing and layout matrices.
- `components/` → Reusable primitives and global shells (e.g., AppShell).
- `features/` → Granular business domains (e.g., `liveMatch/`, `playoffs/`).
- `lib/` → Configuration, Prisma instantiation, and global abstractions.
- `store/` → Zustand domains.
- `types/` → Type declarations shared globally.
- `validators/` → Zod schema validators.
- `hooks/` → Reusable custom React hooks and Query wrappers.

---

## 4. Component Design Rules
Component definition must prioritize explicit readability.

**Rules:**
- **Keep components small and focused.**
- **Avoid large monolithic components.** Slices of UI exceeding 150 lines should usually be decomposed.
- **Separate presentational and logic-heavy components.** 
- **Props must be fully typed with TypeScript.** (No `any` or loose `Record<string, unknown>`).
- UI components **should not** contain raw domain logic (e.g., calculating a tie-breaker inside a table row cell).
- Domain logic must live explicitly in services or feature-level `utils/`.
- Reusable primitives mapped from the Design System should exist directly inside `/components/ui/`.

---

## 5. State Management Rules
DartPulse fundamentally separates standard UI state from authoritative remote data.

**Zustand (Client State):**
Used strictly for instantaneous interactions and short-lived session context:
- Gameplay state (throws, active turn).
- Round tracking.
- Match leaderboard ordering calculations.
- Local UI interaction states (modal flashes).

**TanStack Query (Server State):**
Used strictly for caching remote API data representing the authoritative source of truth:
- Server API data polling.
- Match history retrieval.
- Deep analytics dataset queries.

**Rules:**
- **Never duplicate server state into Zustand** unless deliberately buffering a controlled, disconnected live session.
- **Use selectors** to derive computed values inside Zustand.
- **Avoid storing derived data redundantly** in raw state memory.
- **Round scores, total scores, and leaderboards must always be derived from ThrowEvent data.** Each ThrowEvent represents one shot. Round score = sum of shot scores in that round for that player; match total = sum of round scores. Do not persist round totals or leaderboard snapshots as separate source-of-truth fields. Selectors are the preferred mechanism for deriving live scoreboard views.
- **Base player order and turn order:** The Match persists the fixed player order (**basePlayerOrder** or equivalent). Base order = user-selected order at setup (or shuffled before match start only); once the match starts, it is fixed. **Regular match turn order must always be derived from:** **basePlayerOrder**, **roundNumber**, and **shotsPerRound** — not from transient UI state. Rotating start: `startingPlayerIndex = (roundNumber - 1) mod playerCount`; within each round, each player completes all shots then the next player. **Refresh/recovery** must reconstruct turn position from persisted data; rotating round-start logic depends on the persisted base order.
- **Shots per round:** Match configuration includes `shotsPerRound` (regular match) and optional `playoffShotsPerRound` (playoff matches; defaults to `shotsPerRound`). Playoff matches have one round with that many shots per player. Sudden death always uses **1 shot per player** per cycle; tied players maintain a fixed order during sudden death. When configuration is absent (e.g. legacy matches), treat as `shotsPerRound = 1`, `playoffShotsPerRound = shotsPerRound`.
- **Playoff first throw:** Before each playoff match, one player (by decision rights: rank 1 for 3-player final and Q1; rank 3 for **eliminator** (3rd vs 4th); higher score in *previous playoff match* for **Qualifier 2**; winner Q1 for Final 4+) decides who throws first. Persist **startingPlayerId** (who was **actually chosen** to throw first) and optionally **decidedByPlayerId** (who **had the right** to choose) so recovery is deterministic. The distinction is explicit: one had the decision right, the other is the chosen starting thrower. Bracket order for 4+ players: Q1 ∥ Eliminator → Q2 → Final (see `docs/prd.md` §3.4).
- **Regular vs sudden-death scores:** Regular-round scores and sudden-death scores must remain logically separate. Regular leaderboard totals come only from regular ThrowEvent records (eventType/round within regular rounds). Sudden-death results determine ordering among tied players only; they do not change regular totalScore. Tie-break logic must support shrinking tied subsets (sudden death continues for the still-tied subset until ranking is resolved). Progression logic (winner, final, playoffs) must follow player-count rules exactly: 2 players → no playoffs/final, highest total wins; 3 players → top 2 to final; 4+ players → top 4 to playoffs.
- **Playoff undo:** Playoff undo is allowed until the first throw of the **downstream dependent** playoff match is recorded (dependency graph: Q1 ↔ Eliminator as parallel opening; then Q2; then Final — see `docs/prd.md` §Playoff Undo). The lock condition is: the downstream dependent match has **at least one persisted throw**. Downstream match existence alone (row created, bracket visible, starting player selected) must **not** block undo. The client must rely on server validation; the client must not determine bracket safety by itself. Undo remains scoped to the current playoff match and the last throw of that match; it must never affect regular-match throws or unrelated playoff matches.

---

## 6. Data Fetching Rules
Data must flow down clearly defined channels.

**Preferred Fetching Hierarchy:**
1. Server Components (Direct asynchronous execution on the server).
2. Route Handlers (If required to be requested by a client transition).
3. TanStack Query (For all client-side asynchronous needs to internal API bounds).

**Rules:**
- Heavy analytics queries **must** run server-side (do not ship dense historic raw data to the client to `reduce()`).
- UI components **should not directly execute database queries**.
- Always use structured hook factories (e.g., `useAnalyticsQuery`) for repeated API calls rather than loose `fetch()` calls locally.

---

## 7. Route Handler Rules
Route handlers serve solely as structural transport APIs.

**Rules:**
- They must remain as **thin transport layers**.
- **Validate all request payloads** using Zod middleware before proceeding.
- **Call decoupled service layers** for business logic.
- **Never implement complex domain logic directly inside route handler endpoints.**

**All standardized responses must:**
- Exclusively return `camelCase` fields.
- Return fully typed JSON responses to bridge TanStack hooks.

---

## 8. Database Rules (Prisma + MongoDB)
**Rules:**
- Prisma is the **only acceptable database access layer**.
- **No raw Mongo queries** inside UI, utilities, or route handlers.
- Database models natively follow the unified `camelCase` naming conventions.

**Isolation Rule:**
- The repository layer located in `/lib/repositories/` should encapsulate all complex Prisma access routines. Avoid leaking `db.match.create()` syntax outward; instead expose `MatchRepository.initiateMatch()`.

---

## Environment Variable Rules

All environment variables must be accessed through a centralized configuration layer.

**Rules:**
- Environment variables must be validated using Zod during application startup.
- Avoid accessing `process.env` directly across multiple files.
- Sensitive secrets (database credentials, API keys) must never appear in client-side code.
- Public environment variables must follow the `NEXT_PUBLIC_` prefix convention.

This ensures predictable configuration management and prevents runtime crashes due to missing variables.

---

## Performance Optimization Rules

Performance must be optimized by prioritizing server rendering and minimizing unnecessary client re-renders.

**Rules:**
- Prefer Server Components over Client Components whenever possible.
- Memoization techniques (`React.memo`, `useMemo`, `useCallback`) should only be used inside Client Components when components re-render frequently.
- Server Components do not require memoization because they render once on the server.
- Large analytics datasets must be processed server-side instead of in browser loops.
- Avoid unnecessary re-renders in frequently updating UI elements such as leaderboards or score widgets.

---

## Import Path Rules

To maintain readable imports and prevent deep relative paths, the project must use absolute imports.

**Rules:**
Prefer absolute imports using the `@/` alias.

Example:
```typescript
import { Leaderboard } from "@/features/leaderboard/components/Leaderboard"
```

Avoid deep relative imports such as:
```typescript
import { Leaderboard } from "../../../../components/Leaderboard"
```

Absolute imports improve maintainability and reduce refactoring risk.

---

## 9. Validation Rules
Reliable validation protects the database and UI from injection and corruption.

**Rules:**
- **Validate all request payloads** at the boundary using predefined Zod schemas.
- **Validate environment variables** immediately at application startup.
- **Validate persisted local state** explicitly before hydrating Zustand (vital to prevent corrupted LocalStorage from crashing the client).
- **Never trust external input.**

---

## 10. Styling Rules
All UI presentation must derive from the established `design-system.md` file.

**Rules:**
- Utilize strictly **Tailwind CSS**.
- **Do not hardcode colors** loosely (`#00FFFF`) outside mapped Tailwind semantic tokens (e.g., `text-primary-neon`).
- The `GlassCard` abstraction must be used as the base container for nearly all bounded dashboard elements.
- Animations must follow Framer Motion standards predefined in the architecture and design systems.

---

## 10b. Global Leaderboard (`/leaderboard`)

- **Scope:** Completed matches only. No Zustand; server-derived read model.
- **Ranking basis:** Final resolved placement per match via shared history helper `getFinalPlacementFromPayload` (all players: playoff bracket ranks 1–4 for qualifiers; ranks 5+ from regular leaderboard for non-qualifiers). See [global-leaderboard.md](./global-leaderboard.md).
- **Tabs:** Overall (default), Wins, Avg Score, Total Points — each tab is a sort order on the same standings; default Overall = wins DESC, average finish ASC, average round score DESC, best throw DESC.
- **Metrics:** Throw aggregates align with Phase 9 (regular-match throws only; exclude playoff; include sudden death).
- **Weighted score:** Not default. A future optional weighted tab may be added; do not replace the canonical tab model without product sign-off.

---

## 11. Animation Rules
**Framer Motion** is the single required source of truth for motion.

**Rules:**
- Use motion **only when it improves interaction clarity or feedback** (do not add arbitrary delays).
- Avoid excessive, long-duration animation blocking user loops.
- Follow motion durations strictly defined in the design system (`150ms`/`200ms`/`easeOut`).

**Acceptable Motion Examples:**
- Score update pulse.
- Leaderboard position spring movement.
- Playoff bracket transition reveals.

---

## 12. Naming Conventions
Consistency in DartPulse is non-negotiable across stack boundaries.

**`camelCase` for:**
- File variables
- API payloads
- Database fields
- Zustand store keys

**`PascalCase` for:**
- All React components
- TypeScript types and interfaces

**`kebab-case` allowed only for:**
- Next.js route segment folder names (e.g., `app/player-settings`) and CSS.

**Prohibited:**
- `snake_case` must **never** be used in application code.

---

## 13. Error Handling Rules
Define system behavior predictably when failure occurs.

**Rules:**
- **Never silently swallow errors** (`catch (e) { return null }`).
- Explicitly preserve local active match state in Zustand/LocalStorage when network degradation occurs.
- Show bounded, concise user-friendly toast/modal messages to communicate disruption.
- Log errors clearly with high verbosity in development mode.

---

## 14. Testing Rules
Automated testing must focus explicitly on core, high-stakes application value domains.

**Critical Areas to Test:**
- Score aggregation loops.
- Match leaderboard rank calculation arrays.
- Playoff deterministic generation logic (including player-count-based progression: 2 no playoffs, 3 top 2 to final, 4+ top 4 to playoffs).
- The sudden-death tie-breaker system, including shrinking tied subsets (sudden death continues for still-tied subset until ranking resolved) and correct rank assignment after resolution.

**Testing Layers:**
- **Unit tests:** For the isolated Match Engine utilities and formulas (Vitest).
- **Component tests:** For complex UI interaction tracking (React Testing Library).
- **E2E tests:** To prove full session execution through the GUI matching critical path flows (Playwright).

---

## 15. Cursor / AI Assistant Development Rules
This section controls automated generation heuristics. All AI coding assistants interacting with this codebase (e.g., Cursor, GitHub Copilot, Gemini) must rigorously adhere to these boundaries.

**AI tools must:**
- Strictly follow the definitions inside the Architecture Document.
- Generatively **build standard TS Types before** writing implementation logic to ensure robust mapping.
- **Never introduce `snake_case`** into new variables, API returns, or Prisma models.
- **Never place database calls (`prisma.*`) inside UI components** or client-side files.
- Always avoid mixing arbitrary UI structures with backend domain logic.
- Extensively preserve and utilize the established Next.js App Router folder structure (`app/`, `features/`, `components/`).
- Follow all standardized semantic tokens detailed inside `design-system.md` when rendering outputs.

**AI tools must treat this document and its parent documentation as the absolute source of truth above native predictive preferences.**

---

## 16. Definition of Done
Every feature pull request or code change explicitly satisfies these bounds:

- [ ] Follows Architecture Document conventions.
- [ ] Strictly maps to `camelCase` Naming Conventions.
- [ ] Validated deeply with Zod.
- [ ] Modifies correct separate state layer (Zustand interaction vs Server caching).
- [ ] Strictly applies Design System tokens natively.
- [ ] Includes domain appropriate Unit or E2E tests.
