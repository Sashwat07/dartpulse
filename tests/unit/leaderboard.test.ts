import { describe, expect, it } from "vitest";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { deriveMatchOutcome } from "@/lib/progression";
import {
  twoPlayerNormalFinishScenario,
  fourPlayerSuddenDeathScenario,
} from "@/tests/fixtures";

describe("deriveLeaderboardFromThrowEvents", () => {
  it("derives the correct final ranking for a two-player completed match", () => {
    const { players, throwEvents, expectedRanking } = twoPlayerNormalFinishScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(throwEvents, players, []);
    const actualOrder = leaderboard.sort((a, b) => a.rank - b.rank).map((e) => e.playerId);
    expect(actualOrder).toEqual(expectedRanking);
    expect(leaderboard[0].totalScore).toBe(38);
    expect(leaderboard[1].totalScore).toBe(35);
  });

  it("assigns ranks 1 to N by descending total score when no ties", () => {
    const { players, throwEvents } = twoPlayerNormalFinishScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(throwEvents, players, []);
    expect(leaderboard.map((e) => e.rank)).toEqual([1, 2]);
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[1].rank).toBe(2);
  });

  it("resolves a four-player tie using sudden-death resolved order", () => {
    const {
      players,
      throwEvents,
      resolvedTieOrders,
      expectedRanking,
    } = fourPlayerSuddenDeathScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(
      throwEvents,
      players,
      resolvedTieOrders,
    );
    const actualOrder = leaderboard.sort((a, b) => a.rank - b.rank).map((e) => e.playerId);
    expect(actualOrder).toEqual(expectedRanking);
  });

  it("places tied players in resolved tie order when resolvedTieOrders is provided", () => {
    const { players, throwEvents, resolvedTieOrders } = fourPlayerSuddenDeathScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(
      throwEvents,
      players,
      resolvedTieOrders,
    );
    const byRank = leaderboard.sort((a, b) => a.rank - b.rank);
    expect(byRank[0].playerId).toBe(players[0].playerId);
    expect(byRank[1].playerId).toBe(players[1].playerId);
    expect(byRank[2].playerId).toBe(players[2].playerId);
    expect(byRank[3].playerId).toBe(players[3].playerId);
  });
});

describe("deriveMatchOutcome", () => {
  it("derives the correct winner for a two-player completed match", () => {
    const { players, throwEvents, expectedOutcome } = twoPlayerNormalFinishScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(throwEvents, players, []);
    const outcome = deriveMatchOutcome(leaderboard, players.length);
    expect(outcome.winner).toBe(expectedOutcome.winner);
    expect(outcome.topTwo).toBeUndefined();
    expect(outcome.topFour).toBeUndefined();
  });

  it("derives top four for a four-player scenario when used with leaderboard", () => {
    const {
      players,
      throwEvents,
      resolvedTieOrders,
      expectedRanking,
    } = fourPlayerSuddenDeathScenario;
    const leaderboard = deriveLeaderboardFromThrowEvents(
      throwEvents,
      players,
      resolvedTieOrders,
    );
    const outcome = deriveMatchOutcome(leaderboard, players.length);
    expect(outcome.topFour).toEqual(expectedRanking);
    expect(outcome.winner).toBeUndefined();
  });
});
