import type { IsoDateString } from "@/types/common";

export type MatchStatus =
  | "matchCreated"
  | "matchStarted"
  | "roundActive"
  | "roundComplete"
  | "playoffPhase"
  | "qualifier1Active"
  | "qualifier2Active"
  | "eliminatorActive"
  | "finalActive"
  | "matchFinished";

export type MatchMode = "casual" | "tournament";

/**
 * Root match entity (entity-model §6).
 * basePlayerOrder: playerId[] for turn order; fixed at match start.
 */
export type Match = {
  matchId: string;
  name: string;
  mode: MatchMode;
  totalRounds: number;
  status: MatchStatus;
  shotsPerRound?: number;
  playoffShotsPerRound?: number;
  basePlayerOrder?: string[];
   /** Owner of the match (User.id); null/undefined for legacy or unowned matches. */
   createdByUserId?: string;
  createdAt: IsoDateString;
  startedAt?: IsoDateString;
  completedAt?: IsoDateString;
};

/** List-item shape for completed match history (Phase 8). Lightweight; no full leaderboards. */
export type CompletedMatchListItem = {
  matchId: string;
  matchName: string;
  status: MatchStatus;
  createdAt: IsoDateString;
  completedAt: IsoDateString | null;
  playerCount: number;
  hasPlayoffs: boolean;
  championPlayerId?: string;
  championPlayerName?: string;
};

/** Display status for history list: fully complete vs playoffs pending. */
export type HistoryDisplayStatus = "complete" | "playoffsPending";

/** History list item: completed or playoff-pending; winner only when complete. */
export type HistoryListItem = CompletedMatchListItem & {
  displayStatus: HistoryDisplayStatus;
  isFullyComplete: boolean;
};

/** List-item for resumable (in-progress) matches. resumeTo is server-derived for routing. */
export type ResumableMatchListItem = {
  matchId: string;
  matchName: string;
  status: MatchStatus;
  createdAt: IsoDateString;
  playerCount: number;
  /** MVP: "playoffs" if match has any playoff matches; "match" otherwise. May be refined later. */
  resumeTo: "match" | "playoffs";
};

export type ActiveMatch = {
  matchId: string;
  status: MatchStatus;
  totalRounds: number;
  currentRound: number;
  shotsPerRound: number;
  playoffShotsPerRound?: number;
  createdAt: IsoDateString;
};

/**
 * Participation of a player in a match (entity-model §7).
 */
export type MatchPlayer = {
  matchPlayerId: string;
  matchId: string;
  playerId: string;
  seedRank?: number;
  finalRank?: number;
  isQualifiedForPlayoffs: boolean;
  createdAt: IsoDateString;
};

/**
 * MatchPlayer plus display fields for live UI (client-facing / view-model).
 */
export type MatchPlayerWithDisplay = MatchPlayer & {
  name: string;
  avatarColor?: string;
};

/**
 * One round in a match (entity-model §8).
 */
export type Round = {
  roundId: string;
  matchId: string;
  roundNumber: number;
  startedAt?: IsoDateString;
  completedAt?: IsoDateString;
};

export type ThrowEventType = "regular" | "suddenDeath";

/**
 * Single scoring action (entity-model §9).
 * turnIndex: 0-based slot in round (0 .. playerCount*shotsPerRound - 1).
 */
export type ThrowEvent = {
  throwEventId: string;
  matchId: string;
  roundId?: string;
  roundNumber: number;
  playerId: string;
  turnIndex: number;
  score: number;
  isBullseye: boolean;
  eventType: ThrowEventType;
  /** Set only for playoff-match throws; regular match ranking must ignore these. */
  playoffMatchId?: string;
  createdAt: IsoDateString;
};

/**
 * Derived: live session ranking snapshot (entity-model §12).
 */
export type MatchLeaderboardEntry = {
  playerId: string;
  playerName: string;
  roundScore: number;
  totalScore: number;
  rank: number;
};

/**
 * Derived: tie-breaker state in memory (entity-model §12).
 * tiedPlayerIds = currently unresolved tied group only.
 * When isResolved, resolvedTieOrder is rank order (first = highest) for that group.
 * resolvedRanksSoFar = global rank positions (regular-match SD only); includes players above the active group and resolved-from-group so far.
 */
export type SuddenDeathState = {
  matchId: string;
  tiedPlayerIds: string[];
  stage: "suddenDeath" | "playoff";
  roundNumber: number;
  isResolved: boolean;
  resolvedTieOrder?: string[];
  /** Global rank positions resolved so far (regular-match SD only). Rank 1 = best. */
  resolvedRanksSoFar?: { rank: number; playerId: string }[];
};

