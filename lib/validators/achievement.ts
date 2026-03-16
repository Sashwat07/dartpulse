import { z } from "zod";

export const achievementTypeSchema = z.enum([
  "bullseyeKing",
  "longestStreak",
  "clutchPerformer",
  "consistencyMaster",
  "comebackPlayer",
  "champion",
  "podium",
  "perfectRound",
  "bigThrow",
  "comebackKing",
  "firstWin",
  "fiveWins",
  "tenWins",
  "thousandPoints",
  "fiftyRounds",
]);

export const achievementSchema = z.object({
  achievementId: z.string(),
  playerId: z.string(),
  type: achievementTypeSchema,
  sourceMatchId: z.string().optional(),
  awardedAt: z.string(),
});
