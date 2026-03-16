"use client";

import type { ThrowEvent } from "@/types/match";
import { selectShotHistoryDisplay } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";

function getName(
  matchPlayers: { playerId: string; name: string }[],
  playerId: string,
): string {
  return matchPlayers.find((p) => p.playerId === playerId)?.name ?? playerId;
}

function ThrowsList({
  throws,
  matchPlayers,
  label,
  roundLabel,
}: {
  throws: ThrowEvent[];
  matchPlayers: { playerId: string; name: string }[];
  label?: string;
  roundLabel?: (r: number) => string;
}) {
  if (throws.length === 0) return null;

  const byRound = new Map<number, ThrowEvent[]>();
  for (const t of throws) {
    if (!byRound.has(t.roundNumber)) byRound.set(t.roundNumber, []);
    byRound.get(t.roundNumber)!.push(t);
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide">
          {label}
        </p>
      )}
      <ul className="space-y-1 text-sm">
        {rounds.map((r) => (
          <li key={r}>
            {roundLabel ? (
              <span className="text-mutedForeground mr-2">
                {roundLabel(r)}:
              </span>
            ) : null}
            {(byRound.get(r) ?? []).map((t) => (
              <span
                key={t.throwEventId}
                className="tabular-nums mr-2 after:content-['·'] last:after:content-['']"
              >
                {getName(matchPlayers, t.playerId)} {t.score}
              </span>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ShotHistorySection() {
  const display = useMatchStore(selectShotHistoryDisplay);
  const matchPlayers = useMatchStore((s) => s.matchPlayers);
  const totalRounds = useMatchStore((s) => s.activeMatch?.totalRounds ?? 1);

  const hasAny =
    display.regular.length > 0 || display.suddenDeath.length > 0;
  if (!hasAny) return null;

  return (
    <GlassCard className="p-4 overflow-x-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
        Shot history
      </h2>
      <div className="space-y-4">
        <ThrowsList
          throws={display.regular}
          matchPlayers={matchPlayers}
          label="By round"
          roundLabel={(r) => `R${r}`}
        />
        <ThrowsList
          throws={display.suddenDeath}
          matchPlayers={matchPlayers}
          label="Sudden death"
          roundLabel={(r) => `SD${r - totalRounds}`}
        />
      </div>
    </GlassCard>
  );
}
