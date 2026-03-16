import type { PlayerAnalytics } from "@/lib/analytics/types";
import { getMatchChampion } from "@/lib/matchHistory";
import {
  listCompletedMatchParticipations,
  listCompletedMatchSummaries,
  listPlayers,
  listThrowEventsForCompletedMatches,
} from "@/lib/repositories";

/**
 * Build per-player analytics from completed matches only.
 * Throw scope: regular-match throws (excludes playoff; includes sudden death).
 * matchesPlayed and roundsPlayed from bulk listCompletedMatchParticipations.
 */
export async function getPerPlayerAnalytics(): Promise<PlayerAnalytics[]> {
  const [participations, throws, players, summaries] = await Promise.all([
    listCompletedMatchParticipations(),
    listThrowEventsForCompletedMatches(),
    listPlayers(),
    listCompletedMatchSummaries(),
  ]);

  const champions = await Promise.all(
    summaries.map((s) => getMatchChampion(s.matchId)),
  );
  const matchIdToChampion = new Map(
    summaries.map((s, i) => [s.matchId, champions[i]]),
  );

  const matchesPlayedByPlayer = new Map<string, number>();
  const roundsPlayedByPlayer = new Map<string, number>();
  for (const { playerId, matchId, totalRounds } of participations) {
    matchesPlayedByPlayer.set(
      playerId,
      (matchesPlayedByPlayer.get(playerId) ?? 0) + 1,
    );
    roundsPlayedByPlayer.set(
      playerId,
      (roundsPlayedByPlayer.get(playerId) ?? 0) + totalRounds,
    );
  }

  const winsByPlayer = new Map<string, number>();
  for (const { matchId } of summaries) {
    const championId = matchIdToChampion.get(matchId) ?? null;
    if (championId) {
      winsByPlayer.set(championId, (winsByPlayer.get(championId) ?? 0) + 1);
    }
  }

  const totalPointsByPlayer = new Map<string, number>();
  const bestThrowByPlayer = new Map<string, number>();
  const totalThrowsByPlayer = new Map<string, number>();
  for (const t of throws) {
    totalPointsByPlayer.set(
      t.playerId,
      (totalPointsByPlayer.get(t.playerId) ?? 0) + t.score,
    );
    const prevBest = bestThrowByPlayer.get(t.playerId) ?? 0;
    bestThrowByPlayer.set(t.playerId, Math.max(prevBest, t.score));
    totalThrowsByPlayer.set(
      t.playerId,
      (totalThrowsByPlayer.get(t.playerId) ?? 0) + 1,
    );
  }

  const playerById = new Map(players.map((p) => [p.playerId, p]));

  const playerIds = new Set([
    ...participations.map((p) => p.playerId),
    ...throws.map((t) => t.playerId),
  ]);

  const result: PlayerAnalytics[] = Array.from(playerIds).map((playerId) => {
    const matchesPlayed = matchesPlayedByPlayer.get(playerId) ?? 0;
    const roundsPlayed = roundsPlayedByPlayer.get(playerId) ?? 0;
    const totalPoints = totalPointsByPlayer.get(playerId) ?? 0;
    const averageRoundScore =
      roundsPlayed > 0 ? totalPoints / roundsPlayed : 0;

    return {
      playerId,
      playerName: playerById.get(playerId)?.name ?? playerId,
      matchesPlayed,
      roundsPlayed,
      wins: winsByPlayer.get(playerId) ?? 0,
      totalPoints,
      bestThrow: bestThrowByPlayer.get(playerId) ?? 0,
      averageRoundScore,
      totalThrows: totalThrowsByPlayer.get(playerId) ?? 0,
    };
  });

  result.sort((a, b) => b.totalPoints - a.totalPoints);
  return result;
}
