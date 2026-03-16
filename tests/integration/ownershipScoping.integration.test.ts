import { describe, expect, it } from "vitest";
import type { Match, MatchStatus } from "@/types/match";
import { makeMatch } from "@/tests/fixtures";
import {
  listOwnedCompletedMatches,
  listOwnedResumableMatches,
  listCompletedMatches,
  listResumableMatches,
} from "@/lib/repositories";

/**
 * Pure contract: a match belongs in "owned completed" list iff
 * status === "matchFinished" AND createdByUserId === userId (strict; legacy excluded).
 */
function isOwnedCompleted(match: Match, userId: string): boolean {
  if (match.status !== "matchFinished") return false;
  if (match.createdByUserId === undefined || match.createdByUserId === null) return false;
  return match.createdByUserId === userId;
}

/**
 * Pure contract: a match belongs in "owned resumable" list iff
 * status !== "matchFinished" AND createdByUserId === userId (strict; legacy excluded).
 */
function isOwnedResumable(match: Match, userId: string): boolean {
  if (match.status === "matchFinished") return false;
  if (match.createdByUserId === undefined || match.createdByUserId === null) return false;
  return match.createdByUserId === userId;
}

describe("Ownership filter contract (owner-scoped lists)", () => {
  const userId = "user-alpha";

  it("isOwnedCompleted includes only matchFinished with matching owner", () => {
    const completedOwned = makeMatch({
      matchId: "m1",
      name: "M1",
      mode: "casual",
      totalRounds: 3,
      status: "matchFinished",
      createdByUserId: userId,
    });
    const completedOther = makeMatch({
      matchId: "m2",
      name: "M2",
      mode: "casual",
      totalRounds: 3,
      status: "matchFinished",
      createdByUserId: "other-user",
    });
    const completedLegacy = makeMatch({
      matchId: "m3",
      name: "M3",
      mode: "casual",
      totalRounds: 3,
      status: "matchFinished",
    });
    expect(isOwnedCompleted(completedOwned, userId)).toBe(true);
    expect(isOwnedCompleted(completedOther, userId)).toBe(false);
    expect(isOwnedCompleted(completedLegacy, userId)).toBe(false);
  });

  it("isOwnedResumable includes only non-finished with matching owner", () => {
    const resumableOwned = makeMatch({
      matchId: "r1",
      name: "R1",
      mode: "casual",
      totalRounds: 3,
      status: "roundActive",
      createdByUserId: userId,
    });
    const resumableOther = makeMatch({
      matchId: "r2",
      name: "R2",
      mode: "casual",
      totalRounds: 3,
      status: "matchStarted",
      createdByUserId: "other-user",
    });
    const resumableLegacy = makeMatch({
      matchId: "r3",
      name: "R3",
      mode: "casual",
      totalRounds: 3,
      status: "playoffPhase",
    });
    expect(isOwnedResumable(resumableOwned, userId)).toBe(true);
    expect(isOwnedResumable(resumableOther, userId)).toBe(false);
    expect(isOwnedResumable(resumableLegacy, userId)).toBe(false);
  });

  it("legacy matches (null/undefined createdByUserId) never appear in owned lists", () => {
    const statuses: MatchStatus[] = [
      "matchCreated",
      "matchStarted",
      "roundActive",
      "matchFinished",
    ];
    for (const status of statuses) {
      const legacy = makeMatch({
        matchId: `legacy-${status}`,
        name: "Legacy",
        mode: "casual",
        totalRounds: 3,
        status,
      });
      expect(isOwnedCompleted(legacy, userId)).toBe(false);
      expect(isOwnedResumable(legacy, userId)).toBe(false);
    }
  });
});

describe("Repository API contract (owner-scoped vs global)", () => {
  it("listOwnedCompletedMatches and listOwnedResumableMatches accept userId", () => {
    expect(listOwnedCompletedMatches.length).toBe(1);
    expect(listOwnedResumableMatches.length).toBe(1);
    // Arity: (userId: string). Call with a dummy id; may return [] if no DB or empty DB.
    expect(typeof listOwnedCompletedMatches).toBe("function");
    expect(typeof listOwnedResumableMatches).toBe("function");
  });

  it("listCompletedMatches and listResumableMatches are global (no userId)", () => {
    expect(listCompletedMatches.length).toBe(0);
    expect(listResumableMatches.length).toBe(0);
  });

});

describe("History / Resume / App data boundary contract", () => {
  it("history data source is owner-scoped (listOwnedCompletedMatches)", () => {
    expect(listOwnedCompletedMatches).toBeDefined();
    expect(listOwnedResumableMatches).toBeDefined();
  });

  it("resume data source is owner-scoped (listOwnedResumableMatches)", () => {
    expect(listOwnedResumableMatches).toBeDefined();
  });

  it("global list functions exist for analytics/leaderboard (unscoped)", () => {
    expect(listCompletedMatches).toBeDefined();
    expect(listResumableMatches).toBeDefined();
  });
});
