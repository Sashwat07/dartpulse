import {
  getChampionPlayerIdFromPayload,
  type MatchHistoryPayload,
} from "@/lib/matchHistory";

/**
 * Result of comeback detection.
 * Scope: completed matches only; regulation rounds (roundScoreTable); excludes playoff.
 */
export type ComebackResult = {
  isComeback: boolean;
  /** eventual winner (champion) was last at some round */
  winnerWasLastAtSomeRound: boolean;
};

/**
 * Detect if the match winner was ever in last place during regulation rounds.
 * Algorithm: compute cumulative score after each round, derive rank after each round,
 * then check if eventual winner was last in any round.
 * Payload-first to avoid duplicate loads.
 */
export function detectComeback(payload: MatchHistoryPayload): ComebackResult {
  const championId = getChampionPlayerIdFromPayload(payload);
  if (!championId) {
    return { isComeback: false, winnerWasLastAtSomeRound: false };
  }

  const { roundScoreTable } = payload;
  const { roundNumbers, rows } = roundScoreTable;
  const playerIds = rows.map((r) => r.playerId);

  // cumulative total per player after each round
  const cumulativeByRound: Map<number, Map<string, number>> = new Map();
  for (let i = 0; i < roundNumbers.length; i++) {
    const round = roundNumbers[i];
    const cum = new Map<string, number>();
    for (const row of rows) {
      let sum = 0;
      for (let j = 0; j <= i; j++) {
        sum += row.roundScores[j] ?? 0;
      }
      cum.set(row.playerId, sum);
    }
    cumulativeByRound.set(round, cum);
  }

  for (const round of roundNumbers) {
    const cum = cumulativeByRound.get(round)!;
    const sorted = [...playerIds].sort((a, b) => (cum.get(b) ?? 0) - (cum.get(a) ?? 0));
    const lastPlace = sorted[sorted.length - 1];
    if (lastPlace === championId) {
      return { isComeback: true, winnerWasLastAtSomeRound: true };
    }
  }

  return { isComeback: false, winnerWasLastAtSomeRound: false };
}
