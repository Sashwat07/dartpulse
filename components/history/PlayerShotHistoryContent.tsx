"use client";

import type { ThrowEvent } from "@/types/match";
import type { ShotHistoryDisplay } from "@/lib/shotHistoryDisplay";

type PlayerShotHistoryContentProps = {
  playerId: string;
  shotHistoryDisplay: ShotHistoryDisplay;
  totalRounds: number;
};

/**
 * Compact per-player shot history for inline expansion under a scoreboard row.
 * Shows only that player's throws: by round, then sudden death when present.
 * No player name repetition (row already identifies the player).
 */
export function PlayerShotHistoryContent({
  playerId,
  shotHistoryDisplay,
  totalRounds,
}: PlayerShotHistoryContentProps) {
  const regular = shotHistoryDisplay.regular.filter((t) => t.playerId === playerId);
  const suddenDeath = shotHistoryDisplay.suddenDeath.filter((t) => t.playerId === playerId);
  const hasAny = regular.length > 0 || suddenDeath.length > 0;
  if (!hasAny) return null;

  const byRound = new Map<number, ThrowEvent[]>();
  for (const t of regular) {
    if (!byRound.has(t.roundNumber)) byRound.set(t.roundNumber, []);
    byRound.get(t.roundNumber)!.push(t);
  }
  const rounds = Array.from(byRound.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-3 py-2 text-sm">
      {rounds.length > 0 && (
        <div>
          <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-1.5">
            By round
          </p>
          <ul className="space-y-1">
            {rounds.map((r) => (
              <li key={r}>
                <span className="text-mutedForeground mr-2">R{r}:</span>
                <span className="tabular-nums">
                  {(byRound.get(r) ?? []).map((t) => t.score).join(", ")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {suddenDeath.length > 0 && (
        <div>
          <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-1.5">
            Sudden death
          </p>
          <ul className="space-y-1">
            {(() => {
              const sdByRound = new Map<number, ThrowEvent[]>();
              for (const t of suddenDeath) {
                if (!sdByRound.has(t.roundNumber)) sdByRound.set(t.roundNumber, []);
                sdByRound.get(t.roundNumber)!.push(t);
              }
              const sdRounds = Array.from(sdByRound.keys()).sort((a, b) => a - b);
              return sdRounds.map((r) => (
                <li key={r}>
                  <span className="text-mutedForeground mr-2">
                    SD{r - totalRounds}:
                  </span>
                  <span className="tabular-nums">
                    {(sdByRound.get(r) ?? []).map((t) => t.score).join(", ")}
                  </span>
                </li>
              ));
            })()}
          </ul>
        </div>
      )}
    </div>
  );
}
