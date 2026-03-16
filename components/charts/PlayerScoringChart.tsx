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

type PlayerScoringChartProps = {
  stats: PlayerAnalytics | null;
};

const EMPTY_MESSAGE =
  "Not enough player data yet. Play more completed matches to unlock this chart.";

export function PlayerScoringChart({ stats }: PlayerScoringChartProps) {
  if (!stats || stats.roundsPlayed === 0) {
    return (
      <GlassCard className="min-w-0 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Scoring
        </h2>
        <p className="mt-3 text-sm text-mutedForeground break-words">{EMPTY_MESSAGE}</p>
      </GlassCard>
    );
  }

  const avgRounded =
    Math.round(stats.averageRoundScore * 10) / 10;

  const data = [
    { name: "Avg / round", value: avgRounded, key: "avg" },
    { name: "Best throw", value: stats.bestThrow, key: "best" },
  ];

  return (
    <ChartContainer
      title="Scoring"
      description="Average score per round and best single throw (completed matches)."
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
          width={40}
        />
        <Tooltip
          contentStyle={tooltipStyle.contentStyle}
          labelStyle={tooltipStyle.labelStyle}
          formatter={(value) => [
            typeof value === "number"
              ? value.toLocaleString(undefined, { maximumFractionDigits: 1 })
              : value,
            "",
          ]}
          labelFormatter={(label) => label}
        />
        <Bar
          dataKey="value"
          fill={chartColors.secondarySeries}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
