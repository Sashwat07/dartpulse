import type { CreateMatchPayload } from "@/types/dto";
import type { Match } from "@/types/match";
import type {
  CompletedMatchListItem,
  HistoryListItem,
  ResumableMatchListItem,
} from "@/types/match";

import { db } from "@/lib/db";

/** Filter for match history list. "inProgress" = matchStarted | roundActive | roundComplete; "playoffs" = playoff-phase statuses. */
export type MatchHistoryFilter =
  | "all"
  | "matchFinished"
  | "inProgress"
  | "matchCreated"
  | "playoffs";

/** Payload for createMatch; name is required (bootstrap sets default when client sends blank). */
export type CreateMatchPayloadWithName = Omit<CreateMatchPayload, "name"> & {
  name: string;
  createdByUserId?: string;
};

export async function createMatch(data: CreateMatchPayloadWithName): Promise<Match> {
  const shotsPerRound = data.shotsPerRound ?? 1;
  const created = await db.match.create({
    data: {
      name: data.name,
      mode: data.mode,
      totalRounds: data.totalRounds,
      status: "matchStarted",
      shotsPerRound,
      playoffShotsPerRound: data.playoffShotsPerRound ?? undefined,
      basePlayerOrder: data.basePlayerOrder ?? undefined,
      createdByUserId: data.createdByUserId,
    },
  });
  return mapMatchFromDb(created);
}

function mapMatchFromDb(m: {
  matchId: string;
  name: string;
  mode: string;
  totalRounds: number;
  status: string;
  shotsPerRound?: number;
  playoffShotsPerRound?: number | null;
  basePlayerOrder?: unknown;
  createdByUserId?: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
}): Match {
  const basePlayerOrder = Array.isArray(m.basePlayerOrder)
    ? (m.basePlayerOrder as string[])
    : undefined;
  return {
    matchId: m.matchId,
    name: m.name,
    mode: m.mode as Match["mode"],
    totalRounds: m.totalRounds,
    status: m.status as Match["status"],
    shotsPerRound: m.shotsPerRound,
    playoffShotsPerRound: m.playoffShotsPerRound ?? undefined,
    basePlayerOrder: basePlayerOrder?.length ? basePlayerOrder : undefined,
    createdByUserId: m.createdByUserId ?? undefined,
    createdAt: m.createdAt.toISOString(),
    startedAt: m.startedAt?.toISOString(),
    completedAt: m.completedAt?.toISOString(),
  };
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const match = await db.match.findUnique({ where: { matchId } });
  if (!match) return null;
  return mapMatchFromDb(match);
}

/** Count all matches in the database (for default naming). */
export async function countMatches(): Promise<number> {
  return db.match.count();
}

/** Default match name for new matches: "Match No. <count + 1>". Uses all matches, not only completed. */
export async function getDefaultMatchName(): Promise<string> {
  const count = await countMatches();
  return `Match No. ${count + 1}`;
}

export async function listMatches(): Promise<Match[]> {
  const list = await db.match.findMany({ orderBy: { createdAt: "desc" } });
  return list.map((m) => mapMatchFromDb(m));
}

/**
 * List completed matches for history. Returns list-item shape only; no full leaderboards.
 * Ordered by completedAt desc (fallback createdAt desc when completedAt is null).
 * Global: includes all completed matches (used by analytics/leaderboard).
 */
export async function listCompletedMatches(): Promise<CompletedMatchListItem[]> {
  return listMatchesForHistory("matchFinished");
}

/**
 * List resumable (in-progress) matches: status !== "matchFinished".
 * resumeTo: MVP routing rule — "playoffs" if _count.playoffMatches > 0, else "match".
 * Global: includes all in-progress matches.
 */
