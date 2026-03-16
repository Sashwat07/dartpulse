import type { Match, MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";

/**
 * Returns the effective base player order for turn derivation.
 * Uses match.basePlayerOrder only when valid: array, same length as matchPlayers,
 * all ids present in match, no duplicates. Otherwise falls back to matchPlayers order.
 */
export function getEffectiveBaseOrder(
  match: Match,
  matchPlayers: MatchPlayerWithDisplay[],
): string[] {
  const order = match.basePlayerOrder;
  if (!Array.isArray(order) || order.length !== matchPlayers.length) {
    return matchPlayers.map((p) => p.playerId);
  }
  const playerIds = new Set(matchPlayers.map((p) => p.playerId));
  if (!order.every((id) => typeof id === "string" && playerIds.has(id))) {
    return matchPlayers.map((p) => p.playerId);
  }
  if (new Set(order).size !== order.length) {
    return matchPlayers.map((p) => p.playerId);
  }
  return order;
}

/**
 * Sorts match players to follow the canonical base order (same as match state).
 * Players in baseOrder come first in that order; any others are appended.
 */
export function sortMatchPlayersByBaseOrder(
  matchPlayers: MatchPlayerWithDisplay[],
  baseOrder: string[],
): MatchPlayerWithDisplay[] {
  const byId = new Map(matchPlayers.map((p) => [p.playerId, p]));
  const result: MatchPlayerWithDisplay[] = [];
  for (const playerId of baseOrder) {
    const p = byId.get(playerId);
    if (p) result.push(p);
  }
  for (const p of matchPlayers) {
    if (!result.includes(p)) result.push(p);
  }
  return result;
}

/**
 * Round order for round N: basePlayerOrder rotated by (roundNumber - 1) % playerCount.
 */
export function getRoundOrderForRound(
  baseOrder: string[],
  roundNumber: number,
): string[] {
  if (baseOrder.length === 0) return [];
  const startIndex = (roundNumber - 1) % baseOrder.length;
  return [...baseOrder.slice(startIndex), ...baseOrder.slice(0, startIndex)];
}

export type RegularRoundAndTurn = {
  currentRound: number;
  currentTurn: { playerId: string; turnIndex: number } | null;
};

/**
 * Round order and slot derivation:
 * - Round order for round N = baseOrder rotated by (roundNumber - 1) % playerCount.
 * - Slot = 0-based index in round, range 0 .. playerCount*shotsPerRound - 1.
 * - playerIndex = floor(slot / shotsPerRound); playerId = roundOrder[playerIndex].
 *
 * Derives current round and current turn from regular throws only.
 * turnIndex = 0-based slot in round (0 .. playerCount*shotsPerRound - 1).
 */
export function deriveRegularRoundAndTurn(
  regularThrows: ThrowEvent[],
  baseOrder: string[],
  shotsPerRound: number,
  totalRounds: number,
): RegularRoundAndTurn {
  const slotsPerRound = baseOrder.length * shotsPerRound;
  if (baseOrder.length === 0) {
    return { currentRound: 1, currentTurn: null };
  }

  if (regularThrows.length === 0) {
    const roundOrder = getRoundOrderForRound(baseOrder, 1);
    return {
      currentRound: 1,
      currentTurn: { playerId: roundOrder[0], turnIndex: 0 },
    };
  }

  const last = regularThrows[regularThrows.length - 1];
  const roundOfLast = last.roundNumber;
  const throwsInRound = regularThrows.filter((e) => e.roundNumber === roundOfLast);
  const count = throwsInRound.length;

  if (count < slotsPerRound) {
    const nextSlot = count;
    const roundOrder = getRoundOrderForRound(baseOrder, roundOfLast);
    const playerIndex = Math.floor(nextSlot / shotsPerRound);
    return {
      currentRound: roundOfLast,
      currentTurn: {
        playerId: roundOrder[playerIndex],
        turnIndex: nextSlot,
      },
    };
  }

  if (roundOfLast < totalRounds) {
    const nextRound = roundOfLast + 1;
    const roundOrder = getRoundOrderForRound(baseOrder, nextRound);
    return {
      currentRound: nextRound,
      currentTurn: { playerId: roundOrder[0], turnIndex: 0 },
    };
  }

  return {
    currentRound: totalRounds,
    currentTurn: null,
  };
}
