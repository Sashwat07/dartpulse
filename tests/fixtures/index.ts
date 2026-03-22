/**
 * Shared test fixtures and golden scenarios for DartPulse.
 * Use from unit, integration, and (when seeding) e2e tests.
 *
 * @see tests/fixtures/README.md
 */

export { FIXTURE_DATE } from "./constants";
export {
  makeMatchPlayerWithDisplay,
  TWO_PLAYERS,
  FOUR_PLAYERS,
  type FixturePlayer,
} from "./players";
export { makeMatch } from "./matches";
export { makeThrowEvent } from "./throwEvents";
export { makePlayoffMatch } from "./playoffMatches";

export {
  twoPlayerNormalFinishScenario,
  twoPlayerNormalFinishMatch,
  twoPlayerNormalFinishPlayers,
  twoPlayerNormalFinishThrowEvents,
  twoPlayerNormalFinishExpectedOutcome,
  twoPlayerNormalFinishExpectedRanking,
} from "./scenarios";

export {
  fourPlayerSuddenDeathScenario,
  fourPlayerSuddenDeathMatch,
  fourPlayerSuddenDeathPlayers,
  fourPlayerSuddenDeathThrowEvents,
  fourPlayerSuddenDeathResolvedTieOrders,
  fourPlayerSuddenDeathExpectedRanking,
} from "./scenarios";

export {
  fourPlayerPlayoffScenario,
  fourPlayerPlayoffMatch,
  fourPlayerPlayoffPlayers,
  fourPlayerPlayoffRegularThrowEvents,
  fourPlayerPlayoffMatchesProvisional,
  fourPlayerPlayoffMatchesFinalConfirmed,
  fourPlayerPlayoffExpectedChampionId,
  fourPlayerPlayoffExpectedPlacements,
  PLAYOFF_IDS,
} from "./scenarios";
