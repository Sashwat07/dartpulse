import { z } from "zod";

import { DART_SCORE_MIN, DART_SCORE_MAX } from "@/constants/gameRules";

export const playoffStageSchema = z.enum([
  "qualifier1",
  "qualifier2",
  "eliminator",
  "final",
]);

/** Final only: provisionalCompleted until "Match complete" confirmation. */
export const playoffStatusSchema = z.enum([
  "pending",
  "active",
  "provisionalCompleted",
  "completed",
]);

export const resolvedBySchema = z.enum(["normal", "tieBreak", "suddenDeath"]);

export const playoffMatchSchema = z.object({
  playoffMatchId: z.string(),
  parentMatchId: z.string(),
  stage: playoffStageSchema,
  player1Id: z.string(),
  player2Id: z.string(),
  player1Score: z.number().int().nonnegative().optional(),
  player2Score: z.number().int().nonnegative().optional(),
  winnerId: z.string().optional(),
  loserId: z.string().optional(),
  status: playoffStatusSchema,
  resolvedBy: resolvedBySchema.optional(),
  createdAt: z.string(),
  completedAt: z.string().optional(),
});

/** Throw score: integer 1–60 (dart model: single/double/triple 1–20, bull 50). */
export const addPlayoffThrowPayloadSchema = z.object({
  playoffMatchId: z.string(),
  playerId: z.string(),
  score: z
    .number()
    .int()
    .min(DART_SCORE_MIN, { message: `Score must be at least ${DART_SCORE_MIN}` })
    .max(DART_SCORE_MAX, { message: `Score must be at most ${DART_SCORE_MAX}` }),
});

export const setPlayoffStartingPlayerPayloadSchema = z.object({
  playoffMatchId: z.string(),
  startingPlayerId: z.string(),
});

export const undoPlayoffThrowPayloadSchema = z.object({
  playoffMatchId: z.string(),
});
