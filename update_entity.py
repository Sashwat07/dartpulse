with open('docs/entity-model.md', 'r') as f:
    text = f.read()

# 1. camelCase naming
text = text.replace('- **camelCase routing:** `camelCase` must be used for all fields universally.', '- **camelCase naming:** `camelCase` must be used for all fields universally.')

# 2. MongoDB tables -> collections
text = text.replace('dedicated MongoDB tables unless aggressive caching', 'dedicated MongoDB collections unless aggressive caching')
text = text.replace('duplicate MongoDB tracking tables.', 'duplicate MongoDB tracking collections.')

# 3. Match Entity
match_status_old = """**Possible status values:**
- `matchCreated`
- `matchStarted`
- `roundActive`
- `roundComplete`
- `playoffPhase`
- `matchFinished`

**Relationships:**
- Has many rounds.
- Has many throw events.
- Has many participating players (via `MatchPlayer`).
- Has many playoff matches."""

match_status_new = """**Possible status values:**
- `matchCreated`
- `matchStarted`
- `playoffPhase`
- `matchFinished`

**Detailed playoff sub-states:**
- `qualifier1Active`
- `qualifier2Active`
- `eliminatorActive`
- `finalActive`

**Relationships:**
- Has many rounds.
- Has many throw events.
- Has many participating players (via `MatchPlayer`).
- Has many playoff matches."""

text = text.replace(match_status_old, match_status_new)

match_impl_old = """**Implementation note:**
The `Match` is the root aggregate of gameplay. Most queries filter down implicitly from a `matchId`."""

match_impl_new = """**Implementation note:**
The `Match` is the root aggregate of gameplay. Most queries filter down implicitly from a `matchId`.
For MVP, `Match.status` may store the full current state, including detailed playoff states, for simpler implementation."""

text = text.replace(match_impl_old, match_impl_new)

# 4. Round Entity
round_rel_old = """**Relationships:**
- Belongs to one match.
- Has many `throwEvents`.

**Implementation note:**
Even though round data conceptually surfaces from aggregating arrays of `ThrowEvents`, the `Round` should remain an explicit recorded entity; doing so radically simplifies analytics queries and active match progression tracking."""

round_rel_new = """**Relationships:**
- Belongs to one match.
- Has many `throwEvents`.

**Participation Rule:**
- Each MatchPlayer gets one turn per Round in the MVP points-based mode.
- A Round is considered complete when all participating MatchPlayers have recorded their throw for that round.

**Implementation note:**
Even though round data conceptually surfaces from aggregating arrays of `ThrowEvents`, the `Round` should remain an explicit recorded entity; doing so simplifies analytics queries and active match progression tracking."""

text = text.replace(round_rel_old, round_rel_new)


# 5. ThrowEvent Entity
throw_fields_old = """- `throwEventId` (Primary Key)
- `matchId`
- `roundId`
- `roundNumber`
- `playerId`
- `turnIndex`
- `score`
- `isBullseye`
- `eventType`
- `createdAt`

**Possible eventType values:**
- `regular`
- `suddenDeath`
- `undoMarker` (If event-sourcing undo logic is utilized; otherwise deletions may happen normally)."""

throw_fields_new = """- `throwEventId` (Primary Key)
- `matchId`
- `roundId`
- `roundNumber`
- `playerId`
- `turnIndex`
- `score`
- `isBullseye`
- `eventType`
- `createdAt`

**Explanation of fields:**
- `roundId` is the relational reference to the Round entity.
- `roundNumber` is a denormalized convenience field used for easier sorting, querying, and analytics computation.

**Possible eventType values:**
- `regular`
- `suddenDeath`"""

text = text.replace(throw_fields_old, throw_fields_new)

throw_impl_old = """**Validation Notes:**
- Target maximum score rules applies to limit out of bounds entry.
- Accepted MVP scores must properly validate cleanly against traditional rule-sets."""

throw_impl_new = """**Validation Notes:**
- Target maximum score rules applies to limit out of bounds entry.
- Accepted MVP scores must properly validate cleanly against traditional rule-sets.

**Undo Strategy for MVP:**
- Undo removes the most recent ThrowEvent for the active match session.
- The system does NOT use append-only undo markers in the MVP.
- ThrowEvent remains the primary scoring record, but undo is implemented as controlled deletion of the most recent valid event during active gameplay only.
- Completed matches remain immutable, so undo is not allowed after match completion."""

text = text.replace(throw_impl_old, throw_impl_new)

