import { describe, expect, it } from "vitest";
import {
  getFinalPlacementFromPayload,
  getChampionPlayerIdFromPayload,
} from "@/lib/matchHistory";
import { buildMatchHistoryPayloadFromData } from "./helpers/buildPayload";
import { fourPlayerPlayoffScenario } from "@/tests/fixtures";

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

  it("final placement ordering is correct (champion, final loser, Q2 loser, eliminator loser)", () => {
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

    const { expectedPlacements } = fourPlayerPlayoffScenario;
    expect(byRank[0].playerId).toBe(expectedPlacements.first);
    expect(byRank[1].playerId).toBe(expectedPlacements.second);
    expect(byRank[2].playerId).toBe(expectedPlacements.third);
    expect(byRank[3].playerId).toBe(expectedPlacements.fourth);
  });

  it("bracket progression matches new format: Q1/Elim → Q2 feeds Final with correct winners", () => {
    const { playoffMatchesFinalConfirmed } = fourPlayerPlayoffScenario;
    const q1 = playoffMatchesFinalConfirmed.find((m) => m.stage === "qualifier1");
    const elim = playoffMatchesFinalConfirmed.find((m) => m.stage === "eliminator");
    const q2 = playoffMatchesFinalConfirmed.find((m) => m.stage === "qualifier2");
    const finalM = playoffMatchesFinalConfirmed.find((m) => m.stage === "final");

    expect(q1).toBeDefined();
    expect(elim).toBeDefined();
    expect(q2).toBeDefined();
    expect(finalM).toBeDefined();

    expect(q2!.player1Id).toBe(q1!.loserId);
    expect(q2!.player2Id).toBe(elim!.winnerId);
    expect(finalM!.player1Id).toBe(q1!.winnerId);
    expect(finalM!.player2Id).toBe(q2!.winnerId);

    expect(elim!.loserId).toBe(fourPlayerPlayoffScenario.expectedPlacements.fourth);
    expect(q2!.loserId).toBe(fourPlayerPlayoffScenario.expectedPlacements.third);
    expect(finalM!.loserId).toBe(fourPlayerPlayoffScenario.expectedPlacements.second);
    expect(finalM!.winnerId).toBe(fourPlayerPlayoffScenario.expectedPlacements.first);
  });
});
