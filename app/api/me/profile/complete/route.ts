import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/getCurrentUser";
import { completeLinkedPlayerProfile } from "@/lib/repositories/playerRepository";
import { completeProfileSchema } from "@/lib/validators";

export async function POST(req: Request) {
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
  const parsed = completeProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const player = await completeLinkedPlayerProfile({
      userId: user.id,
      displayName: parsed.data.displayName,
      avatarColor: parsed.data.avatarColor,
    });
    return NextResponse.json({
      playerId: player.playerId,
      name: player.name,
      avatarColor: player.avatarColor,
      profileCompleted: player.profileCompleted,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to save profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
