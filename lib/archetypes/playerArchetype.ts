import type { PlayerAnalytics } from "@/lib/analytics/types";
import { getPerPlayerAnalytics } from "@/lib/analytics/playerStats";

/**
 * Primary archetype per player. Exactly one; derived from career metrics.
 * Deterministic: same inputs => same archetype.
 */
export type PlayerArchetype =
  | "Champion"
  | "Consistent"
  | "Aggressive"
  | "Clutch"
  | "Grinder";

/**
 * Score each archetype from career metrics; return the highest-scoring.
 * Weights (tunable): Champion = wins; Consistent = avg round score; Aggressive = best throw;
 * Clutch = win rate proxy; Grinder = rounds + steady avg.
 */
function scoreArchetypes(stats: PlayerAnalytics): Record<PlayerArchetype, number> {
  const matchesPlayed = Math.max(1, stats.matchesPlayed);
  const winRate = stats.wins / matchesPlayed;

  return {
    Champion: stats.wins * 10,
    Consistent: stats.averageRoundScore,
    Aggressive: stats.bestThrow,
    Clutch: winRate * 20,
    Grinder: stats.roundsPlayed * 0.2 + stats.averageRoundScore * 0.5,
  };
}

/**
 * Get the primary archetype for a player from career analytics.
 * Uses getPerPlayerAnalytics; exactly one archetype per player.
 * Returns "Consistent" if player has no completed-match data.
 */
export async function getPlayerArchetype(
  playerId: string,
): Promise<PlayerArchetype> {
  const all = await getPerPlayerAnalytics();
  const stats = all.find((p) => p.playerId === playerId);
  if (!stats || stats.matchesPlayed === 0) {
    return "Consistent";
  }

  const scores = scoreArchetypes(stats);
  const entries = Object.entries(scores) as [PlayerArchetype, number][];
  let best: PlayerArchetype = "Consistent";
  let bestScore = -1;
  for (const [arch, score] of entries) {
    if (score > bestScore) {
      bestScore = score;
      best = arch;
    }
  }
  return best;
}
