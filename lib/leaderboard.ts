import type { MatchLeaderboardEntry, MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";

/**
 * Derives final leaderboard from regular-match throws and resolved tie orders.
 * Used by playoff bootstrap; excludes playoff throws (caller must pass regular-only throws).
 */
export function deriveLeaderboardFromThrowEvents(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  resolvedTieOrders: string[][],
): MatchLeaderboardEntry[] {
  const regularThrows = throwEvents.filter(
    (e) => e.eventType === "regular" && !e.playoffMatchId,
  );
  const totalByPlayer = new Map<string, number>();
  for (const e of regularThrows) {
    totalByPlayer.set(e.playerId, (totalByPlayer.get(e.playerId) ?? 0) + e.score);
  }

  const playerIds = Array.from(new Set(matchPlayers.map((p) => p.playerId)));
  const entries: MatchLeaderboardEntry[] = playerIds.map((playerId) => {
    const player = matchPlayers.find((p) => p.playerId === playerId);
    return {
      playerId,
      playerName: player?.name ?? "",
      totalScore: totalByPlayer.get(playerId) ?? 0,
      roundScore: 0,
      rank: 0,
    };
  });

  entries.sort((a, b) => b.totalScore - a.totalScore);

  let groupStart = 0;
  let orderIndex = 0;
  while (groupStart < entries.length) {
    const score = entries[groupStart].totalScore;
    let groupEnd = groupStart;
    while (groupEnd < entries.length && entries[groupEnd].totalScore === score) groupEnd++;
    const group = entries.slice(groupStart, groupEnd);
    if (group.length > 1 && orderIndex < resolvedTieOrders.length) {
      const order = resolvedTieOrders[orderIndex];
      const orderMap = new Map(order.map((id, i) => [id, i]));
      group.sort((a, b) => (orderMap.get(a.playerId) ?? 99) - (orderMap.get(b.playerId) ?? 99));
      for (let i = 0; i < group.length; i++) entries[groupStart + i] = group[i];
      orderIndex++;
    }
    groupStart = groupEnd;
  }

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}
