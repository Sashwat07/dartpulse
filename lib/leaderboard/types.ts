/**
 * Global leaderboard row. Throw metrics align with Phase 9 (completed matches;
 * regular-match throws only; exclude playoff; include sudden death).
 * Placement metrics from getFinalPlacementFromPayload per match.
 * Future: optional weighted-score column/tab may be added without changing this default model.
 */
export type GlobalLeaderboardEntry = {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  podiums: number;
  /** Mean final placement; lower is better */
  averageFinish: number;
  totalPoints: number;
  averageRoundScore: number;
  bestThrow: number;
  totalThrows: number;
};

export type LeaderboardTabId = "overall" | "wins" | "avgScore" | "totalPoints";
