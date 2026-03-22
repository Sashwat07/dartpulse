import { describe, expect, it } from "vitest";

import { BULLSEYE_SCORE } from "@/constants/gameRules";
import { addThrowPayloadSchema } from "@/lib/validators";

const basePayload = {
  matchId: "match-1",
  roundNumber: 1,
  playerId: "player-1",
  turnIndex: 0,
};

describe("addThrowPayloadSchema", () => {
  it("accepts valid score 1 (single 1)", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts bullseye score 50", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: BULLSEYE_SCORE,
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid score 60 (triple 20)", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: 60,
    });
    expect(result.success).toBe(true);
  });

  it("accepts score 0 (miss / rules min)", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects score above 60", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: 61,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative score", () => {
    const result = addThrowPayloadSchema.safeParse({
      ...basePayload,
      score: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = addThrowPayloadSchema.safeParse({
      matchId: "match-1",
      // missing roundNumber, playerId, turnIndex, score
    });
    expect(result.success).toBe(false);
  });
});
