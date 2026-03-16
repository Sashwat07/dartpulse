import type { CreatePlayerPayload } from "@/types/dto";
import type { Player } from "@/types/player";

import { db } from "@/lib/db";

export async function createPlayer(data: CreatePlayerPayload): Promise<Player> {
  const created = await db.player.create({
    data: {
      name: data.name,
      avatarColor: data.avatarColor ?? undefined,
    },
  });
  return {
    playerId: created.playerId,
    name: created.name,
    avatarColor: created.avatarColor ?? undefined,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
    avatarUrl: created.avatarUrl ?? undefined,
    status: created.status ?? undefined,
  };
}

export async function listPlayers(): Promise<Player[]> {
  const list = await db.player.findMany({ orderBy: { createdAt: "desc" } });
  return list.map((p) => ({
    playerId: p.playerId,
    name: p.name,
    avatarColor: p.avatarColor ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    avatarUrl: p.avatarUrl ?? undefined,
    status: p.status ?? undefined,
  }));
}

export async function getPlayerById(playerId: string): Promise<Player | null> {
  const player = await db.player.findUnique({ where: { playerId } });
  if (!player) return null;
  return {
    playerId: player.playerId,
    name: player.name,
    avatarColor: player.avatarColor ?? undefined,
    createdAt: player.createdAt.toISOString(),
    updatedAt: player.updatedAt.toISOString(),
    avatarUrl: player.avatarUrl ?? undefined,
    status: player.status ?? undefined,
  };
}
