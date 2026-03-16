import type { Match } from "@/types/match";
import type { PlayoffMatch } from "@/types/playoff";
import type { ThrowEvent } from "@/types/match";
import { derivePlayoffSuddenDeath } from "@/lib/playoffSuddenDeath";

export type PlayoffTurnPhase =
  | "needsFirstThrowChoice"
  | "regulation"
  | "suddenDeath"
  | "complete";

export type PlayoffTurnState = {
  phase: PlayoffTurnPhase;
  shotsPerRound: number;
  decidedByPlayerId: string | undefined;
  startingPlayerId: string | undefined;
  needsFirstThrowChoice: boolean;
  currentPlayerId: string | null;
  currentTurnIndex: number;
  regulationRoundNumber: number;
  regulationScores: { player1Id: string; player2Id: string; score1: number; score2: number };
  currentSuddenDeathRound: number | null;
  winnerId: string | null;
  loserId: string | null;
};

const REGULATION_ROUND = 1;

/**
 * Single derivation helper for playoff match state.
 * Regulation: slots = 2 × playoffShotsPerRound. Sudden death: 1 shot per player per cycle.
 * Server-driven only; do not use client as source of truth for round/turn/slot.
 */
export function derivePlayoffTurnState(
  playoffMatch: PlayoffMatch,
  parentMatch: Match,
  throwEvents: ThrowEvent[],
): PlayoffTurnState {
  const shotsPerRound =
    parentMatch.playoffShotsPerRound ?? parentMatch.shotsPerRound ?? 1;
  const regulationSlots = 2 * shotsPerRound;
  const { player1Id, player2Id, startingPlayerId, decidedByPlayerId } =
    playoffMatch;

  const regularThrows = throwEvents.filter(
    (e) =>
      e.eventType === "regular" &&
      (e.playerId === player1Id || e.playerId === player2Id),
  );

  const base: Partial<PlayoffTurnState> = {
    shotsPerRound,
    decidedByPlayerId,
    startingPlayerId,
    regulationRoundNumber: REGULATION_ROUND,
    regulationScores: {
      player1Id,
      player2Id,
      score1: 0,
      score2: 0,
    },
    currentSuddenDeathRound: null,
    winnerId: null,
    loserId: null,
  };

  if (!startingPlayerId && regularThrows.length === 0) {
    return {
      ...base,
      phase: "needsFirstThrowChoice",
      needsFirstThrowChoice: true,
      currentPlayerId: null,
      currentTurnIndex: 0,
    } as PlayoffTurnState;
  }

  const order: [string, string] = startingPlayerId
    ? [
        startingPlayerId,
        player1Id === startingPlayerId ? player2Id : player1Id,
      ]
    : [player1Id, player2Id];

  if (regularThrows.length < regulationSlots) {
    const count = regularThrows.length;
    const playerIndex = Math.floor(count / shotsPerRound);
    const currentPlayerId = order[playerIndex] ?? order[0];
    return {
      ...base,
      phase: "regulation",
      needsFirstThrowChoice: false,
      currentPlayerId,
      currentTurnIndex: count,
      regulationScores: {
        player1Id,
        player2Id,
        score1: regularThrows
          .filter((e) => e.playerId === player1Id)
          .reduce((s, e) => s + e.score, 0),
        score2: regularThrows
          .filter((e) => e.playerId === player2Id)
          .reduce((s, e) => s + e.score, 0),
      },
    } as PlayoffTurnState;
  }

  const score1 = regularThrows
    .filter((e) => e.playerId === player1Id)
    .reduce((s, e) => s + e.score, 0);
  const score2 = regularThrows
    .filter((e) => e.playerId === player2Id)
    .reduce((s, e) => s + e.score, 0);

  if (score1 !== score2) {
    const winnerId = score1 > score2 ? player1Id : player2Id;
    const loserId = score1 > score2 ? player2Id : player1Id;
    return {
      ...base,
      phase: "complete",
      needsFirstThrowChoice: false,
      currentPlayerId: null,
      currentTurnIndex: regulationSlots,
      regulationScores: { player1Id, player2Id, score1, score2 },
      winnerId,
      loserId,
    } as PlayoffTurnState;
  }

  const firstSDRound = REGULATION_ROUND + 1;
  const sdResult = derivePlayoffSuddenDeath(
    throwEvents,
    order[0],
    order[1],
    firstSDRound,
  );

  if (sdResult.isComplete && sdResult.winnerId && sdResult.loserId) {
    return {
      ...base,
      phase: "complete",
      needsFirstThrowChoice: false,
      currentPlayerId: null,
      currentTurnIndex: regulationSlots,
      regulationScores: { player1Id, player2Id, score1, score2 },
      currentSuddenDeathRound: sdResult.currentSDRound,
      winnerId: sdResult.winnerId,
      loserId: sdResult.loserId,
    } as PlayoffTurnState;
  }

  return {
    ...base,
    phase: "suddenDeath",
    needsFirstThrowChoice: false,
    currentPlayerId: sdResult.currentTurn?.playerId ?? null,
    currentTurnIndex: sdResult.currentTurn?.turnIndex ?? 0,
    regulationScores: { player1Id, player2Id, score1, score2 },
    currentSuddenDeathRound: sdResult.currentSDRound,
  } as PlayoffTurnState;
}
