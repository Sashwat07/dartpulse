import { NextResponse } from "next/server";

import type { MatchStateResponse } from "@/types/dto";
import type { MatchPlayerWithDisplay } from "@/types/match";
import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { buildMatchOutcomeSummary } from "@/lib/matchOutcomeSummary";
import {
  deriveRegularRoundAndTurn,
  getEffectiveBaseOrder,
  getRoundOrderForRound,
  sortMatchPlayersByBaseOrder,
} from "@/lib/regularMatchTurn";
import {
  deriveSuddenDeath,
  getRegularThrows,
  isRegularRoundsComplete,
} from "@/lib/suddenDeath";
import {
  getRoundsByMatchId,
  listMatchPlayersWithDisplayByMatchId,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByMatch,
} from "@/lib/repositories";

type RouteContext = { params: Promise<{ matchId: string }> };

export async function GET(_req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getOwnedMatchForApi(matchId);
  if (auth instanceof NextResponse) return auth;
  const { match } = auth;

  const [rawMatchPlayers, rounds, throwEvents] = await Promise.all([
    listMatchPlayersWithDisplayByMatchId(matchId),
    getRoundsByMatchId(matchId),
    listThrowEventsByMatch(matchId),
  ]);

  const shotsPerRound = match.shotsPerRound ?? 1;
  const baseOrder = getEffectiveBaseOrder(match, rawMatchPlayers);
  const matchPlayers = sortMatchPlayersByBaseOrder(rawMatchPlayers, baseOrder);

  const regularThrows = getRegularThrows(throwEvents);
  const regularComplete = isRegularRoundsComplete(
    throwEvents,
    match.totalRounds,
    matchPlayers.length,
    shotsPerRound,
  );

  let currentTurn: { playerId: string; turnIndex: number } | null = null;
  let suddenDeathState: MatchStateResponse["suddenDeathState"] = null;
  let resolvedTieOrders: string[][] = [];
  let currentRound: number;

  let matchOutcomeSummary: MatchStateResponse["matchOutcomeSummary"] = undefined;
  if (match.status === "matchFinished") {
    currentRound = Math.min(match.totalRounds, 1);
    const finishedResult = deriveSuddenDeath(
      matchId,
      throwEvents,
      matchPlayers,
      match.totalRounds,
      match.status,
      shotsPerRound,
    );
    resolvedTieOrders = finishedResult.resolvedTieOrders;
    const leaderboard = deriveLeaderboardFromThrowEvents(
      throwEvents,
      matchPlayers,
      resolvedTieOrders,
    );
    matchOutcomeSummary = buildMatchOutcomeSummary(leaderboard, matchPlayers.length);
  } else if (regularComplete) {
    const result = deriveSuddenDeath(
      matchId,
      throwEvents,
      matchPlayers,
      match.totalRounds,
      match.status,
      shotsPerRound,
    );
    suddenDeathState = result.suddenDeathState;
    resolvedTieOrders = result.resolvedTieOrders;
    currentTurn = result.currentTurn;
    currentRound = match.totalRounds;
  } else {
    const derived = deriveRegularRoundAndTurn(
      regularThrows,
      baseOrder,
      shotsPerRound,
      match.totalRounds,
    );
    currentRound = Math.min(derived.currentRound, match.totalRounds);
    currentTurn = derived.currentTurn;
    if (process.env.NODE_ENV === "development" && baseOrder.length > 0) {
      console.debug("[DartPulse] state round order", {
        currentRound,
        roundOrder: getRoundOrderForRound(baseOrder, currentRound),
      });
    }
  }

  let undoLocked = false;
  if (match.status === "matchFinished") {
    const playoffMatches = await listPlayoffMatchesByParentMatch(matchId);
    const finalMatch = playoffMatches.find((m) => m.stage === "final");
    undoLocked = finalMatch?.status === "completed" ?? false;
  }

  const body: MatchStateResponse = {
    match: {
      matchId: match.matchId,
      status: match.status,
      totalRounds: match.totalRounds,
      currentRound,
      shotsPerRound,
      playoffShotsPerRound: match.playoffShotsPerRound,
      createdAt: match.createdAt,
    },
    matchPlayers,
    rounds,
    throwEvents,
    currentTurn,
    suddenDeathState,
    resolvedTieOrders,
    matchOutcomeSummary,
    undoLocked,
  };

  return NextResponse.json(body);
}
