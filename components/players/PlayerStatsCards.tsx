import type { PlayerAnalytics } from "@/lib/analytics/types";
import { GlassCard } from "@/components/GlassCard";

type PlayerStatsCardsProps = {
  stats: PlayerAnalytics;
};

const statItems = (
  stats: PlayerAnalytics,
): { label: string; value: string }[] => {
  const winRate =
    stats.matchesPlayed > 0
      ? ((stats.wins / stats.matchesPlayed) * 100).toFixed(1) + "%"
      : "—";
  return [
    { label: "Matches", value: String(stats.matchesPlayed) },
    { label: "Wins", value: String(stats.wins) },
    { label: "Win rate", value: winRate },
    {
      label: "Avg / round",
      value: stats.averageRoundScore.toFixed(1),
    },
    {
      label: "Total points",
      value: stats.totalPoints.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
    },
    { label: "Best throw", value: String(stats.bestThrow) },
  ];
};

export function PlayerStatsCards({ stats }: PlayerStatsCardsProps) {
  const items = statItems(stats);

  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {items.map(({ label, value }) => (
        <GlassCard
          key={label}
          className="flex min-h-[72px] flex-col justify-between p-3"
        >
          <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
            {label}
          </p>
          <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
            {value}
          </p>
        </GlassCard>
      ))}
    </div>
  );
}
