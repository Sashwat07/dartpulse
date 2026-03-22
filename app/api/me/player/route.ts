import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  getLinkedPlayerByUserId,
  updateLinkedPlayerColor,
} from "@/lib/repositories/playerRepository";
import { updateLinkedPlayerColorSchema } from "@/lib/validators";

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await getLinkedPlayerByUserId(user.id);
  if (!player) {
    return NextResponse.json({ error: "No linked player" }, { status: 404 });
  }

  return NextResponse.json({
    playerId: player.playerId,
    name: player.name,
    avatarColor: player.avatarColor,
    avatarUrl: player.avatarUrl,
    profileCompleted: player.profileCompleted,
    email: user.email,
    image: user.image,
  });
}

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = updateLinkedPlayerColorSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const player = await updateLinkedPlayerColor(
      user.id,
      parsed.data.avatarColor,
    );
    return NextResponse.json({
      playerId: player.playerId,
      name: player.name,
      avatarColor: player.avatarColor,
      avatarUrl: player.avatarUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
