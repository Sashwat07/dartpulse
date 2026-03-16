import type { ThrowEvent } from "@/types/match";

/**
 * Playoff sudden death: 1 shot per player per cycle.
 * Only handles sudden-death logic; regulation is handled by derivePlayoffTurnState.
 */
export type PlayoffSuddenDeathResult = {
  isComplete: boolean;
  winnerId?: string;
  loserId?: string;
  currentTurn: { playerId: string; turnIndex: number } | null;
  currentSDRound: number;
  resolvedOrder: string[] | null;
};

/**
 * Derives sudden-death state only (2 players, 1 shot per player per cycle).
 * playerOrder = [first, second] for turn order in each SD round.
 * firstSDRound = round number used for the first SD round (e.g. 2 after one regulation round).
 */
export function derivePlayoffSuddenDeath(
  throwEvents: ThrowEvent[],
  firstPlayerId: string,
  secondPlayerId: string,
  firstSDRound: number,
): PlayoffSuddenDeathResult {
  const playerOrder = [firstPlayerId, secondPlayerId];
  const sdThrows = throwEvents.filter(
    (e) =>
      e.eventType === "suddenDeath" &&
      (e.playerId === firstPlayerId || e.playerId === secondPlayerId),
  );

  const byRound = new Map<number, ThrowEvent[]>();
  for (const e of sdThrows) {
    const list = byRound.get(e.roundNumber) ?? [];
    list.push(e);
    byRound.set(e.roundNumber, list);
  }
  const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b);
  const currentSDRound =
    roundNumbers.length === 0 ? firstSDRound : roundNumbers[roundNumbers.length - 1];
  const throwsThisRound = byRound.get(currentSDRound) ?? [];

  if (throwsThisRound.length < 2) {
    const nextPlayerId = playerOrder[throwsThisRound.length] ?? playerOrder[0];
    const turnIndex = throwsThisRound.length;
    return {
      isComplete: false,
      currentTurn: { playerId: nextPlayerId, turnIndex },
      currentSDRound,
      resolvedOrder: null,
    };
  }

  const s1 = throwsThisRound.find((e) => e.playerId === firstPlayerId)?.score ?? 0;
  const s2 = throwsThisRound.find((e) => e.playerId === secondPlayerId)?.score ?? 0;
  if (s1 !== s2) {
    const winnerId = s1 > s2 ? firstPlayerId : secondPlayerId;
    const loserId = s1 > s2 ? secondPlayerId : firstPlayerId;
    return {
      isComplete: true,
      winnerId,
      loserId,
      currentTurn: null,
      currentSDRound,
      resolvedOrder: [winnerId, loserId],
    };
  }

  return {
    isComplete: false,
    currentTurn: { playerId: firstPlayerId, turnIndex: 0 },
    currentSDRound: currentSDRound + 1,
    resolvedOrder: null,
  };
}
