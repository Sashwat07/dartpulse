import { NextResponse } from "next/server";

import type { PlayoffMatch } from "@/types/playoff";
import type { ThrowEvent } from "@/types/match";
import { getMatchReadAccessForApi } from "@/lib/auth/matchAccess";
import { bootstrapPlayoffs, deriveNextPlayoffMatchIfNeeded, isPlayoffBootstrapEligible } from "@/lib/playoffEngine";
import {
  listMatchPlayersWithDisplayByMatchId,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByPlayoffMatch,
  listThrowEventsByMatch,
} from "@/lib/repositories";
import { derivePlayoffTurnState } from "@/lib/playoffTurn";

type RouteContext = { params: Promise<{ matchId: string }> };

const STAGE_ORDER: PlayoffMatch["stage"][] = [
  "qualifier1",
  "eliminator",
  "qualifier2",
  "final",
];

/**
 * GET: Playoff state for the match (dedicated endpoint; do not overload match state).
 * Returns playoff matches, active playoff match id, and throw events for the active match.
 */
export async function GET(_req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getMatchReadAccessForApi(matchId);
  if (auth instanceof NextResponse) return auth;
  const { match, sessionWriteEnabled } = auth;

  const [matchPlayers, throwEvents] = await Promise.all([
    listMatchPlayersWithDisplayByMatchId(matchId),
    listThrowEventsByMatch(matchId),
  ]);

  const shotsPerRound = match.shotsPerRound ?? 1;
  let playoffMatches = await listPlayoffMatchesByParentMatch(matchId);
  const canBootstrap =
    playoffMatches.length === 0 &&
    isPlayoffBootstrapEligible(
      match.status,
      match.totalRounds,
      throwEvents,
      matchPlayers.length,
      shotsPerRound,
    );
  if (canBootstrap) {
    playoffMatches = await bootstrapPlayoffs(
      matchId,
      match.status,
      match.totalRounds,
      throwEvents,
      matchPlayers,
      shotsPerRound,
    );
  }

  // Reconcile progression: ensure qualifier2/final exist when prerequisites are met (idempotent).
  let next = await deriveNextPlayoffMatchIfNeeded(matchId, playoffMatches);
  while (next) {
    playoffMatches = [...playoffMatches, next];
    next = await deriveNextPlayoffMatchIfNeeded(matchId, playoffMatches);
  }

  const sortedMatches = [...playoffMatches].sort(
    (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
  );
  const activePlayoffMatch =
    sortedMatches.find(
      (m) =>
        m.status === "pending" ||
        m.status === "active" ||
        (m.stage === "final" && m.status === "provisionalCompleted"),
    ) ?? null;
  const activePlayoffMatchId = activePlayoffMatch?.playoffMatchId ?? null;

  let throwEventsForActive: ThrowEvent[] = [];
  if (activePlayoffMatchId) {
    throwEventsForActive = await listThrowEventsByPlayoffMatch(activePlayoffMatchId);
  }

  const playoffShotsPerRound =
    match.playoffShotsPerRound ?? match.shotsPerRound ?? 1;
  const playoffTurnState =
    activePlayoffMatch != null
      ? derivePlayoffTurnState(activePlayoffMatch, match, throwEventsForActive)
      : undefined;

  return NextResponse.json({
    matchId,
    playoffMatches: sortedMatches,
    activePlayoffMatchId,
    activePlayoffMatch: activePlayoffMatch ?? undefined,
    throwEventsForActive,
    stageOrder: STAGE_ORDER,
    matchPlayers,
    totalRounds: match.totalRounds,
    playoffShotsPerRound,
    playoffTurnState: playoffTurnState ?? undefined,
    sessionWriteEnabled,
  });
}
