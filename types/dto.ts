import type {
  ActiveMatch,
  MatchMode,
  MatchPlayerWithDisplay,
  Round,
  SuddenDeathState,
  ThrowEvent,
} from "@/types/match";

/**
 * Request payload for creating a player. camelCase only; no raw _id.
 */
export type CreatePlayerPayload = {
  name: string;
  avatarColor?: string;
};

/**
 * Request payload for creating a match.
 * playerIds order = base order unless shuffle is true.
 * basePlayerOrder is set by server (bootstrap) before createMatch; client sends playerIds + optional shuffle.
 * name may be omitted or blank; server will persist default "Match No. <n>" when blank.
 */
export type CreateMatchPayload = {
  name?: string;
  mode: MatchMode;
  totalRounds: number;
  playerIds: string[];
  shotsPerRound?: number;
  playoffShotsPerRound?: number;
  shuffle?: boolean;
  basePlayerOrder?: string[];
};

/**
 * POST /api/matches response (match creation).
 */
export type CreateMatchResponse = {
  matchId: string;
};

/**
 * Request payload for adding a throw (score entry).
 * Server derives round, slot, and current player from persisted state; client sends playerId and score for validation.
 */
export type AddThrowPayload = {
  matchId: string;
  roundId?: string;
  roundNumber?: number;
  playerId: string;
  turnIndex?: number;
  score: number;
};

/**
 * Generic API response wrapper.
 */
export type ApiResponse<T> = {
  data?: T;
  error?: string;
  ok: boolean;
};

/**
 * List players API response shape.
 */
export type ListPlayersResponse = {
  players: Array<{ playerId: string; name: string; avatarColor?: string }>;
};

/**
 * List matches API response shape.
 */
export type ListMatchesResponse = {
  matches: Array<{
    matchId: string;
    name: string;
    mode: MatchMode;
    status: string;
    totalRounds: number;
  }>;
};

/**
 * Single match API response shape.
 */
export type GetMatchResponse = {
  match: {
    matchId: string;
    name: string;
    mode: MatchMode;
    status: string;
    totalRounds: number;
    shotsPerRound?: number;
    playoffShotsPerRound?: number;
    basePlayerOrder?: string[];
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
  } | null;
  matchId: string;
};

/** Presentation-ready decision right: who decides first throw (playerId + playerName). */
export type DecisionRightDisplay = {
  playerId: string;
  playerName: string;
};

/** Summary of match outcome for completed-match UI; derived from final resolved ranking. */
export type MatchOutcomeSummary = {
  ranking: { rank: number; playerId: string; playerName: string }[];
  outcomeType: "winner" | "finalQualification" | "playoffQualification";
  winnerPlayerId?: string;
  finalPairing?: { player1Id: string; player2Id: string; player1Name: string; player2Name: string };
  qualifier1Pairing?: { player1Id: string; player2Id: string; player1Name: string; player2Name: string };
  qualifier2Pairing?: { player1Id: string; player2Id: string; player1Name: string; player2Name: string };
  decisionRights: {
    final?: DecisionRightDisplay;
    qualifier1?: DecisionRightDisplay;
    qualifier2?: DecisionRightDisplay;
  };
};

/** currentTurn is derived on the server from persisted state and returned for client convenience. */
export type MatchStatePayload = {
  match: ActiveMatch | null;
  matchPlayers: MatchPlayerWithDisplay[];
  rounds: Round[];
  throwEvents: ThrowEvent[];
  currentTurn: { playerId: string; turnIndex: number } | null;
  suddenDeathState: SuddenDeathState | null;
  resolvedTieOrders: string[][];
  matchOutcomeSummary?: MatchOutcomeSummary | null;
  /** True when match is finished and playoff final is confirmed; undo is then disabled everywhere. */
  undoLocked?: boolean;
  /**
   * When false, client must not send throws/undo (participant or read-only session).
   * Omitted/true = scoring allowed (owner or unowned match).
   */
  sessionWriteEnabled?: boolean;
};

/** GET /api/matches/[matchId]/state response. */
export type MatchStateResponse = MatchStatePayload;
