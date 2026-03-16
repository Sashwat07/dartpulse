/**
 * Shared default styles for Recharts (grid, axis, tooltip, font).
 * Import these in chart components instead of repeating styles.
 */

export const axisStyle = {
  stroke: "var(--glassBorder)",
  fontSize: 12,
  tick: { fill: "var(--foreground)" },
} as const;

export const gridStyle = {
  stroke: "var(--glassBorder)",
  strokeDasharray: "3 3",
  strokeOpacity: 0.6,
} as const;

export const tooltipStyle = {
  contentStyle: {
    backgroundColor: "var(--glassBackground)",
    border: "1px solid var(--glassBorder)",
    color: "var(--foreground)",
    borderRadius: 6,
  },
  labelStyle: { color: "var(--foreground)" },
} as const;

/** Default font size for chart labels (axis, tooltip). */
export const chartFontStyle = {
  fontSize: 12,
} as const;
