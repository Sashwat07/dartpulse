"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerAnalytics } from "@/lib/analytics/types";
import { ChartContainer } from "@/components/charts/ChartContainer";
import { GlassCard } from "@/components/GlassCard";
import { chartColors } from "@/lib/charts/chartTheme";
import { axisStyle, gridStyle, tooltipStyle } from "@/lib/charts/chartDefaults";

type PlayerVolumeChartProps = {
  stats: PlayerAnalytics | null;
};

const EMPTY_MESSAGE =
  "Not enough player data yet. Play more completed matches to unlock this chart.";

export function PlayerVolumeChart({ stats }: PlayerVolumeChartProps) {
  if (!stats || stats.matchesPlayed === 0) {
    return (
      <GlassCard className="min-w-0 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Matches & wins
        </h2>
        <p className="mt-3 text-sm text-mutedForeground break-words">{EMPTY_MESSAGE}</p>
      </GlassCard>
    );
  }

  const data = [
    { name: "Matches", value: stats.matchesPlayed, key: "matches" },
    { name: "Wins", value: stats.wins, key: "wins" },
  ];

  return (
    <ChartContainer
      title="Matches & wins"
      description="Completed matches played and wins (championships)."
    >
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        barCategoryGap="30%"
      >
        <CartesianGrid
          strokeDasharray={gridStyle.strokeDasharray}
          stroke={gridStyle.stroke}
          strokeOpacity={gridStyle.strokeOpacity}
          vertical={false}
        />
        <XAxis
          dataKey="name"
          stroke={axisStyle.stroke}
          fontSize={axisStyle.fontSize}
          tick={{ fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke={axisStyle.stroke}
          fontSize={axisStyle.fontSize}
          tick={{ fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => String(v)}
          allowDecimals={false}
          width={28}
        />
        <Tooltip
          contentStyle={tooltipStyle.contentStyle}
          labelStyle={tooltipStyle.labelStyle}
          formatter={(value) => [value, ""]}
          labelFormatter={(label) => label}
        />
        <Bar
          dataKey="value"
          fill={chartColors.primarySeries}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
