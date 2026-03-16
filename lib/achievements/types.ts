import type { AchievementType } from "@/types/achievement";

/**
 * Achievement definition for the rules layer.
 * kind: 'match' = evaluated per match with sourceMatchId; 'career' = evaluated from career stats, sourceMatchId null.
 */
export type AchievementDefinition = {
  id: AchievementType;
  name: string;
  kind: "match" | "career";
};

/**
 * Result of evaluating a single match/career rule: which playerIds qualify.
 */
export type AchievementRuleResult = {
  playerIds: string[];
};
