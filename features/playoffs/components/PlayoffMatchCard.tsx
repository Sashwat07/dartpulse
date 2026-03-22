"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import { cn } from "@/utils/cn";
import { PlayoffThrowHistory } from "./PlayoffThrowHistory";

type PlayoffMatchCardProps = {
  matchId: string;
  playoffMatch: PlayoffMatch;
  matchPlayers: MatchPlayerWithDisplay[];
  matchNumber?: string;
  isActive: boolean;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onRefresh: () => void;
  readOnly?: boolean;
  finalConfirmed?: boolean;
};

function playerInitial(name: string): string {
  return name.slice(0, 1).toUpperCase();
}

function playerName(players: MatchPlayerWithDisplay[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.name ?? playerId;
}

export function PlayoffMatchCard({
  matchId,
  playoffMatch,
  matchPlayers,
  matchNumber,
  isActive,
  isExpanded,
  onExpandToggle,
  onRefresh,
  readOnly = false,
  finalConfirmed = false,
}: PlayoffMatchCardProps) {
  const [throwEvents, setThrowEvents] = useState<ThrowEvent[]>([]);
  const [loadingThrows, setLoadingThrows] = useState(false);
  const [undoSubmitting, setUndoSubmitting] = useState(false);
  const [undoError, setUndoError] = useState<string | null>(null);

  useEffect(() => {
    if (!isExpanded || !playoffMatch.playoffMatchId) return;
    setLoadingThrows(true);
    setUndoError(null);
    fetch(
      `/api/playoffs/${matchId}/throws?playoffMatchId=${encodeURIComponent(playoffMatch.playoffMatchId)}`,
    )
      .then((res) => (res.ok ? res.json() : Promise.resolve({ throwEvents: [] })))
      .then((data: { throwEvents?: ThrowEvent[] }) =>
        setThrowEvents(Array.isArray(data.throwEvents) ? data.throwEvents : []),
      )
      .finally(() => setLoadingThrows(false));
  }, [matchId, playoffMatch.playoffMatchId, isExpanded]);

  const p1Name = playerName(matchPlayers, playoffMatch.player1Id);
  const p2Name = playerName(matchPlayers, playoffMatch.player2Id);
  const winnerId = playoffMatch.winnerId;
  const isFinished =
    playoffMatch.status === "completed" ||
    (playoffMatch.stage === "final" && playoffMatch.status === "provisionalCompleted");

  const p1IsWinner = winnerId === playoffMatch.player1Id;
  const p2IsWinner = winnerId === playoffMatch.player2Id;

  const canShowUndo = throwEvents.length > 0 && !readOnly && !finalConfirmed;

  const handleUndo = async () => {
    setUndoSubmitting(true);
    setUndoError(null);
    try {
      const res = await fetch(`/api/playoffs/${matchId}/throws/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playoffMatchId: playoffMatch.playoffMatchId }),
      });
      if (res.ok) {
        onRefresh();
        setThrowEvents((prev) => prev.slice(0, -1));
      } else if (res.status === 409 || res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setUndoError(data.error ?? "Cannot undo");
      }
    } finally {
      setUndoSubmitting(false);
    }
  };

  const expandTriggerId = `playoff-card-expand-${playoffMatch.playoffMatchId}`;
  const expandedRegionId = `playoff-card-content-${playoffMatch.playoffMatchId}`;

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onExpandToggle();
    }
  };

  return (
    <div
      id={expandTriggerId}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-controls={expandedRegionId}
      aria-label={isExpanded ? "Collapse match details" : "Expand match details"}
      onClick={onExpandToggle}
      onKeyDown={handleCardKeyDown}
      className={cn(
        "rounded-xl border cursor-pointer transition-all duration-150 min-w-[200px] select-none",
        isActive
          ? "border-primaryNeon/40 bg-surfaceSubtle/80 shadow-[0_0_18px_rgba(0,229,255,0.12)]"
          : isFinished
            ? "border-glassBorder/60 bg-glassBackground/60"
            : "border-glassBorder/80 bg-glassBackground",
      )}
    >
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-glassBorder/40">
        <span className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50">
          {matchNumber ? `MATCH #${matchNumber}` : "MATCH"}
        </span>
        <div className="flex items-center gap-1.5">
          {isActive && (
            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-primaryNeon">
              <span className="h-1.5 w-1.5 rounded-full bg-primaryNeon animate-pulse" />
              LIVE
            </span>
          )}
          {isFinished && !isActive && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-championGold/60">
              Done
            </span>
          )}
        </div>
      </div>

      {/* Players */}
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Player 1 */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
            p1IsWinner
              ? "bg-championGold/8 border border-championGold/20"
              : "border border-transparent",
          )}
        >
          <span className="h-6 w-6 shrink-0 rounded-full bg-primaryNeon/15 border border-primaryNeon/25 flex items-center justify-center text-[9px] font-black text-primaryNeon">
            {playerInitial(p1Name)}
          </span>
          <span
            className={cn(
              "flex-1 truncate text-xs font-semibold leading-none",
              p1IsWinner ? "text-championGold" : "text-foreground/90",
            )}
          >
            {p1Name}
          </span>
          {p1IsWinner && (
            <Trophy size={10} className="shrink-0 text-championGold" aria-hidden />
          )}
          {playoffMatch.player1Score != null && (
            <span className="tabular-nums text-xs font-bold text-mutedForeground shrink-0">
              {playoffMatch.player1Score}
            </span>
          )}
        </div>

        {/* Player 2 */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
            p2IsWinner
              ? "bg-championGold/8 border border-championGold/20"
              : "border border-transparent",
          )}
        >
          <span className="h-6 w-6 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-[9px] font-black text-amber-400">
            {playerInitial(p2Name)}
          </span>
          <span
            className={cn(
              "flex-1 truncate text-xs font-semibold leading-none",
              p2IsWinner ? "text-championGold" : "text-foreground/90",
            )}
          >
            {p2Name}
          </span>
          {p2IsWinner && (
            <Trophy size={10} className="shrink-0 text-championGold" aria-hidden />
          )}
          {playoffMatch.player2Score != null && (
            <span className="tabular-nums text-xs font-bold text-mutedForeground shrink-0">
              {playoffMatch.player2Score}
            </span>
          )}
        </div>
      </div>

      {/* Expanded: throw history */}
      {isExpanded && (
        <div
          id={expandedRegionId}
          role="region"
          aria-labelledby={expandTriggerId}
          className="px-3 pb-3 border-t border-glassBorder/40 pt-2.5"
          onClick={(e) => e.stopPropagation()}
        >
          {loadingThrows ? (
            <p className="text-xs text-mutedForeground">Loading…</p>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50 mb-2">
                Shot history
              </p>
              {throwEvents.length === 0 ? (
                <p className="text-xs text-mutedForeground/60 italic">No throws recorded</p>
              ) : (
                <PlayoffThrowHistory
                  throwEvents={throwEvents}
                  matchPlayers={matchPlayers}
                  compact
                />
              )}
              {!readOnly && canShowUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={undoSubmitting}
                  className="mt-3 w-full rounded-lg border border-glassBorder/60 bg-glassBackground px-3 py-1.5 text-[11px] font-medium text-mutedForeground hover:text-foreground hover:border-glassBorder transition-colors disabled:opacity-40"
                >
                  Undo last throw
                </button>
              )}
              {undoError && (
                <p className="mt-1.5 text-xs text-destructive">{undoError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
