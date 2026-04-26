# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev           # Start Next.js dev server
pnpm build         # Production build
pnpm lint          # Run ESLint
pnpm test          # Run unit/component/integration tests (Vitest)
pnpm test:e2e      # Run end-to-end tests (Playwright)
pnpm seed:dev      # Seed development data
```

Run a single test file:
```bash
pnpm test tests/unit/someFile.test.ts
```

**Package manager: pnpm only.** Never use npm or yarn.

## Architecture

### Stack
- **Next.js 16 App Router** — Server Components by default; use `"use client"` only for interactivity, Zustand, or Framer Motion
- **MongoDB + Prisma ORM** — All DB access goes through `/lib/repositories/` only, never call Prisma directly in components or route handlers
- **Zustand** — Client state for active match (`store/useMatchStore.ts`)
- **TanStack React Query** — Server/cached state (historical data, leaderboard, stats)
- **NextAuth.js** — Google OAuth, session management
- **Zod** — Validation at API boundaries
- **Tailwind CSS 4 + shadcn/ui** — Styling with neon arcade aesthetic (cyan/purple/magenta, glass-morphism panels)

### Folder conventions (do not add new top-level directories)
| Path | Purpose |
|------|---------|
| `app/(shell)/` | Protected routes (authenticated layout) |
| `components/` | Shared React components and shadcn/ui primitives |
| `features/` | Domain-bounded feature modules (`liveMatch/`, `matchSetup/`, `playoffs/`) |
| `store/` | Zustand store, selectors, actions, types |
| `lib/` | Business logic, services, repositories, validators |
| `constants/` | Game rules, scoring limits, static config |
| `types/` | Global TypeScript types |
| `utils/` | Pure helper utilities |
| `tests/` | Unit, component, integration, and e2e tests |
| `docs/` | Architecture & product documentation — treat as source of truth |

### State layers
1. **Local React state** — transient UI (modals, tooltips)
2. **Zustand** (`store/useMatchStore.ts`) — active match domain state
3. **Selectors** (`store/selectors.ts`) — derived/computed values (leaderboard, turn order); never recompute inline
4. **TanStack Query** — server-fetched data (history, analytics, global rankings)

### Core domain logic
- **Turn order** is derived, not stored. Formula: `startingPlayerIndex = (roundNumber - 1) % playerCount`. Players rotate who goes first each round; within a round each player takes all `shotsPerRound` shots sequentially.
- **Leaderboard** is computed from `ThrowEvent[]`. Filter: `eventType === "regular"` and `!playoffMatchId`. Tie-breakers in order: highest single throw → most bullseyes → highest final-round score → sudden death.
- **Playoff bracket** (4+ players): Qualifier 1 (Rank 1 vs 2) and Eliminator (Rank 3 vs 4) run in parallel → Qualifier 2 (Q1 loser vs Elim winner) → Final (Q1 winner vs Q2 winner).
- **Event sourcing**: full match state is reconstructible from `ThrowEvent[]`; this enables browser-refresh recovery.

### API + data flow
```
UI action → Zustand store update → POST /api/matches/[matchId]/throws
  → create ThrowEvent → derive current turn → check round/match complete
  → auto-trigger sudden death if tied → return updated state
  → Zustand store receives payload → selectors recompute → UI re-renders
```

## Naming conventions
- `camelCase` — variables, functions
- `PascalCase` — React components, TypeScript types/interfaces
- No `snake_case` anywhere in application code
