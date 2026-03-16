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

const MAX_BARS = 10;

type AverageRoundScoreChartProps = {
  players: PlayerAnalytics[];
};

function truncateName(name: string, maxLen: number = 12): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "…";
}

export function AverageRoundScoreChart({
  players,
}: AverageRoundScoreChartProps) {
  if (players.length === 0) {
    return (
      <GlassCard className="min-w-0 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Average score per round
        </h2>
        <p className="mt-3 text-sm text-mutedForeground break-words">
          Not enough analytics data yet. Play more completed matches to unlock
          this chart.
        </p>
      </GlassCard>
    );
  }

  const data = players.slice(0, MAX_BARS).map((p) => ({
    name: truncateName(p.playerName),
    fullName: p.playerName,
    avg: Math.round(p.averageRoundScore * 10) / 10,
  }));

  return (
    <ChartContainer
      title="Average score per round"
      description="Per-player average (total points ÷ rounds played). Top 10 by total points."
    >
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        barCategoryGap="25%"
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
          angle={-25}
          textAnchor="end"
          height={44}
          interval={0}
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
          labelFormatter={(_, payload) =>
            payload[0]?.payload?.fullName ?? ""
          }
          formatter={(value) => [
            value != null
              ? Number(value).toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })
              : "—",
            "Avg / round",
          ]}
        />
        <Bar
          dataKey="avg"
          fill={chartColors.primarySeries}
          name="avg"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
