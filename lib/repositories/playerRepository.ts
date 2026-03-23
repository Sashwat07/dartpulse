import type { CreatePlayerPayload } from "@/types/dto";
import type { Player } from "@/types/player";

import { db } from "@/lib/db";

function mapPlayer(p: {
  playerId: string;
  name: string;
  avatarColor: string | null;
  avatarUrl: string | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
  profileCompleted?: boolean | null;
}): Player {
  return {
    playerId: p.playerId,
    name: p.name,
    avatarColor: p.avatarColor ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    avatarUrl: p.avatarUrl ?? undefined,
    status: p.status ?? undefined,
    userId: p.userId ?? undefined,
    profileCompleted:
      p.profileCompleted === undefined || p.profileCompleted === null
        ? true
        : p.profileCompleted,
  };
}

export async function createPlayer(data: CreatePlayerPayload): Promise<Player> {
  const created = await db.player.create({
    data: {
      name: data.name,
      avatarColor: data.avatarColor ?? undefined,
      profileCompleted: true,
    },
  });
  return mapPlayer(created);
}

export async function listPlayers(): Promise<Player[]> {
  const list = await db.player.findMany({ orderBy: { createdAt: "desc" } });
  return list.map((p) => mapPlayer(p));
}

export async function getPlayerById(playerId: string): Promise<Player | null> {
  const player = await db.player.findUnique({ where: { playerId } });
  if (!player) return null;
  return mapPlayer(player);
}

export async function getLinkedPlayerByUserId(
  userId: string,
): Promise<Player | null> {
  const player = await db.player.findFirst({ where: { userId } });
  if (!player) return null;
  return mapPlayer(player);
}

export type EnsureLinkedPlayerInput = {
  userId: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

/**
 * Idempotent: ensures a Player row exists for this User with profileCompleted false until setup.
 * Does not overwrite completed profiles.
 */
export async function ensureLinkedPlayerForUser(
  input: EnsureLinkedPlayerInput,
): Promise<Player> {
  const existing = await db.player.findFirst({ where: { userId: input.userId } });
  if (existing) {
    if (input.image) {
      await db.player.updateMany({
        where: { userId: input.userId },
        data: { avatarUrl: input.image },
      });
    }
    const refreshed = await db.player.findFirst({ where: { userId: input.userId } });
    if (refreshed) return mapPlayer(refreshed);
    return mapPlayer(existing);
  }

  const provisionalName =
    (input.name && input.name.trim()) ||
    (input.email?.includes("@")
      ? input.email.split("@")[0]?.trim() || "Player"
      : "Player");

  const created = await db.player.create({
    data: {
      name: provisionalName,
      userId: input.userId,
      profileCompleted: false,
      avatarUrl: input.image ?? undefined,
    },
  });
  return mapPlayer(created);
}

export type CompleteLinkedProfileInput = {
  userId: string;
  displayName: string;
  avatarColor: string;
};

export async function completeLinkedPlayerProfile(
  input: CompleteLinkedProfileInput,
): Promise<Player> {
  const trimmedName = input.displayName.trim();
  if (!trimmedName) {
    throw new Error("Display name is required");
  }
  const color = input.avatarColor.trim();
  if (!color) {
    throw new Error("Color is required");
  }

  // Uniqueness check: reject if another player already has this name (case-insensitive)
  const conflict = await db.player.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
      userId: { not: input.userId },
    },
  });
  if (conflict) {
    throw new Error("That name is already taken. Please choose a different one.");
  }

  const updated = await db.player.updateMany({
    where: { userId: input.userId },
    data: {
      name: trimmedName,
      avatarColor: color,
      profileCompleted: true,
    },
  });

  if (updated.count === 0) {
    throw new Error("Linked player not found");
  }

  const player = await db.player.findFirst({ where: { userId: input.userId } });
  if (!player) throw new Error("Linked player not found");
  return mapPlayer(player);
}

export async function updateLinkedPlayerColor(
  userId: string,
  avatarColor: string,
): Promise<Player> {
  const color = avatarColor.trim();
  if (!color) {
    throw new Error("Color is required");
  }
  const updated = await db.player.updateMany({
    where: { userId },
    data: { avatarColor: color },
  });
  if (updated.count === 0) {
    throw new Error("Linked player not found");
  }
  const player = await db.player.findFirst({ where: { userId } });
  if (!player) throw new Error("Linked player not found");
  return mapPlayer(player);
}
