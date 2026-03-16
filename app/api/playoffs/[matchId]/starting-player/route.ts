import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import {
  getPlayoffMatchById,
  listThrowEventsByPlayoffMatch,
  updatePlayoffStartingPlayer,
} from "@/lib/repositories";
import { setPlayoffStartingPlayerPayloadSchema } from "@/lib/validators/playoff";

type RouteContext = { params: Promise<{ matchId: string }> };

/**
 * POST: Set who throws first in a playoff match.
 * startingPlayerId becomes immutable once any throw exists for that playoff match.
 */
export async function POST(req: Request, context: RouteContext) {
  const { matchId: parentMatchId } = await context.params;
  const auth = await getOwnedMatchForApi(parentMatchId);
  if (auth instanceof NextResponse) return auth;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = setPlayoffStartingPlayerPayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { playoffMatchId, startingPlayerId } = parsed.data;

  const playoffMatch = await getPlayoffMatchById(playoffMatchId);
  if (playoffMatch === null || playoffMatch.parentMatchId !== parentMatchId) {
    return NextResponse.json(
      { error: "Playoff match not found" },
      { status: 404 },
    );
  }
  if (
    playoffMatch.status === "completed" ||
    playoffMatch.status === "provisionalCompleted"
  ) {
    return NextResponse.json(
      { error: "Playoff match already completed" },
      { status: 400 },
    );
  }

  if (startingPlayerId !== playoffMatch.player1Id && startingPlayerId !== playoffMatch.player2Id) {
    return NextResponse.json(
      { error: "startingPlayerId must be one of the two playoff participants" },
      { status: 400 },
    );
  }

  const existingThrows = await listThrowEventsByPlayoffMatch(playoffMatchId);
  if (existingThrows.length > 0) {
    return NextResponse.json(
      { error: "First throw cannot be changed after any throw has been recorded" },
      { status: 400 },
    );
  }

  const updated = await updatePlayoffStartingPlayer(playoffMatchId, startingPlayerId);
  return NextResponse.json(updated);
}
