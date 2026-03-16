import { describe, expect, it } from "vitest";
import {
  getFinalPlacementFromPayload,
  getChampionPlayerIdFromPayload,
} from "@/lib/matchHistory";
import { buildMatchHistoryPayloadFromData } from "./helpers/buildPayload";
import {
  twoPlayerNormalFinishScenario,
  fourPlayerSuddenDeathScenario,
} from "@/tests/fixtures";

describe("Match history composition (two-player normal finish)", () => {
  it("composes a completed match payload with correct final leaderboard and outcome", () => {
    const { match, players, throwEvents, expectedOutcome, expectedRanking } =
      twoPlayerNormalFinishScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const placement = getFinalPlacementFromPayload(payload);
    const actualOrder = placement.sort((a, b) => a.rank - b.rank).map((r) => r.playerId);
    expect(actualOrder).toEqual(expectedRanking);
    expect(payload.leaderboard.length).toBe(2);
    expect(payload.leaderboard[0].rank).toBe(1);
    expect(payload.leaderboard[1].rank).toBe(2);
  });

  it("match outcome summary aligns with expected winner", () => {
    const { match, players, throwEvents, expectedOutcome } =
      twoPlayerNormalFinishScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    expect(payload.matchOutcomeSummary.outcomeType).toBe("winner");
    expect(payload.matchOutcomeSummary.winnerPlayerId).toBe(expectedOutcome.winner);
  });

  it("champion from payload matches expected winner", () => {
    const { match, players, throwEvents, expectedOutcome } =
      twoPlayerNormalFinishScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const champion = getChampionPlayerIdFromPayload(payload);
    expect(champion).toBe(expectedOutcome.winner);
  });
});

describe("Match history composition (four-player sudden death)", () => {
  it("resolved ranking in composed payload matches expectedRanking", () => {
    const { match, players, throwEvents, expectedRanking } =
      fourPlayerSuddenDeathScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const placement = getFinalPlacementFromPayload(payload);
    const actualOrder = placement.sort((a, b) => a.rank - b.rank).map((r) => r.playerId);
    expect(actualOrder).toEqual(expectedRanking);
  });

  it("sudden death contribution is reflected in final leaderboard", () => {
    const { match, players, throwEvents, resolvedTieOrders } =
      fourPlayerSuddenDeathScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    expect(payload.leaderboard).toHaveLength(4);
    expect(payload.suddenDeathDisplay).not.toBeNull();
    expect(payload.suddenDeathDisplay?.sdRoundNumbers.length ?? 0).toBeGreaterThan(0);
    const ordered = payload.leaderboard.sort((a, b) => a.rank - b.rank).map((e) => e.playerId);
    expect(ordered[0]).toBe(resolvedTieOrders[0][0]);
    expect(ordered[1]).toBe(resolvedTieOrders[0][1]);
    expect(ordered[2]).toBe(resolvedTieOrders[0][2]);
  });
});
