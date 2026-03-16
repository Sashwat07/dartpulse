import type { IsoDateString } from "@/types/common";

export type PlayoffStage = "qualifier1" | "qualifier2" | "eliminator" | "final";

/** Final only: "provisionalCompleted" until user confirms "Match complete"; then "completed". */
export type PlayoffStatus = "pending" | "active" | "provisionalCompleted" | "completed";

export type ResolvedBy = "normal" | "tieBreak" | "suddenDeath";

/**
 * Head-to-head playoff bracket node (entity-model §10).
 * decidedByPlayerId = who had the right to choose first throw.
 * startingPlayerId = who was chosen to throw first; immutable once any throw exists.
 */
export type PlayoffMatch = {
  playoffMatchId: string;
  parentMatchId: string;
  stage: PlayoffStage;
  player1Id: string;
  player2Id: string;
  startingPlayerId?: string;
  decidedByPlayerId?: string;
  player1Score?: number;
  player2Score?: number;
  winnerId?: string;
  loserId?: string;
  status: PlayoffStatus;
  resolvedBy?: ResolvedBy;
  createdAt: IsoDateString;
  completedAt?: IsoDateString;
};
