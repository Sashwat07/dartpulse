import type { Match, MatchPlayerWithDisplay, Round, ThrowEvent } from "@/types/match";
import type { PlayoffMatch } from "@/types/playoff";
import { getEffectiveBaseOrder, sortMatchPlayersByBaseOrder } from "@/lib/regularMatchTurn";
import { deriveSuddenDeath } from "@/lib/suddenDeath";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { buildMatchOutcomeSummary } from "@/lib/matchOutcomeSummary";
import { deriveRoundScoreTable } from "@/lib/roundScoreTable";
import { deriveShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import { deriveSuddenDeathScoreDisplay } from "@/lib/suddenDeathDisplay";
import type { MatchHistoryPayload } from "@/lib/matchHistory";

/**
 * Builds MatchHistoryPayload using the same composition as getMatchHistoryPayload,
 * but from in-memory fixture data (no repository calls).
 * Used by integration tests to verify the full derivation pipeline.
 */
export function buildMatchHistoryPayloadFromData(
  match: Match,
  matchPlayers: MatchPlayerWithDisplay[],
  throwEvents: ThrowEvent[],
  rounds: Round[],
  playoffMatches: PlayoffMatch[],
): MatchHistoryPayload {
  const baseOrder = getEffectiveBaseOrder(match, matchPlayers);
  const sortedMatchPlayers = sortMatchPlayersByBaseOrder(matchPlayers, baseOrder);
  const shotsPerRound = match.shotsPerRound ?? 1;

  const { resolvedTieOrders } = deriveSuddenDeath(
    match.matchId,
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
    match.status,
    shotsPerRound,
  );

  const leaderboard = deriveLeaderboardFromThrowEvents(
    throwEvents,
    sortedMatchPlayers,
    resolvedTieOrders,
  );

  const matchOutcomeSummary = buildMatchOutcomeSummary(
    leaderboard,
    sortedMatchPlayers.length,
  );

  const roundScoreTable = deriveRoundScoreTable(
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
  );

  const suddenDeathDisplay = deriveSuddenDeathScoreDisplay(
    throwEvents,
    sortedMatchPlayers,
  );

  const shotHistoryDisplay = deriveShotHistoryDisplay(
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
  );

  return {
    match,
    matchPlayers: sortedMatchPlayers,
    throwEvents,
    rounds,
    playoffMatches,
    leaderboard,
    matchOutcomeSummary,
    roundScoreTable,
    suddenDeathDisplay,
    shotHistoryDisplay,
  };
}
