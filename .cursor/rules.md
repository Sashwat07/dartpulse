# Cursor AI Rules — DartPulse

These rules control how AI assistants generate code for this repository.

The following documentation files are the source of truth and must always be followed:

docs/prd.md  
docs/architecture.md  
docs/tech-decisions.md  
docs/project-scaffolding.md  
docs/design-system.md  
docs/development-rules.md  

If generated code conflicts with these documents, the documentation takes priority.

---

Package Manager Rules

This project uses **pnpm** as the package manager.

Rules:

- Do not use npm commands.
- Do not use yarn commands.
- Always use pnpm for dependency management.

Examples:

pnpm install  
pnpm add <package>  
pnpm dev  
pnpm build  

All generated instructions and scripts must use pnpm.


Architecture Rules

This project uses Next.js App Router with Server Components.

Rules:

- Prefer Server Components by default.
- Client Components should only be used when necessary.

Client Components are allowed only for:

- UI interactivity
- Zustand usage
- Framer Motion animations
- browser APIs
- local React state

Server Components must never import:

- Zustand
- Framer Motion
- browser APIs (window, document, localStorage)

---

Folder Structure Rules

Follow the defined architecture.

Valid top-level folders:

app/
components/
features/
lib/
stores/
types/
validators/
hooks/

Rules:

- app/ contains routing only
- features/ contains domain modules
- components/ui/ contains reusable UI primitives
- stores/ contains Zustand stores
- lib/ contains shared services and repositories
- validators/ contains Zod schemas

Do not introduce new top-level folders.

---

State Management Rules

State layers must remain separated.

Zustand → client gameplay state  
TanStack Query → server state

Rules:

- Do not duplicate server state into Zustand
- Use selectors for derived Zustand values

---

Database Rules

All database access must go through Prisma.

Rules:

- Prisma calls must only exist inside `/lib/repositories`.
- UI components must never access the database.
- Route handlers must call repository functions instead of Prisma directly.
- Do not use raw MongoDB driver queries.

---

Environment Variable Rules

Environment variables must be managed through a centralized configuration layer.

Rules:

- Avoid direct usage of `process.env` across multiple files.
- Use a configuration module inside `/lib/config`.
- Validate environment variables using **Zod** during application startup.
- Public environment variables must use the `NEXT_PUBLIC_` prefix.

---

Styling Rules

All UI must follow the design system defined in:

docs/design-system.md

Rules:

- Use Tailwind CSS
- Use design tokens instead of hardcoded colors
- Use the GlassCard component pattern for dashboard panels

---

Naming Rules

Naming conventions are strict.

camelCase for:

- variables
- API payloads
- database fields
- Zustand store keys

PascalCase for:

- React components
- TypeScript types

snake_case must never appear in application code.

---

Development Workflow Rules

When implementing new features, AI assistants must follow this order:

1. Define TypeScript types
2. Implement domain logic
3. Implement repository/database layer
4. Implement API routes
5. Implement UI components
6. Implement pages

Never start implementation directly from UI.

This ensures proper architectural layering and maintainability.

---

Code Generation Rules

When generating code:

1. Generate TypeScript types first
2. Generate domain logic second
3. Generate UI components last

Avoid mixing UI logic with domain logic.

---

Performance Rules

Prefer server rendering whenever possible.

Memoization techniques (React.memo, useMemo, useCallback) should only be used inside Client Components when necessary.

Large datasets must be processed server-side.

---

Game Model Rules

Scoring and rounds follow the model in docs/prd.md and docs/entity-model.md.

Rules:

- Match has totalRounds, shotsPerRound, optional playoffShotsPerRound (defaults to shotsPerRound), and **basePlayerOrder** (persisted fixed player order; must not change after match start). Base order = user-selected at setup; optional Shuffle before match start only.
- Each ThrowEvent is one shot. Round score = sum of shots in that round; match total = sum of round scores.
- Regular match turn order must be **derived from** basePlayerOrder, roundNumber, and shotsPerRound (not transient UI). Rotating start: startingPlayerIndex = (roundNumber - 1) mod playerCount; round order = basePlayerOrder rotated by that index. Within a round, one player completes all shotsPerRound shots, then the next. Refresh/recovery reconstructs turn from persisted data.
- Playoff matches have one round; each player takes playoffShotsPerRound (or shotsPerRound) shots. Before each playoff match, one player (by decision rights) chooses who throws first. Persist **startingPlayerId** (who was chosen to throw first) and optionally **decidedByPlayerId** (who had the right to choose). Playoff tie-break and regular-match sudden death use 1 shot per player per cycle.
- Legacy matches without shotsPerRound/playoffShotsPerRound: treat as shotsPerRound = 1, playoffShotsPerRound = shotsPerRound.

---

Testing Rules

Critical logic must include tests.

Focus testing on:

- score aggregation (round = sum of shots; total = sum of rounds)
- leaderboard ranking
- playoff generation
- tie-breaker logic

---

Final Rule

If uncertain about architecture or conventions, always follow the documentation inside the /docs folder.
