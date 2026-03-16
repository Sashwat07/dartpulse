import { z } from "zod";

export const matchStatusSchema = z.enum([
  "matchCreated",
  "matchStarted",
  "roundActive",
  "roundComplete",
  "playoffPhase",
  "qualifier1Active",
  "qualifier2Active",
  "eliminatorActive",
  "finalActive",
  "matchFinished",
]);

export const matchModeSchema = z.enum(["casual", "tournament"]);

export const createMatchPayloadSchema = z
  .object({
    name: z.string().trim().optional().default(""),
    mode: matchModeSchema,
    totalRounds: z.number().int().positive(),
    playerIds: z.array(z.string()).min(2, "At least 2 players are required"),
    shotsPerRound: z.number().int().positive().optional(),
    playoffShotsPerRound: z.number().int().positive().optional(),
    shuffle: z.boolean().optional(),
  })
  .refine((data) => new Set(data.playerIds).size === data.playerIds.length, {
    message: "Duplicate player IDs",
    path: ["playerIds"],
  });

export const roundSchema = z.object({
  roundId: z.string(),
  matchId: z.string(),
  roundNumber: z.number().int().nonnegative(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export type CreateMatchPayloadInput = z.infer<typeof createMatchPayloadSchema>;
