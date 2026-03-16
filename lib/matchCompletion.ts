import type { ThrowEvent } from "@/types/match";

/**
 * Centralized match completion check. Used by GET state and POST throws so logic does not drift.
 * Final round is complete exactly when throws in that round === player count.
 */
export function isMatchComplete(
  throwEvents: ThrowEvent[],
  totalRounds: number,
  playerCount: number,
): boolean {
  if (playerCount === 0) return false;
  const throwsInFinalRound = throwEvents.filter((e) => e.roundNumber === totalRounds);
  return throwsInFinalRound.length === playerCount;
}
