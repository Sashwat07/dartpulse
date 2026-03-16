import { describe, expect, it } from "vitest";

import { createMatchPayloadSchema } from "@/lib/validators";

describe("createMatchPayloadSchema", () => {
  it("accepts valid payload", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "Friday Night",
      mode: "casual",
      totalRounds: 10,
      playerIds: ["p1", "p2"],
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing name (server will apply default)", () => {
    const result = createMatchPayloadSchema.safeParse({
      mode: "casual",
      totalRounds: 10,
      playerIds: ["p1", "p2"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("");
  });

  it("accepts blank name", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "   ",
      mode: "casual",
      totalRounds: 10,
      playerIds: ["p1", "p2"],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("");
  });

  it("rejects non-string name", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: 123,
      mode: "casual",
      totalRounds: 10,
      playerIds: ["p1", "p2"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty playerIds", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "Match",
      mode: "tournament",
      totalRounds: 5,
      playerIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects single player", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "Match",
      mode: "casual",
      totalRounds: 5,
      playerIds: ["p1"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate playerIds", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "Match",
      mode: "casual",
      totalRounds: 5,
      playerIds: ["p1", "p1"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid mode", () => {
    const result = createMatchPayloadSchema.safeParse({
      name: "Match",
      mode: "invalid",
      totalRounds: 5,
      playerIds: ["p1", "p2"],
    });
    expect(result.success).toBe(false);
  });
});
