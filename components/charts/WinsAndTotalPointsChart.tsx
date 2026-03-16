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

type WinsAndTotalPointsChartProps = {
  players: PlayerAnalytics[];
};

/** Truncate long names for axis labels. */
function truncateName(name: string, maxLen: number = 12): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + "…";
}

export function WinsAndTotalPointsChart({ players }: WinsAndTotalPointsChartProps) {
  if (players.length === 0) {
    return (
      <GlassCard className="min-w-0 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Wins & total points
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
    wins: p.wins,
    totalPoints: Math.round(p.totalPoints),
  }));

  return (
    <ChartContainer
      title="Wins & total points"
      description="Wins (left) and total points (right) by player. Top 10 by total points."
    >
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        barCategoryGap="20%"
        barGap={4}
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
          yAxisId="wins"
          orientation="left"
          stroke={axisStyle.stroke}
          fontSize={axisStyle.fontSize}
          tick={{ fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => String(v)}
          width={28}
        />
        <YAxis
          yAxisId="points"
          orientation="right"
          stroke={axisStyle.stroke}
          fontSize={axisStyle.fontSize}
          tick={{ fill: "var(--foreground)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))}
          width={36}
        />
        <Tooltip
          contentStyle={tooltipStyle.contentStyle}
          labelStyle={tooltipStyle.labelStyle}
          labelFormatter={(_, payload) =>
            payload[0]?.payload?.fullName ?? ""
          }
          formatter={(value, name) => [
            value != null
              ? name === "wins"
                ? value
                : Number(value).toLocaleString()
              : "—",
            name === "wins" ? "Wins" : "Total points",
          ]}
        />
        <Bar
          yAxisId="wins"
          dataKey="wins"
          fill={chartColors.primarySeries}
          name="wins"
          radius={[2, 2, 0, 0]}
        />
        <Bar
          yAxisId="points"
          dataKey="totalPoints"
          fill={chartColors.secondarySeries}
          name="totalPoints"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}
