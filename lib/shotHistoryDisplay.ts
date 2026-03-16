import type { ThrowEvent } from "@/types/match";

/** Shot history display model: regular and sudden-death throws, sorted. */
export type ShotHistoryDisplay = {
  regular: ThrowEvent[];
  suddenDeath: ThrowEvent[];
};

function compareThrowOrder(a: ThrowEvent, b: ThrowEvent): number {
  if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
  if (a.turnIndex !== b.turnIndex) return a.turnIndex - b.turnIndex;
  return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
}

/**
 * Build shot history display from throwEvents (regular + sudden death, no playoff).
 * Pure function for history UI; no store.
 */
export function deriveShotHistoryDisplay(
  throwEvents: ThrowEvent[],
  _matchPlayers: { playerId: string }[],
  _totalRounds: number,
): ShotHistoryDisplay {
  const regular = throwEvents
    .filter((e) => !e.playoffMatchId && e.eventType === "regular")
    .slice()
    .sort(compareThrowOrder);
  const suddenDeath = throwEvents
    .filter((e) => !e.playoffMatchId && e.eventType === "suddenDeath")
    .slice()
    .sort(compareThrowOrder);
  return { regular, suddenDeath };
}
