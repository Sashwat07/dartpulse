import type { AchievementDefinition } from "@/lib/achievements/types";
import type { AchievementType } from "@/types/achievement";

/**
 * Phase 10 achievement definitions. Data-like; evaluator runs these.
 * Match rules use placement, roundScoreTable, throwEvents, match.
 * Career rules use playerStats.
 * Perfect Round: roundScore === getMaxRoundScore(shotsPerRound).
 * Big Throw: any throw >= BIG_THROW_THRESHOLD (50); includes bullseye and triple-20.
 */
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: "champion" as AchievementType, name: "Champion", kind: "match" },
  { id: "podium" as AchievementType, name: "Podium", kind: "match" },
  { id: "perfectRound" as AchievementType, name: "Perfect Round", kind: "match" },
  { id: "bigThrow" as AchievementType, name: "Big Throw", kind: "match" },
  { id: "comebackKing" as AchievementType, name: "Comeback King", kind: "match" },
  { id: "firstWin" as AchievementType, name: "First Win", kind: "career" },
  { id: "fiveWins" as AchievementType, name: "5 Wins", kind: "career" },
  { id: "tenWins" as AchievementType, name: "10 Wins", kind: "career" },
  { id: "thousandPoints" as AchievementType, name: "1000 Points", kind: "career" },
  { id: "fiftyRounds" as AchievementType, name: "50 Rounds", kind: "career" },
];

export const MATCH_ACHIEVEMENT_TYPES: AchievementType[] = [
  "champion",
  "podium",
  "perfectRound",
  "bigThrow",
  "comebackKing",
];

export const CAREER_ACHIEVEMENT_TYPES: AchievementType[] = [
  "firstWin",
  "fiveWins",
  "tenWins",
  "thousandPoints",
  "fiftyRounds",
];
