# Project Scaffolding Document: DartPulse

## 1. Scaffolding Goals
This document defines the practical implementation scaffold for DartPulse, translating the Architecture and Technology Decisions into actionable structural blueprints. 

The goal is to define:
- **initial repository structure** explicitly.
- exact **setup steps** required to boot the repository.
- **base dependencies** to install.
- **shared patterns** enforcing consistency across full-stack boundaries.
- **implementation order** for predictable development without blockers.
- **reusable foundations** necessary before feature logic is coded.

By following this, engineers and AI-assisted tools (like Cursor) will establish a reliable, standardized foundation optimized for speed, maintainability, and correct abstraction.

---

## 2. Initial Project Setup
Follow this exact sequence to bootstrap the DartPulse repository:

1. **Initialize the Next.js App (TypeScript & App Router):**
   ```bash
   pnpm create next-app dartpulse \
     --typescript \
     --tailwind \
     --eslint \
     --app \
     --src-dir false \
     --import-alias "@/*"
   cd dartpulse
   ```
2. **Setup pnpm:**
   pnpm should already be installed on the developer machine, or installed using:
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
3. **Install Core State & Animation Dependencies:**
   ```bash
   pnpm add framer-motion zustand @tanstack/react-query
   ```
4. **Install UI & Icon Tools:**
   ```bash
   npx shadcn-ui@latest init
   pnpm add lucide-react
   ```
5. **Install Database & Validation Dependencies:**
   ```bash
   pnpm add prisma @prisma/client zod
   pnpm exec prisma init
   ```
6. **Install Testing Ecosystem:**
   ```bash
   pnpm add -D vitest @testing-library/react @testing-library/jest-dom @playwright/test
   pnpm exec playwright install
   ```

---

## 3. Recommended Root Folder Structure
Ensure the repository mirrors this root-level structure:

```text
/
├── app/          # Next.js App Router (pages, layouts, and API route handlers)
├── components/   # Shared global UI (primitives, layout shells)
├── features/     # Encapsulated domain logic and feature-specific components
├── store/        # Global Zustand state definition and selectors
├── hooks/        # Shared global React hooks (e.g., TanStack queries)
├── lib/          # Global configurations, Prisma DB instance, validators
├── types/        # Global TypeScript interfaces
├── utils/        # Agnostic helper functions (formatting, pure math)
├── constants/    # Static configurations, enums, rulesets
├── prisma/       # Prisma schema and seed scripts
├── public/       # Static assets (images, fonts, manifesting)
├── styles/       # Global CSS and Tailwind directives
├── tests/        # Automated testing directories
└── docs/         # Project documentation (PRD, Architecture, this document)
```

---

## 4. Next.js Route Scaffolding
Scaffold the `/app` router precisely with the following tree:

**Frontend Pages:**
- `/app/page.tsx` → The Home dashboard.
- `/app/match/new/page.tsx` → Match configuration and player select.
- `/app/match/[matchId]/page.tsx` → Live scoring dartboard.
- `/app/playoffs/[matchId]/page.tsx` → Interactive tournament bracket.
- `/app/leaderboard/page.tsx` → Live dynamic rankings.
- `/app/history/page.tsx` → Paginated match logs.
- `/app/history/[matchId]/page.tsx` → Deep dive on a single completed match.
- `/app/analytics/page.tsx` → Charting and global insights.
- `/app/players/[playerId]/page.tsx` → Isolated player history and badges.

**API Route Handlers:**
- `/app/api/players/route.ts` & `[playerId]/route.ts` → Fetch/mutate players.
- `/app/api/matches/route.ts` 
- `/app/api/matches/[matchId]/route.ts` → Manage specific active matches.
- `/app/api/throws/route.ts` → Log/undo standard `ThrowEvent`s.
- `/app/api/playoffs/route.ts` → Seed and update `PlayoffMatch` blocks.
- `/app/api/leaderboard/route.ts` → Retrieve compiled global rankings.

---

## 5. Feature Module Scaffolding
The `features/` directory slices business domains. Create the following modules:

