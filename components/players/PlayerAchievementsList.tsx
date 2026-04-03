"use client";

import type { Achievement, AchievementType } from "@/types/achievement";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";

type PlayerAchievementsListProps = {
  achievements: Achievement[];
};

/** One row per achievement type, with total count. */
function groupAchievementsByType(achievements: Achievement[]): {
  type: AchievementType;
  count: number;
  sourceMatchId?: string;
  awardedAt?: string;
}[] {
  const map = new Map<AchievementType, { count: number; sample: Achievement }>();
  for (const a of achievements) {
    const cur = map.get(a.type);
    if (cur) {
      cur.count += 1;
    } else {
      map.set(a.type, { count: 1, sample: a });
    }
  }
  return Array.from(map.entries())
    .map(([type, { count, sample }]) => ({
      type,
      count,
      sourceMatchId: count === 1 ? sample.sourceMatchId : undefined,
      awardedAt: sample.awardedAt,
    }))
    .sort((a, b) => a.type.localeCompare(b.type));
}

export function PlayerAchievementsList({ achievements }: PlayerAchievementsListProps) {
  const rows = groupAchievementsByType(achievements);

  return (
    <StaggerChildren className="flex flex-wrap gap-3" staggerDelay={0.04}>
      {rows.map((row) => (
        <StaggerChild key={row.type}>
          <AchievementBadge
            type={row.type}
            sourceMatchId={row.sourceMatchId}
            awardedAt={row.awardedAt}
            count={row.count}
          />
        </StaggerChild>
      ))}
    </StaggerChildren>
  );
}
