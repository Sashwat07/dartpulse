import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AverageRoundScoreChart } from "@/components/charts/AverageRoundScoreChart";
import { WinsAndTotalPointsChart } from "@/components/charts/WinsAndTotalPointsChart";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import {
  getAnalyticsOverview,
  getPerPlayerAnalytics,
} from "@/lib/analytics";
import { formatScore } from "@/lib/utils/dartScore";

export default async function AnalyticsPage() {
  const [overview, players] = await Promise.all([
    getAnalyticsOverview(),
    getPerPlayerAnalytics(),
  ]);

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="Analytics"
          description="Completed matches only. Regular-match throws (excludes playoff; includes sudden death)."
        />
        <div className="mt-6 min-w-0 space-y-10">
        {/* Overview stat cards */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Completed matches
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {overview.totalCompletedMatches}
              </p>
            </GlassCard>
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Registered players
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {overview.totalRegisteredPlayers}
              </p>
            </GlassCard>
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Best throw
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {formatScore(overview.bestThrow)}
              </p>
            </GlassCard>
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Avg score per round
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {formatScore(overview.averageRoundScore)}
              </p>
            </GlassCard>
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Highest match score
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {formatScore(overview.highestCompletedMatchScore)}
              </p>
            </GlassCard>
            <GlassCard className="flex min-h-[88px] flex-col justify-between p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                Total points
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
                {formatScore(overview.totalPoints)}
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Top by wins */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Top by wins
          </h2>
          {overview.topPlayersByWins.length === 0 ? (
            <GlassCard className="p-4">
              <p className="text-sm text-mutedForeground">
                No completed matches yet.
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <ul className="divide-y divide-glassBorder">
                {overview.topPlayersByWins.map((p, i) => (
                  <li
                    key={p.playerId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="w-6 shrink-0 tabular-nums text-mutedForeground">
                      {i + 1}.
                    </span>
                    <Link
                      href={`/players/${p.playerId}`}
                      className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded -mx-2 px-2 py-1 cursor-pointer"
                    >
                      {p.playerName}
                    </Link>
                    <span className="shrink-0 tabular-nums font-semibold text-foreground">
                      {p.wins}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </section>

        {/* Top by total points */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Top by total points
          </h2>
          {overview.topPlayersByTotalPoints.length === 0 ? (
            <GlassCard className="p-4">
              <p className="text-sm text-mutedForeground">
                No completed matches yet.
              </p>
            </GlassCard>
          ) : (
            <GlassCard className="overflow-hidden p-0">
              <ul className="divide-y divide-glassBorder">
                {overview.topPlayersByTotalPoints.map((p, i) => (
                  <li
                    key={p.playerId}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <span className="w-6 shrink-0 tabular-nums text-mutedForeground">
                      {i + 1}.
                    </span>
                    <Link
                      href={`/players/${p.playerId}`}
                      className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded -mx-2 px-2 py-1 cursor-pointer"
                    >
                      {p.playerName}
                    </Link>
                    <span className="shrink-0 tabular-nums font-semibold text-foreground">
                      {formatScore(p.totalPoints)}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </section>

        {/* Analytics charts — real data from getPerPlayerAnalytics */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Charts
          </h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <WinsAndTotalPointsChart players={players} />
            <AverageRoundScoreChart players={players} />
          </div>
        </section>

        {/* Player analytics table */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Player analytics
          </h2>
          {players.length === 0 ? (
            <GlassCard className="p-6">
              <p className="text-sm text-mutedForeground">
                No player participation in completed matches yet.
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-2">
              <GlassCard className="overflow-x-auto p-0">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-glassBorder text-mutedForeground">
                      <th className="px-3 py-3 font-semibold">Player</th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Matches
                      </th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Wins
                      </th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Total points
                      </th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Best throw
                      </th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Avg/round
                      </th>
                      <th className="px-3 py-3 text-right font-medium tabular-nums">
                        Throws
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p) => (
                      <tr
                        key={p.playerId}
                        className="border-b border-glassBorder/60 last:border-0 transition-colors hover:bg-surfaceSubtle"
                      >
                        <td className="max-w-[12rem] truncate px-3 py-2.5 font-medium">
                          <Link
                            href={`/players/${p.playerId}`}
                            className="text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded"
                          >
                            {p.playerName}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {p.matchesPlayed}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {p.wins}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatScore(p.totalPoints)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatScore(p.bestThrow)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatScore(p.averageRoundScore)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {p.totalThrows}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassCard>
              <p className="text-xs text-mutedForeground">
                Same throw scope as Leaderboard (regular match + sudden death; no
                playoff throws).
              </p>
            </div>
          )}
        </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