- `matchSetup/`
- `liveMatch/`
- `leaderboard/`
- `playoffs/`
- `analytics/`
- `matchHistory/`
- `playerProfile/`

**Standard Internal Structure for a Feature Module:**
```text
features/liveMatch/
├── components/   # UI strictly used for live scoring (e.g., TargetBoard)
├── hooks/        # Local state adapters for the module
├── services/     # Feature-specific API clients
├── utils/        # Specific parsers for this domain
└── types/        # Narrow types only used here
```

---

## 6. Shared UI Component Scaffolding
Initialize the `components/` directory starting with primitives wrapped by `shadcn/ui`, then construct the required custom game blocks.

**Foundational Shells:**
- `AppShell`
- `SidebarNav`
- `TopBar`
- `PageHeader`
- `GlassCard`
- `PrimaryButton`
- `SecondaryButton`
- `StatCard`
- `ModalShell`
- `ThemeToggle`

**Game-Specific Abstractions:**
- `ScorePad`
- `PlayerCard`
- `LeaderboardTable`
- `BracketNode`
- `MomentumPanel`
- `AchievementBadge`
- `RoundTracker`

*Rule:* Map component behavior over strictly typed props relying on `camelCase` keys.

---

## 7. Store Scaffolding
Use Zustand inside `/store/`. Scaffold the store by splitting state, actions, and selectors logically.

**Recommended Initial Files:**
- `store/useMatchStore.ts` (Core unified Zustand store)
- `store/selectors.ts` (Derived analytics, e.g., Match Leaderboard rankings)
- `store/actions.ts` (Abstracted business operations)
- `store/types.ts` (Strict typing of the state shape)

**Initial State Targets to Implement:**
```typescript
{
  activeMatch: null,
  matchPlayers: [],
  rounds: [],
  throwEvents: [],
  currentTurn: null,
  matchLeaderboard: [],
  playoffState: "pending",
  playoffMatches: [],
  suddenDeathState: null,
  analyticsFilters: {},
  globalPlayerStats: {},
  uiFlags: {}
}
```

---

## 8. Server State / Query Scaffolding
TanStack React Query handles all asynchronous synchronization from the Next API routes.

**Scaffold Sequence:**
1. Configure `QueryClientProvider` in your root layout `app/layout.tsx`.
2. Map query keys centrally (`constants/queryKeys.ts`) to avoid typos.
3. Build isolated custom hooks in `/hooks/` wrapping query logic.

**Example Target Hooks:**
- `usePlayersQuery`
- `useMatchQuery`
- `useMatchHistoryQuery`
- `useLeaderboardQuery`
- `useAnalyticsQuery`

*Rule:* Never mix Zustand fast-interaction state with TanStack's remote persistence cache.

---

## 9. Prisma and Database Scaffolding
Initialize `/prisma/schema.prisma` mapping directly to the entity definitions.

**Configuration:**
- Set `provider = "mongodb"`.
- Configure `env("MONGODB_URL")`.

**Model Placeholders (camelCase mapped to DB types):**
- `model Player { ... }`
- `model Match { ... }`
- `model Round { ... }`
- `model ThrowEvent { ... }`
- `model PlayoffMatch { ... }`
- `model Achievement { ... }`

**Database Access Helpers:**
- Scaffold the singleton connection at `lib/db.ts`.
- Place granular queries in `lib/repositories/` to keep route handlers clean.

---

## 10. API Layer Scaffolding
Next Route Handlers must strictly adhere to a three-tier design.

**For each API route domain, separate:**
- **Route File** (`app/api/**/route.ts`): Parses HTTP incoming, parses URL params.
- **Request Validation** (`lib/validators/*.ts`): Runs Zod schemas against payloads.
- **Domain Services / Repository** (`lib/repositories/*.ts`): Actually runs the Prisma logic.

*Rule:* `route.ts` should remain remarkably thin, delegating all complex logic to services. 

---

## 11. Validation Scaffolding
Implement `Zod` schema definitions strictly relying on `camelCase`.

**Locations:**
- `lib/validators/` or `lib/schemas/`

