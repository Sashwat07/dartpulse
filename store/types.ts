import type { MatchOutcomeSummary, MatchStatePayload } from "@/types/dto";
import type { PlayoffMatch } from "@/types/playoff";
import type {
  ActiveMatch,
  MatchLeaderboardEntry,
  MatchPlayerWithDisplay,
  Round,
  SuddenDeathState,
  ThrowEvent,
} from "@/types/match";

export type AnalyticsFilters = {
  season?: string;
  matchId?: string;
  playerId?: string;
  timeRange?: string;
};

export type GlobalPlayerStats = Record<string, unknown>;

export type UiFlags = {
  isScoreModalOpen: boolean;
  isUndoConfirmOpen: boolean;
};

export type MatchStoreState = {
  activeMatch: ActiveMatch | null;
  matchPlayers: MatchPlayerWithDisplay[];
  rounds: Round[];
  throwEvents: ThrowEvent[];
  currentTurn: { playerId: string; turnIndex: number } | null;

  matchLeaderboard: MatchLeaderboardEntry[];

  playoffState: "pending" | "active" | "completed";
  playoffMatches: PlayoffMatch[];
  suddenDeathState: SuddenDeathState | null;
  resolvedTieOrders: string[][];
  matchOutcomeSummary: MatchOutcomeSummary | null;

  /** When true (e.g. playoff final confirmed), undo is disabled for this match. */
  undoLocked: boolean;

  /** When false, scoring and undo are disabled (view-only participant). */
  sessionWriteEnabled: boolean;

  analyticsFilters: AnalyticsFilters;
  globalPlayerStats: GlobalPlayerStats;

  uiFlags: UiFlags;
};

export type MatchStoreActions = {
  // Phase 1 stubs only.
  addThrow: (score: number) => void;
  undoLastThrow: () => void;
  advanceRound: () => void;
  generatePlayoffs: () => void;
  /** Hydrate store from server state (recovery payload). */
  setMatchState: (payload: MatchStatePayload) => void;
};

export type MatchStore = MatchStoreState & MatchStoreActions;

