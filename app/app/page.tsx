import Link from "next/link";

import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResumeCardList } from "@/components/resume/ResumeCardList";
import { HistoryCardList } from "@/components/history/HistoryCardList";
import { getAnalyticsOverview } from "@/lib/analytics";
import { getGlobalLeaderboardStandings } from "@/lib/leaderboard/globalStandings";
import {
  listOwnedResumableMatches,
  listOwnedCompletedMatches,
} from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";
import { formatScore } from "@/lib/utils/dartScore";

export default async function AppHomePage() {
  const user = await requireUser();

  const [resumable, completed, overview, leaderboard] = await Promise.all([
    listOwnedResumableMatches(user.id),
    listOwnedCompletedMatches(user.id),
    getAnalyticsOverview(),
    getGlobalLeaderboardStandings(),
  ]);

  const recentCompleted = completed.slice(0, 5).map((m) => ({
    ...m,
    displayStatus: "complete" as const,
    isFullyComplete: true,
  }));
  const resumePreview = resumable.slice(0, 3);
  const topThree = leaderboard.slice(0, 3);
  const topByWins = overview.topPlayersByWins?.[0];

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="DartPulse"
          description="Track every throw. Own every match."
          rightSlot={
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <Link
                  href="/match/new"
                  className="btn-outline-primary focus-ring"
                >
                  <span aria-hidden>＋</span>
                  <span>New Match</span>
                </Link>
              {resumable.length > 0 && (
                <Link
                  href={
                    resumable[0].resumeTo === "playoffs"
                      ? `/playoffs/${resumable[0].matchId}`
                      : `/match/${resumable[0].matchId}`
                  }
                  className="btn-secondary focus-ring"
                >
                  Resume
                </Link>
              )}
              <Link
                href="/leaderboard"
                className="btn-secondary focus-ring"
              >
                Leaderboard
              </Link>
            </div>
          }
        />

        <div className="mt-8 min-w-0 space-y-8">
          {/* Overview stat cards */}
          <section className="space-y-3">
            <h2 className="section-heading">Overview</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <GlassCard className="flex min-h-[90px] flex-col justify-between p-4">
                <p className="stat-label">Completed</p>
                <p className="stat-value mt-2 text-foreground">
                  {overview.totalCompletedMatches}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[90px] flex-col justify-between p-4">
                <p className="stat-label">Players</p>
                <p className="stat-value mt-2 text-foreground">
                  {overview.totalRegisteredPlayers}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[90px] flex-col justify-between p-4">
                <p className="stat-label">Best throw</p>
                <p className="stat-value mt-2 text-primaryNeon">
                  {formatScore(overview.bestThrow)}
                </p>
              </GlassCard>
              {topByWins && (
                <GlassCard className="flex min-h-[90px] flex-col justify-between p-4">
                  <p className="stat-label">Top by wins</p>
                  <Link
                    href={`/players/${topByWins.playerId}`}
                    className="mt-2 truncate font-display text-xl font-bold text-foreground hover:text-primaryNeon transition-colors leading-tight"
                  >
                    {topByWins.playerName}
                  </Link>
                </GlassCard>
              )}
            </div>
          </section>

          {/* Resume */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-heading">In progress</h2>
              {resumable.length > 3 && (
                <Link
                  href="/resume"
                  className="text-xs font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  View all
                </Link>
              )}
            </div>
            {resumable.length === 0 ? (
              <EmptyState
                title="No matches in progress"
                description="Start a new match to begin. In-progress matches appear here until completed."
                action={
                  <Link
                    href="/match/new"
                    className="btn-outline-primary focus-ring"
                  >
                    New Match
                  </Link>
                }
              />
            ) : (
              <>
                <ResumeCardList items={resumePreview} />
                {resumable.length > 3 && (
                  <p className="text-sm text-mutedForeground">
                    <Link href="/resume" className="font-medium hover:text-primaryNeon transition-colors">
                      View all {resumable.length} in progress →
                    </Link>
                  </p>
                )}
              </>
            )}
          </section>

          {/* Recent completed */}
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="section-heading">Recent matches</h2>
              {completed.length > 5 && (
                <Link
                  href="/history"
                  className="text-xs font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  View all
                </Link>
              )}
            </div>
            {recentCompleted.length === 0 ? (
              <EmptyState
                title="No completed matches yet"
                description="Finish a match to see it here. Completed matches appear with scoreboard and analytics."
              />
            ) : (
              <>
                <HistoryCardList items={recentCompleted} />
                {completed.length > 5 && (
                  <p className="text-sm text-mutedForeground">
                    <Link href="/history" className="font-medium hover:text-primaryNeon transition-colors">
                      View all {completed.length} matches →
                    </Link>
                  </p>
                )}
              </>
            )}
          </section>

          {/* Leaderboard + Analytics preview */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Leaderboard preview */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-heading">Leaderboard</h2>
                <Link
                  href="/leaderboard"
                  className="text-xs font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  View full
                </Link>
              </div>
              {topThree.length === 0 ? (
                <GlassCard className="p-4">
                  <p className="text-sm text-mutedForeground">
                    No standings yet. Complete matches to see the leaderboard.
                  </p>
                </GlassCard>
              ) : (
                <GlassCard className="overflow-hidden p-0">
                  <ul className="divide-y divide-glassBorder">
                    {topThree.map((entry, i) => (
                      <li key={entry.playerId}>
                        <Link
                          href={`/players/${entry.playerId}`}
                          className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surfaceSubtle"
                        >
                          <span
                            className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${
                              i === 0
                                ? "text-championGold"
                                : i === 1
                                  ? "text-rankSilver"
                                  : i === 2
                                    ? "text-rankBronze"
                                    : "text-mutedForeground"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground text-sm">
                            {entry.playerName}
                          </span>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-mutedForeground">
                            {entry.wins}W
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}
            </section>

            {/* Analytics preview */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-heading">Analytics</h2>
                <Link
                  href="/analytics"
                  className="text-xs font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  View full
                </Link>
              </div>
              <GlassCard className="p-5">
                <div className="grid grid-cols-3 gap-5">
                  <div>
                    <p className="stat-label">Avg / round</p>
                    <p className="stat-value mt-1.5 text-foreground text-2xl">
                      {formatScore(overview.averageRoundScore)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Total pts</p>
                    <p className="stat-value mt-1.5 text-foreground text-2xl">
                      {formatScore(overview.totalPoints)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">High match</p>
                    <p className="stat-value mt-1.5 text-foreground text-2xl">
                      {formatScore(overview.highestCompletedMatchScore)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/analytics"
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primaryNeon hover:underline focus-ring rounded"
                >
                  Open analytics →
                </Link>
              </GlassCard>
            </section>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