**Targets:**
- Request payloads (e.g., `AddThrowPayloadSchema`)
- Environment variable validation (`envSchema`)
- Persistence sanity checks (preventing corrupted local caches)

---

## 12. Theme and Styling Scaffolding
Configure Tailwind and global CSS to support the product's requested neon/glass aesthetic.

- Implement themes dynamically via `tailwind.config.ts` mapping CSS Variables.
- Construct the `ThemeProvider` (e.g., `next-themes`).
- Scaffold CSS variables for `neon-green`, `glass-bg`, and typography tokens.
- *Rule:* Ensure all JS properties applying dynamic styling use standard `camelCase`.

---

## 13. Testing Scaffolding
Scaffold the `tests/` folder explicitly by scope to enforce quality boundaries.

**Folders:**
- `tests/unit/` (Vitest: tie-breaker algorithms, score aggregators)
- `tests/components/` (React Testing Library: ScorePad UI responses)
- `tests/e2e/` (Playwright: match creation to tournament final paths)

**First Recommended Test Suites:**
- Sudden-death tie-breaker resolution logic.
- Bracket generation deterministic sorting.
- ScorePad increment operations.

---

## 14. Environment and Config Scaffolding
Ensure these base configurations map correctly from day one.

**Config Targets:**
- `.env.local`: Supply `MONGODB_URL`, `NEXT_PUBLIC_APP_NAME="DartPulse"`.
- `tsconfig.json`: Enforce `"strict": true` and `"paths": { "@/*": ["./*"] }`.
- `.eslintrc.json`: Validate react hooks and Next.js standards.
- `vitest.config.ts` & `playwright.config.ts`: Define test root folders.

---

## 15. Recommended Implementation Order
Implement the architecture in this exact sequence to unblock layered dependencies progressively:

1. **Project initialization:** Folders, linters, TS configs.
2. **Theme and app shell:** Tailwind, Dark mode, `shadcn/ui` core.
3. **Prisma + MongoDB connection:** Schema sync and mock seeders.
4. **Base types and schemas:** Zod schemas and standard TS `interfaces`.
5. **Zustand store scaffold:** Empty object maps and placeholder actions.
6. **API route scaffolding:** Mocked response endpoints.
7. **Match setup flow:** UI to initialize a Match state object.
8. **Live match scoring:** The `ScorePad`, Turn logic, and Local Undo.
9. **Match leaderboard:** Derived UI state relying on scoring state.
10. **Playoff generation:** Bracketing UI and domain engine algorithm.
11. **Match history:** TanStack query integration with persistence layer.
12. **Analytics & Players:** Complex reporting dashboards.
13. **Testing and polish:** Tie-breakers and validation assurance.

---

## 16. Cursor-Friendly Development Guidance
When driving this project via an AI-assisted tool such as Cursor, enforce these directives in chat/composer:

- **Structure over Features:** Command structural folders and type scaffolding before asking for component logic.
- **Shared Types First:** Ensure `types/` are generated *before* tackling specialized component definitions to guarantee perfect IDE auto-completion.
- **Strict Separation:** Repeatedly block Cursor from embedding thick Prisma queries inside UI components; demand it builds thin route handlers calling isolated domain services.
- **Enforce camelCase:** Remind the AI model strictly that no `snake_case` fields are accepted in TypeScript interfaces, Prisma schemas, or JSON responses.

---

## 17. Deliverables Checklist
Ensure these scaffolding blocks are complete before beginning feature sprints:

- [ ] Next.js project initialized (App Router + TS).
- [ ] Tailwind configured with Arcadian/Neon tokens.
- [ ] `shadcn/ui` primitives installed.
- [ ] Zustand unified store structure stubbed.
- [ ] TanStack Query provider and query key mappings.
- [ ] Prisma initialized with base Schema.
- [ ] MongoDB connection helper ready.
- [ ] Next.js App Routes structurally scaffolded (Blank Pages).
- [ ] API Route wrappers stubbed.
- [ ] Foundational UI components mapped.
- [ ] Vitest/Playwright folders generated.
- [ ] `.env` and lint configurations locked.
