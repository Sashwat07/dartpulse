# Phase 3 Preparation Pass — Architecture Review

## 1. Prep-pass readiness assessment

**Is the repository structurally ready for Phase 3?**

**Yes with fixes.**

The prep pass is largely correct and achieves the stated structural goals. A few documentation and naming inconsistencies and one minor contract gap should be fixed before or at the start of Phase 3; none are blocking.

---

## 2. What was implemented correctly

- **MatchPlayerWithDisplay** — Correctly placed in `types/match.ts` as a view-model type (MatchPlayer + `name`, `avatarColor?`). Domain/view-model separation is respected; DTOs stay in `types/dto.ts`.

- **MatchStatePayload / MatchStateResponse** — Defined in `types/dto.ts` with match, matchPlayers (with display), rounds, throwEvents, currentTurn. Single coherent recovery shape; camelCase throughout; no raw Mongo `_id` in types.

- **currentTurn** — Typed as `{ playerId: string; turnIndex: number } | null` in payload and store. Documented in DTO as “derived on the server from persisted state and returned for client convenience.” Server derivation in state route is correct (last throw + turn order).

- **Turn order** — Explicit in code: `constants/liveMatch.ts` documents MVP rule (“turn order = order of matchPlayers attached to the match”), exports `TURN_ORDER_SOURCE` and `getOrderedMatchPlayers()`. `selectOrderedMatchPlayers` uses it; state API returns matchPlayers in creation order (turn order). No ambiguity.

- **Store hydration** — `setMatchState(payload: MatchStatePayload)` exists in store types and implementation. Hydrates activeMatch, matchPlayers, rounds, throwEvents, currentTurn; resets matchLeaderboard to `[]`. No scoring or business logic inside the action. All five required fields can be restored from the payload.

- **Recovery API** — `GET /api/matches/[matchId]/state` exists, returns `MatchStateResponse` (same shape as MatchStatePayload). Minimally real implementation: uses getMatchById, listMatchPlayersWithDisplayByMatchId, getRoundsByMatchId, listThrowEventsByMatch; derives currentTurn and currentRound on the server; response is camelCase and includes player display data (name, avatarColor). Sufficient for Phase 3 hydration.

- **Undo contract** — Repository: `undoLastThrow(matchId): Promise<UndoLastThrowResult>` with `UndoLastThrowResult = { success: boolean; deletedThrowEventId?: string }`. API: `POST /api/matches/[matchId]/throws/undo` returns that shape. Contract is structured and suitable for Phase 3; no full undo logic yet.

- **Derived selectors** — All required placeholders exist in `store/selectors.ts`: selectOrderedMatchPlayers, selectCurrentRoundThrows, selectCurrentPlayer, selectNextPlayer, selectIsRoundComplete, selectDerivedMatchLeaderboard. Plus existing selectMatchLeaderboard. Signatures are typed and useful; only minimal logic (e.g. selectCurrentPlayer resolves currentTurn to player); stubs return null/false/pass-through. Correct pattern for Phase 3.

- **Live match page hydration path** — Clear path: `app/match/[matchId]/page.tsx` (Server Component) renders `LiveMatchHydrator` with matchId; `features/liveMatch/components/LiveMatchHydrator.tsx` (Client Component) fetches `GET /api/matches/${matchId}/state` and calls `setMatchState(data)`. Hydrator in correct feature folder; Server/Client boundary respected (page stays server, hydrator is client with Zustand/fetch).

- **matchPlayerRepository** — `listMatchPlayersWithDisplayByMatchId` returns MatchPlayerWithDisplay[] in turn order (createdAt); used by state route. Exported from `lib/repositories/index.ts`.

- **Phase boundary** — No full scoring engine, add-throw workflow, round progression engine, leaderboard calculations, tie-break/sudden-death/playoff logic, or analytics. Store actions (addThrow, undoLastThrow, advanceRound, generatePlayoffs) remain no-op stubs; selectDerivedMatchLeaderboard is pass-through; state route only assembles and derives currentTurn/currentRound.

---

## 3. Problems still remaining

1. **Naming inconsistency: “selectDerivedMatchLeaderboard” vs “selectComputedMatchLeaderboard”**  
   Review asked for “selectMatchLeaderboard or selectComputedMatchLeaderboard.” Implementation has selectMatchLeaderboard (pass-through) and selectDerivedMatchLeaderboard. “Derived” is consistent with architecture (“Derived analytics state … via selectors”); “Computed” is not used. This is a naming/documentation alignment issue only.

2. **Recovery API when match not found**  
   When `getMatchById(matchId)` returns null, the state route still returns 200 with `match: null`, matchPlayers/rounds/throwEvents from other repos (may be empty), and derived currentTurn. That is valid for “no match” but could be clearer: e.g. return 404 when match is null so the hydrator can show “Match not found” instead of an empty state. Optional improvement, not a structural blocker.

3. **Doc vs repo: store folder**  
   development-rules.md says “stores/” (plural); repo and project-scaffolding use “store/”. Implementation is correct per scaffolding; doc is inconsistent.

4. **Doc vs repo: feature folder name**  
   architecture.md mentions “live-match/”; project-scaffolding and development-rules use “liveMatch/”. Implementation uses features/liveMatch/. Implementation aligns with scaffolding; architecture doc is inconsistent.

---

## 4. Severity of each problem

| Problem | Severity |
|--------|----------|
| selectDerivedMatchLeaderboard vs selectComputedMatchLeaderboard | **Minor** |
| Recovery API returns 200 when match is null (no 404) | **Minor** |
| development-rules: “stores/” vs “store/” | **Minor** |
| architecture: “live-match/” vs “liveMatch/” | **Minor** |

None are Critical or Major. No unresolved structural blockers for Phase 3.

---

## 5. Exact fixes recommended before Phase 3

- **Optional — Naming:** If you want strict alignment with the review wording, add an alias or rename: e.g. keep `selectDerivedMatchLeaderboard` and add a short JSDoc: “Also referred to as computed match leaderboard in docs.” Or rename to `selectComputedMatchLeaderboard` and update any references. Recommendation: keep current name; it matches architecture (“Derived … via selectors”).

- **Optional — Recovery API:** In `app/api/matches/[matchId]/state/route.ts`, after fetching match, if `match === null` return `NextResponse.json({ error: "Match not found" }, { status: 404 })` and in LiveMatchHydrator treat 404 as “match not found” UI instead of hydrating empty state. Not required for structural readiness.

- **Documentation only:** In `docs/development-rules.md`, change “stores/” to “store/” where it describes the Zustand folder. In `docs/architecture.md`, change “live-match/” to “liveMatch/” in the folder structure and in the sentence that references “the live-match folder,” so it matches project-scaffolding and the repo.

---

## 6. Final verdict

**Safe to start Phase 3.**

The prep pass correctly removed the identified structural blockers. Match players have display info in client state, turn order is explicit, the store hydrates from a single recovery payload, the recovery API and undo contract are in place, derived selectors are stubbed, and the live match page has a clear hydration path. Remaining items are minor (naming/doc alignment, optional 404 for missing match) and do not block beginning the live scoring engine work.
