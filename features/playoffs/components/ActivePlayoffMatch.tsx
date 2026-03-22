"use client";

import { useState } from "react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { PlayoffTurnState } from "@/lib/playoffTurn";
import { ShotDots } from "@/components/ShotDots";
import { GlassCard } from "@/components/GlassCard";
import { PlayoffThrowHistory } from "./PlayoffThrowHistory";
import { DartScoreInput } from "@/components/DartScoreInput";
import { LastThrowIndicator } from "@/components/DartScoreInput/LastThrowIndicator";

type ActivePlayoffMatchProps = {
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

export function ActivePlayoffMatch({
  matchId,
  playoffMatch,
  throwEvents,
  matchPlayers,
  playoffShotsPerRound,
  playoffTurnState,
  onThrowAdded,
}: ActivePlayoffMatchProps) {
  const [submitting, setSubmitting] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  const p1Name = playerName(matchPlayers, playoffMatch.player1Id);
  const p2Name = playerName(matchPlayers, playoffMatch.player2Id);

  const score1 = playoffTurnState?.regulationScores.score1 ?? 0;
  const score2 = playoffTurnState?.regulationScores.score2 ?? 0;
  const inSuddenDeath = playoffTurnState?.phase === "suddenDeath";
  const isComplete = playoffTurnState?.phase === "complete";
  const needsFirstThrowChoice = playoffTurnState?.needsFirstThrowChoice ?? false;
  const decidedByPlayerId = playoffTurnState?.decidedByPlayerId ?? playoffMatch.decidedByPlayerId;

  const p1Shots = Math.min(
    playoffShotsPerRound,
    throwEvents.filter(
      (e) =>
        e.eventType === "regular" && e.playerId === playoffMatch.player1Id,
    ).length,
  );
  const p2Shots = Math.min(
    playoffShotsPerRound,
    throwEvents.filter(
      (e) =>
        e.eventType === "regular" && e.playerId === playoffMatch.player2Id,
    ).length,
  );

  const handleSetStartingPlayer = async (startingPlayerId: string) => {
    if (!decidedByPlayerId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/playoffs/${matchId}/starting-player`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playoffMatchId: playoffMatch.playoffMatchId,
          startingPlayerId,
        }),
      });
      if (res.ok) onThrowAdded();
    } finally {
      setSubmitting(false);
    }
  };

  const handleThrow = async (score: number) => {
    const currentPlayerId = playoffTurnState?.currentPlayerId;
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
      if (res.ok) {
        onThrowAdded();
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setUndoError(data.error ?? "Cannot undo: a later playoff match already has throws");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isFinalProvisional =
    playoffMatch.stage === "final" && playoffMatch.status === "provisionalCompleted";
  const isFinalConfirmed =
    playoffMatch.stage === "final" && playoffMatch.status === "completed";
  const canUndo =
    throwEvents.length > 0 &&
    !needsFirstThrowChoice &&
    !isFinalConfirmed;

  const handleConfirmFinal = async () => {
    setSubmitting(true);
    setUndoError(null);
    try {
      const res = await fetch(`/api/playoffs/${matchId}/complete-final`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playoffMatchId: playoffMatch.playoffMatchId }),
      });
      if (res.ok) onThrowAdded();
      else {
        const data = await res.json().catch(() => ({}));
        setUndoError(data.error ?? "Failed to confirm");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stageLabel = (() => {
    switch (playoffMatch.stage) {
      case "qualifier1": return "Qualifier 1";
      case "qualifier2": return "Qualifier 2";
      case "eliminator": return "Eliminator";
      case "final": return "Final";
      default: return playoffMatch.stage;
    }
  })();

  return (
    <GlassCard className="border-primaryNeon/30 bg-gradient-to-br from-primaryNeon/5 to-transparent p-4 shadow-glowShadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
          Active match
        </p>
        <span className="text-[10px] font-semibold border border-primaryNeon/25 bg-primaryNeon/8 text-primaryNeon rounded-full px-2 py-0.5">
          {stageLabel}
        </span>
      </div>

      {/* Player scores — compact 2-col with VS divider */}
      <div className="flex items-stretch gap-2 mb-3">
        <div className="flex-1 min-w-0 rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2">
          <p className="text-[10px] font-medium truncate text-mutedForeground mb-0.5">{p1Name}</p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{score1}</p>
          <div className="mt-1.5">
            <ShotDots shotsTaken={p1Shots} shotsPerRound={playoffShotsPerRound} />
          </div>
        </div>
        <div className="flex items-center justify-center w-6 shrink-0">
          <span className="text-[10px] font-bold text-mutedForeground/50">VS</span>
        </div>
        <div className="flex-1 min-w-0 rounded-lg border border-glassBorder bg-surfaceSubtle px-3 py-2">
          <p className="text-[10px] font-medium truncate text-mutedForeground mb-0.5">{p2Name}</p>
          <p className="text-2xl font-bold tabular-nums text-foreground leading-none">{score2}</p>
          <div className="mt-1.5">
            <ShotDots shotsTaken={p2Shots} shotsPerRound={playoffShotsPerRound} />
          </div>
        </div>
      </div>

      {inSuddenDeath && (
        <p className="text-xs text-amber-400/90 mb-2">Sudden death</p>
      )}

      {needsFirstThrowChoice ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mutedForeground">
            First throw
          </p>
          <p className="text-xs text-mutedForeground -mt-1">
            {decidedByPlayerId &&
              `${playerName(matchPlayers, decidedByPlayerId)} chooses:`}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSetStartingPlayer(playoffMatch.player1Id)}
              disabled={submitting}
              className="rounded-button border border-primaryNeon/30 bg-primaryNeon/5 px-3 py-2 text-xs font-semibold text-primaryNeon hover:bg-primaryNeon/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {p1Name}
            </button>
            <button
              type="button"
              onClick={() => handleSetStartingPlayer(playoffMatch.player2Id)}
              disabled={submitting}
              className="rounded-button border border-primaryNeon/30 bg-primaryNeon/5 px-3 py-2 text-xs font-semibold text-primaryNeon hover:bg-primaryNeon/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {p2Name}
            </button>
          </div>
        </div>
      ) : isComplete ? (
        <div className="space-y-2">
          {isFinalProvisional && (
            <p className="text-xs text-mutedForeground">Provisional result</p>
          )}
          <p className="text-xs font-medium">
            Winner:{" "}
            <span className="text-foreground">
              {playoffTurnState?.winnerId &&
                playerName(matchPlayers, playoffTurnState.winnerId)}
            </span>
          </p>
          {isFinalProvisional && (
            <button
              type="button"
              onClick={handleConfirmFinal}
              disabled={submitting}
              className="rounded-button border border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              Match complete
            </button>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={submitting}
              className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              Undo last throw
            </button>
          )}
          {undoError && <p className="text-xs text-destructive">{undoError}</p>}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">
              Current turn
            </p>
            <p className="text-xs font-medium text-foreground">
              {playoffTurnState?.currentPlayerId &&
                playerName(matchPlayers, playoffTurnState.currentPlayerId)}
            </p>
          </div>
          <LastThrowIndicator
            lastScore={
              throwEvents.length > 0
                ? throwEvents[throwEvents.length - 1]?.score ?? null
                : null
            }
            className="mb-2"
          />
          <DartScoreInput
            onScore={(score) => handleThrow(score)}
            disabled={submitting}
          />
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={submitting}
              className="mt-2 w-full rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-xs font-medium text-mutedForeground hover:text-foreground hover:bg-surfaceSubtle transition-colors disabled:opacity-50"
            >
              Undo last throw
            </button>
          )}
          {undoError && <p className="mt-1 text-xs text-destructive">{undoError}</p>}
        </>
      )}

      {throwEvents.length > 0 && (
        <div className="mt-3 pt-3 border-t border-glassBorder">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-mutedForeground mb-1.5">
            Shot history
          </p>
          <PlayoffThrowHistory throwEvents={throwEvents} matchPlayers={matchPlayers} />
        </div>
      )}
    </GlassCard>
  );
}
