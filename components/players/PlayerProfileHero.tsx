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
    <GlassCard className="overflow-hidden border-primaryNeon/30 bg-gradient-to-br from-white/[0.06] to-transparent p-6 shadow-[0_0_24px_rgba(0,229,255,0.08)] md:p-8">
      <div className="flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:gap-6 md:text-left">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-foreground ring-4 md:h-24 md:w-24 md:text-3xl"
          style={{
            backgroundColor: `${ringColor}20`,
            color: ringColor,
            boxShadow: `0 0 0 2px ${ringColor}40`,
          }}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {player.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full border border-primaryNeon/50 bg-primaryNeon/10 px-3 py-1 text-sm font-semibold text-primaryNeon">
              {archetype}
            </span>
            {showChampionBadge && (
              <span className="rounded-full border border-championGold/50 bg-championGold/10 px-3 py-1 text-sm font-semibold text-championGold">
                Champion
              </span>
            )}
          </div>
          <p className="text-sm text-mutedForeground">{archetypeDescription}</p>
        </div>
      </div>
    </GlassCard>
  );
}
