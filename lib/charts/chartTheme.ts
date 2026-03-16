/**
 * Chart color tokens aligned with design-system.md §10 (Charts & Analytics).
 * Use these for all Recharts series (stroke, fill, color) so charts stay
 * consistent and readable on glass panels.
 */
export const chartColors = {
  /** Primary series — cyan (#00E5FF) */
  primarySeries: "var(--primaryNeon)",
  /** Secondary series — purple (#A855F7) */
  secondarySeries: "#A855F7",
  /** Highlight / champion — gold (#FFD700) */
  highlightSeries: "var(--championGold)",
  /** Muted / tertiary — gray (#9CA3AF) */
  mutedSeries: "#9CA3AF",
} as const;
