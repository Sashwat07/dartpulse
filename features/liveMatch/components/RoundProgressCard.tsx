"use client";

import { selectActiveMatch, selectThrowEvents } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";

export function RoundProgressCard() {
  const activeMatch = useMatchStore(selectActiveMatch);
  const throwEvents = useMatchStore(selectThrowEvents);
  const currentTurn = useMatchStore((s) => s.currentTurn);

  if (!activeMatch) return null;

  const shotsPerRound = activeMatch.shotsPerRound ?? 1;
  const currentRound = activeMatch.currentRound;
  const totalRounds = activeMatch.totalRounds;
  const currentPlayerId = currentTurn?.playerId ?? null;

  const shotsByCurrentPlayerInRound = throwEvents.filter(
    (e) =>
      e.eventType === "regular" &&
      !e.playoffMatchId &&
      e.roundNumber === currentRound &&
      e.playerId === currentPlayerId,
  );
  const shotsTaken = Math.min(shotsByCurrentPlayerInRound.length, shotsPerRound);

  const progressPct = totalRounds > 0 ? ((currentRound - 1) / totalRounds) * 100 : 0;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
          Round progress
        </h2>
        <span className="font-display text-sm font-bold tabular-nums text-foreground">
          {currentRound} <span className="text-mutedForeground font-normal">/ {totalRounds}</span>
        </span>
      </div>

      {/* Round progress bar */}
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surfaceSubtle">
        <div
          className="h-full rounded-full bg-primaryNeon/50 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />
      </div>

      {/* Shot dots */}
      {shotsPerRound > 1 && (
        <div className="space-y-1.5">
          <p className="text-xs text-mutedForeground">
            Shots this turn
          </p>
          <div
            className="flex gap-2 items-center"
            aria-label={`${shotsTaken} of ${shotsPerRound} shots in this round`}
          >
            {Array.from({ length: shotsPerRound }, (_, i) => (
              <span
                key={i}
                className={
                  i < shotsTaken
                    ? "h-3.5 w-3.5 rounded-full shrink-0 bg-primaryNeon shadow-[0_0_8px_rgba(0,229,255,0.5)] transition-all duration-150"
                    : "h-3.5 w-3.5 rounded-full shrink-0 border border-glassBorder bg-transparent transition-all duration-150"
                }
              />
            ))}
          </div>
        </div>
      )}
      {shotsPerRound === 1 && (
        <div
          className="flex gap-2 items-center"
          aria-label={`${shotsTaken} of ${shotsPerRound} shots in this round`}
        >
          {Array.from({ length: shotsPerRound }, (_, i) => (
            <span
              key={i}
              className={
                i < shotsTaken
                  ? "h-3.5 w-3.5 rounded-full shrink-0 bg-primaryNeon shadow-[0_0_8px_rgba(0,229,255,0.5)] transition-all duration-150"
                  : "h-3.5 w-3.5 rounded-full shrink-0 border border-glassBorder bg-transparent transition-all duration-150"
              }
            />
          ))}
        </div>
      )}
    </GlassCard>
  );
}
