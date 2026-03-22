import { BIG_THROW_THRESHOLD, getMaxRoundScore } from "@/constants/scoringLimits";
import { detectComeback } from "@/lib/analytics/comeback";
import {
  createAchievement,
  hasAchievement,
} from "@/lib/achievements/repository";
import type { AchievementType } from "@/types/achievement";
import type { PlayerAnalytics } from "@/lib/analytics/types";
import {
  getChampionPlayerIdFromPayload,
  getFinalPlacementFromPayload,
  getMatchHistoryPayload,
} from "@/lib/matchHistory";
import { getPerPlayerAnalytics } from "@/lib/analytics/playerStats";

/**
 * Evaluate match-level achievements and persist awards.
 * Idempotent: checks hasAchievement(playerId, type, sourceMatchId) before each create.
 * Call after updateMatchToFinished(matchId).
 */
export async function evaluateMatchAchievements(
  matchId: string,
): Promise<void> {
  const payload = await getMatchHistoryPayload(matchId);
  if (!payload) return;

  const placement = getFinalPlacementFromPayload(payload);
  const championId = getChampionPlayerIdFromPayload(payload);
  const comebackResult = detectComeback(payload);
  const shotsPerRound = payload.match.shotsPerRound ?? 1;
  const maxRoundScore = getMaxRoundScore(shotsPerRound);
  const regularThrows = payload.throwEvents.filter(
    (e) => !e.playoffMatchId && e.roundNumber <= payload.match.totalRounds,
  );

  const placementByPlayer = new Map(placement.map((p) => [p.playerId, p.rank]));

  // Champion: rank 1
  if (championId) {
    const type: AchievementType = "champion";
    const exists = await hasAchievement(championId, type, matchId);
    if (!exists) {
      await createAchievement({
        playerId: championId,
        type,
        sourceMatchId: matchId,
      });
    }
  }

  // Podium: rank <= 3
  for (const { playerId, rank } of placement) {
    if (rank > 3) continue;
    const type: AchievementType = "podium";
    const exists = await hasAchievement(playerId, type, matchId);
    if (!exists) {
      await createAchievement({
        playerId,
        type,
        sourceMatchId: matchId,
      });
    }
  }

  // Perfect Round: any roundScore === getMaxRoundScore(shotsPerRound)
  for (const row of payload.roundScoreTable.rows) {
    const hasPerfect = row.roundScores.some((s) => s === maxRoundScore);
    if (!hasPerfect) continue;
    const type: AchievementType = "perfectRound";
    const exists = await hasAchievement(row.playerId, type, matchId);
    if (!exists) {
      await createAchievement({
        playerId: row.playerId,
        type,
        sourceMatchId: matchId,
      });
    }
  }

  // Big Throw: any throw >= BIG_THROW_THRESHOLD
  const playerIdsWithBigThrow = new Set<string>();
  for (const t of regularThrows) {
    if (t.score >= BIG_THROW_THRESHOLD) {
      playerIdsWithBigThrow.add(t.playerId);
    }
  }
  for (const playerId of playerIdsWithBigThrow) {
    const type: AchievementType = "bigThrow";
    const exists = await hasAchievement(playerId, type, matchId);
    if (!exists) {
      await createAchievement({
        playerId,
        type,
        sourceMatchId: matchId,
      });
    }
  }

  // Comeback King: champion and isComeback
  if (championId && comebackResult.isComeback) {
    const type: AchievementType = "comebackKing";
    const exists = await hasAchievement(championId, type, matchId);
    if (!exists) {
      await createAchievement({
        playerId: championId,
        type,
        sourceMatchId: matchId,
      });
    }
  }
}

/**
 * Evaluate career achievements for one player and persist if missing.
 * Idempotent: checks hasAchievement(playerId, type, null) before each create.
 * Call when loading player profile so career badges are up to date.
 * Pass precomputed stats when already available to avoid duplicate analytics work.
 */
export async function evaluateCareerAchievements(
  playerId: string,
  statsOrUndefined?: PlayerAnalytics | null,
): Promise<void> {
  const stats =
    statsOrUndefined ??
    (await getPerPlayerAnalytics()).find((p) => p.playerId === playerId);
  if (!stats) return;

  const checks: { type: AchievementType; condition: boolean }[] = [
    { type: "firstWin", condition: stats.wins >= 1 },
    { type: "fiveWins", condition: stats.wins >= 5 },
    { type: "tenWins", condition: stats.wins >= 10 },
    { type: "thousandPoints", condition: stats.totalPoints >= 1000 },
    { type: "fiftyRounds", condition: stats.roundsPlayed >= 50 },
  ];

  for (const { type, condition } of checks) {
    if (!condition) continue;
    const exists = await hasAchievement(playerId, type, null);
    if (!exists) {
      await createAchievement({
        playerId,
        type,
        sourceMatchId: undefined,
      });
    }
  }
}
