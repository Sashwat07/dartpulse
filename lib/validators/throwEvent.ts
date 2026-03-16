import { z } from "zod";

import { DART_SCORE_MIN, DART_SCORE_MAX } from "@/constants/gameRules";

export const throwEventTypeSchema = z.enum(["regular", "suddenDeath"]);

/** Throw score: integer 1–60 (dart model: single/double/triple 1–20, bull 50). */
export const addThrowPayloadSchema = z.object({
  matchId: z.string(),
  roundId: z.string().optional(),
  roundNumber: z.number().int().nonnegative().optional(),
  playerId: z.string(),
  turnIndex: z.number().int().nonnegative().optional(),
  score: z
    .number()
    .int()
    .min(DART_SCORE_MIN, { message: `Score must be at least ${DART_SCORE_MIN}` })
    .max(DART_SCORE_MAX, { message: `Score must be at most ${DART_SCORE_MAX}` }),
});

export type AddThrowPayloadInput = z.infer<typeof addThrowPayloadSchema>;
