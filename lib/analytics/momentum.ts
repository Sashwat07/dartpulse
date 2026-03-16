import type { MatchHistoryPayload } from "@/lib/matchHistory";

/**
 * One entry in the momentum timeline: who won that round.
 * Scope: completed matches only; regulation rounds from roundScoreTable (excludes playoff).
 */
export type MomentumEntry = {
  round: number;
  leader: string;
};

/**
 * Momentum = who won each round (player with highest round score in that round).
 * Uses only regulation rounds from payload's roundScoreTable.
 * Payload-first to avoid duplicate loads when history page already has the payload.
 */
export function getMomentumTimeline(
  payload: MatchHistoryPayload,
): MomentumEntry[] {
  const { roundScoreTable } = payload;
  const { roundNumbers, rows } = roundScoreTable;
  const result: MomentumEntry[] = [];

  for (let i = 0; i < roundNumbers.length; i++) {
    const round = roundNumbers[i];
    let maxScore = -1;
    let leaderId = "";
    for (const row of rows) {
      const score = row.roundScores[i] ?? 0;
      if (score > maxScore) {
        maxScore = score;
        leaderId = row.playerId;
      }
    }
    if (leaderId) {
      result.push({ round, leader: leaderId });
    }
  }

  return result;
}
