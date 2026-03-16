# Technology Decisions Document: DartPulse

## 1. Technology Overview
This document outlines the implementation technology choices and rationale for the DartPulse application. The architecture aligns with the previously established Product Requirements Document (PRD) and Architecture Document. 

The selected technology stack is:
- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons
- **State Management:** Zustand, TanStack Query
- **Backend:** Next.js Route Handlers
- **Database:** MongoDB
- **Data Access Layer:** Prisma ORM with MongoDB connector
- **Testing:** Vitest, React Testing Library, Playwright
- **Deployment:** Vercel, MongoDB Atlas
- **Package Manager:** pnpm

These tools work together to provide a seamless, type-safe, and highly performant full-stack development experience, allowing frontend UI, global state, backend APIs, and persistence modeling to coexist efficiently.

---

## 2. Frontend Framework Decision
**Framework:** Next.js (App Router)

Next.js was selected due to its powerful feature set that perfectly aligns with DartPulse's requirements:
- **File-based routing:** Intuitive directory-based routing simplifies page management.
- **Server Components:** Reduces client-side bundle size, improving performance.
- **Full-stack support:** Allows both the rich interactive frontend UI and the backend APIs to exist within the same unified repository.
- **Easy deployment on Vercel:** Seamless CI/CD integration.

---

## 3. Language Decision
**Language:** TypeScript (strict mode)

TypeScript brings essential rigor to the complex state management inherent in DartPulse:
- **Type safety:** Prevents runtime bugs critical during live scoring events.
- **Better maintainability:** Makes the large event arrays and state shapes inherently documented.
- **Safer refactoring:** Ensures that architecture modifications won't silently break downstream dependencies.
- **Strong IDE support:** Accelerates AI-assisted development (e.g., Cursor) and logic completion.
- **Alignment with Prisma schema types:** Provides continuous end-to-end type safety from the UI down to the database schema.

---

## 4. UI System Decision
- **UI Framework:** Tailwind CSS
- **Component Library:** shadcn/ui
- **Icons:** Lucide
- **Animation:** Framer Motion

While `shadcn/ui` provides excellent, highly customizable, accessible foundational primitives (e.g., dialogs, dropdowns), DartPulse will heavily implement **custom gameplay UI components**. Tailwind CSS provides the atomic styling flexibility needed to rapidly build these, while Framer Motion handles the dynamic state animations required for an "arcade" feel.

**Examples of custom components:**
- `ScorePad`
- `PlayerCard`
- `LeaderboardTable`
- `BracketNode`
- `MomentumPanel`
- `AchievementBadge`

---

## 5. State Management Strategy
DartPulse requires a strict separation between client-side interactive state and server-side data synchronization.

- **Client State: Zustand**
  - Used for rapid, highly mutable in-memory data: active match state, current round layout, the current player's turn, temporary UI configuration, and immediate gameplay interactions.

- **Server State: TanStack Query**
  - Used for asynchronous API data fetching, caching, and synchronization: retrieving match history, pulling global leaderboards, fetching player profiles, and loading heavy analytics data.

---

## 6. Backend Architecture Decision
**Backend Implementation:** Next.js Route Handlers

The API is structured directly within the Next.js App Router under `/app/api/*`.
**Examples:**
- `/api/players`
- `/api/matches`
- `/api/matches/[matchId]`
- `/api/throws`
- `/api/playoffs`
- `/api/leaderboard`

**Rationale:**
- Maintains a single monolithic repository for ease of development.
- Drastically simplified deployment process.
- Tight integration with the React frontend codebase.
- Provides the organizational ability to later extract the backend into a standalone microservice structure if the product scales significantly.

---

## 7. Database Decision
**Database:** MongoDB

MongoDB is an exceptional fit for DartPulse:
- **Flexible schema:** Easily handles varied `ThrowEvent` payloads and evolving player statistics.
- **Excellent for event-style data:** The chronological sequencing of throws perfectly maps to MongoDB document structures.
- **Fast iteration:** No rigid migrations required during early MVP development.
- **Excellent cloud hosting:** Fully managed through MongoDB Atlas.

**Expected Collections:**
- `players`
- `matches`
- `rounds`
- `throwEvents`
- `playoffMatches`
- `achievements`

While MongoDB collections may remain plural nouns, **fields inside documents follow camelCase**.

---

## 8. Data Access Layer
**ORM:** Prisma with MongoDB connector.

**Benefits:**
- **Type-safe queries:** Queries guarantee that the data mapping exactly matches the TypeScript entity models.
- **Schema-driven modeling:** Prisma abstracts the database structure directly reflecting the entities defined in the Architecture Document.
- **Clean TypeScript integration:** Minimizes boilerplate mapping logic.
- **Simplified database access:** Reduces risk of injection logic and complex raw query management.

Prisma models will follow the same **camelCase** naming convention.

**Example fields:**
- `playerId`
- `matchId`
- `roundNumber`
- `turnIndex`
- `createdAt`

This ensures seamless mapping between Prisma models, TypeScript types, and API responses.

