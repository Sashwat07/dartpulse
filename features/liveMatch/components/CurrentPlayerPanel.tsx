"use client";

import { selectActiveMatch, selectCurrentPlayer, selectMatchPlayers, selectThrowEvents } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";
import { DartScoreInput } from "@/components/DartScoreInput";
import { LastThrowIndicator } from "@/components/DartScoreInput/LastThrowIndicator";

export function CurrentPlayerPanel() {
  const addThrow = useMatchStore((s) => s.addThrow);
  const undoLastThrow = useMatchStore((s) => s.undoLastThrow);

  const activeMatch = useMatchStore(selectActiveMatch);
  const currentPlayer = useMatchStore(selectCurrentPlayer);
  const matchPlayers = useMatchStore(selectMatchPlayers);
  const throwEvents = useMatchStore(selectThrowEvents);
  const suddenDeathState = useMatchStore((s) => s.suddenDeathState);

  const currentTurn = useMatchStore((s) => s.currentTurn);
  const undoLocked = useMatchStore((s) => s.undoLocked);
  const matchComplete = activeMatch && currentTurn === null && throwEvents.length > 0;
  const canUndo = throwEvents.length > 0 && !undoLocked;
  const inSuddenDeath = suddenDeathState && !suddenDeathState.isResolved;
  const tiedNames = inSuddenDeath
    ? suddenDeathState.tiedPlayerIds
        .map((id) => matchPlayers.find((p) => p.playerId === id)?.name ?? id)
        .join(", ")
    : null;
  const sdRoundDisplay =
    activeMatch && suddenDeathState
      ? suddenDeathState.roundNumber - activeMatch.totalRounds
      : 1;
  const roundLabel = activeMatch
    ? inSuddenDeath
      ? `Sudden death · round ${sdRoundDisplay}`
      : `Round ${activeMatch.currentRound} / ${activeMatch.totalRounds}`
    : null;

  return (
    <GlassCard className={`p-5 ${inSuddenDeath ? "border-amber-400/40 bg-gradient-to-br from-amber-400/5 to-transparent" : "border-primaryNeon/25 bg-gradient-to-br from-primaryNeon/5 to-transparent"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">
          Current turn
        </p>
        {roundLabel && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${inSuddenDeath ? "border border-amber-400/30 bg-amber-400/10 text-amber-400" : "border border-primaryNeon/25 bg-primaryNeon/8 text-primaryNeon"}`}>
            {roundLabel}
          </span>
        )}
      </div>

      {matchComplete ? (
        <p className="font-display text-2xl font-bold text-foreground">Match complete</p>
      ) : inSuddenDeath ? (
        <div className="space-y-0.5">
          <p className="font-display text-2xl font-bold text-amber-400">
            {currentPlayer?.name ?? "—"}
          </p>
          {tiedNames && (
            <p className="text-xs text-mutedForeground">Tied: {tiedNames}</p>
          )}
        </div>
      ) : (
        <p className="font-display text-2xl font-bold text-foreground leading-tight">
          {currentPlayer?.name ?? "—"}
        </p>
      )}

      <div className="mt-5 space-y-3">
        <LastThrowIndicator
          lastScore={
            throwEvents.length > 0
              ? throwEvents[throwEvents.length - 1]?.score ?? null
              : null
          }
        />
        <DartScoreInput
          onScore={(score) => addThrow(score)}
          disabled={Boolean(matchComplete)}
        />
        <button
          type="button"
          onClick={() => undoLastThrow()}
          disabled={!canUndo}
          className="rounded-button border border-glassBorder bg-glassBackground px-3 py-2 text-sm font-medium text-mutedForeground hover:border-primaryNeon/30 hover:bg-surfaceSubtle hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Undo last throw
        </button>
      </div>
    </GlassCard>
  );
}
