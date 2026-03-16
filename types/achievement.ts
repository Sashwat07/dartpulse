import type { IsoDateString } from "@/types/common";

export type AchievementType =
  | "bullseyeKing"
  | "longestStreak"
  | "clutchPerformer"
  | "consistencyMaster"
  | "comebackPlayer"
  // Phase 10 match-scoped
  | "champion"
  | "podium"
  | "perfectRound"
  | "bigThrow"
  | "comebackKing"
  // Phase 10 career-scoped
  | "firstWin"
  | "fiveWins"
  | "tenWins"
  | "thousandPoints"
  | "fiftyRounds";

/**
 * Badge/milestone earned by a player (entity-model §11).
 */
export type Achievement = {
  achievementId: string;
  playerId: string;
  type: AchievementType;
  sourceMatchId?: string;
  awardedAt: IsoDateString;
};
