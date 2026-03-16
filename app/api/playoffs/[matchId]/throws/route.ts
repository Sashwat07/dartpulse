import { NextResponse } from "next/server";

import type { ThrowEvent } from "@/types/match";
import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import { deriveNextPlayoffMatchIfNeeded } from "@/lib/playoffEngine";
import { derivePlayoffTurnState } from "@/lib/playoffTurn";
import {
  createThrowEvent,
  getMatchById,
  getPlayoffMatchById,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByPlayoffMatch,
  updatePlayoffMatchResult,
  updatePlayoffMatchStatus,
} from "@/lib/repositories";
import { addPlayoffThrowPayloadSchema } from "@/lib/validators/playoff";

type RouteContext = { params: Promise<{ matchId: string }> };

const REGULATION_ROUND = 1;

/**
 * GET: Throw events for a single playoff match (e.g. for bracket card expanded content).
 * Query: playoffMatchId. Returns { throwEvents }.
 */
export async function GET(req: Request, context: RouteContext) {
  const { matchId: parentMatchId } = await context.params;
  const auth = await getOwnedMatchForApi(parentMatchId);
  if (auth instanceof NextResponse) return auth;

  const url = new URL(req.url);
  const playoffMatchId = url.searchParams.get("playoffMatchId");
  if (!playoffMatchId) {
    return NextResponse.json(
      { error: "playoffMatchId query is required" },
      { status: 400 },
    );
  }

  const playoffMatch = await getPlayoffMatchById(playoffMatchId);
  if (playoffMatch === null || playoffMatch.parentMatchId !== parentMatchId) {
    return NextResponse.json(
      { error: "Playoff match not found" },
      { status: 404 },
    );
  }

  const throwEvents = await listThrowEventsByPlayoffMatch(playoffMatchId);
  return NextResponse.json({ throwEvents });
}

export async function POST(req: Request, context: RouteContext) {
  const { matchId: parentMatchId } = await context.params;
  const auth = await getOwnedMatchForApi(parentMatchId);
  if (auth instanceof NextResponse) return auth;
  const { match } = auth;

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type must be application/json" },
      { status: 400 },
    );
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = addPlayoffThrowPayloadSchema.safeParse({ ...raw });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { playoffMatchId, playerId, score } = parsed.data;

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

  const throwEvents = await listThrowEventsByPlayoffMatch(playoffMatchId);
  const turnState = derivePlayoffTurnState(playoffMatch, match, throwEvents);

  if (turnState.phase === "needsFirstThrowChoice") {
    return NextResponse.json(
      { error: "Set first throw before scoring" },
      { status: 400 },
    );
  }
  if (turnState.phase === "complete") {
    return NextResponse.json(
      { error: "Playoff match already resolved" },
      { status: 400 },
    );
  }
  if (turnState.currentPlayerId !== playerId) {
    return NextResponse.json(
      { error: "Not your turn in this playoff match" },
      { status: 400 },
    );
  }

  const regulationSlots = 2 * turnState.shotsPerRound;
  const regularCount = throwEvents.filter((e) => e.eventType === "regular").length;
  if (regularCount >= regulationSlots && turnState.phase === "regulation") {
    return NextResponse.json(
      { error: "Round is full; no more regulation throws allowed" },
      { status: 400 },
    );
  }

  const roundNumber =
    turnState.phase === "suddenDeath" && turnState.currentSuddenDeathRound != null
      ? turnState.currentSuddenDeathRound
      : REGULATION_ROUND;
  const eventType = turnState.phase === "suddenDeath" ? "suddenDeath" : "regular";
  const turnIndex = turnState.currentTurnIndex;

  const created = await createThrowEvent({
    matchId: parentMatchId,
    roundNumber,
    playerId,
    turnIndex,
    score,
    isBullseye: score === 50,
    eventType,
    playoffMatchId,
  });

  if (playoffMatch.status === "pending") {
    await updatePlayoffMatchStatus(playoffMatchId, "active");
  }

  const afterThrows = await listThrowEventsByPlayoffMatch(playoffMatchId);
  const afterState = derivePlayoffTurnState(playoffMatch, match, afterThrows);

  if (afterState.phase === "complete" && afterState.winnerId && afterState.loserId) {
    const finalStatus =
      playoffMatch.stage === "final" ? "provisionalCompleted" : "completed";
    await updatePlayoffMatchResult(playoffMatchId, {
      winnerId: afterState.winnerId,
      loserId: afterState.loserId,
      player1Score: afterState.regulationScores.score1,
      player2Score: afterState.regulationScores.score2,
      status: finalStatus,
      resolvedBy:
        afterState.currentSuddenDeathRound != null ? "suddenDeath" : "normal",
      completedAt: new Date(),
    });

    const allPlayoffMatches = await listPlayoffMatchesByParentMatch(parentMatchId);
    await deriveNextPlayoffMatchIfNeeded(parentMatchId, allPlayoffMatches);
  }

  const response: ThrowEvent = {
    throwEventId: created.throwEventId,
    matchId: created.matchId,
    roundId: created.roundId,
    roundNumber: created.roundNumber,
    playerId: created.playerId,
    turnIndex: created.turnIndex,
    score: created.score,
    isBullseye: created.isBullseye,
    eventType: created.eventType,
    playoffMatchId: created.playoffMatchId,
    createdAt: created.createdAt,
  };
  return NextResponse.json(response, { status: 201 });
}
