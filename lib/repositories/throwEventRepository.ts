import type { ThrowEvent } from "@/types/match";

import { db } from "@/lib/db";

type CreateThrowEventData = {
  matchId: string;
  roundId?: string;
  roundNumber: number;
  playerId: string;
  turnIndex: number;
  score: number;
  isBullseye: boolean;
  eventType: "regular" | "suddenDeath";
  playoffMatchId?: string;
};

function mapRowToThrowEvent(e: {
  throwEventId: string;
  matchId: string;
  roundId: string | null;
  roundNumber: number;
  playerId: string;
  turnIndex: number;
  score: number;
  isBullseye: boolean;
  eventType: string;
  playoffMatchId: string | null;
  createdAt: Date;
}): ThrowEvent {
  return {
    throwEventId: e.throwEventId,
    matchId: e.matchId,
    roundId: e.roundId ?? undefined,
    roundNumber: e.roundNumber,
    playerId: e.playerId,
    turnIndex: e.turnIndex,
    score: e.score,
    isBullseye: e.isBullseye,
    eventType: e.eventType as ThrowEvent["eventType"],
    playoffMatchId: e.playoffMatchId ?? undefined,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function createThrowEvent(
  data: CreateThrowEventData,
): Promise<ThrowEvent> {
  const created = await db.throwEvent.create({
    data: {
      matchId: data.matchId,
      roundId: data.roundId,
      roundNumber: data.roundNumber,
      playerId: data.playerId,
      turnIndex: data.turnIndex,
      score: data.score,
      isBullseye: data.isBullseye,
      eventType: data.eventType,
      playoffMatchId: data.playoffMatchId ?? null,
    },
  });
  return mapRowToThrowEvent(created);
}

/**
 * Lists only regular-match throws (excludes playoff throws). Use for leaderboard, state, ranking.
 * Includes both eventType "regular" and "suddenDeath"; excludes playoffMatchId.
 */
export async function listThrowEventsByMatch(
  matchId: string,
): Promise<ThrowEvent[]> {
  const list = await db.throwEvent.findMany({
    where: { matchId, playoffMatchId: null },
    orderBy: [{ roundNumber: "asc" }, { turnIndex: "asc" }, { createdAt: "asc" }],
  });
  return list.map(mapRowToThrowEvent);
}

/**
 * All regular-match throws from completed matches only.
 * Scope: match.status === "matchFinished", playoffMatchId === null (excludes playoff throws).
 * Includes both regular and sudden-death throws within the regular match.
 * Use for analytics aggregation (bestThrow, totalPoints, averageRoundScore).
 */
export async function listThrowEventsForCompletedMatches(): Promise<ThrowEvent[]> {
  const list = await db.throwEvent.findMany({
    where: {
      playoffMatchId: null,
      match: { status: "matchFinished" },
    },
    orderBy: [{ matchId: "asc" }, { roundNumber: "asc" }, { turnIndex: "asc" }],
  });
  return list.map(mapRowToThrowEvent);
}

/**
 * Lists throws for a single playoff match. Used only by playoff engine; never mix with regular match logic.
 */
export async function listThrowEventsByPlayoffMatch(
  playoffMatchId: string,
): Promise<ThrowEvent[]> {
  const list = await db.throwEvent.findMany({
    where: { playoffMatchId },
    orderBy: [{ roundNumber: "asc" }, { turnIndex: "asc" }, { createdAt: "asc" }],
  });
  return list.map(mapRowToThrowEvent);
}

export type UndoLastThrowResult = {
  success: boolean;
  deletedThrowEventId?: string;
};

/**
 * Undo the last throw for the regular match only (excludes playoff throws).
 */
export async function undoLastThrow(matchId: string): Promise<UndoLastThrowResult> {
  const last = await db.throwEvent.findFirst({
    where: { matchId, playoffMatchId: null },
    orderBy: [{ roundNumber: "desc" }, { turnIndex: "desc" }, { createdAt: "desc" }],
  });
  if (!last) return { success: false };
  await db.throwEvent.delete({ where: { throwEventId: last.throwEventId } });
  return { success: true, deletedThrowEventId: last.throwEventId };
}

/**
 * Undo the last throw for a single playoff match only. Does not validate downstream; caller must.
 */
export async function undoLastPlayoffThrow(
  playoffMatchId: string,
): Promise<UndoLastThrowResult> {
  const last = await db.throwEvent.findFirst({
    where: { playoffMatchId },
    orderBy: [{ roundNumber: "desc" }, { turnIndex: "desc" }, { createdAt: "desc" }],
  });
  if (!last) return { success: false };
  await db.throwEvent.delete({ where: { throwEventId: last.throwEventId } });
  return { success: true, deletedThrowEventId: last.throwEventId };
}
