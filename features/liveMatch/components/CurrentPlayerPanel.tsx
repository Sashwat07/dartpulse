"use client";

import { selectActiveMatch, selectCurrentPlayer, selectMatchPlayers, selectThrowEvents } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";
import { DartScoreInput } from "@/components/DartScoreInput";
import { LastThrowIndicator } from "@/components/DartScoreInput/LastThrowIndicator";

export function CurrentPlayerPanel() {
  const addThrow = useMatchStore((s) => s.addThrow);
  const undoLastThrow = useMatchStore((s) => s.undoLastThrow);
  const sessionWriteEnabled = useMatchStore((s) => s.sessionWriteEnabled);

  const activeMatch = useMatchStore(selectActiveMatch);
  const currentPlayer = useMatchStore(selectCurrentPlayer);
  const matchPlayers = useMatchStore(selectMatchPlayers);
  const throwEvents = useMatchStore(selectThrowEvents);
  const suddenDeathState = useMatchStore((s) => s.suddenDeathState);

  const currentTurn = useMatchStore((s) => s.currentTurn);
  const undoLocked = useMatchStore((s) => s.undoLocked);
  const matchComplete = activeMatch && currentTurn === null && throwEvents.length > 0;
  const canUndo =
    sessionWriteEnabled && throwEvents.length > 0 && !undoLocked;
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
      ? `SD·${sdRoundDisplay}`
      : `Round ${activeMatch.currentRound} / ${activeMatch.totalRounds}`
    : null;

  // Round progress
  const shotsPerRound = activeMatch?.shotsPerRound ?? 1;
  const currentRound = activeMatch?.currentRound ?? 1;
  const totalRounds = activeMatch?.totalRounds ?? 1;
  const progressPct = totalRounds > 0 ? ((currentRound - 1) / totalRounds) * 100 : 0;
  const shotsTaken = Math.min(
    shotsPerRound,
    throwEvents.filter(
      (e) =>
        e.eventType === "regular" &&
        !e.playoffMatchId &&
        e.roundNumber === currentRound &&
        e.playerId === currentTurn?.playerId,
    ).length,
  );

  return (
    <GlassCard className={`p-4 ${inSuddenDeath ? "border-amber-400/40 bg-gradient-to-br from-amber-400/5 to-transparent" : "border-primaryNeon/25 bg-gradient-to-br from-primaryNeon/5 to-transparent"}`}>
      {!sessionWriteEnabled && (
        <p className="mb-3 rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2 text-xs font-medium text-mutedForeground">
          View only — you can follow this match but only the owner can score.
        </p>
      )}
      {/* Header: current turn label + round badge */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
          Current turn
        </p>
        {roundLabel && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${inSuddenDeath ? "border border-amber-400/30 bg-amber-400/10 text-amber-400" : "border border-primaryNeon/25 bg-primaryNeon/8 text-primaryNeon"}`}>
            {roundLabel}
          </span>
        )}
      </div>

      {/* Player name */}
      {matchComplete ? (
        <p className="font-display text-xl font-bold text-foreground">Match complete</p>
      ) : inSuddenDeath ? (
        <div className="space-y-0.5">
          <p className="font-display text-xl font-bold text-amber-400">
            {currentPlayer?.name ?? "—"}
          </p>
          {tiedNames && (
            <p className="text-[10px] text-mutedForeground">Tied: {tiedNames}</p>
          )}
        </div>
      ) : (
        <p className="font-display text-xl font-bold text-foreground leading-tight">
          {currentPlayer?.name ?? "—"}
        </p>
      )}

      {/* Round progress bar */}
      <div className="mt-2 mb-1 h-1 w-full overflow-hidden rounded-full bg-surfaceSubtle">
        <div
          className="h-full rounded-full bg-primaryNeon/50 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          aria-hidden
        />
      </div>

      {/* Last throw + shot dots inline */}
      <div className="flex items-center justify-between mb-3">
        <LastThrowIndicator
          lastScore={
            throwEvents.length > 0
              ? throwEvents[throwEvents.length - 1]?.score ?? null
              : null
          }
        />
        {shotsPerRound > 1 && (
          <div className="flex gap-1.5 items-center" aria-label={`${shotsTaken} of ${shotsPerRound} shots`}>
            {Array.from({ length: shotsPerRound }, (_, i) => (
              <span
                key={i}
                className={
                  i < shotsTaken
                    ? "h-2.5 w-2.5 rounded-full shrink-0 bg-primaryNeon shadow-[0_0_6px_rgba(0,229,255,0.5)] transition-all duration-150"
                    : "h-2.5 w-2.5 rounded-full shrink-0 border border-glassBorder bg-transparent transition-all duration-150"
                }
              />
            ))}
          </div>
        )}
      </div>

      <DartScoreInput
        onScore={(score) => addThrow(score)}
        disabled={Boolean(matchComplete) || !sessionWriteEnabled}
      />

      <button
        type="button"
        onClick={() => undoLastThrow()}
        disabled={!canUndo}
        className="mt-2 w-full rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-xs font-medium text-mutedForeground hover:border-primaryNeon/30 hover:bg-surfaceSubtle hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Undo last throw
      </button>
    </GlassCard>
  );
}
