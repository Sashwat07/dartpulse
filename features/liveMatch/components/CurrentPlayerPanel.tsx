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
      ? `Sudden death (round ${sdRoundDisplay})`
      : `Round ${activeMatch.currentRound} / ${activeMatch.totalRounds}`
    : null;

  return (
    <GlassCard className="p-4">
      <h2 className="text-xs font-medium uppercase tracking-wider text-mutedForeground">
        Current turn
      </h2>
      {matchComplete ? (
        <p className="mt-2 text-lg font-semibold">Match complete</p>
      ) : inSuddenDeath ? (
        <div className="mt-2 space-y-0.5">
          <p className="text-lg font-semibold text-amber-400">Sudden death</p>
          {tiedNames && (
            <p className="text-sm text-mutedForeground">Tied: {tiedNames}</p>
          )}
          <p className="text-sm font-medium">{currentPlayer?.name ?? "—"}</p>
        </div>
      ) : (
        <div className="mt-2 space-y-0.5">
          <p className="text-lg font-semibold">{currentPlayer?.name ?? "—"}</p>
          {roundLabel && (
            <p className="text-sm text-mutedForeground">{roundLabel}</p>
          )}
        </div>
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
          className="rounded-lg border border-glassBorder bg-glassBackground px-3 py-2 text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Undo last throw
        </button>
      </div>
    </GlassCard>
  );
}
