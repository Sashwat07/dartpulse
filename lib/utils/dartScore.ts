/**
 * Dart score input: multiplier + number → score.
 * Single 1–20, Double 2–40, Triple 3–60, Bull 50.
 */

export type DartMultiplier = "single" | "double" | "triple" | "bull";

/**
 * Computes the throw score from multiplier and number (1–20).
 * For bull, value is ignored and 50 is returned.
 */
export function computeScore(
  multiplier: DartMultiplier,
  value: number
): number {
  switch (multiplier) {
    case "single":
      return value;
    case "double":
      return value * 2;
    case "triple":
      return value * 3;
    case "bull":
      return 50;
    default:
      return value;
  }
}

/** Format a numeric score for display (1 decimal max). */
export function formatScore(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

/** Display label for well-known scores (Last Throw Indicator). Unambiguous only: Bull, T20, D20. */
export function getScoreDisplayLabel(score: number): string | null {
  if (score === 50) return "Bull";
  if (score === 60) return "T20";
  if (score === 40) return "D20";
  return null;
}
