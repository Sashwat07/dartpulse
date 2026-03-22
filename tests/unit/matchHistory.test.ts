import { describe, expect, it } from "vitest";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { buildMatchOutcomeSummary } from "@/lib/matchOutcomeSummary";
import { deriveRoundScoreTable } from "@/lib/roundScoreTable";
import { deriveShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import { deriveSuddenDeathScoreDisplay } from "@/lib/suddenDeathDisplay";
import {
  getFinalPlacementFromPayload,
  getChampionPlayerIdFromPayload,
  type MatchHistoryPayload,
} from "@/lib/matchHistory";
import { fourPlayerPlayoffScenario } from "@/tests/fixtures";

/**
 * Build a minimal MatchHistoryPayload from the four-player playoff scenario
 * so we can test getChampionPlayerIdFromPayload and getFinalPlacementFromPayload.
 */
function buildPlayoffPayload(useFinalConfirmed: boolean): MatchHistoryPayload {
  const {
    match,
    players,
    throwEvents,
    playoffMatches,
    playoffMatchesFinalConfirmed,
  } = fourPlayerPlayoffScenario;
  const resolvedTieOrders: string[][] = [];
  const leaderboard = deriveLeaderboardFromThrowEvents(
    throwEvents,
    players,
    resolvedTieOrders,
  );
  const matchOutcomeSummary = buildMatchOutcomeSummary(leaderboard, players.length);
  const roundScoreTable = deriveRoundScoreTable(
    throwEvents,
    players,
    match.totalRounds,
  );
  const suddenDeathDisplay = deriveSuddenDeathScoreDisplay(throwEvents, players);
  const shotHistoryDisplay = deriveShotHistoryDisplay(
    throwEvents,
    players,
    match.totalRounds,
  );
  const playoffMatchesToUse = useFinalConfirmed
    ? playoffMatchesFinalConfirmed
    : playoffMatches;

  return {
    match,
    matchPlayers: players,
    throwEvents,
    rounds: [],
    playoffMatches: playoffMatchesToUse,
    leaderboard,
    matchOutcomeSummary,
    roundScoreTable,
    suddenDeathDisplay,
    shotHistoryDisplay,
  };
}

describe("getChampionPlayerIdFromPayload", () => {
  it("derives the playoff champion from a confirmed final", () => {
    const payload = buildPlayoffPayload(true);
    const champion = getChampionPlayerIdFromPayload(payload);
    expect(champion).toBe(fourPlayerPlayoffScenario.expectedChampionId);
  });

  it("returns the final winner even when final is provisionalCompleted", () => {
    const payload = buildPlayoffPayload(false);
    const champion = getChampionPlayerIdFromPayload(payload);
    expect(champion).toBe(fourPlayerPlayoffScenario.expectedChampionId);
  });
});

describe("getFinalPlacementFromPayload", () => {
  it("returns playoff ranks 1–4 for top four and regular ranks for rest", () => {
    const payload = buildPlayoffPayload(true);
    const placement = getFinalPlacementFromPayload(payload);
    expect(placement).toHaveLength(4);
    const byRank = placement.sort((a, b) => a.rank - b.rank);
    expect(byRank[0].rank).toBe(1);
    expect(byRank[0].playerId).toBe(fourPlayerPlayoffScenario.expectedChampionId);
    expect(byRank[1].rank).toBe(2);
    expect(byRank[2].rank).toBe(3);
    expect(byRank[3].rank).toBe(4);
  });

  it("assigns 1st–4th as final W/L, Q2 loser, eliminator loser", () => {
    const payload = buildPlayoffPayload(true);
    const placement = getFinalPlacementFromPayload(payload);
    const champion = placement.find((r) => r.rank === 1);
    expect(champion?.playerId).toBe(fourPlayerPlayoffScenario.expectedChampionId);
    const { expectedPlacements, playoffMatchesFinalConfirmed } = fourPlayerPlayoffScenario;
    const byRank = [...placement].sort((a, b) => a.rank - b.rank);
    expect(byRank[0].playerId).toBe(expectedPlacements.first);
    expect(byRank[1].playerId).toBe(expectedPlacements.second);
    expect(byRank[2].playerId).toBe(expectedPlacements.third);
    expect(byRank[3].playerId).toBe(expectedPlacements.fourth);

    const finalM = playoffMatchesFinalConfirmed.find((m) => m.stage === "final");
    const q2 = playoffMatchesFinalConfirmed.find((m) => m.stage === "qualifier2");
    const elim = playoffMatchesFinalConfirmed.find((m) => m.stage === "eliminator");
    expect(byRank[0].playerId).toBe(finalM?.winnerId);
    expect(byRank[1].playerId).toBe(finalM?.loserId);
    expect(byRank[2].playerId).toBe(q2?.loserId);
    expect(byRank[3].playerId).toBe(elim?.loserId);
  });
});
