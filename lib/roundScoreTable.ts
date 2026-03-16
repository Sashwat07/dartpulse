import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";

/** One row of the round-by-round score table (derived from throwEvents). */
export type RoundScoreRow = {
  playerId: string;
  playerName: string;
  roundScores: number[];
  totalScore: number;
};

/** Full round score table: players as rows, rounds as columns, totals. */
export type RoundScoreTable = {
  roundNumbers: number[];
  rows: RoundScoreRow[];
};

/**
 * Derive round-by-round score table from throwEvents and matchPlayers.
 * Pure function for history (no Zustand). Uses only regular throws; matchPlayers order = row order.
 */
export function deriveRoundScoreTable(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  totalRounds: number,
): RoundScoreTable {
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const regularThrows = throwEvents.filter(
    (e) =>
      e.eventType === "regular" &&
      !e.playoffMatchId &&
      e.roundNumber <= totalRounds,
  );

  const scoreByPlayerByRound = new Map<string, Map<number, number>>();
  const totalByPlayer = new Map<string, number>();

  for (const e of regularThrows) {
    if (!scoreByPlayerByRound.has(e.playerId)) {
      scoreByPlayerByRound.set(e.playerId, new Map());
    }
    const roundMap = scoreByPlayerByRound.get(e.playerId)!;
    roundMap.set(e.roundNumber, (roundMap.get(e.roundNumber) ?? 0) + e.score);
    totalByPlayer.set(e.playerId, (totalByPlayer.get(e.playerId) ?? 0) + e.score);
  }

  const rows: RoundScoreRow[] = matchPlayers.map((p) => ({
    playerId: p.playerId,
    playerName: p.name,
    roundScores: roundNumbers.map(
      (r) => scoreByPlayerByRound.get(p.playerId)?.get(r) ?? 0,
    ),
    totalScore: totalByPlayer.get(p.playerId) ?? 0,
  }));

  return { roundNumbers, rows };
}
