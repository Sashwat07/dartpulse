export const queryKeys = {
  players: () => ["players"] as const,
  player: (playerId: string) => ["players", playerId] as const,

  matches: () => ["matches"] as const,
  match: (matchId: string) => ["matches", matchId] as const,

  leaderboard: () => ["leaderboard"] as const,
  analytics: () => ["analytics"] as const,
} as const;

