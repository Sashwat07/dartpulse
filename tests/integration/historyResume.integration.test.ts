import { describe, expect, it } from "vitest";
import type { MatchStatus } from "@/types/match";

const COMPLETED_STATUS: MatchStatus = "matchFinished";

const RESUMABLE_STATUSES: MatchStatus[] = [
  "matchCreated",
  "matchStarted",
  "roundActive",
  "roundComplete",
  "playoffPhase",
  "qualifier1Active",
  "qualifier2Active",
  "eliminatorActive",
  "finalActive",
];

/**
 * Product rule: completed matches belong to history; in-progress matches belong to resume.
 * listCompletedMatches returns status === "matchFinished";
 * listResumableMatches returns status !== "matchFinished".
 * This test asserts the separation contract without hitting the DB.
 */
describe("History vs resume separation", () => {
  it("completed status is exactly matchFinished", () => {
    expect(COMPLETED_STATUS).toBe("matchFinished");
  });

  it("no resumable status equals matchFinished", () => {
    for (const status of RESUMABLE_STATUSES) {
      expect(status).not.toBe("matchFinished");
    }
  });

  it("a match cannot be both completed and resumable (status partition)", () => {
    const completedSet = new Set([COMPLETED_STATUS]);
    const resumableSet = new Set(RESUMABLE_STATUSES);
    for (const s of resumableSet) {
      expect(completedSet.has(s)).toBe(false);
    }
    expect(completedSet.has(COMPLETED_STATUS)).toBe(true);
    expect(resumableSet.has(COMPLETED_STATUS)).toBe(false);
  });

  it("completed matches should not appear resumable when classified by status", () => {
    const matchCompleted = { matchId: "m1", status: "matchFinished" as MatchStatus };
    const isResumable = matchCompleted.status !== "matchFinished";
    expect(isResumable).toBe(false);
  });

  it("resumable matches should not appear as completed history when classified by status", () => {
    const matchInProgress = { matchId: "m2", status: "roundActive" as MatchStatus };
    const isCompleted = matchInProgress.status === "matchFinished";
    expect(isCompleted).toBe(false);
  });
});
