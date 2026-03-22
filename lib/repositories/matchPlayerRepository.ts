import type { MatchPlayerWithDisplay } from "@/types/match";

import { db } from "@/lib/db";

export async function isPlayerInMatch(
  matchId: string,
  playerId: string,
): Promise<boolean> {
  const row = await db.matchPlayer.findFirst({
    where: { matchId, playerId },
    select: { matchPlayerId: true },
  });
  return row != null;
}

/**
 * Create MatchPlayer rows for a match in the given player order.
 * Order is preserved via sequential create so createdAt asc = turn order.
 */
export async function createMatchPlayersForMatch(
  matchId: string,
  playerIds: string[],
): Promise<void> {
  for (const playerId of playerIds) {
    await db.matchPlayer.create({
      data: { matchId, playerId },
    });
  }
}

/**
 * List match players with display info (name, avatarColor) in turn order.
 * MVP: turn order = order of matchPlayers by createdAt.
 */
export async function listMatchPlayersWithDisplayByMatchId(
  matchId: string,
): Promise<MatchPlayerWithDisplay[]> {
  const list = await db.matchPlayer.findMany({
    where: { matchId },
    include: { player: true },
    orderBy: { createdAt: "asc" },
  });
  type Row = (typeof list)[number];
  return list.map((mp: Row) => ({
    matchPlayerId: mp.matchPlayerId,
    matchId: mp.matchId,
    playerId: mp.playerId,
    seedRank: mp.seedRank ?? undefined,
    finalRank: mp.finalRank ?? undefined,
    isQualifiedForPlayoffs: mp.isQualifiedForPlayoffs,
    createdAt: mp.createdAt.toISOString(),
    name: mp.player.name,
    avatarColor: mp.player.avatarColor ?? undefined,
  }));
}

/**
 * Bulk participation in completed matches only.
 * Returns one row per (playerId, matchId) with that match's totalRounds.
 * Use for matchesPlayed (count distinct matchId per player) and roundsPlayed (sum totalRounds per player).
 */
export async function listCompletedMatchParticipations(): Promise<
  { playerId: string; matchId: string; totalRounds: number }[]
> {
  const list = await db.matchPlayer.findMany({
    where: { match: { status: "matchFinished" } },
    select: {
      playerId: true,
      matchId: true,
      match: { select: { totalRounds: true } },
    },
  });
  return list.map((mp) => ({
    playerId: mp.playerId,
    matchId: mp.matchId,
    totalRounds: mp.match.totalRounds,
  }));
}
