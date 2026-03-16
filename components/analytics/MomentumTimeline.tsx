import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

export type MomentumEntry = {
  round: number;
  leader: string;
};

type MomentumTimelineProps = {
  timeline: MomentumEntry[];
  /** playerId -> display name */
  playerNames: Record<string, string>;
};

/**
 * Read-only momentum timeline: who won each round.
 */
export function MomentumTimeline({ timeline, playerNames }: MomentumTimelineProps) {
  if (timeline.length === 0) {
    return (
      <GlassCard className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Momentum
        </h2>
        <p className="mt-3 text-sm text-mutedForeground">No rounds.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
        Momentum
      </h2>
      <p className="mt-1 text-xs text-mutedForeground">Round winner by round</p>
      <ul className="mt-4 space-y-2">
        {timeline.map(({ round, leader }) => {
          const leaderName = playerNames[leader] ?? leader;
          return (
            <li
              key={round}
              className={cn(
                "flex items-center justify-between gap-3 rounded-button border border-transparent px-3 py-2",
                "bg-surfaceSubtle",
              )}
            >
              <span className="shrink-0 rounded-full bg-surfaceHover px-2.5 py-1 text-xs font-medium tabular-nums text-mutedForeground">
                R{round}
              </span>
              <span className="min-w-0 flex-1 truncate text-right font-semibold text-foreground">
                {leaderName}
              </span>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
