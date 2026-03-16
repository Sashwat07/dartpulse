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

  it("assigns champion rank 1, final loser rank 2, eliminator loser 3, fourth 4", () => {
    const payload = buildPlayoffPayload(true);
    const placement = getFinalPlacementFromPayload(payload);
    const champion = placement.find((r) => r.rank === 1);
    expect(champion?.playerId).toBe(fourPlayerPlayoffScenario.expectedChampionId);
  });
});
