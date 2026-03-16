import { cn } from "@/utils/cn";

type AchievementBadgeProps = {
  type: string;
  sourceMatchId?: string;
  awardedAt?: string;
  className?: string;
};

/** Display label for achievement type (user-facing). */
const ACHIEVEMENT_LABELS: Record<string, string> = {
  champion: "Champion",
  podium: "Podium",
  perfectRound: "Perfect Round",
  bigThrow: "Big Throw",
  comebackKing: "Comeback King",
  firstWin: "First Win",
  fiveWins: "5 Wins",
  tenWins: "10 Wins",
  thousandPoints: "1000 Points",
  fiftyRounds: "50 Rounds",
  bullseyeKing: "Bullseye King",
  longestStreak: "Longest Streak",
  clutchPerformer: "Clutch Performer",
  consistencyMaster: "Consistency Master",
  comebackPlayer: "Comeback Player",
};

/**
 * Single achievement badge. Read-only; optional source match and date.
 */
export function AchievementBadge({
  type,
  sourceMatchId,
  awardedAt,
  className,
}: AchievementBadgeProps) {
  const label = ACHIEVEMENT_LABELS[type] ?? type;
  const isChampion = type === "champion";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        isChampion
          ? "border-championGold/50 bg-championGold/10 text-championGold"
          : "border-glassBorder bg-surfaceSubtle text-foreground",
        className,
      )}
      title={awardedAt ? `Awarded ${awardedAt}` : undefined}
    >
      {label}
      {sourceMatchId && (
        <span className="font-normal text-mutedForeground">· match</span>
      )}
    </span>
  );
}
