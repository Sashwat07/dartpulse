/**
 * Phase 10 scoring limits for achievements and analytics.
 * Aligns with dashboard model: Single 1–20, Double 2–40, Triple 3–60, Bullseye 50.
 * Do NOT change constants/gameRules.ts or throw/playoff validators (no gameplay change).
 */

/** Maximum single-shot score (triple 20). */
export const MAX_SINGLE_SHOT = 60;

/** Maximum possible round score for a given shots-per-round. Returns shotsPerRound × 60. */
export function getMaxRoundScore(shotsPerRound: number): number {
  return shotsPerRound * MAX_SINGLE_SHOT;
}

/**
 * Big Throw threshold: any throw >= this value counts as a "Big Throw".
 * Includes bullseye (50) and triple-20 (60). Keep as constant for easy tuning.
 */
export const BIG_THROW_THRESHOLD = 50;
