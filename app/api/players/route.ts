import { NextResponse } from "next/server";

import type { ListPlayersResponse } from "@/types/dto";
import { createPlayer, listPlayers } from "@/lib/repositories";
import { createPlayerPayloadSchema } from "@/lib/validators";

export async function GET() {
  const players = await listPlayers();
  const body: ListPlayersResponse = {
    players: players.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      avatarColor: p.avatarColor,
    })),
  };
  return NextResponse.json(body);
}

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }
  const raw = await req.json().catch(() => ({}));
  const parsed = createPlayerPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const created = await createPlayer({
    name: parsed.data.name,
    avatarColor: parsed.data.avatarColor?.trim() || undefined,
  });
  return NextResponse.json(
    {
      playerId: created.playerId,
      name: created.name,
      avatarColor: created.avatarColor,
    },
    { status: 201 },
  );
}
