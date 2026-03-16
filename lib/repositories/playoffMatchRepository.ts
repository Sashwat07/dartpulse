import type { PlayoffMatch } from "@/types/playoff";

import { db } from "@/lib/db";

type CreatePlayoffMatchData = {
  parentMatchId: string;
  stage: PlayoffMatch["stage"];
  player1Id: string;
  player2Id: string;
  decidedByPlayerId?: string;
};

export async function createPlayoffMatch(
  data: CreatePlayoffMatchData,
): Promise<PlayoffMatch> {
  const created = await db.playoffMatch.create({
    data: {
      parentMatchId: data.parentMatchId,
      stage: data.stage,
      player1Id: data.player1Id,
      player2Id: data.player2Id,
      decidedByPlayerId: data.decidedByPlayerId ?? null,
      status: "pending",
    },
  });
  return mapToPlayoffMatch(created);
}

export async function updatePlayoffStartingPlayer(
  playoffMatchId: string,
  startingPlayerId: string,
): Promise<PlayoffMatch> {
  const updated = await db.playoffMatch.update({
    where: { playoffMatchId },
    data: { startingPlayerId },
  });
  return mapToPlayoffMatch(updated);
}

export async function listPlayoffMatchesByParentMatch(
  parentMatchId: string,
): Promise<PlayoffMatch[]> {
  const list = await db.playoffMatch.findMany({
    where: { parentMatchId },
    orderBy: { createdAt: "asc" },
  });
  return list.map(mapToPlayoffMatch);
}

export async function getPlayoffMatchById(
  playoffMatchId: string,
): Promise<PlayoffMatch | null> {
  const row = await db.playoffMatch.findUnique({
    where: { playoffMatchId },
  });
  return row ? mapToPlayoffMatch(row) : null;
}

export type UpdatePlayoffMatchResultData = {
  winnerId: string;
  loserId: string;
  player1Score: number;
  player2Score: number;
  status: PlayoffMatch["status"];
  resolvedBy?: PlayoffMatch["resolvedBy"];
  completedAt: Date;
};

export async function updatePlayoffMatchResult(
  playoffMatchId: string,
  data: UpdatePlayoffMatchResultData,
): Promise<PlayoffMatch> {
  const updated = await db.playoffMatch.update({
    where: { playoffMatchId },
    data: {
      winnerId: data.winnerId,
      loserId: data.loserId,
      player1Score: data.player1Score,
      player2Score: data.player2Score,
      status: data.status,
      resolvedBy: data.resolvedBy ?? null,
      completedAt: data.completedAt,
    },
  });
  return mapToPlayoffMatch(updated);
}

export async function updatePlayoffMatchStatus(
  playoffMatchId: string,
  status: PlayoffMatch["status"],
): Promise<PlayoffMatch> {
  const updated = await db.playoffMatch.update({
    where: { playoffMatchId },
    data: { status },
  });
  return mapToPlayoffMatch(updated);
}

/**
 * Clear result and set status to active (reopen match after undo). Used when last throw is removed and match was completed.
 */
export async function resetPlayoffMatchToActive(
  playoffMatchId: string,
): Promise<PlayoffMatch> {
  const updated = await db.playoffMatch.update({
    where: { playoffMatchId },
    data: {
      status: "active",
      winnerId: null,
      loserId: null,
      player1Score: null,
      player2Score: null,
      resolvedBy: null,
      completedAt: null,
    },
  });
  return mapToPlayoffMatch(updated);
}

/**
 * Delete a playoff match. Only safe when the match has zero throws (e.g. downstream reconciliation).
 */
export async function deletePlayoffMatch(playoffMatchId: string): Promise<void> {
  await db.playoffMatch.delete({ where: { playoffMatchId } });
}

function mapToPlayoffMatch(row: {
  playoffMatchId: string;
  parentMatchId: string;
  stage: string;
  player1Id: string;
  player2Id: string;
  startingPlayerId: string | null;
  decidedByPlayerId: string | null;
  player1Score: number | null;
  player2Score: number | null;
  winnerId: string | null;
  loserId: string | null;
  status: string;
  resolvedBy: string | null;
  createdAt: Date;
  completedAt: Date | null;
}): PlayoffMatch {
  return {
    playoffMatchId: row.playoffMatchId,
    parentMatchId: row.parentMatchId,
    stage: row.stage as PlayoffMatch["stage"],
    player1Id: row.player1Id,
    player2Id: row.player2Id,
    startingPlayerId: row.startingPlayerId ?? undefined,
    decidedByPlayerId: row.decidedByPlayerId ?? undefined,
    player1Score: row.player1Score ?? undefined,
    player2Score: row.player2Score ?? undefined,
    winnerId: row.winnerId ?? undefined,
    loserId: row.loserId ?? undefined,
    status: row.status as PlayoffMatch["status"],
    resolvedBy: (row.resolvedBy as PlayoffMatch["resolvedBy"]) ?? undefined,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString(),
  };
}
