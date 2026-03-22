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
    <span className="inline-flex items-center gap-1 rounded border border-glassBorder bg-surfaceSubtle px-2 py-0.5 text-[10px] font-medium">
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
    <GlassCard className="px-4 py-2.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground shrink-0">
          Setup
        </span>
        <div className="flex flex-wrap gap-1.5">
          <StatChip label="Players" value={matchPlayers.length} />
          <StatChip label="Rounds" value={activeMatch.totalRounds} />
          <StatChip label="Shots" value={shotsPerRound} />
          <StatChip label="Playoff" value={playoffShotsValue} />
        </div>
        <span className="text-[10px] text-mutedForeground hidden sm:block">
          {matchPlayers.map((p) => playerDisplayName(p)).join(" → ")}
        </span>
      </div>
    </GlassCard>
  );
}
