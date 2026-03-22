"use client";

import { useState } from "react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { PlayoffTurnState } from "@/lib/playoffTurn";
import { ShotDots } from "@/components/ShotDots";
import { PlayoffThrowHistory } from "./PlayoffThrowHistory";
import { DartScoreInput } from "@/components/DartScoreInput";
import { LastThrowIndicator } from "@/components/DartScoreInput/LastThrowIndicator";
import { cn } from "@/utils/cn";

type ActivePlayoffMatchProps = {
  matchId: string;
  playoffMatch: PlayoffMatch;
  throwEvents: ThrowEvent[];
  matchPlayers: MatchPlayerWithDisplay[];
  totalRounds: number;
  playoffShotsPerRound: number;
  playoffTurnState?: PlayoffTurnState;
  onThrowAdded: () => void;
  /** When true the DartScoreInput is rendered elsewhere (e.g. right sidebar) */
  hideScoreInput?: boolean;
};

function playerName(players: MatchPlayerWithDisplay[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.name ?? playerId;
}

function playerInitial(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

function stageLabel(stage: PlayoffMatch["stage"]): string {
  switch (stage) {
    case "qualifier1":
      return "Qualifier 1 (1st vs 2nd)";
    case "eliminator":
      return "Eliminator (3rd vs 4th)";
    case "qualifier2":
      return "Qualifier 2";
    case "final":
      return "Final";
    default:
      return stage;
  }
}

export function ActivePlayoffMatch({
  matchId,
  playoffMatch,
  throwEvents,
  matchPlayers,
  playoffShotsPerRound,
  playoffTurnState,
  onThrowAdded,
  hideScoreInput = false,
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
  const currentPlayerId = playoffTurnState?.currentPlayerId;

  const p1Shots = Math.min(
    playoffShotsPerRound,
    throwEvents.filter(
      (e) => e.eventType === "regular" && e.playerId === playoffMatch.player1Id,
    ).length,
  );
  const p2Shots = Math.min(
    playoffShotsPerRound,
    throwEvents.filter(
      (e) => e.eventType === "regular" && e.playerId === playoffMatch.player2Id,
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
    throwEvents.length > 0 && !needsFirstThrowChoice && !isFinalConfirmed;

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

  return (
    <div className="rounded-xl border border-primaryNeon/25 bg-glassBackground overflow-hidden shadow-[0_0_24px_rgba(0,229,255,0.08)]">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-glassBorder/50 bg-primaryNeon/5">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primaryNeon animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-primaryNeon">
            Active Match
          </span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/60 border border-glassBorder/50 rounded-full px-2 py-0.5">
          {stageLabel(playoffMatch.stage)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Player score tiles */}
        <div className="grid grid-cols-2 gap-2">
          {/* Player 1 tile */}
          <div
            className={cn(
              "rounded-xl border p-3 transition-colors",
              currentPlayerId === playoffMatch.player1Id && !isComplete && !needsFirstThrowChoice
                ? "border-primaryNeon/40 bg-primaryNeon/8"
                : "border-glassBorder/60 bg-surfaceSubtle/50",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="h-7 w-7 shrink-0 rounded-full bg-primaryNeon/20 border border-primaryNeon/30 flex items-center justify-center text-[11px] font-black text-primaryNeon">
                {playerInitial(p1Name)}
              </span>
              <span className="truncate text-xs font-semibold text-foreground/80">{p1Name}</span>
              {currentPlayerId === playoffMatch.player1Id && !isComplete && !needsFirstThrowChoice && (
                <span className="ml-auto shrink-0 text-[8px] font-black uppercase text-primaryNeon tracking-wider">
                  UP
                </span>
              )}
            </div>
            <p className="text-3xl font-black tabular-nums leading-none text-foreground">{score1}</p>
            <div className="mt-2">
              <ShotDots shotsTaken={p1Shots} shotsPerRound={playoffShotsPerRound} />
            </div>
          </div>

          {/* Player 2 tile */}
          <div
            className={cn(
              "rounded-xl border p-3 transition-colors",
              currentPlayerId === playoffMatch.player2Id && !isComplete && !needsFirstThrowChoice
                ? "border-amber-400/40 bg-amber-500/8"
                : "border-glassBorder/60 bg-surfaceSubtle/50",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="h-7 w-7 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[11px] font-black text-amber-400">
                {playerInitial(p2Name)}
              </span>
              <span className="truncate text-xs font-semibold text-foreground/80">{p2Name}</span>
              {currentPlayerId === playoffMatch.player2Id && !isComplete && !needsFirstThrowChoice && (
                <span className="ml-auto shrink-0 text-[8px] font-black uppercase text-amber-400 tracking-wider">
                  UP
                </span>
              )}
            </div>
            <p className="text-3xl font-black tabular-nums leading-none text-foreground">{score2}</p>
            <div className="mt-2">
              <ShotDots shotsTaken={p2Shots} shotsPerRound={playoffShotsPerRound} />
            </div>
          </div>
        </div>

        {inSuddenDeath && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/8 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wide">Sudden Death</p>
          </div>
        )}

        {/* State: needs first throw choice */}
        {needsFirstThrowChoice ? (
          <div className="rounded-xl border border-glassBorder/60 bg-surfaceSubtle/30 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50 mb-1">
              First throw decision
            </p>
            {decidedByPlayerId && (
              <p className="text-sm font-semibold text-foreground mb-3">
                {playerName(matchPlayers, decidedByPlayerId)}{" "}
                <span className="text-mutedForeground font-normal">chooses who throws first</span>
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSetStartingPlayer(playoffMatch.player1Id)}
                disabled={submitting}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-primaryNeon/25 bg-primaryNeon/5 px-3 py-3 text-center transition-all hover:border-primaryNeon/50 hover:bg-primaryNeon/10 active:scale-[0.97] disabled:opacity-40"
              >
                <span className="h-8 w-8 rounded-full bg-primaryNeon/20 border border-primaryNeon/30 flex items-center justify-center text-xs font-black text-primaryNeon">
                  {playerInitial(p1Name)}
                </span>
                <span className="text-xs font-bold text-foreground/90 truncate max-w-full">{p1Name}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-primaryNeon/60 group-hover:text-primaryNeon transition-colors">
                  Throws first
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSetStartingPlayer(playoffMatch.player2Id)}
                disabled={submitting}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-3 text-center transition-all hover:border-amber-400/50 hover:bg-amber-500/10 active:scale-[0.97] disabled:opacity-40"
              >
                <span className="h-8 w-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400">
                  {playerInitial(p2Name)}
                </span>
                <span className="text-xs font-bold text-foreground/90 truncate max-w-full">{p2Name}</span>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-400/60 group-hover:text-amber-400 transition-colors">
                  Throws first
                </span>
              </button>
            </div>
          </div>
        ) : isComplete ? (
          /* Match complete state */
          <div className="rounded-xl border border-glassBorder/60 bg-surfaceSubtle/30 p-4 space-y-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50 mb-1">
                Result
              </p>
              <p className="text-sm font-semibold text-foreground">
                Winner:{" "}
                <span className="text-championGold">
                  {playoffTurnState?.winnerId &&
                    playerName(matchPlayers, playoffTurnState.winnerId)}
                </span>
              </p>
              {isFinalProvisional && (
                <p className="text-xs text-mutedForeground/60 mt-0.5">Provisional result — confirm to lock in</p>
              )}
            </div>
            {isFinalProvisional && (
              <button
                type="button"
                onClick={handleConfirmFinal}
                disabled={submitting}
                className="w-full rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-400 hover:bg-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                Confirm match complete
              </button>
            )}
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
            {undoError && <p className="text-xs text-destructive">{undoError}</p>}
          </div>
        ) : (
          /* Active scoring state */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50">
                Current turn
              </p>
              {currentPlayerId && (
                <span className="text-xs font-bold text-foreground">
                  {playerName(matchPlayers, currentPlayerId)}
                </span>
              )}
            </div>
            {!hideScoreInput && (
              <>
                <LastThrowIndicator
                  lastScore={
                    throwEvents.length > 0 ? throwEvents[throwEvents.length - 1]?.score ?? null : null
                  }
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
                    className="w-full rounded-lg border border-glassBorder/60 bg-glassBackground px-3 py-2 text-xs font-medium text-mutedForeground hover:text-foreground hover:border-glassBorder transition-colors disabled:opacity-40"
                  >
                    Undo last throw
                  </button>
                )}
                {undoError && <p className="text-xs text-destructive">{undoError}</p>}
              </>
            )}
            {hideScoreInput && (
              <p className="text-[10px] text-mutedForeground/50 italic">Score input is in the sidebar →</p>
            )}
          </div>
        )}

        {/* Shot history */}
        {throwEvents.length > 0 && (
          <div className="pt-3 border-t border-glassBorder/40">
            <p className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50 mb-2">
              Shot history
            </p>
            <PlayoffThrowHistory throwEvents={throwEvents} matchPlayers={matchPlayers} />
          </div>
        )}
      </div>
    </div>
  );
}