export async function listResumableMatches(): Promise<ResumableMatchListItem[]> {
  const list = await db.match.findMany({
    where: { status: { not: "matchFinished" } },
    include: {
      _count: {
        select: { matchPlayers: true, playoffMatches: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return list.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    playerCount: m._count.matchPlayers,
    resumeTo: m._count.playoffMatches > 0 ? "playoffs" : "match",
  }));
}

/**
 * List completed matches owned by the given user (createdByUserId === userId).
 * Legacy/unowned matches (null owner) are excluded.
 */
export async function listOwnedCompletedMatches(
  userId: string,
): Promise<CompletedMatchListItem[]> {
  const list = await db.match.findMany({
    where: {
      createdByUserId: userId,
      status: "matchFinished",
    },
    include: {
      _count: {
        select: { matchPlayers: true, playoffMatches: true },
      },
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
  return list.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    completedAt: m.completedAt?.toISOString() ?? null,
    playerCount: m._count.matchPlayers,
    hasPlayoffs: m._count.playoffMatches > 0,
  }));
}

/**
 * List resumable (in-progress) matches owned by the given user (createdByUserId === userId).
 * Legacy/unowned matches (null owner) are excluded.
 */
export async function listOwnedResumableMatches(
  userId: string,
): Promise<ResumableMatchListItem[]> {
  const list = await db.match.findMany({
    where: {
      createdByUserId: userId,
      status: { not: "matchFinished" },
    },
    include: {
      _count: {
        select: { matchPlayers: true, playoffMatches: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return list.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    playerCount: m._count.matchPlayers,
    resumeTo: m._count.playoffMatches > 0 ? "playoffs" : "match",
  }));
}

const IN_PROGRESS_STATUSES = ["matchStarted", "roundActive", "roundComplete"] as const;
export const PLAYOFF_STATUSES = [
  "playoffPhase",
  "qualifier1Active",
  "qualifier2Active",
  "eliminatorActive",
  "finalActive",
] as const;

/**
 * List matches that belong in History: fully complete (matchFinished) or playoff-pending.
 * Ordered by completedAt desc for finished, createdAt desc for pending; finished first.
 */
export async function listOwnedHistoryMatches(
  userId: string,
): Promise<HistoryListItem[]> {
  const [completed, pending] = await Promise.all([
    db.match.findMany({
      where: {
        createdByUserId: userId,
        status: "matchFinished",
      },
      include: {
        _count: {
          select: { matchPlayers: true, playoffMatches: true },
        },
      },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
    }),
    db.match.findMany({
      where: {
        createdByUserId: userId,
        status: { in: ["roundComplete", ...PLAYOFF_STATUSES] },
      },
      include: {
        _count: {
          select: { matchPlayers: true, playoffMatches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const completedItems: HistoryListItem[] = completed.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    completedAt: m.completedAt?.toISOString() ?? null,
    playerCount: m._count.matchPlayers,
    hasPlayoffs: m._count.playoffMatches > 0,
    displayStatus: "complete" as const,
    isFullyComplete: true,
  }));

  const pendingItems: HistoryListItem[] = pending.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    completedAt: null,
    playerCount: m._count.matchPlayers,
    hasPlayoffs: m._count.playoffMatches > 0,
    displayStatus: "playoffsPending" as const,
    isFullyComplete: false,
  }));

  return [...completedItems, ...pendingItems];
}

/**
 * List matches for history with optional status filter. Returns list-item shape; supports all statuses.
 * Default filter "matchFinished" shows only completed matches.
 */
export async function listMatchesForHistory(
  filter: MatchHistoryFilter = "matchFinished",
): Promise<CompletedMatchListItem[]> {
  const where =
    filter === "all"
      ? {}
      : filter === "matchFinished"
        ? { status: "matchFinished" }
        : filter === "matchCreated"
          ? { status: "matchCreated" }
          : filter === "inProgress"
            ? { status: { in: [...IN_PROGRESS_STATUSES] } }
            : { status: { in: [...PLAYOFF_STATUSES] } };

  const list = await db.match.findMany({
    where,
    include: {
      _count: {
        select: { matchPlayers: true, playoffMatches: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return list.map((m) => ({
    matchId: m.matchId,
    matchName: m.name,
    status: m.status as Match["status"],
    createdAt: m.createdAt.toISOString(),
    completedAt: m.completedAt?.toISOString() ?? null,
    playerCount: m._count.matchPlayers,
    hasPlayoffs: m._count.playoffMatches > 0,
  }));
}

/**
 * Lightweight list of completed matches for analytics: matchId, totalRounds, playerCount.
 * Used for round-unit counts and averageRoundScore denominator.
 */
export async function listCompletedMatchSummaries(): Promise<
  { matchId: string; totalRounds: number; playerCount: number }[]
> {
  const list = await db.match.findMany({
    where: { status: "matchFinished" },
    select: {
      matchId: true,
      totalRounds: true,
      _count: { select: { matchPlayers: true } },
    },
  });
  return list.map((m) => ({
    matchId: m.matchId,
    totalRounds: m.totalRounds,
    playerCount: m._count.matchPlayers,
  }));
}

export async function updateMatchToFinished(matchId: string): Promise<void> {
  await db.match.update({
    where: { matchId },
    data: { status: "matchFinished", completedAt: new Date() },
  });
}

/** Revert match from finished when undo removes the final completing throw. */
export async function revertMatchFromFinished(matchId: string): Promise<void> {
  await db.match.update({
    where: { matchId },
    data: { status: "finalActive", completedAt: null },
  });
}

/**
 * Get the most recent completed match owned by the user (by completedAt desc).
 * Returns null if none. Used for "recent players" on New Match page.
 */
export async function getMostRecentOwnedCompletedMatch(
  userId: string,
): Promise<Match | null> {
  const m = await db.match.findFirst({
    where: {
      createdByUserId: userId,
      status: "matchFinished",
    },
    orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
  });
  if (!m) return null;
  return mapMatchFromDb(m);
}
