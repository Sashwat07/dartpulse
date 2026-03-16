# Test Fixtures

Shared test-data foundation for DartPulse. Used by **unit**, **integration**, and (when seeding) **e2e** tests so coverage stays coherent and maintainable.

## Strategy

- **Unit tests:** Pure fixtures only; no database, no network. Import from `@/tests/fixtures` or `tests/fixtures`.
- **Integration tests:** Use these fixtures with an isolated test DB or mocks; state reset between tests.
- **E2E tests:** May seed data from these scenarios or create data via UI; must not depend on manual dev data.

## Golden scenarios

Three canonical scenarios are defined and exported from `scenarios.ts`:

| Scenario | Purpose | Exports |
|----------|---------|--------|
| **Two-player normal finish** | No tie, no playoffs; match completes after regular rounds. | `twoPlayerNormalFinishScenario`, `match`, `players`, `throwEvents`, `expectedOutcome`, `expectedRanking` |
| **Four-player sudden death** | Tie at end of regular rounds; sudden death resolves ranking. | `fourPlayerSuddenDeathScenario`, `match`, `players`, `throwEvents`, `resolvedTieOrders`, `expectedRanking` |
| **Four-player playoff path** | Full bracket: Q1, Q2, Eliminator, Final; includes provisional and final-confirmed variants. | `fourPlayerPlayoffScenario`, `match`, `players`, `throwEvents`, `playoffMatches`, `playoffMatchesFinalConfirmed`, `expectedChampionId` |

Reuse these across tests so assertions (e.g. leaderboard order, undo rules, read-only history) stay consistent.

## Builders

Lightweight builders for one-off or custom data:

- `makeMatch(overrides)` — Match
- `makeMatchPlayerWithDisplay(overrides)` — MatchPlayerWithDisplay
- `makeThrowEvent(overrides)` — ThrowEvent (score 1–60, eventType regular | suddenDeath)
- `makePlayoffMatch(overrides)` — PlayoffMatch

All use a fixed `FIXTURE_DATE` from `constants.ts` for determinism.

## Where fixtures live

- **Directory:** `tests/fixtures/`
- **Entry:** `tests/fixtures/index.ts` re-exports scenarios and builders.
- **Import in tests:** `import { twoPlayerNormalFinishScenario, makeThrowEvent } from "@/tests/fixtures";` or relative path from test file.

## What not to do

- Do not scatter duplicate fixture helpers under `tests/unit`, `tests/integration`, or `tests/e2e`. Keep one shared layer here.
- Do not add application logic to fixtures; they are data only.
