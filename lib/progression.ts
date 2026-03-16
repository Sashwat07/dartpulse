import type { MatchLeaderboardEntry } from "@/types/match";

export type MatchOutcome = {
  winner?: string;
  topTwo?: string[];
  topFour?: string[];
};

/**
 * Derives winner and progression-relevant playerIds from final leaderboard and player count.
 * Does not create playoff matches or persist anything.
 * - 2 players: winner only (rank 1); if tied, sudden death already resolved rank 1/2.
 * - 3 players: top 2 (go to final).
 * - 4+ players: top 4 (advance to playoffs).
 */
export function deriveMatchOutcome(
  leaderboard: MatchLeaderboardEntry[],
  playerCount: number,
): MatchOutcome {
  const outcome: MatchOutcome = {};
  if (leaderboard.length === 0 || playerCount === 0) return outcome;

  const ordered = [...leaderboard].sort((a, b) => a.rank - b.rank);

  if (playerCount === 2) {
    if (ordered[0]) outcome.winner = ordered[0].playerId;
  } else if (playerCount === 3) {
    outcome.topTwo = ordered.slice(0, 2).map((e) => e.playerId);
  } else {
    outcome.topFour = ordered.slice(0, 4).map((e) => e.playerId);
  }

  return outcome;
}
