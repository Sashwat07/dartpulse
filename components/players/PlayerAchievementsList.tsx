"use client";

import type { Achievement } from "@/types/achievement";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";

type PlayerAchievementsListProps = {
  achievements: Achievement[];
};

export function PlayerAchievementsList({ achievements }: PlayerAchievementsListProps) {
  return (
    <StaggerChildren className="flex flex-wrap gap-3" staggerDelay={0.04}>
      {achievements.map((a) => (
        <StaggerChild key={a.achievementId}>
          <AchievementBadge
            type={a.type}
            sourceMatchId={a.sourceMatchId}
            awardedAt={a.awardedAt}
          />
        </StaggerChild>
      ))}
    </StaggerChildren>
  );
}
