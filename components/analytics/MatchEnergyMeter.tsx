import { GlassCard } from "@/components/GlassCard";

type MatchEnergyMeterProps = {
  energyScore: number;
  leadChanges: number;
  closeRounds: number;
  clutchRoundShift: 0 | 1;
};

/**
 * Read-only match energy: competitiveness score and breakdown.
 * Formula: (leadChanges × 3) + (closeRounds × 2) + clutchRoundShift
 */
export function MatchEnergyMeter({
  energyScore,
  leadChanges,
  closeRounds,
  clutchRoundShift,
}: MatchEnergyMeterProps) {
  return (
    <GlassCard className="p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
        Match energy
      </h2>
      <p className="mt-1 text-xs text-mutedForeground">
        Competitiveness score
      </p>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {energyScore}
        </span>
        <span className="text-sm text-mutedForeground">pts</span>
      </div>
      <p className="mt-3 text-xs text-mutedForeground">
        (lead changes × 3) + (close rounds × 2) + clutch ={" "}
        <span className="font-medium tabular-nums text-foreground">
          {leadChanges}×3 + {closeRounds}×2 + {clutchRoundShift} = {energyScore}
        </span>
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-glassBorder/80 pt-3 text-xs">
        <dt className="text-mutedForeground">Lead changes</dt>
        <dd className="text-right font-semibold tabular-nums text-foreground">
          {leadChanges}
        </dd>
        <dt className="text-mutedForeground">Close rounds (diff ≤ 2)</dt>
        <dd className="text-right font-semibold tabular-nums text-foreground">
          {closeRounds}
        </dd>
        <dt className="text-mutedForeground">Final round clutch</dt>
        <dd className="text-right font-semibold tabular-nums text-foreground">
          {clutchRoundShift}
        </dd>
      </dl>
    </GlassCard>
  );
}
