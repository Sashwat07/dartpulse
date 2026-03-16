import type { MatchHistoryPayload } from "@/lib/matchHistory";

/**
 * Round heatmap: round-by-round score intensity per player.
 * Scope: completed matches only; regulation rounds from roundScoreTable.
 */
export type RoundHeatmapPlayer = {
  playerId: string;
  playerName: string;
};

export type RoundHeatmapRound = {
  round: number;
  scores: Record<string, number>;
};

export type RoundHeatmapResult = {
  players: RoundHeatmapPlayer[];
  rounds: RoundHeatmapRound[];
};

/**
 * Get round-by-round scores for heatmap visualization.
 * Payload-first to avoid duplicate loads.
 */
export function getRoundHeatmap(
  payload: MatchHistoryPayload,
): RoundHeatmapResult {
  const { roundScoreTable } = payload;
  const { roundNumbers, rows } = roundScoreTable;

  const players: RoundHeatmapPlayer[] = rows.map((r) => ({
    playerId: r.playerId,
    playerName: r.playerName,
  }));

  const rounds: RoundHeatmapRound[] = roundNumbers.map((round, i) => {
    const scores: Record<string, number> = {};
    for (const row of rows) {
      scores[row.playerId] = row.roundScores[i] ?? 0;
    }
    return { round, scores };
  });

  return { players, rounds };
}
