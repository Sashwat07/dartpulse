"use client";

import { Fragment, useState, useEffect, useMemo } from "react";

import { PlayerShotHistoryContent } from "@/components/history/PlayerShotHistoryContent";
import { GlassCard } from "@/components/GlassCard";
import {
  selectActiveMatch,
  selectRoundScoreTable,
  selectShotHistoryDisplay,
  selectThrowEvents,
} from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { ScoreTableRow } from "./ScoreTableRow";

export function ScoreTable() {
  const table = useMatchStore(selectRoundScoreTable);
  const activeMatch = useMatchStore(selectActiveMatch);
  const throwEvents = useMatchStore(selectThrowEvents);
  const shotHistoryDisplay = useMatchStore(selectShotHistoryDisplay);
  const currentPlayerId = useMatchStore((s) => s.currentTurn?.playerId ?? null);

  const currentRound = activeMatch?.currentRound ?? 1;
  const shotsPerRound = activeMatch?.shotsPerRound ?? 1;
  const totalRounds = activeMatch?.totalRounds ?? 1;
  const colSpan = table.roundNumbers.length + 2;

  /**
   * Expansion state:
   * - Current player is always expanded unless they manually collapsed it.
   * - Other players can be freely toggled without affecting the current player.
   */
  const [manualExpandedIds, setManualExpandedIds] = useState<Set<string>>(new Set());
  const [currentPlayerCollapsed, setCurrentPlayerCollapsed] = useState(false);

  // When the active player changes, reset their collapsed state so they auto-expand.
  useEffect(() => {
    setCurrentPlayerCollapsed(false);
  }, [currentPlayerId]);

  const isExpanded = (playerId: string) =>
    manualExpandedIds.has(playerId) ||
    (playerId === currentPlayerId && !currentPlayerCollapsed);

  const handleToggle = (playerId: string) => {
    if (playerId === currentPlayerId) {
      setCurrentPlayerCollapsed((prev) => !prev);
      return;
    }
    setManualExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });
  };

  /**
   * Per-round heatmap: compute min/max score across all players for each
   * completed round, so cells can be tinted high (neon) → low (red).
   * Only applied to past rounds (r < currentRound).
   */
  const roundHeatmap = useMemo(() => {
    const map = new Map<number, { min: number; max: number }>();
    for (const r of table.roundNumbers) {
      if (r >= currentRound) continue; // only completed rounds
      const scores = table.rows.map((row) => row.roundScores[r - 1] ?? 0);
      const max = Math.max(...scores);
      if (max === 0) continue;
      map.set(r, { min: Math.min(...scores), max });
    }
    return map;
  }, [table, currentRound]);

  if (table.rows.length === 0) {
    return (
      <GlassCard className="p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground mb-3">Scoreboard</h2>
        <p className="text-sm text-mutedForeground">No players in match.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="overflow-x-auto p-0">
      <div className="px-5 pt-4 pb-3 border-b border-glassBorder">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">Scoreboard</h2>
      </div>
      <table className="w-full min-w-[320px] border-collapse">
        <thead>
          <tr className="border-b border-glassBorder text-left text-xs text-mutedForeground">
            <th className="px-4 py-2.5 font-semibold">Player</th>
            {table.roundNumbers.map((r) => (
              <th
                key={r}
                className={
                  r === currentRound
                    ? "px-3 py-2.5 text-right font-bold bg-primaryNeon/8 text-primaryNeon"
                    : "px-3 py-2.5 text-right font-medium"
                }
              >
                R{r}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right font-bold text-foreground/70">Total</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            const shotsTaken = Math.min(
              shotsPerRound,
              throwEvents.filter(
                (e) =>
                  e.eventType === "regular" &&
                  !e.playoffMatchId &&
                  e.roundNumber === currentRound &&
                  e.playerId === row.playerId,
              ).length,
            );

            // Build per-round heatmap intensities for this player
            const roundHeatIntensities: Record<number, number> = {};
            for (const [r, { min, max }] of roundHeatmap) {
              const score = row.roundScores[r - 1] ?? 0;
              roundHeatIntensities[r] =
                max === min ? 1 : (score - min) / (max - min);
            }

            const expanded = isExpanded(row.playerId);
            const detailId = `scoreboard-shot-history-${row.playerId}`;

            return (
              <Fragment key={row.playerId}>
                <ScoreTableRow
                  row={row}
                  roundNumbers={table.roundNumbers}
                  currentRound={currentRound}
                  isCurrentPlayer={row.playerId === currentPlayerId}
                  shotsTaken={shotsTaken}
                  shotsPerRound={shotsPerRound}
                  isExpanded={expanded}
                  onToggle={() => handleToggle(row.playerId)}
                  ariaControlsId={detailId}
                  roundHeatIntensities={roundHeatIntensities}
                />
                {expanded && (
                  <tr key={`${row.playerId}-detail`} className="border-b border-glassBorder">
                    <td
                      colSpan={colSpan}
                      id={detailId}
                      className="px-4 py-3 bg-surfaceSubtle align-top"
                    >
                      <PlayerShotHistoryContent
                        playerId={row.playerId}
                        shotHistoryDisplay={shotHistoryDisplay}
                        totalRounds={totalRounds}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </GlassCard>
  );
}