# 6. PlayoffMatch Entity
playoff_fields_old = """- `player1Id`
- `player2Id`
- `winnerId` (Nullable)
- `loserId` (Nullable)
- `status`"""

playoff_fields_new = """- `player1Id`
- `player2Id`
- `player1Score`
- `player2Score`
- `winnerId` (Nullable)
- `loserId` (Nullable)
- `status`"""

text = text.replace(playoff_fields_old, playoff_fields_new)

playoff_rel_old = """**Relationships:**
- Belongs inherently to one parent `Match`.
- References two starting players.
- References explicit `winnerId` and `loserId` references once resolved successfully.

**Implementation note:**
This entity only materializes and consumes DB scope if playoffs are deliberately triggered."""

playoff_rel_new = """**Relationships:**
- Belongs inherently to one parent `Match`.
- References two starting players.
- References explicit `winnerId` and `loserId` references once resolved successfully.

**Score Fields:**
`player1Score` and `player2Score` represent the final playoff result for display, history, and analytics purposes.

**Implementation note:**
This entity only materializes and consumes DB scope if playoffs are deliberately triggered."""

text = text.replace(playoff_rel_old, playoff_rel_new)


# 7. Achievement Entity
ach_impl_old = """**Relationships:**
- Belongs strictly to one player.
- May loosely reference the specific match ID context where the achievement was triggered.

**Implementation note:**
Achievements are exclusively computed at the completion bounds of a match and appended passively later; active matches do not render active badges midway."""

ach_impl_new = """**Relationships:**
- Belongs strictly to one player.
- May loosely reference the specific match ID context where the achievement was triggered.

**Duplication & Persistence Semantics:**
- Achievements are persisted as per-match awards.
- The same player may receive the same achievement type across multiple matches.
- `sourceMatchId` records where the achievement was earned.
- Achievement records are immutable once awarded for a completed match.

**Implementation note:**
Achievements are exclusively computed at the completion bounds of a match and appended later; active matches do not render active badges midway."""

text = text.replace(ach_impl_old, ach_impl_new)

# 8. Analytics Snapshot
analytics_old = """### `analyticsSnapshot`
Advanced historical groupings calculated on demand entirely within Next.js API bounds."""

analytics_new = """### `analyticsSnapshot`
Advanced historical groupings calculated on demand entirely within Next.js API bounds (not persisted by default in MVP)."""

text = text.replace(analytics_old, analytics_new)


# 9. Lifecycle rules mapping tweaks
lc_old = """- **Player:** Independent. Outlives and exists prior to matches.
- **Match:** Openly mutable configuration array until finalization event commits.
- **Completed Match:** A hard lock is placed stopping subsequent DB updates immediately.
- **Round:** Instantiated sequentially inside a Match array, resolved actively linearly relative to player sizes.
- **ThrowEvent:** An append-only historical log array unless expressly marked negated by user-facing "Undo" hooks.
- **PlayoffMatch:** Seeded completely passively only moving into memory post Match configuration threshold mapping.
- **Achievement:** Instantiated only upon Match conclusion scans and assigned passively out-of-bounds to the active process."""

lc_new = """- **Player:** Independent. Outlives and exists prior to matches.
- **Match:** Mutable configuration until finalization event commits.
- **Completed Match:** A hard lock is placed stopping subsequent DB updates immediately.
- **Round:** Instantiated sequentially inside a Match array, resolved actively linearly relative to player sizes.
- **ThrowEvent:** An append-only historical log array, but subject to controlled deletion of the most recent event during active gameplay for the MVP Undo implementation.
- **PlayoffMatch:** Seeded completely only moving into memory post Match configuration threshold mapping.
- **Achievement:** Instantiated only upon Match conclusion scans and assigned out-of-bounds to the active process."""

text = text.replace(lc_old, lc_new)

# 10. ID Conventions
id_old = """- **IDs**: Every single persistent entity requires a highly stable auto-generated unique identifier string mapping (`customerId` -> `cuid() / objectId`)."""

id_new = """- **IDs**: All entity IDs exposed in TypeScript types, Prisma models, and API payloads must use camelCase names such as: `playerId`, `matchId`, `matchPlayerId`, `roundId`, `throwEventId`, `playoffMatchId`, `achievementId`. If MongoDB internal `_id` fields are used through Prisma, they must be abstracted away behind these camelCase fields. API consumers and frontend code must never depend on raw Mongo `_id` naming."""

text = text.replace(id_old, id_new)

with open('docs/entity-model.md', 'w') as f:
    f.write(text)

