import Link from "next/link";
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
import { AnalyticsPlayerTableClient } from "./AnalyticsPlayerTableClient";

export default async function AnalyticsPage() {
  const [overview, players] = await Promise.all([
    getAnalyticsOverview(),
    getPerPlayerAnalytics(),
  ]);

  return (
    <PageTransition>
        <PageHeader
          title="Analytics"
          description="Completed matches only. Regular-match throws (excludes playoff; includes sudden death)."
        />
        <div className="mt-4 min-w-0 space-y-5">

          {/* Overview stat cards */}
          <section className="space-y-2">
            <h2 className="section-heading">Overview</h2>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: "Completed matches", value: overview.totalCompletedMatches, accent: false },
                { label: "Registered players", value: overview.totalRegisteredPlayers, accent: false },
                { label: "Best throw", value: formatScore(overview.bestThrow), accent: true },
                { label: "Avg score / round", value: formatScore(overview.averageRoundScore), accent: false },
                { label: "Highest match score", value: formatScore(overview.highestCompletedMatchScore), accent: false },
                { label: "Total points", value: formatScore(overview.totalPoints), accent: false },
              ].map((stat) => (
                <GlassCard key={stat.label} className="flex min-h-[72px] flex-col justify-between p-3">
                  <p className="stat-label leading-tight">{stat.label}</p>
                  <p className={`stat-value mt-1.5 ${stat.accent ? "text-primaryNeon" : "text-foreground"}`}>
                    {stat.value}
                  </p>
                </GlassCard>
              ))}
            </div>
          </section>

          {/* Top by wins */}
          <section className="space-y-2">
            <h2 className="section-heading">Top by wins</h2>
            {overview.topPlayersByWins.length === 0 ? (
              <GlassCard className="p-4">
                <p className="text-sm text-mutedForeground">No completed matches yet.</p>
              </GlassCard>
            ) : (
              <ul className="space-y-2">
                {overview.topPlayersByWins.map((p, i) => (
                  <li key={p.playerId}>
                    <Link
                      href={`/players/${p.playerId}`}
                      className="group flex items-center justify-between gap-3 rounded-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon"
                      style={{ background: "var(--glassBackground)", boxShadow: "var(--panelShadow)" }}
                    >
                      <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${i === 0 ? "text-championGold" : i === 1 ? "text-rankSilver" : i === 2 ? "text-rankBronze" : "text-mutedForeground"}`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primaryNeon transition-colors">
                        {p.playerName}
                      </span>
                      <span className="shrink-0 tabular-nums text-sm font-bold text-foreground">
                        {p.wins}
                        <span className="ml-0.5 text-xs font-medium text-mutedForeground">W</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Top by total points */}
          <section className="space-y-2">
            <h2 className="section-heading">Top by total points</h2>
            {overview.topPlayersByTotalPoints.length === 0 ? (
              <GlassCard className="p-4">
                <p className="text-sm text-mutedForeground">No completed matches yet.</p>
              </GlassCard>
            ) : (
              <ul className="space-y-2">
                {overview.topPlayersByTotalPoints.map((p, i) => (
                  <li key={p.playerId}>
                    <Link
                      href={`/players/${p.playerId}`}
                      className="group flex items-center justify-between gap-3 rounded-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon"
                      style={{ background: "var(--glassBackground)", boxShadow: "var(--panelShadow)" }}
                    >
                      <span className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${i === 0 ? "text-championGold" : i === 1 ? "text-rankSilver" : i === 2 ? "text-rankBronze" : "text-mutedForeground"}`}>
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primaryNeon transition-colors">
                        {p.playerName}
                      </span>
                      <span className="shrink-0 tabular-nums text-sm font-bold text-foreground">
                        {formatScore(p.totalPoints)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Charts */}
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
              Charts
            </h2>
            <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
              <WinsAndTotalPointsChart players={players} />
              <AverageRoundScoreChart players={players} />
            </div>
          </section>

          {/* Player analytics table */}
          <section className="space-y-2">
            <h2 className="section-heading">Player analytics</h2>
            <AnalyticsPlayerTableClient players={players} />
          </section>
        </div>
    </PageTransition>
  );
}
