import type { PlayoffMatch, PlayoffStage } from "@/types/playoff";
import { FIXTURE_DATE } from "./constants";

type PlayoffStatus = PlayoffMatch["status"];

/**
 * Build a PlayoffMatch fixture for unit/integration tests (undo rules, bracket state).
 */
export function makePlayoffMatch(
  overrides: {
    playoffMatchId: string;
    parentMatchId: string;
    stage: PlayoffStage;
    player1Id: string;
    player2Id: string;
    status: PlayoffStatus;
    startingPlayerId?: string;
    decidedByPlayerId?: string;
    player1Score?: number;
    player2Score?: number;
    winnerId?: string;
    loserId?: string;
    resolvedBy?: "normal" | "tieBreak" | "suddenDeath";
  } & Partial<Pick<PlayoffMatch, "createdAt" | "completedAt">>,
): PlayoffMatch {
  return {
    playoffMatchId: overrides.playoffMatchId,
    parentMatchId: overrides.parentMatchId,
    stage: overrides.stage,
    player1Id: overrides.player1Id,
    player2Id: overrides.player2Id,
    startingPlayerId: overrides.startingPlayerId,
    decidedByPlayerId: overrides.decidedByPlayerId,
    player1Score: overrides.player1Score,
    player2Score: overrides.player2Score,
    winnerId: overrides.winnerId,
    loserId: overrides.loserId,
    status: overrides.status,
    resolvedBy: overrides.resolvedBy,
    createdAt: overrides.createdAt ?? FIXTURE_DATE,
    completedAt: overrides.completedAt,
  };
}
