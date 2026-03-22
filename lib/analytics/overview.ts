import type { AnalyticsOverview } from "@/lib/analytics/types";
import { getChampionsByMatchIds } from "@/lib/matchHistory";
import {
  listCompletedMatchSummaries,
  listPlayers,
  listThrowEventsForCompletedMatches,
} from "@/lib/repositories";

const TOP_N = 10;

/**
 * Build analytics overview from completed matches only.
 * Throw scope: regular-match throws (excludes playoff; includes sudden death).
 */
export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [summaries, throws, players] = await Promise.all([
    listCompletedMatchSummaries(),
    listThrowEventsForCompletedMatches(),
    listPlayers(),
  ]);

  const championsByMatchId = await getChampionsByMatchIds(
    summaries.map((s) => s.matchId),
  );

  const totalCompletedMatches = summaries.length;
  const totalRegisteredPlayers = players.length;
  const totalRoundUnits = summaries.reduce((acc, s) => acc + s.totalRounds, 0);
  const totalPoints = throws.reduce((acc, t) => acc + t.score, 0);
  const bestThrow =
    throws.length > 0 ? Math.max(...throws.map((t) => t.score)) : 0;

  const pointsByMatch = new Map<string, number>();
  for (const t of throws) {
    pointsByMatch.set(t.matchId, (pointsByMatch.get(t.matchId) ?? 0) + t.score);
  }
  const highestCompletedMatchScore =
    pointsByMatch.size > 0 ? Math.max(...pointsByMatch.values()) : 0;

  const winsByPlayerId = new Map<string, number>();
  for (const { matchId } of summaries) {
    const championId = championsByMatchId.get(matchId) ?? null;
    if (championId) {
      winsByPlayerId.set(championId, (winsByPlayerId.get(championId) ?? 0) + 1);
    }
  }
  const pointsByPlayerId = new Map<string, number>();
  for (const t of throws) {
    pointsByPlayerId.set(t.playerId, (pointsByPlayerId.get(t.playerId) ?? 0) + t.score);
  }

  const playerById = new Map(players.map((p) => [p.playerId, p]));
  const topPlayersByWins = Array.from(winsByPlayerId.entries())
    .map(([playerId, wins]) => ({
      playerId,
      playerName: playerById.get(playerId)?.name ?? playerId,
      wins,
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, TOP_N);
  const topPlayersByTotalPoints = Array.from(pointsByPlayerId.entries())
    .map(([playerId, totalPoints]) => ({
      playerId,
      playerName: playerById.get(playerId)?.name ?? playerId,
      totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, TOP_N);

  const averageRoundScore =
    totalRoundUnits > 0 ? totalPoints / totalRoundUnits : 0;

  return {
    totalCompletedMatches,
    totalRegisteredPlayers,
    bestThrow,
    averageRoundScore,
    totalRoundUnits,
    highestCompletedMatchScore,
    totalPoints,
    topPlayersByWins,
    topPlayersByTotalPoints,
  };
}