**Example API Response:**
```json
{
  "matchId": "123",
  "roundNumber": 2,
  "playerId": "p1",
  "score": 50
}
```

---

## 9. Persistence Strategy
**Source of Truth:** Backend (MongoDB)

While local browser storage will be used for instantaneous match recovery in case of a tab crash, and saving user UI preferences (like dark mode), it is *not* the primary store. 

**Data Flow:**
`UI` → `API` → `MongoDB`

The backend always remains the absolute authoritative data source for matches, history, and global rankings.

---

## 10. Match Save Strategy
DartPulse generates a high volume of scoring events. Throws are persisted using a hybrid strategy to balance performance with safety:

1. **Throw entered** (e.g., Player hits '50')
2. → **UI state update** (Instant optimistic visual update via Zustand)
3. → **Debounced API call** (Groups multiple rapid throws over a short time window)
4. → **Guaranteed save** (A forced flush/save ensures all queued throws are persisted to MongoDB strictly at round completion).

This prevents excessive database writes while ensuring gameplay progress is fundamentally never lost.

---

## 11. Player Model
For the MVP, strict authentication boundaries (like passwords/OAuth) are fundamentally not required.

**Model details:**
- Players represent conceptual game participants rather than traditional authenticated user accounts.
- Players can be created rapidly within the app interface to instantly start a match.
- **Core fields:** `playerId`, `name`, `avatarColor`, `statistics`.
- Robust authentication and user-claimed profiles can be introduced seamlessly in a later V2 update.

---

## 12. Realtime Strategy
Realtime gameplay synchronization is conceptually supported via a **WebSocket abstraction layer**.

This prepares the architecture for:
- Live remote score updates on observer devices.
- Multiplayer scoreboard synchronization across the room.
- Future truly online remote matches.

By building state dispatch actions behind a realtime abstraction, the core logic remains completely agnostic to how the events are pushed.

---

## 13. Analytics Strategy
Analytics enforce a **hybrid computation model**.

- **Computed Live:** Immediate dashboard metrics (e.g., active round leader, highest single throw in the current match).
- **Computed on Match Finish:** Aggregations for the global leaderboard (e.g., updating a player's lifetime win count, unlocking achievements).
- **Computed on Analytics Render:** Extremely heavy time-series calculations or cross-match visualizations are recomputed only when the user requests the analytics page.

**Examples of analytics metrics calculated:**
- Average round score
- Best throw
- Momentum timeline mapping
- Player streaks (Wins, Bullseyes)
- Achievement unlocks

---

## 14. Testing Strategy
A robust, layered testing strategy ensures the scoring logic remains absolutely deterministic:
- **Unit Testing (Vitest):** To validate the pure domain logic (e.g., tie-breaker rule sets, playoff bracket seeding logic) where fast, isolated execution is critical.
- **Component Testing (React Testing Library):** To ensure custom gameplay UI components (like the `ScorePad`) render interactions exactly as intended given mocked state.
- **End-to-End Testing (Playwright):** To validate critical user flows (e.g., from Match Creation -> Live Scoring -> Playoff Champion declaration) exactly as a real user would experience them.

---

## 15. Deployment Strategy
- **Deployment Platform:** Vercel
- **Database Hosting:** MongoDB Atlas

Because Vercel inherently understands the App Router, Next.js UI rendering, and integrated API Route Handlers are packaged, optimized, and deployed together effortlessly as a single highly-available artifact communicating with Atlas.

---

## 16. Package Manager
**Package Manager:** pnpm

`pnpm` is selected over `npm` or `yarn` for:
- **Faster installs:** Symlinked node_modules ensure near-instantaneous dependency loading.
- **Disk-efficient dependency management:** Downloads and stores a single copy of a package version globally.
- **Strict dependency resolution:** Prevents phantom dependency issues by strictly enforcing the `package.json`.
- **Excellent support:** Highly recommended and standardized across modern Next.js/TypeScript JavaScript tooling.

---

## 17. UI Theming
DartPulse inherently supports both **dark mode and light mode** viewing, though it is optimized for high-contrast viewing.

**Visual Design Implementation:**
- Neon arcade accents
- Glassmorphism UI panels
- Sports broadcast scoreboard styling

Themes are fluidly implemented using the combination of **Tailwind configuration** and global CSS custom properties (variables), allowing components to instantly switch color schemes dynamically without JS overhead.

---

## Naming Conventions

DartPulse uses **camelCase consistently across the entire application**. We strictly avoid using `snake_case` in the codebase.

This convention applies to:
- TypeScript variables
- object properties
- database fields
- API payload fields
- state store keys
- analytics fields

This ensures consistency between:
- Frontend code
- API responses
- database models
- analytics computations

### Examples

**Correct:**
- `playerId`
- `matchId`
- `roundNumber`
- `throwEvents`
- `playoffMatches`
- `averageRoundScore`

**Incorrect:**
- `player_id`
- `match_id`
- `round_number`
- `throw_events`
- `playoff_matches`
