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
        <div className="mt-8 min-w-0 space-y-10">

          {/* Overview stat cards */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
              Overview
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Completed matches", value: overview.totalCompletedMatches, accent: false },
                { label: "Registered players", value: overview.totalRegisteredPlayers, accent: false },
                { label: "Best throw", value: formatScore(overview.bestThrow), accent: true },
                { label: "Avg score / round", value: formatScore(overview.averageRoundScore), accent: false },
                { label: "Highest match score", value: formatScore(overview.highestCompletedMatchScore), accent: false },
                { label: "Total points", value: formatScore(overview.totalPoints), accent: false },
              ].map((stat) => (
                <GlassCard key={stat.label} className="flex min-h-[96px] flex-col justify-between p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground leading-tight">
                    {stat.label}
                  </p>
                  <p className={`mt-2 font-display text-3xl font-bold tabular-nums leading-none ${stat.accent ? "text-primaryNeon" : "text-foreground"}`}>
                    {stat.value}
                  </p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Top by wins */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
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
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surfaceSubtle"
                    >
                      <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${i === 0 ? "text-championGold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-mutedForeground"}`}>
                        {i + 1}
                      </span>
                      <Link
                        href={`/players/${p.playerId}`}
                        className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded -mx-2 px-2 py-1 cursor-pointer transition-colors"
                      >
                        {p.playerName}
                      </Link>
                      <span className="shrink-0 tabular-nums font-bold text-foreground">
                        {p.wins}
                        <span className="ml-0.5 text-xs font-medium text-mutedForeground">W</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </section>

          {/* Top by total points */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
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
                      className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surfaceSubtle"
                    >
                      <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${i === 0 ? "text-championGold" : i === 1 ? "text-[#C0C0C0]" : i === 2 ? "text-[#CD7F32]" : "text-mutedForeground"}`}>
                        {i + 1}
                      </span>
                      <Link
                        href={`/players/${p.playerId}`}
                        className="min-w-0 flex-1 truncate font-medium text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded -mx-2 px-2 py-1 cursor-pointer transition-colors"
                      >
                        {p.playerName}
                      </Link>
                      <span className="shrink-0 tabular-nums font-bold text-foreground">
                        {formatScore(p.totalPoints)}
                      </span>
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </section>

          {/* Charts */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
              Charts
            </h2>
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
              <WinsAndTotalPointsChart players={players} />
              <AverageRoundScoreChart players={players} />
            </div>
          </section>

          {/* Player analytics table */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
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
                      <tr className="border-b border-glassBorder">
                        <th className="px-4 py-3 font-semibold text-foreground/80">Player</th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Matches
                        </th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Wins
                        </th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Total pts
                        </th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Best throw
                        </th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Avg / round
                        </th>
                        <th className="px-3 py-3 text-right font-medium tabular-nums text-mutedForeground">
                          Throws
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((p) => (
                        <tr
                          key={p.playerId}
                          className="border-b border-glassBorder/50 last:border-0 transition-colors hover:bg-surfaceSubtle"
                        >
                          <td className="max-w-[12rem] truncate px-4 py-3 font-medium">
                            <Link
                              href={`/players/${p.playerId}`}
                              className="text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded transition-colors"
                            >
                              {p.playerName}
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-foreground/80">
                            {p.matchesPlayed}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums font-semibold text-foreground">
                            {p.wins}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-foreground/80">
                            {formatScore(p.totalPoints)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-primaryNeon font-semibold">
                            {formatScore(p.bestThrow)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-foreground/80">
                            {formatScore(p.averageRoundScore)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums text-foreground/80">
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
