import type { MatchHistoryPayload } from "@/lib/matchHistory";

/**
 * Match energy = simple competitiveness score.
 * Formula: energyScore = (leadChanges × 3) + (closeRounds × 2) + clutchRoundShift
 * Scope: completed matches only; regulation rounds from roundScoreTable.
 */
export type MatchEnergyResult = {
  energyScore: number;
  leadChanges: number;
  closeRounds: number;
  clutchRoundShift: 0 | 1;
};

/**
 * Compute cumulative leader after each round, then:
 * - leadChanges = number of times match leader changed across rounds
 * - closeRounds = rounds where top two round scores differ by <= 2
 * - clutchRoundShift = 1 if final round changed the leader
 * Payload-first to avoid duplicate loads.
 */
export function getMatchEnergy(
  payload: MatchHistoryPayload,
): MatchEnergyResult {
  const { roundScoreTable } = payload;
  const { roundNumbers, rows } = roundScoreTable;

  let leadChanges = 0;
  let closeRounds = 0;
  let prevLeader: string | null = null;
  let leaderAfterFinalRound: string | null = null;

  // Cumulative totals to determine leader after each round
  const cumByPlayer = new Map<string, number>();
  for (const row of rows) {
    cumByPlayer.set(row.playerId, 0);
  }

  for (let i = 0; i < roundNumbers.length; i++) {
    const roundScoresThisRound = rows.map((r) => ({
      playerId: r.playerId,
      score: r.roundScores[i] ?? 0,
    }));
    const sorted = [...roundScoresThisRound].sort(
      (a, b) => b.score - a.score,
    );
    const topScore = sorted[0]?.score ?? 0;
    const secondScore = sorted[1]?.score ?? 0;
    if (topScore - secondScore <= 2 && sorted.length >= 2) {
      closeRounds++;
    }

    for (const row of rows) {
      const add = row.roundScores[i] ?? 0;
      cumByPlayer.set(
        row.playerId,
        (cumByPlayer.get(row.playerId) ?? 0) + add,
      );
    }
    const sortedCum = [...rows].sort(
      (a, b) =>
        (cumByPlayer.get(b.playerId) ?? 0) - (cumByPlayer.get(a.playerId) ?? 0),
    );
    const currentLeader = sortedCum[0]?.playerId ?? null;
    if (currentLeader && prevLeader !== null && currentLeader !== prevLeader) {
      leadChanges++;
    }
    prevLeader = currentLeader;
    if (i === roundNumbers.length - 1) {
      leaderAfterFinalRound = currentLeader;
    }
  }

  const leaderBeforeFinal =
    roundNumbers.length <= 1
      ? null
      : (() => {
          const cum = new Map<string, number>();
          for (const row of rows) {
            cum.set(row.playerId, 0);
          }
          for (let i = 0; i < roundNumbers.length - 1; i++) {
            for (const row of rows) {
              cum.set(
                row.playerId,
                (cum.get(row.playerId) ?? 0) + (row.roundScores[i] ?? 0),
              );
            }
          }
          const sorted = [...rows].sort(
            (a, b) =>
              (cum.get(b.playerId) ?? 0) - (cum.get(a.playerId) ?? 0),
          );
          return sorted[0]?.playerId ?? null;
        })();

  const clutchRoundShift: 0 | 1 =
    leaderBeforeFinal !== null &&
    leaderAfterFinalRound !== null &&
    leaderBeforeFinal !== leaderAfterFinalRound
      ? 1
      : 0;

  const energyScore =
    leadChanges * 3 + closeRounds * 2 + clutchRoundShift;

  return {
    energyScore,
    leadChanges,
    closeRounds,
    clutchRoundShift,
  };
}
