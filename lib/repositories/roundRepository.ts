import type { Round } from "@/types/match";

import { db } from "@/lib/db";

type CreateRoundData = {
  matchId: string;
  roundNumber: number;
  startedAt?: Date;
};

export async function createRound(data: CreateRoundData): Promise<Round> {
  const created = await db.round.create({
    data: {
      matchId: data.matchId,
      roundNumber: data.roundNumber,
      startedAt: data.startedAt,
    },
  });
  return {
    roundId: created.roundId,
    matchId: created.matchId,
    roundNumber: created.roundNumber,
    startedAt: created.startedAt?.toISOString(),
    completedAt: created.completedAt?.toISOString(),
  };
}

export async function getRoundsByMatchId(matchId: string): Promise<Round[]> {
  const list = await db.round.findMany({
    where: { matchId },
    orderBy: { roundNumber: "asc" },
  });
  return list.map((r) => ({
    roundId: r.roundId,
    matchId: r.matchId,
    roundNumber: r.roundNumber,
    startedAt: r.startedAt?.toISOString(),
    completedAt: r.completedAt?.toISOString(),
  }));
}
