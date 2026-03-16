import { NextResponse } from "next/server";

import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import { evaluateMatchAchievements } from "@/lib/achievements/evaluator";
import { getOwnedMatchForApi } from "@/lib/auth/ownership";
import {
  deriveRegularRoundAndTurn,
  getEffectiveBaseOrder,
} from "@/lib/regularMatchTurn";
import {
  deriveSuddenDeath,
  getActiveTieGroup,
  getRegularThrows,
  isMatchFullyComplete,
  isRegularRoundsComplete,
} from "@/lib/suddenDeath";
import {
  createRound,
  createThrowEvent,
  getRoundsByMatchId,
  listMatchPlayersWithDisplayByMatchId,
  listThrowEventsByMatch,
  updateMatchToFinished,
} from "@/lib/repositories";
import { addThrowPayloadSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ matchId: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { matchId } = await context.params;
  const auth = await getOwnedMatchForApi(matchId);
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
  const parsed = addThrowPayloadSchema.safeParse({ ...raw, matchId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { playerId, score } = parsed.data;

  const [rounds, matchPlayers, existingThrows] = await Promise.all([
    getRoundsByMatchId(matchId),
    listMatchPlayersWithDisplayByMatchId(matchId),
    listThrowEventsByMatch(matchId),
  ]);

  const shotsPerRound = match.shotsPerRound ?? 1;
  const baseOrder = getEffectiveBaseOrder(match, matchPlayers);

  if (
    isMatchFullyComplete(
      existingThrows,
      matchPlayers,
      match.totalRounds,
      match.status,
      shotsPerRound,
    )
  ) {
    return NextResponse.json(
      { error: "Match is already complete; no more throws allowed" },
      { status: 400 },
    );
  }

  const regularThrows = getRegularThrows(existingThrows);
  const regularComplete = isRegularRoundsComplete(
    existingThrows,
    match.totalRounds,
    matchPlayers.length,
    shotsPerRound,
  );

  if (regularComplete && match.status !== "matchFinished") {
    const sdResult = deriveSuddenDeath(
      matchId,
      existingThrows,
      matchPlayers,
      match.totalRounds,
      match.status,
      shotsPerRound,
    );
    if (sdResult.suddenDeathState && sdResult.currentTurn) {
      if (sdResult.currentTurn.playerId !== playerId) {
        return NextResponse.json(
          { error: "Not your turn in sudden death" },
          { status: 400 },
        );
      }
      const created = await createThrowEvent({
        matchId,
        roundId: undefined,
        roundNumber: sdResult.suddenDeathState.roundNumber,
        playerId,
        turnIndex: sdResult.currentTurn.turnIndex,
        score,
        isBullseye: score === 50,
        eventType: "suddenDeath",
      });
      const afterThrows = await listThrowEventsByMatch(matchId);
      const afterResult = deriveSuddenDeath(
        matchId,
        afterThrows,
        matchPlayers,
        match.totalRounds,
        match.status,
        shotsPerRound,
      );
      if (afterResult.isMatchFullyComplete) {
        await updateMatchToFinished(matchId);
        await evaluateMatchAchievements(matchId);
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
        createdAt: created.createdAt,
      };
      return NextResponse.json(response, { status: 201 });
    }
  }

  const { currentRound, currentTurn } = deriveRegularRoundAndTurn(
    regularThrows,
    baseOrder,
    shotsPerRound,
    match.totalRounds,
  );

  if (currentTurn === null) {
    return NextResponse.json(
      { error: "Regular rounds complete; no regular throw expected" },
      { status: 400 },
    );
  }

  if (currentTurn.playerId !== playerId) {
    return NextResponse.json(
      { error: "Not your turn" },
      { status: 400 },
    );
  }

  const slotsPerRound = matchPlayers.length * shotsPerRound;
  const throwsInCurrentRound = regularThrows.filter(
    (e) => e.roundNumber === currentRound,
  ).length;
  if (throwsInCurrentRound >= slotsPerRound) {
    return NextResponse.json(
      { error: "Round is full; no more throws allowed this round" },
      { status: 400 },
    );
  }

  const roundNumber = currentRound;
  const turnIndex = currentTurn.turnIndex;
  const round = rounds.find((r) => r.roundNumber === roundNumber);
  const roundId = round?.roundId;

  const created = await createThrowEvent({
    matchId,
    roundId,
    roundNumber,
    playerId,
    turnIndex,
    score,
    isBullseye: score === 50,
    eventType: "regular",
  });

  const regularThrowsAfter = [...regularThrows, created];
  const throwsInRoundAfter = regularThrowsAfter.filter(
    (e) => e.roundNumber === roundNumber && e.eventType === "regular",
  );
  const roundComplete = throwsInRoundAfter.length === slotsPerRound;
  const totalRounds = match.totalRounds;

  if (roundComplete && roundNumber < totalRounds) {
    await createRound({ matchId, roundNumber: roundNumber + 1 });
  }
  if (roundComplete && roundNumber === totalRounds) {
    const afterThrows = await listThrowEventsByMatch(matchId);
    const tiedGroup = getActiveTieGroup(afterThrows, matchPlayers);
    if (tiedGroup === null) {
      await updateMatchToFinished(matchId);
      await evaluateMatchAchievements(matchId);
    }
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
    createdAt: created.createdAt,
  };

  return NextResponse.json(response, { status: 201 });
}
