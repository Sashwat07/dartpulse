# DartPulse: Auth + Match Ownership — Implementation-Ready Plan

This document is the single source of truth for implementing Google authentication and match ownership in DartPulse. It refines and locks architectural decisions so implementation can proceed without ambiguity.

---

## 1. Overview

- DartPulse will add **user authentication** (Google OAuth via Auth.js) and **match ownership** so that only the creating user can create, resume, edit, and view their own matches.
- **Global** surfaces (Leaderboard, Analytics, Players, Player profiles) remain viewable to any authenticated user and are **not** filtered by ownership.
- All authorization is **server-enforced** in route handlers, server components, and repositories. UI hiding alone is not sufficient.
- **No code has been implemented yet.** This plan is documentation only.

---

## 2. Authentication System (Locked Decision)

**Choice:** Auth.js (NextAuth) with Google OAuth provider, using the **Prisma database adapter**. Sessions are **persisted in the database**.

**Rationale:**
- Auth.js is the standard for Next.js; it supports App Router, server components, and route handlers.
- Database sessions allow invalidation, auditing, and a single source of truth alongside DartPulse data.
- Prisma is already used for the application schema ([prisma/schema.prisma](prisma/schema.prisma)); the adapter keeps sessions and users in the same store.

**How sessions are used:**
- In **server components** and **route handlers**, call `auth()` (or `getServerSession()`) from Auth.js to obtain the current session.
- Session contains `user` with `id`, `email`, `name`, `image`. The **session.user.id** must map to the **internal User.id** in the DartPulse database (see User model below).
- A shared helper (e.g. `getCurrentUser()`) will wrap Auth.js and return the application User or null. All protected logic uses this helper so that **session.user.id === User.id** is the single ownership reference.

**Session storage:**
- Auth.js Prisma adapter will create/use tables for `Session` and `Account` (OAuth links). The **User** table is the application user; Auth.js can use it for the `user` relation in sessions so that `session.user.id` is our `User.id`.

---

## 3. User Model (Locked Decision)

**Application User model** (stored in DartPulse DB, managed in sync with Auth.js):

| Field      | Type     | Notes                    |
|-----------|----------|---------------------------|
| id        | String   | Primary key (e.g. ObjectId/cuid) |
| email     | String   | Unique, from Google       |
| name      | String?  | From Google profile       |
| image     | String?  | Avatar URL                |
| createdAt | DateTime | Set on first create       |
| updatedAt | DateTime | Updated on login/profile  |

**Responsibilities:**
- **Auth.js** manages OAuth (Google) and the `Account` / `Session` records.
- **DartPulse** stores and uses the **User** record as the application identity. The same `User.id` is exposed in the session so that **session.user.id** is the ownership reference everywhere.
- On first Google login, create a **User** row (or upsert by email) and ensure Auth.js session references this `User.id`. Internal ownership is always by this internal **User.id**.

---

## 4. Match Ownership Model (Locked Decision)

**Add to Match model:**

| Field             | Type   | Notes                                      |
|-------------------|--------|--------------------------------------------|
| createdByUserId   | String?| References User.id; null = legacy match    |

- **createdByUserId** is the only ownership field. It references `User.id`.
- **Ownership rule:** Only the user whose `User.id` equals `match.createdByUserId` may:
  - Resume the match
  - Enter or undo throws (live match and playoffs)
  - Manage playoff progression
  - View the match in their Resume or History list
  - View the History detail page for that match (owner-only; see Match Access Policy).
- Non-owners must not be able to access editable routes or see the match in their personal Resume/History. Direct URL access to another user’s match must be rejected server-side (404 or 403).

**PlayoffMatch:** Ownership is implied via the parent Match. No separate ownership field on PlayoffMatch. Access control is enforced by resolving the parent match and checking `match.createdByUserId`.

---

## 5. Global vs User-Scoped Data (Core Product Rule)

This is a **core product rule** and must not be relaxed without an explicit product/architecture decision.

**User-scoped (filtered by current user):**
- **Resume** — Only matches where `createdByUserId === currentUser.id` and status is not finished.
- **Match history (list)** — Only completed matches where `createdByUserId === currentUser.id`.
- **Match history (detail)** — Only if `createdByUserId === currentUser.id` (owner-only view).
- **Live match editing** — Only owner can load and use the editable live match page.
- **Playoff continuation** — Only owner can load and use the playoff management flow.

