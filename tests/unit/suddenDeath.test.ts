import { describe, expect, it } from "vitest";
import {
  getRegularThrows,
  isRegularRoundsComplete,
  getRankedTiedGroups,
  getActiveTieGroup,
  deriveResolvedTieOrdersFromThrowEvents,
  deriveSuddenDeath,
  shouldMarkMatchFinishedAfterRegularPhaseComplete,
} from "@/lib/suddenDeath";
import {
  twoPlayerNormalFinishScenario,
  fourPlayerSuddenDeathScenario,
} from "@/tests/fixtures";

describe("getRegularThrows", () => {
  it("returns only regular throws without playoffMatchId for two-player scenario", () => {
    const { throwEvents } = twoPlayerNormalFinishScenario;
    const regular = getRegularThrows(throwEvents);
    expect(regular).toHaveLength(throwEvents.length);
    expect(regular.every((e) => e.eventType === "regular" && !e.playoffMatchId)).toBe(true);
  });

  it("excludes sudden-death throws in four-player scenario", () => {
    const { throwEvents } = fourPlayerSuddenDeathScenario;
    const regular = getRegularThrows(throwEvents);
    const regularCount = throwEvents.filter((e) => e.eventType === "regular").length;
    expect(regular).toHaveLength(regularCount);
    expect(regular.every((e) => e.eventType === "regular")).toBe(true);
  });
});

describe("isRegularRoundsComplete", () => {
  it("returns true for two-player scenario when all rounds are filled", () => {
    const { players, throwEvents, match } = twoPlayerNormalFinishScenario;
    const complete = isRegularRoundsComplete(
      throwEvents,
      match.totalRounds,
      players.length,
      match.shotsPerRound ?? 1,
    );
    expect(complete).toBe(true);
  });

  it("returns true for four-player scenario after regular round only", () => {
    const { players, throwEvents, match } = fourPlayerSuddenDeathScenario;
    const regularOnly = throwEvents.filter((e) => e.eventType === "regular");
    const complete = isRegularRoundsComplete(
      regularOnly,
      match.totalRounds,
      players.length,
      match.shotsPerRound ?? 1,
    );
    expect(complete).toBe(true);
  });
});

describe("getRankedTiedGroups", () => {
  it("returns no tied groups for two-player scenario with no tie", () => {
    const { players, throwEvents } = twoPlayerNormalFinishScenario;
    const groups = getRankedTiedGroups(throwEvents, players);
    expect(groups).toHaveLength(0);
  });

  it("returns one tied group of three for four-player sudden-death scenario (A,B,C tied)", () => {
    const { players, throwEvents } = fourPlayerSuddenDeathScenario;
    const regularOnly = throwEvents.filter((e) => e.eventType === "regular");
    const groups = getRankedTiedGroups(regularOnly, players);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
    const [a, b, c] = fourPlayerSuddenDeathScenario.players;
    expect(groups[0]).toContain(a.playerId);
    expect(groups[0]).toContain(b.playerId);
    expect(groups[0]).toContain(c.playerId);
  });
});

describe("getActiveTieGroup", () => {
  it("returns null when there are no ties", () => {
    const { players, throwEvents } = twoPlayerNormalFinishScenario;
    const active = getActiveTieGroup(throwEvents, players);
    expect(active).toBeNull();
  });

  it("returns the first tied group for four-player scenario before sudden death", () => {
    const { players, throwEvents } = fourPlayerSuddenDeathScenario;
    const regularOnly = throwEvents.filter((e) => e.eventType === "regular");
    const active = getActiveTieGroup(regularOnly, players);
    expect(active).not.toBeNull();
    expect(active).toHaveLength(3);
  });
});

describe("deriveResolvedTieOrdersFromThrowEvents", () => {
  it("reconstructs resolved tie order from sudden-death throws in four-player scenario", () => {
    const { players, throwEvents, resolvedTieOrders: expected } = fourPlayerSuddenDeathScenario;
    const resolved = deriveResolvedTieOrdersFromThrowEvents(
      throwEvents,
      players,
      fourPlayerSuddenDeathScenario.match.totalRounds,
    );
    expect(resolved).toHaveLength(expected.length);
    expect(resolved[0]).toEqual(expected[0]);
    expect(resolved[0]).toHaveLength(3);
    expect(resolved[0][0]).toBe(players[0].playerId);
    expect(resolved[0][1]).toBe(players[1].playerId);
    expect(resolved[0][2]).toBe(players[2].playerId);
  });
});

describe("shouldMarkMatchFinishedAfterRegularPhaseComplete", () => {
  it("is true only for two-player matches (no playoffs)", () => {
    expect(shouldMarkMatchFinishedAfterRegularPhaseComplete(2)).toBe(true);
    expect(shouldMarkMatchFinishedAfterRegularPhaseComplete(3)).toBe(false);
    expect(shouldMarkMatchFinishedAfterRegularPhaseComplete(4)).toBe(false);
  });
});

describe("deriveSuddenDeath", () => {
  it("returns resolved tie orders and isMatchFullyComplete for finished four-player match", () => {
    const { match, players, throwEvents, resolvedTieOrders: expected } = fourPlayerSuddenDeathScenario;
    const result = deriveSuddenDeath(
      match.matchId,
      throwEvents,
      players,
      match.totalRounds,
      "matchFinished",
      match.shotsPerRound ?? 1,
    );
    expect(result.suddenDeathState).toBeNull();
    expect(result.currentTurn).toBeNull();
    expect(result.isMatchFullyComplete).toBe(true);
    expect(result.resolvedTieOrders).toHaveLength(expected.length);
    expect(result.resolvedTieOrders[0]).toEqual(expected[0]);
  });

  it("returns no sudden-death state for two-player match with no ties", () => {
    const { match, players, throwEvents } = twoPlayerNormalFinishScenario;
    const result = deriveSuddenDeath(
      match.matchId,
      throwEvents,
      players,
      match.totalRounds,
      "matchFinished",
      match.shotsPerRound ?? 1,
    );
    expect(result.suddenDeathState).toBeNull();
    expect(result.resolvedTieOrders).toEqual([]);
    expect(result.isMatchFullyComplete).toBe(true);
  });
});
