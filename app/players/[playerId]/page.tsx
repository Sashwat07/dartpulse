import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PlayerProfileHero } from "@/components/players/PlayerProfileHero";
import { PlayerStatsCards } from "@/components/players/PlayerStatsCards";
import { PlayerAchievementsList } from "@/components/players/PlayerAchievementsList";
import { PlayerScoringChart } from "@/components/charts/PlayerScoringChart";
import { PlayerVolumeChart } from "@/components/charts/PlayerVolumeChart";
import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { evaluateCareerAchievements } from "@/lib/achievements/evaluator";
import { listAchievementsByPlayerId } from "@/lib/repositories/achievementRepository";
import { getPerPlayerAnalytics } from "@/lib/analytics/playerStats";
import { getPlayerArchetype } from "@/lib/archetypes/playerArchetype";
import type { PlayerArchetype } from "@/lib/archetypes/playerArchetype";
import { getPlayerById } from "@/lib/repositories";

/** Short display descriptions for archetypes (presentation only). */
const ARCHETYPE_DESCRIPTIONS: Record<PlayerArchetype, string> = {
  Champion: "Dominates the win column.",
  Consistent: "Steady scores round after round.",
  Aggressive: "High-risk, high-reward throws.",
  Clutch: "Rises when it matters.",
  Grinder: "Volume and reliability.",
};

type PageProps = {
  params: Promise<{ playerId: string }>;
};

export default async function PlayerPage({ params }: PageProps) {
  const { playerId } = await params;

  const [player, allAnalytics] = await Promise.all([
    getPlayerById(playerId),
    getPerPlayerAnalytics(),
  ]);

  if (!player) {
    notFound();
  }

  const stats = allAnalytics.find((a) => a.playerId === playerId);
  await evaluateCareerAchievements(playerId, stats ?? null);
  const [achievements, archetype] = await Promise.all([
    listAchievementsByPlayerId(playerId),
    getPlayerArchetype(playerId),
  ]);

  const hasChampionAchievement = achievements.some((a) => a.type === "champion");

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="Player profile"
          description="Career stats and achievements from completed matches."
        />

        <div className="mt-4 min-w-0 space-y-5">
        {/* Hero / identity */}
        <section>
          <PlayerProfileHero
            player={player}
            archetype={archetype}
            archetypeDescription={ARCHETYPE_DESCRIPTIONS[archetype]}
            showChampionBadge={hasChampionAchievement}
          />
        </section>

        {/* Core stats */}
        {stats && (
          <section className="space-y-2">
            <h2 className="section-heading">Core stats</h2>
            <PlayerStatsCards stats={stats} />
          </section>
        )}

        {/* Performance charts */}
        <section className="space-y-2">
          <h2 className="section-heading">Performance</h2>
          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
            <PlayerVolumeChart stats={stats ?? null} />
            <PlayerScoringChart stats={stats ?? null} />
          </div>
        </section>

        {/* Achievements */}
        <section className="space-y-2">
          <h2 className="section-heading">Achievements</h2>
          <GlassCard className="p-4">
            {achievements.length === 0 ? (
              <p className="rounded-button border border-dashed border-glassBorder bg-surfaceMuted py-6 text-center text-sm text-mutedForeground">
                No achievements yet. Complete matches to earn badges.
              </p>
            ) : (
              <PlayerAchievementsList achievements={achievements} />
            )}
          </GlassCard>
        </section>

        {/* CTAs */}
        <section className="flex flex-wrap gap-x-3 gap-y-2">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 rounded-button border border-primaryNeon/50 bg-primaryNeon/5 px-4 py-2.5 text-sm font-semibold text-primaryNeon transition-colors hover:bg-primaryNeon/10"
          >
            View leaderboard
            <ArrowRight size={14} aria-hidden />
          </Link>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 rounded-button border border-glassBorder bg-surfaceSubtle px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surfaceHover"
          >
            View analytics
            <ArrowRight size={14} aria-hidden />
          </Link>
        </section>
        </div>
      </PageTransition>
    </AppShell>
  );
}
