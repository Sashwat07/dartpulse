import type { Player } from "@/types/player";
import type { PlayerArchetype } from "@/lib/archetypes/playerArchetype";
import { GlassCard } from "@/components/GlassCard";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "").toUpperCase() + (parts[1][0] ?? "").toUpperCase();
  }
  const s = name.trim().slice(0, 2);
  return s ? s.toUpperCase() : "?";
}

type PlayerProfileHeroProps = {
  player: Player;
  archetype: PlayerArchetype;
  archetypeDescription: string;
  /** Show a champion highlight badge (e.g. when player has champion achievement). */
  showChampionBadge?: boolean;
};

export function PlayerProfileHero({
  player,
  archetype,
  archetypeDescription,
  showChampionBadge = false,
}: PlayerProfileHeroProps) {
  const initials = getInitials(player.name);
  const ringColor = player.avatarColor ?? "var(--primaryNeon)";

  return (
    <GlassCard className="overflow-hidden bg-gradient-to-br from-primaryNeon/[0.07] dark:from-white/[0.07] to-transparent p-6 md:p-8">
      <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-7 md:text-left">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold md:h-24 md:w-24 md:text-3xl"
          style={{
            backgroundColor: `${ringColor}20`,
            color: ringColor,
            boxShadow: `0 0 0 2px ${ringColor}35, 0 0 20px ${ringColor}15`,
          }}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl leading-tight">
            {player.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full border border-primaryNeon/40 bg-primaryNeon/10 px-3 py-1 text-sm font-semibold text-primaryNeon">
              {archetype}
            </span>
            {showChampionBadge && (
              <span className="rounded-full border border-championGold/50 bg-championGold/10 px-3 py-1 text-sm font-semibold text-championGold">
                Champion
              </span>
            )}
          </div>
          <p className="text-sm text-mutedForeground leading-relaxed">{archetypeDescription}</p>
        </div>
      </div>
    </GlassCard>
  );
}
