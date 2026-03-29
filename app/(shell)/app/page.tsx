import Link from "next/link";

import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResumeCardList } from "@/components/resume/ResumeCardList";
import { HistoryCardList } from "@/components/history/HistoryCardList";
import { getAnalyticsOverview } from "@/lib/analytics";
import { getGlobalLeaderboardStandings } from "@/lib/leaderboard/globalStandings";
import {
  getLinkedPlayerByUserId,
  listVisibleCompletedMatches,
  listVisibleResumableMatches,
} from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";
import { formatScore } from "@/lib/utils/dartScore";

export default async function AppHomePage() {
  const user = await requireUser();
  const linked = await getLinkedPlayerByUserId(user.id);
  const linkedPlayerId = linked?.playerId ?? null;

  const [resumable, completed, overview, leaderboard] = await Promise.all([
    listVisibleResumableMatches(user.id, linkedPlayerId),
    listVisibleCompletedMatches(user.id, linkedPlayerId),
    getAnalyticsOverview(),
    getGlobalLeaderboardStandings(),
  ]);

  const recentCompleted = completed.slice(0, 5).map((m) => ({
    ...m,
    displayStatus: "complete" as const,
    isFullyComplete: true,
  }));
  const resumePreview = resumable.slice(0, 3);
  const resumeHref =
    resumable.length > 1
      ? "/resume"
      : resumable.length === 1
        ? resumable[0].resumeTo === "playoffs"
          ? `/playoffs/${resumable[0].matchId}`
          : `/match/${resumable[0].matchId}`
        : null;
  const topThree = leaderboard.slice(0, 3);
  const topByWins = overview.topPlayersByWins?.[0];

  return (
    <PageTransition>
        <PageHeader
          title="DartPulse"
          description="Track every throw. Own every match."
          rightSlot={
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                <LiquidButton asChild variant="brand" size="sm">
                  <Link href="/match/new">
                    <span aria-hidden>＋</span>
                    <span>New Match</span>
                  </Link>
                </LiquidButton>
              {resumeHref != null && (
                <LiquidButton asChild variant="light" size="sm">
                  <Link href={resumeHref}>Resume</Link>
                </LiquidButton>
              )}
              <LiquidButton asChild variant="light" size="sm">
                <Link href="/leaderboard">Leaderboard</Link>
              </LiquidButton>
            </div>
          }
        />

        <div className="mt-4 min-w-0 space-y-5">
          {/* Overview stat cards */}
          <section className="space-y-2">
            <h2 className="section-heading">Overview</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              <GlassCard className="flex min-h-[72px] flex-col justify-between p-3">
                <p className="stat-label">Your completed</p>
                <p className="stat-value mt-1.5 text-foreground">
                  {completed.length}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[72px] flex-col justify-between p-3">
                <p className="stat-label">Players</p>
                <p className="stat-value mt-1.5 text-foreground">
                  {overview.totalRegisteredPlayers}
                </p>
              </GlassCard>
              <GlassCard className="flex min-h-[72px] flex-col justify-between p-3">
                <p className="stat-label">Best throw</p>
                <p className="stat-value mt-1.5 text-primaryNeon">
                  {formatScore(overview.bestThrow)}
                </p>
              </GlassCard>
              {topByWins && (
                <GlassCard className="flex min-h-[72px] flex-col justify-between p-3">
                  <p className="stat-label">Top by wins</p>
                  <Link
                    href={`/players/${topByWins.playerId}`}
                    className="mt-1.5 truncate font-display text-lg font-bold text-foreground hover:text-primaryNeon transition-colors leading-tight"
                  >
                    {topByWins.playerName}
                  </Link>
                </GlassCard>
              )}
            </div>
          </section>

          {/* Resume */}
          <section className="space-y-2">
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
                  <LiquidButton asChild variant="brand" size="sm">
                    <Link href="/match/new">New Match</Link>
                  </LiquidButton>
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
          <section className="space-y-2">
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
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Leaderboard preview */}
            <section className="space-y-2">
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
                <ul className="space-y-2">
                  {topThree.map((entry, i) => (
                    <li key={entry.playerId}>
                      <Link
                        href={`/players/${entry.playerId}`}
                        className="group flex items-center justify-between gap-3 rounded-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon"
                        style={{ background: "var(--glassBackground)", boxShadow: "var(--panelShadow)" }}
                      >
                        <span
                          className={`w-5 shrink-0 text-center text-sm font-bold tabular-nums ${
                            i === 0 ? "text-championGold" :
                            i === 1 ? "text-rankSilver" :
                            "text-rankBronze"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground group-hover:text-primaryNeon transition-colors">
                          {entry.playerName}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-mutedForeground">
                          {entry.wins}W
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Analytics preview */}
            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="section-heading">Analytics</h2>
                <Link
                  href="/analytics"
                  className="text-xs font-medium text-mutedForeground hover:text-primaryNeon transition-colors"
                >
                  View full
                </Link>
              </div>
              <GlassCard className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="stat-label">Avg / round</p>
                    <p className="stat-value mt-1 text-foreground text-xl">
                      {formatScore(overview.averageRoundScore)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">Total pts</p>
                    <p className="stat-value mt-1 text-foreground text-xl">
                      {formatScore(overview.totalPoints)}
                    </p>
                  </div>
                  <div>
                    <p className="stat-label">High match</p>
                    <p className="stat-value mt-1 text-foreground text-xl">
                      {formatScore(overview.highestCompletedMatchScore)}
                    </p>
                  </div>
                </div>
                <Link
                  href="/analytics"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primaryNeon hover:underline focus-ring rounded"
                >
                  Open analytics →
                </Link>
              </GlassCard>
            </section>
          </div>
        </div>
    </PageTransition>
  );
}
