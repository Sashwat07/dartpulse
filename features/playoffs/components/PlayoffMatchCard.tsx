"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { PlayoffThrowHistory } from "./PlayoffThrowHistory";

type PlayoffMatchCardProps = {
  matchId: string;
  playoffMatch: PlayoffMatch;
  matchPlayers: MatchPlayerWithDisplay[];
  isActive: boolean;
  isExpanded: boolean;
  onExpandToggle: () => void;
  onRefresh: () => void;
  /** When true (e.g. history page), Undo is not shown. */
  readOnly?: boolean;
  /** When true (final confirmed via "Match complete"), Undo is disabled for entire bracket. */
  finalConfirmed?: boolean;
};

function playerName(players: MatchPlayerWithDisplay[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.name ?? playerId;
}

function stageLabel(stage: PlayoffMatch["stage"]): string {
  return stage.replace(/([A-Z])/g, " $1").trim();
}

function matchTypeLabel(stage: PlayoffMatch["stage"]): string {
  if (stage === "qualifier1" || stage === "qualifier2") return "Qualifier";
  if (stage === "eliminator") return "Eliminator";
  return "Final";
}

export function PlayoffMatchCard({
  matchId,
  playoffMatch,
  matchPlayers,
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
  const winnerName =
    winnerId ? playerName(matchPlayers, winnerId) : null;

  const p1IsWinner = winnerId === playoffMatch.player1Id;
  const p2IsWinner = winnerId === playoffMatch.player2Id;

  const canShowUndo =
    throwEvents.length > 0 && !readOnly && !finalConfirmed;

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
        "rounded-card border p-3 transition-colors cursor-pointer",
        isActive
          ? "border-primaryNeon/50 bg-primaryNeon/5 shadow-[0_0_12px_rgba(0,229,255,0.12)]"
          : "border-glassBorder bg-surfaceSubtle",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
        {matchTypeLabel(playoffMatch.stage)} — {stageLabel(playoffMatch.stage)}
      </p>
      <div className="mt-3 space-y-1.5">
          <div
            className={cn(
              "flex items-center justify-between rounded px-2 py-1.5",
              p1IsWinner &&
                "border-l-2 border-l-championGold bg-championGold/10 font-semibold text-championGold",
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {p1IsWinner && <Check size={14} className="shrink-0" aria-hidden />}
              {p1Name}
            </span>
            {playoffMatch.player1Score != null && (
              <span className="tabular-nums text-mutedForeground">{playoffMatch.player1Score}</span>
            )}
          </div>
          <div
            className={cn(
              "flex items-center justify-between rounded px-2 py-1.5",
              p2IsWinner &&
                "border-l-2 border-l-championGold bg-championGold/10 font-semibold text-championGold",
            )}
          >
            <span className="flex items-center gap-2 truncate">
              {p2IsWinner && <Check size={14} className="shrink-0" aria-hidden />}
              {p2Name}
            </span>
            {playoffMatch.player2Score != null && (
              <span className="tabular-nums text-mutedForeground">{playoffMatch.player2Score}</span>
            )}
          </div>
        </div>
        {isFinished && winnerName && (
          <p className="mt-2 text-xs text-mutedForeground">
            Winner: <span className="font-medium text-championGold">{winnerName}</span>
            {playoffMatch.status === "provisionalCompleted" && (
              <span className="ml-1">(provisional)</span>
            )}
          </p>
        )}
        {playoffMatch.status === "active" && (
          <p className="mt-2 text-xs text-primaryNeon">In progress</p>
        )}

        {isExpanded && (
          <div
            id={expandedRegionId}
            role="region"
            aria-labelledby={expandTriggerId}
            className="mt-3 pt-3 border-t border-glassBorder"
            onClick={(e) => e.stopPropagation()}
          >
            {loadingThrows ? (
            <p className="text-sm text-mutedForeground">Loading throw history…</p>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-mutedForeground mb-1.5">
                Shot history
              </p>
              {throwEvents.length === 0 ? (
                <p className="text-sm text-mutedForeground">No throws recorded</p>
              ) : (
                <PlayoffThrowHistory
                  throwEvents={throwEvents}
                  matchPlayers={matchPlayers}
                  compact
                />
              )}
              {!readOnly && canShowUndo && (
                <div className="mt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUndo}
                    disabled={undoSubmitting}
                    className="rounded-button border border-glassBorder bg-glassBackground"
                  >
                    Undo last throw
                  </Button>
                </div>
              )}
              {undoError && (
                <p className="mt-2 text-sm text-destructive">{undoError}</p>
              )}
            </>
          )}
          </div>
        )}
    </div>
  );
}
