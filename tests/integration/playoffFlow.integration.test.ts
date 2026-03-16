import { describe, expect, it } from "vitest";
import {
  getFinalPlacementFromPayload,
  getChampionPlayerIdFromPayload,
} from "@/lib/matchHistory";
import { buildMatchHistoryPayloadFromData } from "./helpers/buildPayload";
import {
  fourPlayerPlayoffScenario,
} from "@/tests/fixtures";

describe("Playoff flow composition (four-player)", () => {
  it("final placement and champion align with expectedChampionId", () => {
    const {
      match,
      players,
      throwEvents,
      playoffMatchesFinalConfirmed,
      expectedChampionId,
    } = fourPlayerPlayoffScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      playoffMatchesFinalConfirmed,
    );

    const champion = getChampionPlayerIdFromPayload(payload);
    expect(champion).toBe(expectedChampionId);

    const placement = getFinalPlacementFromPayload(payload);
    const rank1 = placement.find((r) => r.rank === 1);
    expect(rank1?.playerId).toBe(expectedChampionId);
  });

  it("provisional final state produces same champion semantics as confirmed", () => {
    const {
      match,
      players,
      throwEvents,
      playoffMatches,
      playoffMatchesFinalConfirmed,
      expectedChampionId,
    } = fourPlayerPlayoffScenario;

    const payloadProvisional = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      playoffMatches,
    );

    const payloadConfirmed = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      playoffMatchesFinalConfirmed,
    );

    expect(getChampionPlayerIdFromPayload(payloadProvisional)).toBe(expectedChampionId);
    expect(getChampionPlayerIdFromPayload(payloadConfirmed)).toBe(expectedChampionId);
  });

  it("final placement ordering is correct (champion, final loser, eliminator loser, fourth)", () => {
    const {
      match,
      players,
      throwEvents,
      playoffMatchesFinalConfirmed,
      expectedChampionId,
    } = fourPlayerPlayoffScenario;

    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      playoffMatchesFinalConfirmed,
    );

    const placement = getFinalPlacementFromPayload(payload);
    expect(placement).toHaveLength(4);

    const byRank = placement.sort((a, b) => a.rank - b.rank);
    expect(byRank[0].rank).toBe(1);
    expect(byRank[0].playerId).toBe(expectedChampionId);
    expect(byRank[1].rank).toBe(2);
    expect(byRank[2].rank).toBe(3);
    expect(byRank[3].rank).toBe(4);

    const finalMatch = payload.playoffMatches.find((m) => m.stage === "final");
    expect(finalMatch?.winnerId).toBe(byRank[0].playerId);
    expect(finalMatch?.loserId).toBe(byRank[1].playerId);
  });
});
