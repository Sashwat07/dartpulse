import { describe, expect, it } from "vitest";
import { getFinalPlacementFromPayload } from "@/lib/matchHistory";
import { buildMatchHistoryPayloadFromData } from "./helpers/buildPayload";
import {
  twoPlayerNormalFinishScenario,
  fourPlayerPlayoffScenario,
} from "@/tests/fixtures";

/**
 * Integration sanity: placement-derived wins and consistency
 * from multiple fixture payloads (same pipeline as global leaderboard).
 */
describe("Analytics / leaderboard composition sanity", () => {
  it("composes placement from multiple payloads without crash", () => {
    const payload1 = buildMatchHistoryPayloadFromData(
      twoPlayerNormalFinishScenario.match,
      twoPlayerNormalFinishScenario.players,
      twoPlayerNormalFinishScenario.throwEvents,
      [],
      [],
    );

    const payload2 = buildMatchHistoryPayloadFromData(
      fourPlayerPlayoffScenario.match,
      fourPlayerPlayoffScenario.players,
      fourPlayerPlayoffScenario.throwEvents,
      [],
      fourPlayerPlayoffScenario.playoffMatchesFinalConfirmed,
    );

    const placement1 = getFinalPlacementFromPayload(payload1);
    const placement2 = getFinalPlacementFromPayload(payload2);

    expect(placement1).toHaveLength(2);
    expect(placement2).toHaveLength(4);

    const winsFromPlacement1 = placement1.filter((r) => r.rank === 1).map((r) => r.playerId);
    const winsFromPlacement2 = placement2.filter((r) => r.rank === 1).map((r) => r.playerId);

    expect(winsFromPlacement1).toHaveLength(1);
    expect(winsFromPlacement2).toHaveLength(1);
    expect(winsFromPlacement1[0]).toBe(twoPlayerNormalFinishScenario.expectedOutcome.winner);
    expect(winsFromPlacement2[0]).toBe(fourPlayerPlayoffScenario.expectedChampionId);
  });

  it("placement ranks are consistent with underlying leaderboard and playoff outcome", () => {
    const { match, players, throwEvents, playoffMatchesFinalConfirmed } =
      fourPlayerPlayoffScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      playoffMatchesFinalConfirmed,
    );

    const placement = getFinalPlacementFromPayload(payload);
    const byRank = placement.sort((a, b) => a.rank - b.rank);

    expect(byRank[0].rank).toBe(1);
    expect(byRank[1].rank).toBe(2);
    expect(byRank[2].rank).toBe(3);
    expect(byRank[3].rank).toBe(4);

    const championId = byRank[0].playerId;
    const finalMatch = payload.playoffMatches.find((m) => m.stage === "final");
    expect(finalMatch?.winnerId).toBe(championId);
  });
});
