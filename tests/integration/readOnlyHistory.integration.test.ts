import { describe, expect, it } from "vitest";
import {
  getFinalPlacementFromPayload,
  getChampionPlayerIdFromPayload,
} from "@/lib/matchHistory";
import { buildMatchHistoryPayloadFromData } from "./helpers/buildPayload";
import { twoPlayerNormalFinishScenario } from "@/tests/fixtures";

/**
 * Read-only history invariant: completed history payload is consumed for reads only.
 * Placement and champion derivation must be pure (same input -> same output)
 * and must not mutate the payload.
 */
describe("Read-only history invariant", () => {
  it("getFinalPlacementFromPayload is idempotent (same payload yields same result)", () => {
    const { match, players, throwEvents } = twoPlayerNormalFinishScenario;
    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const first = getFinalPlacementFromPayload(payload);
    const second = getFinalPlacementFromPayload(payload);

    expect(first).toEqual(second);
    expect(first).toHaveLength(second.length);
  });

  it("getChampionPlayerIdFromPayload is idempotent", () => {
    const { match, players, throwEvents } = twoPlayerNormalFinishScenario;
    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const first = getChampionPlayerIdFromPayload(payload);
    const second = getChampionPlayerIdFromPayload(payload);

    expect(first).toBe(second);
  });

  it("payload is not mutated by placement or champion derivation", () => {
    const { match, players, throwEvents } = twoPlayerNormalFinishScenario;
    const payload = buildMatchHistoryPayloadFromData(
      match,
      players,
      throwEvents,
      [],
      [],
    );

    const leaderboardBefore = payload.leaderboard.map((e) => ({ ...e }));
    const playoffMatchesBefore = payload.playoffMatches.map((m) => ({ ...m }));

    getFinalPlacementFromPayload(payload);
    getChampionPlayerIdFromPayload(payload);
    getFinalPlacementFromPayload(payload);

    expect(payload.leaderboard).toHaveLength(leaderboardBefore.length);
    expect(payload.playoffMatches).toHaveLength(playoffMatchesBefore.length);
    for (let i = 0; i < payload.leaderboard.length; i++) {
      expect(payload.leaderboard[i].playerId).toBe(leaderboardBefore[i].playerId);
      expect(payload.leaderboard[i].rank).toBe(leaderboardBefore[i].rank);
    }
  });
});
