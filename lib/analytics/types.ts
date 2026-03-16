/**
 * Analytics types. All metrics are from completed matches only (match.status === "matchFinished").
 *
 * Throw scope for stats below:
 * - Regular-match throws only: playoffMatchId === null (excludes playoff throws).
 * - Includes both eventType "regular" and "suddenDeath" (i.e. full regular match including sudden death).
 */

/** Overview stats for the analytics dashboard. */
export type AnalyticsOverview = {
  /** Count of matches with status matchFinished. */
  totalCompletedMatches: number;
  /** Count of players in the Player table (registered players). MVP: not limited to completed-match participants. */
  totalRegisteredPlayers: number;
  /**
   * Best (highest) single throw score in completed matches.
   * Scope: regular-match throws only (excludes playoff). Includes sudden death.
   */
  bestThrow: number;
  /**
   * Average score per round (per match), not average per throw.
   * Formula: total regular-match points across completed matches / total round-units.
   * One round-unit = one round number in one match (sum of match.totalRounds over completed matches).
   * Scope: regular-match throws only (excludes playoff). Includes sudden death.
   */
  averageRoundScore: number;
  /** Total round-units (sum of totalRounds) across completed matches. Used as denominator for averageRoundScore. */
  totalRoundUnits: number;
  /** Highest single-match total (sum of regular-match throws in one match) across completed matches. Excludes playoff. */
  highestCompletedMatchScore: number;
  /** Total points from regular-match throws across all completed matches. Excludes playoff. Includes sudden death. */
  totalPoints: number;
  /** Top players by win count (champion). */
  topPlayersByWins: { playerId: string; playerName: string; wins: number }[];
  /** Top players by total points in completed matches. */
  topPlayersByTotalPoints: { playerId: string; playerName: string; totalPoints: number }[];
};

/** Per-player analytics. All metrics from completed matches only; regular-match throws (excludes playoff, includes sudden death) unless noted. */
export type PlayerAnalytics = {
  playerId: string;
  playerName: string;
  /** Completed matches in which this player participated (from MatchPlayer). */
  matchesPlayed: number;
  /** Rounds played = sum of match.totalRounds for each completed match the player participated in. */
  roundsPlayed: number;
  /** Count of completed matches where this player was champion (2p: rank 1; 3+: final playoff winner). */
  wins: number;
  /** Sum of throw scores in completed regular matches. Excludes playoff. Includes sudden death. */
  totalPoints: number;
  /** Highest single throw score in completed regular matches. Excludes playoff. Includes sudden death. */
  bestThrow: number;
  /**
   * Average score per round for this player (not average per throw).
   * Formula: totalPoints / roundsPlayed. Zero if roundsPlayed === 0.
   */
  averageRoundScore: number;
  /** Count of regular-match throws in completed matches. Excludes playoff. Includes sudden death. */
  totalThrows: number;
};
