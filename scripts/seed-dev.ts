/**
 * Minimal development seed for testing the live scoring engine.
 * Creates: 2 players, 1 active match, 2 MatchPlayers, 1 round (round 1). No ThrowEvents.
 *
 * Safe for local development only. Requires MONGODB_URL (e.g. from .env).
 */

import "dotenv/config";

import { db } from "@/lib/db";
import { createPlayer, createRound } from "@/lib/repositories";

const ALLOW_ENV = "SEED_DEV_ALLOW";

async function seed() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env[ALLOW_ENV] !== "1"
  ) {
    console.error("Refusing to run dev seed in production. Set SEED_DEV_ALLOW=1 to override.");
    process.exit(1);
  }

  if (!process.env.MONGODB_URL) {
    console.error("MONGODB_URL is not set. Create a .env file or export it.");
    process.exit(1);
  }

  const player1 = await createPlayer({
    name: "Dev Alice",
    avatarColor: "#ef4444",
  });
  const player2 = await createPlayer({
    name: "Dev Bob",
    avatarColor: "#22c55e",
  });

  const match = await db.match.create({
    data: {
      name: "Dev live match",
      mode: "casual",
      totalRounds: 3,
      status: "roundActive",
    },
  });

  await db.matchPlayer.createMany({
    data: [
      { matchId: match.matchId, playerId: player1.playerId },
      { matchId: match.matchId, playerId: player2.playerId },
    ],
  });

  await createRound({ matchId: match.matchId, roundNumber: 1 });

  console.log("Seed complete.");
  console.log("matchId:", match.matchId);
  console.log("Open in browser: http://localhost:3000/match/" + match.matchId);
}

seed().catch((err: { code?: string; message?: string }) => {
  if (err?.code === "P2031") {
    console.error(
      "MongoDB must be run as a replica set for Prisma. See docs/dev-seed.md for setup.",
    );
    console.error(
      "Quick fix (Docker): docker run -d -p 27017:27017 --name mongo-prisma mongo:7 --replSet rs0",
    );
    console.error(
      "Then: docker exec -it mongo-prisma mongosh --eval \"rs.initiate()\"",
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
