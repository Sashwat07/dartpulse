import { describe, expect, it } from "vitest";

import {
  linkedPlayerNeedsProfileCompletion,
  shouldSkipProfileCompletionGate,
} from "@/lib/auth/profileGate";

describe("linkedPlayerNeedsProfileCompletion", () => {
  it("is false when player is null", () => {
    expect(linkedPlayerNeedsProfileCompletion(null)).toBe(false);
  });

  it("is false for manual players (no userId)", () => {
    expect(
      linkedPlayerNeedsProfileCompletion({
        name: "Bob",
        userId: undefined,
        profileCompleted: false,
      }),
    ).toBe(false);
  });

  it("is false when profile is complete", () => {
    expect(
      linkedPlayerNeedsProfileCompletion({
        userId: "u1",
        profileCompleted: true,
      }),
    ).toBe(false);
  });

  it("is true for linked player with profileCompleted false", () => {
    expect(
      linkedPlayerNeedsProfileCompletion({
        userId: "u1",
        profileCompleted: false,
      }),
    ).toBe(true);
  });
});

describe("shouldSkipProfileCompletionGate", () => {
  it("skips complete-profile, NextAuth, and login", () => {
    expect(shouldSkipProfileCompletionGate("/complete-profile")).toBe(true);
    expect(shouldSkipProfileCompletionGate("/complete-profile/step")).toBe(true);
    expect(shouldSkipProfileCompletionGate("/api/auth/callback/google")).toBe(true);
    expect(shouldSkipProfileCompletionGate("/login")).toBe(true);
  });

  it("does not skip main app routes", () => {
    expect(shouldSkipProfileCompletionGate("/app")).toBe(false);
    expect(shouldSkipProfileCompletionGate("/match/new")).toBe(false);
    expect(shouldSkipProfileCompletionGate("/history")).toBe(false);
  });
});
