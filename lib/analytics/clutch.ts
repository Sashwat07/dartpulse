import type { MatchHistoryPayload } from "@/lib/matchHistory";

/**
 * Clutch performance = average score in the final regulation round per player.
 * Scope: completed matches only; final round from roundScoreTable (regulation only).
 */
export type ClutchPerformanceEntry = {
  playerId: string;
  playerName: string;
  /** average score in the final round (for 1 shot per player per round this equals the round score) */
  averageFinalRoundScore: number;
};

/**
 * Get clutch performance (final regulation round average) per player.
 * Payload-first to avoid duplicate loads.
 */
export function getClutchPerformance(
  payload: MatchHistoryPayload,
): ClutchPerformanceEntry[] {
  const { roundScoreTable } = payload;
  const { roundNumbers, rows } = roundScoreTable;
  if (roundNumbers.length === 0) return [];

  const finalRoundIndex = roundNumbers.length - 1;
  return rows.map((row) => ({
    playerId: row.playerId,
    playerName: row.playerName,
    averageFinalRoundScore: row.roundScores[finalRoundIndex] ?? 0,
  }));
}
