import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import { bootstrapPlayoffs, deriveNextPlayoffMatchIfNeeded, isPlayoffBootstrapEligible } from "@/lib/playoffEngine";
import {
  listMatchPlayersWithDisplayByMatchId,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByMatch,
} from "@/lib/repositories";

type RouteContext = { params: Promise<{ matchId: string }> };

/**
 * GET: Returns playoff matches for the parent match.
 * If match is finished and no playoff records exist, bootstraps them (3-player final or 4+ qualifier1/qualifier2).
 * Idempotent.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getOwnedMatchForApi(matchId);
  if (auth instanceof NextResponse) return auth;
  const { match } = auth;

  const [matchPlayers, throwEvents] = await Promise.all([
    listMatchPlayersWithDisplayByMatchId(matchId),
    listThrowEventsByMatch(matchId),
  ]);
  const shotsPerRound = match.shotsPerRound ?? 1;
  let playoffMatches = await listPlayoffMatchesByParentMatch(matchId);
  if (
    playoffMatches.length === 0 &&
    isPlayoffBootstrapEligible(
      match.status,
      match.totalRounds,
      throwEvents,
      matchPlayers.length,
      shotsPerRound,
    )
  ) {
    playoffMatches = await bootstrapPlayoffs(
      matchId,
      match.status,
      match.totalRounds,
      throwEvents,
      matchPlayers,
      shotsPerRound,
    );
  }

  // Reconcile progression: ensure eliminator/final exist when prerequisites are met (idempotent).
  let next = await deriveNextPlayoffMatchIfNeeded(matchId, playoffMatches);
  while (next) {
    playoffMatches = [...playoffMatches, next];
    next = await deriveNextPlayoffMatchIfNeeded(matchId, playoffMatches);
  }

  return NextResponse.json({ playoffMatches });
}