**Global (must NOT be filtered by user):**
- **Leaderboard** — All players’ stats from all completed matches (including legacy).
- **Analytics** — All completed matches for aggregate stats and charts.
- **Players list** — All players.
- **Player profiles** — All players’ profiles and stats.

Repository and API design must keep **global** queries free of any `createdByUserId` filter. User-scoped queries must always include `createdByUserId = currentUser.id` (and handle `createdByUserId === null` as per legacy strategy).

---

## 6. Match Access Policy

**Owner (createdByUserId === currentUser.id) can:**
- Resume the match from Resume or Home.
- Open the live match page and enter/undo throws.
- Open the playoffs page and continue/manage playoff matches.
- See the match in their History list and open History detail (read-only).

**Non-owner cannot:**
- Resume the match (it does not appear in their Resume list).
- Open the editable live match route; server must return 404 (or 403) and must not leak that the match exists.
- Open the editable playoff route; same server-side rejection.
- See the match in their History list or History detail.

**History detail page (final decision):** **Owner-only.** Only the user who created the match can view the match history detail page. Server enforces via ownership helper; non-owner gets 404.

**Direct URL access:** Every route that exposes a match by ID (live match, playoffs, history detail) must validate ownership server-side before rendering or returning data. Validation must use the central ownership helper (see below).

---

## 7. Ownership Enforcement Helper (Standard Pattern)

Introduce a single place for match ownership checks:

**Primary helper:** `getOwnedMatchOrThrow(matchId, userId)`

- **Behavior:** Returns the match if it exists and `match.createdByUserId === userId`. Otherwise throws (e.g. throws a dedicated error or calls `notFound()`).
- **Usage:** All code paths that need to “load this match only if the current user owns it” must use this helper. Do not duplicate ownership logic.

**Alternative naming:** `assertMatchOwnership(matchId, userId)` — same contract: throws or calls `notFound()` if not owner; caller may then load the match once if a separate fetch is desired. The plan recommends **getOwnedMatchOrThrow** so that the caller gets the match in one call and does not need a separate fetch.

**Where the helper must be used:**
- Live match page and any API used by it: `GET /api/matches/[matchId]/state`, `POST /api/matches/[matchId]/throws`, `POST /api/matches/[matchId]/throws/undo`.
- Playoff page and APIs: `GET /api/playoffs/[matchId]/state`, `POST /api/playoffs/[matchId]/throws`, playoff completion and starting-player routes.
- History detail page (and any API it uses): server component or API that loads match history payload must call the helper so that only the owner can load the page.
- Resume logic: list endpoint or repository already scoped by user; no per-match helper needed for the list, but any “open this match” flow must use the helper when loading by ID.

**Centralization:** All ownership rules live in this helper (and in repository query scoping for lists). New routes that touch a match by ID must use the helper; no ad-hoc `getMatchById` + manual check.

---

## 8. Player Model Rule (Locked Decision)

**Players remain global entities.**

- Any **authenticated** user can create players (e.g. from New Match flow). Players are **not** owned by a specific user.
- There is no `createdByUserId` (or similar) on the Player model. Duplicate player names across users remain possible and are handled by existing logic (e.g. selection by name/id at match creation). No change to player uniqueness rules in this phase.

---

## 9. Legacy Match Strategy (Final Decision)

**Definition:** Legacy matches are matches that existed before auth was introduced. In the schema they have **createdByUserId = null**.

**Rules:**
- Legacy matches (**createdByUserId = null**):
  - **Do not** appear in any user’s Resume list.
  - **Do not** appear in any user’s History list.
  - **Remain included** in global Analytics and Leaderboard (so aggregate stats and leaderboards still reflect all historical data).

**Rationale (safest MVP approach):**
- Assigning ownership retroactively would require heuristics or manual mapping and risk wrong attribution.
- Excluding legacy matches from user-scoped views avoids showing “someone else’s” match by mistake and keeps the product rule simple: “you only see your own matches in Resume/History.”
- Including legacy matches in global Leaderboard/Analytics preserves the value of existing data and avoids a sudden drop in leaderboard or analytics content after launch.

**Migration:** Schema migration adds `createdByUserId` to Match; backfill existing rows with `null`. No automated assignment of legacy matches to users in MVP. Optional future: admin tool or one-off script to assign legacy matches to users if required.

---

## 10. Route Protection

