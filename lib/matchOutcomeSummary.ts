import type { MatchOutcomeSummary } from "@/types/dto";
import type { MatchLeaderboardEntry } from "@/types/match";
import { deriveMatchOutcome } from "@/lib/progression";

/**
 * Builds presentation-ready match outcome summary from final resolved leaderboard.
 * Uses the same progression logic as playoff creation (deriveMatchOutcome).
 * decisionRights include playerId and playerName so the UI does not need to remap.
 */
export function buildMatchOutcomeSummary(
  leaderboard: MatchLeaderboardEntry[],
  playerCount: number,
): MatchOutcomeSummary {
  const ordered = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const ranking = ordered.map((e) => ({
    rank: e.rank,
    playerId: e.playerId,
    playerName: e.playerName,
  }));

  const outcome = deriveMatchOutcome(leaderboard, playerCount);
  const decisionRights: MatchOutcomeSummary["decisionRights"] = {};

  if (playerCount === 2) {
    const winnerId = outcome.winner;
    return {
      ranking,
      outcomeType: "winner",
      winnerPlayerId: winnerId,
      decisionRights,
    };
  }

  if (playerCount === 3) {
    const [r1, r2] = outcome.topTwo ?? [];
    const e1 = ordered[0];
    const e2 = ordered[1];
    if (e1) decisionRights.final = { playerId: e1.playerId, playerName: e1.playerName };
    return {
      ranking,
      outcomeType: "finalQualification",
      finalPairing:
        r1 != null && r2 != null && e1 != null && e2 != null
          ? {
              player1Id: r1,
              player2Id: r2,
              player1Name: e1.playerName,
              player2Name: e2.playerName,
            }
          : undefined,
      decisionRights,
    };
  }

  const [r1, r2, r3, r4] = outcome.topFour ?? [];
  const e1 = ordered[0];
  const e2 = ordered[1];
  const e3 = ordered[2];
  const e4 = ordered[3];
  if (e1) decisionRights.qualifier1 = { playerId: e1.playerId, playerName: e1.playerName };
  /** Rank 3 decides first throw in eliminator (3rd vs 4th opening round). Field key is legacy DTO name. */
  if (e3) decisionRights.qualifier2 = { playerId: e3.playerId, playerName: e3.playerName };

  return {
    ranking,
    outcomeType: "playoffQualification",
    qualifier1Pairing:
      r1 != null && r2 != null && e1 != null && e2 != null
        ? {
            player1Id: r1,
            player2Id: r2,
            player1Name: e1.playerName,
            player2Name: e2.playerName,
          }
        : undefined,
    /** 3rd vs 4th — opens as `eliminator` in bracket (not legacy “Q2”). */
    qualifier2Pairing:
      r3 != null && r4 != null && e3 != null && e4 != null
        ? {
            player1Id: r3,
            player2Id: r4,
            player1Name: e3.playerName,
            player2Name: e4.playerName,
          }
        : undefined,
    decisionRights,
  };
}
