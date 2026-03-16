import { NextResponse } from "next/server";

import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import { isMatchFullyComplete } from "@/lib/suddenDeath";
import {
  getMatchById,
  listMatchPlayersWithDisplayByMatchId,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByMatch,
  revertMatchFromFinished,
  undoLastThrow,
} from "@/lib/repositories";

type RouteContext = { params: Promise<{ matchId: string }> };

/**
 * Once the playoff final is confirmed ("Match complete"), undo is locked for the entire
 * match flow (playoff and regular). Reject regular-match undo in that case.
 */
export async function POST(_req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getOwnedMatchForApi(matchId);
  if (auth instanceof NextResponse) return auth;

  const match = await getMatchById(matchId);
  if (!match) return NextResponse.json({ success: false }, { status: 404 });

  if (match.status === "matchFinished") {
    const playoffMatches = await listPlayoffMatchesByParentMatch(matchId);
    const finalMatch = playoffMatches.find((m) => m.stage === "final");
    if (finalMatch?.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Match complete; undo is not allowed." },
        { status: 409 },
      );
    }
  }

  const result = await undoLastThrow(matchId);
  if (!result.success) return NextResponse.json(result);

  if (match.status !== "matchFinished") return NextResponse.json(result);

  const [matchPlayers, throwEvents] = await Promise.all([
    listMatchPlayersWithDisplayByMatchId(matchId),
    listThrowEventsByMatch(matchId),
  ]);
  const shotsPerRound = match.shotsPerRound ?? 1;
  if (
    isMatchFullyComplete(
      throwEvents,
      matchPlayers,
      match.totalRounds,
      "matchStarted",
      shotsPerRound,
    )
  )
    return NextResponse.json(result);

  await revertMatchFromFinished(matchId);
  return NextResponse.json(result);
}
