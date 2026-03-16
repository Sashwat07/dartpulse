import type { ThrowEvent } from "@/types/match";
import type { ShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import { GlassCard } from "@/components/GlassCard";

type HistoryShotHistoryProps = {
  matchPlayers: { playerId: string; name: string }[];
  totalRounds: number;
  shotHistoryDisplay: ShotHistoryDisplay;
  /** Optional; display is derived from shotHistoryDisplay. */
  throwEvents?: ThrowEvent[];
};

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
              <span className="text-mutedForeground mr-2">{roundLabel(r)}:</span>
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

/**
 * Read-only shot history for history detail. Renders regular and sudden-death
 * throws grouped by round. No store usage; receives pre-derived shotHistoryDisplay.
 */
export function HistoryShotHistory({
  matchPlayers,
  totalRounds,
  shotHistoryDisplay,
}: HistoryShotHistoryProps) {
  const hasAny =
    shotHistoryDisplay.regular.length > 0 ||
    shotHistoryDisplay.suddenDeath.length > 0;
  if (!hasAny) return null;

  return (
    <GlassCard className="p-4 overflow-x-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
        Shot history
      </h2>
      <div className="space-y-4">
        <ThrowsList
          throws={shotHistoryDisplay.regular}
          matchPlayers={matchPlayers}
          label="By round"
          roundLabel={(r) => `R${r}`}
        />
        <ThrowsList
          throws={shotHistoryDisplay.suddenDeath}
          matchPlayers={matchPlayers}
          label="Sudden death"
          roundLabel={(r) => `SD${r - totalRounds}`}
        />
      </div>
    </GlassCard>
  );
}