Enforcement must happen in server components (for page loads) and in route handlers (for APIs). The following table defines **auth required** and **ownership required** per route.

| Route              | Auth required | Ownership required | Enforcement notes |
|--------------------|---------------|--------------------|-------------------|
| /                  | Yes           | No                 | Home shows user-scoped Resume/History preview; global stats. Redirect or CTA if not signed in. |
| /match/new         | Yes           | No                 | Block or redirect if no session. On create, set createdByUserId = currentUser.id. |
| /match/[id]        | Yes           | Yes                | Use getOwnedMatchOrThrow(matchId, currentUser.id). 404 if not owner. |
| /playoffs/[id]     | Yes           | Yes                | Resolve parent match; use getOwnedMatchOrThrow(parentMatchId, currentUser.id). 404 if not owner. |
| /resume            | Yes           | No (query scoped)  | Require auth. List only matches where createdByUserId = currentUser.id. |
| /history           | Yes           | No (query scoped)  | Require auth. List only completed matches where createdByUserId = currentUser.id. |
| /history/[id]      | Yes           | Yes                | Use getOwnedMatchOrThrow(matchId, currentUser.id). 404 if not owner. |
| /analytics         | Yes           | No                 | Require auth. Data is global (no ownership filter). |
| /leaderboard       | Yes           | No                 | Require auth. Data is global. |
| /players           | Yes           | No                 | Require auth. Data is global. |
| /players/[id]      | Yes           | No                 | Require auth. Data is global. |

**Enforcement points:**
- **Pages:** In each server component, call `getCurrentUser()`; if auth required and null, redirect to sign-in (or show sign-in CTA). If ownership required, call `getOwnedMatchOrThrow` before rendering.
- **API route handlers:** Same: resolve session/user; if auth required and no user, return 401. If ownership required, call `getOwnedMatchOrThrow` before performing the action or returning data.
- **Repositories:** List functions for Resume and History accept `userId` and add `where: { createdByUserId: userId }` (and optionally `createdByUserId: { not: null }` to exclude legacy in user lists). Global list functions (for analytics/leaderboard) do **not** take userId and do **not** filter by createdByUserId.

---

## 11. Repository and Query Scoping

**Current touchpoints (for implementation):**

- [lib/repositories/matchRepository.ts](lib/repositories/matchRepository.ts): `createMatch`, `getMatchById`, `listResumableMatches`, `listCompletedMatches`, `listMatchesForHistory`, and any other match list used for History/Resume must be split or extended:
  - **User-scoped:** Add `listResumableMatchesForUser(userId)`, `listCompletedMatchesForUser(userId)` (filter by `createdByUserId: userId`). Use these from Resume and History pages and Home preview.
  - **Ownership check:** Add or use `getOwnedMatchOrThrow(matchId, userId)` which loads match and returns it only if `createdByUserId === userId`; otherwise throws/notFound. Use in live match, playoffs, history detail.
  - **Global:** Keep `listCompletedMatchSummaries` and any analytics/leaderboard queries **without** createdByUserId filter so Leaderboard and Analytics stay global.
- API routes that load or mutate a match by ID (e.g. [app/api/matches/[matchId]/state/route.ts](app/api/matches/[matchId]/state/route.ts), throws, undo, playoff state, playoff throws, etc.) must call the ownership helper with the current user id before proceeding.
- [lib/matchHistory.ts](lib/matchHistory.ts) (used by history detail): When loading history payload for a match, enforce ownership (e.g. accept userId and use getOwnedMatchOrThrow or equivalent) so history detail is owner-only.

**Consistency rule:** Any new function that returns matches for “my Resume” or “my History” must filter by createdByUserId. Any new function that returns match data for “global” (analytics/leaderboard) must not filter by createdByUserId.

---

## 12. Security Considerations

- **Server-side authorization only:** No decision to show/hide or allow/deny is made only on the client. Every protected route and API must enforce auth and ownership on the server.
- **Route handler protection:** Every API that reads or mutates a match must verify the session and, where applicable, call getOwnedMatchOrThrow. Do not trust matchId from the URL without verification.
- **Direct URL access:** A user who guesses or knows another user’s match ID must not be able to open the live match, playoff, or history detail page. Server returns 404 (preferred) or 403 and does not reveal whether the match exists.
- **Ownership bypass:** Never use client-provided user id or “owner” field for authorization. The only source of identity is the session (getCurrentUser()). The only source of ownership is the match record (createdByUserId) compared to that identity.
- **Session fixation / logout:** Use Auth.js signOut to clear the session. Ensure session is validated on each request (database session or signed token per Auth.js config).

