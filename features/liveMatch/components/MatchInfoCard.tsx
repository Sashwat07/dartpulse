"use client";

import { selectActiveMatch, selectOrderedMatchPlayers } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";

type StatChipProps = {
  label: string;
  value: string | number;
};

function StatChip({ label, value }: StatChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-1.5 text-xs font-medium">
      <span className="text-mutedForeground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  );
}

function playerDisplayName(p: { displayName?: string; name: string }): string {
  return p.displayName ?? p.name;
}

export function MatchInfoCard() {
  const activeMatch = useMatchStore(selectActiveMatch);
  const matchPlayers = useMatchStore(selectOrderedMatchPlayers);

  if (!activeMatch || matchPlayers.length === 0) return null;

  const playoffShotsValue =
    activeMatch.playoffShotsPerRound != null
      ? String(activeMatch.playoffShotsPerRound)
      : "Same";
  const shotsPerRound = activeMatch.shotsPerRound ?? 1;

  return (
    <GlassCard className="p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground mb-3">
        Match setup
      </h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <StatChip label="Players" value={matchPlayers.length} />
        <StatChip label="Rounds" value={activeMatch.totalRounds} />
        <StatChip label="Shots / Round" value={shotsPerRound} />
        <StatChip label="Playoff Shots" value={playoffShotsValue} />
      </div>
      <div>
        <p className="text-xs font-medium text-mutedForeground mb-1.5">
          Starting order
        </p>
        <p className="text-sm font-medium text-foreground">
          {matchPlayers.map((p) => playerDisplayName(p)).join(" → ")}
        </p>
      </div>
      <p className="mt-2 text-xs text-mutedForeground">
        Starting player rotates each round
      </p>
    </GlassCard>
  );
}
