"use client";

import { useState } from "react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { PlayoffTurnState } from "@/lib/playoffTurn";
import { DartScoreInput } from "@/components/DartScoreInput";
import { LastThrowIndicator } from "@/components/DartScoreInput/LastThrowIndicator";

type PlayoffScorePanelProps = {
  matchId: string;
  playoffMatch: PlayoffMatch;
  throwEvents: ThrowEvent[];
  matchPlayers: MatchPlayerWithDisplay[];
  totalRounds: number;
  playoffShotsPerRound: number;
  playoffTurnState?: PlayoffTurnState;
  onThrowAdded: () => void;
};

function playerName(players: MatchPlayerWithDisplay[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.name ?? playerId;
}

export function PlayoffScorePanel({
  matchId,
  playoffMatch,
  throwEvents,
  matchPlayers,
  totalRounds,
  playoffShotsPerRound,
  playoffTurnState,
  onThrowAdded,
}: PlayoffScorePanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const isComplete = playoffTurnState?.phase === "complete";
  const needsFirstThrowChoice = playoffTurnState?.needsFirstThrowChoice ?? false;
  const currentPlayerId = playoffTurnState?.currentPlayerId;
  const roundNumber = playoffTurnState?.regulationRoundNumber ?? 1;
  const inSuddenDeath = playoffTurnState?.phase === "suddenDeath";
  const isFinalConfirmed =
    playoffMatch.stage === "final" && playoffMatch.status === "completed";
  const canUndo = throwEvents.length > 0 && !needsFirstThrowChoice && !isFinalConfirmed;

  const handleThrow = async (score: number) => {
    if (isComplete || !currentPlayerId) return;
    setSubmitting(true);
    setUndoError(null);
    try {
      const res = await fetch(`/api/playoffs/${matchId}/throws`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playoffMatchId: playoffMatch.playoffMatchId,
          playerId: currentPlayerId,
          score,
        }),
      });
      if (res.ok) onThrowAdded();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (throwEvents.length === 0) return;
    setSubmitting(true);
    setUndoError(null);
    try {
      const res = await fetch(`/api/playoffs/${matchId}/throws/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playoffMatchId: playoffMatch.playoffMatchId }),
      });
      if (res.ok) onThrowAdded();
      else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setUndoError(data.error ?? "Cannot undo");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Only show when there's an active scoring state
  if (!playoffTurnState || needsFirstThrowChoice || isComplete) return null;

  return (
    <div className="rounded-xl border border-glassBorder bg-glassBackground overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-glassBorder/50">
        <span className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/60">
          Current Turn
        </span>
        <span className="rounded-full border border-glassBorder/60 bg-surfaceSubtle px-2 py-0.5 text-[9px] font-bold text-mutedForeground tabular-nums">
          {inSuddenDeath
            ? "Sudden Death"
            : `Round ${roundNumber} / ${totalRounds}`}
        </span>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Current player */}
        <div>
          {currentPlayerId ? (
            <p className="text-sm font-bold text-foreground">
              {playerName(matchPlayers, currentPlayerId)}
            </p>
          ) : (
            <p className="text-sm font-bold text-mutedForeground">—</p>
          )}
        </div>

        {/* Last throw */}
        <LastThrowIndicator
          lastScore={
            throwEvents.length > 0 ? throwEvents[throwEvents.length - 1]?.score ?? null : null
          }
        />

        {/* Score input */}
        <DartScoreInput
          onScore={(score) => handleThrow(score)}
          disabled={submitting || !currentPlayerId}
        />

        {/* Undo */}
        {canUndo && (
          <button
            type="button"
            onClick={handleUndo}
            disabled={submitting}
            className="w-full rounded-lg border border-glassBorder/60 bg-glassBackground px-3 py-2 text-xs font-medium text-mutedForeground hover:text-foreground hover:border-glassBorder transition-colors disabled:opacity-40"
          >
            Undo last throw
          </button>
        )}

        {undoError && (
          <p className="text-xs text-destructive">{undoError}</p>
        )}
      </div>
    </div>
  );
}
