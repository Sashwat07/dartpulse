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

  const stageLabel = playoffMatch.stage.replace(/([A-Z])/g, " $1").trim();

  return (
    <GlassCard className="border-primaryNeon/30 bg-surfaceSubtle p-4 shadow-glowShadow">
      <h2 className="text-base font-semibold uppercase tracking-wider text-primaryNeon">
        {stageLabel} — Active match
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-4 mb-4">
        <div className="min-w-0">
          <p className="font-medium truncate">{p1Name}</p>
          <ShotDots shotsTaken={p1Shots} shotsPerRound={playoffShotsPerRound} />
          <p className="text-2xl tabular-nums mt-1">{score1}</p>
        </div>
        <div>
          <p className="font-medium">{p2Name}</p>
          <ShotDots shotsTaken={p2Shots} shotsPerRound={playoffShotsPerRound} />
          <p className="text-2xl tabular-nums mt-1">{score2}</p>
        </div>
      </div>
      {inSuddenDeath && (
        <p className="text-sm text-amber-400/90 mb-2">Sudden death</p>
      )}
      {needsFirstThrowChoice ? (
        <div className="space-y-2">
          <p className="text-sm text-mutedForeground">
            {decidedByPlayerId &&
              `${playerName(matchPlayers, decidedByPlayerId)} chooses who throws first:`}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSetStartingPlayer(playoffMatch.player1Id)}
              disabled={submitting}
              className="rounded-button border border-glassBorder bg-glassBackground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {p1Name}
            </button>
            <button
              type="button"
              onClick={() => handleSetStartingPlayer(playoffMatch.player2Id)}
              disabled={submitting}
              className="rounded-button border border-glassBorder bg-glassBackground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
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
          <p className="text-sm font-medium">
            Winner:{" "}
            {playoffTurnState?.winnerId &&
              playerName(matchPlayers, playoffTurnState.winnerId)}
          </p>
          {isFinalProvisional && (
            <button
              type="button"
              onClick={handleConfirmFinal}
              disabled={submitting}
              className="rounded-button border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
            >
              Match complete
            </button>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={submitting}
              className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Undo last throw
            </button>
          )}
          {undoError && (
            <p className="text-sm text-destructive">{undoError}</p>
          )}
        </div>
      ) : (
        <>
          <p className="text-sm text-mutedForeground mb-2">
            Current turn:{" "}
            {playoffTurnState?.currentPlayerId &&
              playerName(matchPlayers, playoffTurnState.currentPlayerId)}
          </p>
          <LastThrowIndicator
            lastScore={
              throwEvents.length > 0
                ? throwEvents[throwEvents.length - 1]?.score ?? null
                : null
            }
            className="mb-3"
          />
          <div className="mb-3">
            <DartScoreInput
              onScore={(score) => handleThrow(score)}
              disabled={submitting}
            />
          </div>
          {canUndo && (
            <button
              type="button"
              onClick={handleUndo}
              disabled={submitting}
              className="mt-3 rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Undo last throw
            </button>
          )}
          {undoError && (
            <p className="text-sm text-destructive">{undoError}</p>
          )}
        </>
      )}
      {throwEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-glassBorder">
          <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-2">
            Shot history
          </p>
          <PlayoffThrowHistory throwEvents={throwEvents} matchPlayers={matchPlayers} />
        </div>
      )}
    </GlassCard>
  );
}
