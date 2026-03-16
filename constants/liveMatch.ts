/**
 * MVP rule: turn order for a match is the order of matchPlayers attached to the match.
 * Array index = turn index within a round (0-based).
 */

export const TURN_ORDER_SOURCE = "matchPlayersArray" as const;

/**
 * Returns match players in turn order. Per MVP, the array order is the turn order
 * (no separate reordering); this helper documents the contract.
 */
export function getOrderedMatchPlayers<T extends { playerId: string }>(
  matchPlayers: T[],
): T[] {
  return matchPlayers;
}
