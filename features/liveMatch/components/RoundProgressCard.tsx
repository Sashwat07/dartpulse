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

  return (
    <GlassCard className="p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-mutedForeground mb-2">
        Round progress
      </h2>
      <p className="text-base font-semibold tabular-nums mb-3">
        Round {currentRound} / {totalRounds}
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
                ? "h-3 w-3 rounded-full shrink-0 bg-primaryNeon shadow-[0_0_6px_rgba(0,229,255,0.5)] transition-colors duration-150"
                : "h-3 w-3 rounded-full shrink-0 border border-glassBorder bg-transparent transition-colors duration-150"
            }
          />
        ))}
      </div>
    </GlassCard>
  );
}
