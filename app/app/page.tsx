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

  const recentCompleted = completed.slice(0, 5);
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
                className="inline-flex items-center gap-2 rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-4 py-2.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/20"
              >
                <span className="sr-only">Start a new match</span>
                <span aria-hidden>＋</span>
                <span className="sm:not-sr-only">New Match</span>
              </Link>
              {resumable.length > 0 && (
                <Link
                  href={
                    resumable[0].resumeTo === "playoffs"
                      ? `/playoffs/${resumable[0].matchId}`
                      : `/match/${resumable[0].matchId}`
                  }
                  className="inline-flex items-center gap-2 rounded-button border border-glassBorder bg-surfaceSubtle px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surfaceHover"
                >
                  Resume
                </Link>
              )}
              <Link
                href="/leaderboard"
                className="inline-flex items-center gap-2 rounded-button border border-glassBorder bg-surfaceSubtle px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surfaceHover"
              >
                Leaderboard
              </Link>
            </div>
          }
        />

        <div className="mt-8 min-w-0 space-y-10">
          {/* Overview */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
              Overview
            </h2>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              <GlassCard className="flex min-h-[80px] flex-col justify-between p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                  Completed matches
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                  {overview.totalCompletedMatches}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[80px] flex-col justify-between p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                  Players
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                  {overview.totalRegisteredPlayers}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[80px] flex-col justify-between p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                  Best throw
                </p>
                <p className="mt-2 text-xl font-bold tabular-nums text-foreground">
                  {formatScore(overview.bestThrow)}
                </p>
              </GlassCard>
              {topByWins && (
                <GlassCard className="flex min-h-[80px] flex-col justify-between p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                    Top by wins
                  </p>
                  <Link
                    href={`/players/${topByWins.playerId}`}
                    className="mt-2 truncate text-lg font-bold text-foreground hover:text-primaryNeon"
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
                In progress
              </h2>
              {resumable.length > 3 && (
                <Link
                  href="/resume"
                  className="text-sm font-medium text-mutedForeground hover:text-primaryNeon"
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
                    className="inline-flex items-center gap-2 rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-3 py-2 text-sm font-semibold text-primaryNeon hover:bg-primaryNeon/20"
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
                    <Link href="/resume" className="font-medium hover:text-primaryNeon">
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
              <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
                Recent matches
              </h2>
              {completed.length > 5 && (
                <Link
                  href="/history"
                  className="text-sm font-medium text-mutedForeground hover:text-primaryNeon"
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
                    <Link href="/history" className="font-medium hover:text-primaryNeon">
                      View all {completed.length} matches →
                    </Link>
                  </p>
                )}
              </>
            )}
          </section>

          {/* Leaderboard + Analytics preview */}
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Leaderboard preview */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
                  Leaderboard
                </h2>
                <Link
                  href="/leaderboard"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-mutedForeground hover:text-primaryNeon"
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
                          className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surfaceSubtle"
                        >
                          <span className="w-6 shrink-0 tabular-nums font-semibold text-mutedForeground">
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                            {entry.playerName}
                          </span>
                          <span className="shrink-0 text-sm tabular-nums text-mutedForeground">
                            {entry.wins} W
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
                <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
                  Analytics
                </h2>
                <Link
                  href="/analytics"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-mutedForeground hover:text-primaryNeon"
                >
                  View full
                </Link>
              </div>
              <GlassCard className="p-4">
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                      Avg / round
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                      {formatScore(overview.averageRoundScore)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                      Total points
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                      {formatScore(overview.totalPoints)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
                      Highest match
                    </p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                      {formatScore(overview.highestCompletedMatchScore)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/analytics"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primaryNeon hover:underline"
                >
                  Open analytics
                </Link>
              </GlassCard>
            </section>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}

