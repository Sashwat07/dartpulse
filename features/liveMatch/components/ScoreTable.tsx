"use client";

import { Fragment, useState } from "react";

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

  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  const currentRound = activeMatch?.currentRound ?? 1;
  const shotsPerRound = activeMatch?.shotsPerRound ?? 1;
  const totalRounds = activeMatch?.totalRounds ?? 1;
  const colSpan = table.roundNumbers.length + 2;

  if (table.rows.length === 0) {
    return (
      <GlassCard className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">Scoreboard</h2>
        <p className="text-sm text-mutedForeground">No players in match.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 overflow-x-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">Scoreboard</h2>
      <table className="w-full min-w-[320px] border-collapse">
        <thead>
          <tr className="border-b border-glassBorder text-left text-sm text-mutedForeground">
            <th className="px-3 py-2 font-medium">Player</th>
            {table.roundNumbers.map((r) => (
              <th
                key={r}
                className={
                  r === currentRound
                    ? "px-3 py-2 text-right font-semibold bg-primaryNeon/10 text-primaryNeon/90"
                    : "px-3 py-2 text-right font-medium"
                }
              >
                R{r}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold">Total</th>
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
            const isExpanded = expandedPlayerId === row.playerId;
            const detailId = `scoreboard-shot-history-${row.playerId}`;
            const handleToggle = () => {
              setExpandedPlayerId(isExpanded ? null : row.playerId);
            };
            return (
              <Fragment key={row.playerId}>
                <ScoreTableRow
                  row={row}
                  roundNumbers={table.roundNumbers}
                  currentRound={currentRound}
                  isCurrentPlayer={row.playerId === currentPlayerId}
                  shotsTaken={shotsTaken}
                  shotsPerRound={shotsPerRound}
                  isExpanded={isExpanded}
                  onToggle={handleToggle}
                  ariaControlsId={detailId}
                />
                {isExpanded && (
                  <tr key={`${row.playerId}-detail`} className="border-b border-glassBorder">
                    <td
                      colSpan={colSpan}
                      id={detailId}
                      className="px-3 py-2 bg-muted/20 align-top"
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
