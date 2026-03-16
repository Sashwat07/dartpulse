import type { Achievement, AchievementType } from "@/types/achievement";

import { db } from "@/lib/db";

type CreateAchievementData = {
  playerId: string;
  type: AchievementType;
  sourceMatchId?: string;
};

export async function createAchievement(
  data: CreateAchievementData,
): Promise<Achievement> {
  const created = await db.achievement.create({
    data: {
      playerId: data.playerId,
      type: data.type,
      sourceMatchId: data.sourceMatchId,
    },
  });
  return {
    achievementId: created.achievementId,
    playerId: created.playerId,
    type: created.type as AchievementType,
    sourceMatchId: created.sourceMatchId ?? undefined,
    awardedAt: created.awardedAt.toISOString(),
  };
}

export async function listAchievementsByPlayerId(
  playerId: string,
): Promise<Achievement[]> {
  const list = await db.achievement.findMany({
    where: { playerId },
    orderBy: { awardedAt: "desc" },
  });
  return list.map((a) => ({
    achievementId: a.achievementId,
    playerId: a.playerId,
    type: a.type as AchievementType,
    sourceMatchId: a.sourceMatchId ?? undefined,
    awardedAt: a.awardedAt.toISOString(),
  }));
}
