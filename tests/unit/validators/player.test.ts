import { describe, expect, it } from "vitest";

import { createPlayerPayloadSchema } from "@/lib/validators";

describe("createPlayerPayloadSchema", () => {
  it("accepts valid payload with name and avatarColor", () => {
    const result = createPlayerPayloadSchema.safeParse({
      name: "Alice",
      avatarColor: "#00ff00",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid payload with name only", () => {
    const result = createPlayerPayloadSchema.safeParse({ name: "Bob" });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = createPlayerPayloadSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createPlayerPayloadSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });
});
