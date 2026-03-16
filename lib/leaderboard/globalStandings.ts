import type { GlobalLeaderboardEntry } from "@/lib/leaderboard/types";
import { getPerPlayerAnalytics } from "@/lib/analytics/playerStats";
import {
  getFinalPlacementFromPayload,
  getMatchHistoryPayload,
} from "@/lib/matchHistory";
import { listCompletedMatchSummaries } from "@/lib/repositories";

/**
 * Global standings for /leaderboard.
 * Completed matches only; final placement from shared history helper; metrics from Phase 9 player analytics.
 */
export async function getGlobalLeaderboardStandings(): Promise<
  GlobalLeaderboardEntry[]
> {
  const [analytics, summaries] = await Promise.all([
    getPerPlayerAnalytics(),
    listCompletedMatchSummaries(),
  ]);

  const placementByMatch = new Map<string, Map<string, number>>();
  const payloads = await Promise.all(
    summaries.map((s) => getMatchHistoryPayload(s.matchId)),
  );
  for (let i = 0; i < summaries.length; i++) {
    const payload = payloads[i];
    if (!payload) continue;
    const rows = getFinalPlacementFromPayload(payload);
    const m = new Map<string, number>();
    for (const { playerId, rank } of rows) {
      m.set(playerId, rank);
    }
    placementByMatch.set(summaries[i].matchId, m);
  }

  const analyticsById = new Map(analytics.map((a) => [a.playerId, a]));
  const winsByPlayer = new Map<string, number>();
  const podiumsByPlayer = new Map<string, number>();
  const finishSumByPlayer = new Map<string, number>();
  const finishCountByPlayer = new Map<string, number>();

  for (const s of summaries) {
    const ranks = placementByMatch.get(s.matchId);
    if (!ranks) continue;
    for (const [playerId, rank] of ranks) {
      finishSumByPlayer.set(
        playerId,
        (finishSumByPlayer.get(playerId) ?? 0) + rank,
      );
      finishCountByPlayer.set(
        playerId,
        (finishCountByPlayer.get(playerId) ?? 0) + 1,
      );
      if (rank === 1) {
        winsByPlayer.set(playerId, (winsByPlayer.get(playerId) ?? 0) + 1);
      }
      if (rank <= 3) {
        podiumsByPlayer.set(playerId, (podiumsByPlayer.get(playerId) ?? 0) + 1);
      }
    }
  }

  const result: GlobalLeaderboardEntry[] = analytics.map((a) => {
    const matchesPlayed = a.matchesPlayed;
    const finishCount = finishCountByPlayer.get(a.playerId) ?? 0;
    const averageFinish =
      finishCount > 0
        ? (finishSumByPlayer.get(a.playerId) ?? 0) / finishCount
        : 999;
    return {
      playerId: a.playerId,
      playerName: a.playerName,
      matchesPlayed,
      wins: winsByPlayer.get(a.playerId) ?? 0,
      podiums: podiumsByPlayer.get(a.playerId) ?? 0,
      averageFinish,
      totalPoints: a.totalPoints,
      averageRoundScore: a.averageRoundScore,
      bestThrow: a.bestThrow,
      totalThrows: a.totalThrows,
    };
  });

  return result.filter((e) => e.matchesPlayed > 0);
}
