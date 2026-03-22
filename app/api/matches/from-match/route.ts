import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import {
  getDefaultMatchName,
  listMatchPlayersWithDisplayByMatchId,
} from "@/lib/repositories";
import { bootstrapMatch } from "@/lib/services/matchBootstrapService";

/**
 * POST /api/matches/from-match
 * Create a new match from a completed match (same players, rounds, settings; shuffled order).
 * Body: { sourceMatchId: string }. Requires auth; source match must be owned by current user.
 */
export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await req.json().catch(() => ({}));
  const sourceMatchId =
    typeof raw.sourceMatchId === "string" ? raw.sourceMatchId.trim() : "";
  if (!sourceMatchId) {
    return NextResponse.json(
      { error: "sourceMatchId is required" },
      { status: 400 },
    );
  }

  const auth = await getOwnedMatchForApi(sourceMatchId);
  if (auth instanceof NextResponse) return auth;
  const { user, match: sourceMatch } = auth;
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (sourceMatch.status !== "matchFinished") {
    return NextResponse.json(
      { error: "Source match must be completed" },
      { status: 400 },
    );
  }

  const matchPlayers = await listMatchPlayersWithDisplayByMatchId(sourceMatchId);
  const playerIds = matchPlayers.map((p) => p.playerId);
  if (playerIds.length < 2) {
    return NextResponse.json(
      { error: "Source match must have at least 2 players" },
      { status: 400 },
    );
  }

  const name = await getDefaultMatchName();
  const match = await bootstrapMatch({
    name,
    mode: sourceMatch.mode,
    totalRounds: sourceMatch.totalRounds,
    playerIds,
    shotsPerRound: sourceMatch.shotsPerRound ?? 1,
    playoffShotsPerRound: sourceMatch.playoffShotsPerRound,
    shuffle: true,
    createdByUserId: user.id,
  });

  return NextResponse.json({ matchId: match.matchId }, { status: 201 });
}