---

## 13. Testing Impact (Documentation Only)

**Unit tests (to add):**
- Ownership helper: `getOwnedMatchOrThrow(matchId, userId)` returns match when createdByUserId matches; throws/notFound when match missing or createdByUserId differs. Legacy matches (createdByUserId null) are not returned as owned.

**Integration tests (to add):**
- History/Resume scoping: With seeded users and matches (owned, unowned, legacy), listResumableMatchesForUser and listCompletedMatchesForUser return only owned matches; global analytics/leaderboard queries still include legacy matches.
- Create match: Created match has createdByUserId set to the creating user.

**E2E tests (to add):**
- Login flow: Sign in with Google (or mocked provider); session present; user can access protected home.
- Protected route redirect: Unauthenticated user hitting /match/new or /resume is redirected or sees sign-in CTA.
- Owner vs non-owner: User A creates match; User B cannot open that match’s live URL or playoff URL (404 or redirect). User A can open Resume and History and see the match; User B does not see it in their lists.

**Test data strategy:** Tests need at least two users and matches owned by each, plus legacy matches (createdByUserId null). Do not implement tests in this phase; only document the above.

---

## 14. Implementation Phases (Recommended Order)

| Phase | Scope |
|-------|--------|
| **A. Auth setup** | Install Auth.js, Google provider, and Prisma adapter; configure callback URLs and env. No ownership yet. |
| **B. User model + adapter** | Add User model (and Session/Account if not auto-created by adapter). Wire Auth.js to use DB for sessions and to create/link User. Ensure session.user.id === User.id. |
| **C. Match ownership schema** | Add createdByUserId to Match in Prisma; run migration; backfill null for existing rows. |
| **D. Repository query scoping** | Add getOwnedMatchOrThrow; add listResumableMatchesForUser, listCompletedMatchesForUser; keep global list functions unchanged for analytics/leaderboard. Update createMatch to accept and set createdByUserId. |
| **E. Route protection** | In pages and API routes: getCurrentUser(); require auth where needed; use getOwnedMatchOrThrow for match-by-id routes. Enforce in live match, playoffs, history detail, and all related API handlers. |
| **F. UI login/logout** | Sign-in/sign-out in app shell (e.g. TopBar); redirect or CTA when unauthenticated on protected routes. Home, Resume, History consume user-scoped lists. |
| **G. Testing** | Add unit tests for ownership helper; integration tests for scoping; e2e for login and protected routes. |

---

## 15. Verification and Sign-Off

Before considering auth and ownership complete:

- [ ] Google login and logout work; session persists in DB; session.user.id maps to User.id.
- [ ] New matches have createdByUserId set. Legacy matches have null and do not appear in any user’s Resume/History.
- [ ] Resume and History lists show only current user’s matches. Leaderboard and Analytics remain global.
- [ ] Live match and playoff routes return 404 for non-owner. History detail is owner-only and returns 404 for non-owner.
- [ ] All match-affecting API routes use getOwnedMatchOrThrow (or equivalent) and do not rely on client-provided identity.
- [ ] Tests (unit, integration, e2e) added as described in §13 and passing.

---

## 16. Files to Create or Update (Summary)

- **Auth:** Auth.js config (e.g. auth.config.ts or app/api/auth/[...nextauth]/route.ts); Prisma adapter; env for Google OAuth.
- **Schema:** Prisma User (and Session/Account if needed); Match.createdByUserId; migration.
- **Lib:** getCurrentUser(); getOwnedMatchOrThrow(); listResumableMatchesForUser(userId); listCompletedMatchesForUser(userId); update createMatch to set createdByUserId.
- **Pages:** Home, New Match, Live Match, Playoffs, Resume, History list, History detail — each use getCurrentUser and, where required, getOwnedMatchOrThrow or user-scoped lists.
- **API routes:** All match and playoff handlers that load by matchId must use getOwnedMatchOrThrow with current user id.
- **UI:** Login/logout controls; optional sign-in CTA or redirect for unauthenticated users on protected routes.
- **Docs:** Update architecture and development-plan docs to reference this plan and the core product rule (global vs user-scoped).

No code has been changed; this document is the refined, implementation-ready plan only.
