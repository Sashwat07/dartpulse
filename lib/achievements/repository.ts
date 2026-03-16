import type { Achievement, AchievementType } from "@/types/achievement";
import {
  createAchievement as createAchievementDb,
  listAchievementsByPlayerId,
} from "@/lib/repositories/achievementRepository";

export { createAchievementDb as createAchievement };
export { listAchievementsByPlayerId };

/**
 * Idempotency check: whether this player already has this achievement for this source.
 * Match-scoped: sourceMatchId = matchId. Career-scoped: sourceMatchId = null.
 * Evaluator must call this before creating; if true, do not create again.
 */
export async function hasAchievement(
  playerId: string,
  type: AchievementType,
  sourceMatchId: string | null,
): Promise<boolean> {
  const list = await listAchievementsByPlayerId(playerId);
  return list.some(
    (a) =>
      a.type === type &&
      (sourceMatchId == null
        ? a.sourceMatchId == null || a.sourceMatchId === undefined
        : a.sourceMatchId === sourceMatchId),
  );
}
