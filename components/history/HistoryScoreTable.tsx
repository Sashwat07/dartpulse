"use client";

import { Fragment, useState } from "react";

import type { RoundScoreTable } from "@/lib/roundScoreTable";
import type { ShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import { GlassCard } from "@/components/GlassCard";
import { PlayerShotHistoryContent } from "@/components/history/PlayerShotHistoryContent";
import { cn } from "@/utils/cn";

type HistoryScoreTableProps = {
  table: RoundScoreTable;
  /** When provided, rows become expandable with inline shot history. */
  shotHistoryDisplay?: ShotHistoryDisplay;
  totalRounds?: number;
};

/**
 * Read-only score table for history detail. When shotHistoryDisplay and totalRounds
 * are provided, each row is expandable to show that player's shot history inline.
 */
export function HistoryScoreTable({
  table,
  shotHistoryDisplay,
  totalRounds = 1,
}: HistoryScoreTableProps) {
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const isExpandable = shotHistoryDisplay != null;
  const colSpan = table.roundNumbers.length + 2;

  if (table.rows.length === 0) {
    return (
      <GlassCard className="p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
          Scoreboard
        </h2>
        <p className="text-sm text-mutedForeground">No players in match.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-4 overflow-x-auto">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
        Scoreboard
      </h2>
      <table className="w-full min-w-[320px] border-collapse">
        <thead>
          <tr className="border-b border-glassBorder text-left text-sm text-mutedForeground">
            <th className="px-3 py-2 font-medium">Player</th>
            {table.roundNumbers.map((r) => (
              <th
                key={r}
                className="px-3 py-2 text-right font-medium"
              >
                R{r}
              </th>
            ))}
            <th className="px-3 py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => {
            const isExpanded = expandedPlayerId === row.playerId;
            const detailId = `history-scoreboard-shot-history-${row.playerId}`;
            const handleToggle = () => {
              setExpandedPlayerId(isExpanded ? null : row.playerId);
            };
            return (
              <Fragment key={row.playerId}>
                <tr
                  role={isExpandable ? "button" : undefined}
                  tabIndex={isExpandable ? 0 : undefined}
                  aria-expanded={isExpandable ? isExpanded : undefined}
                  aria-controls={isExpandable ? detailId : undefined}
                  aria-label={
                    isExpandable
                      ? isExpanded
                        ? `Hide shot history for ${row.playerName}`
                        : `Show shot history for ${row.playerName}`
                      : undefined
                  }
                  onClick={isExpandable ? handleToggle : undefined}
                  onKeyDown={
                    isExpandable
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleToggle();
                          }
                        }
                      : undefined
                  }
                  className={cn(
                    "border-b border-glassBorder",
                    isExpandable && "cursor-pointer hover:bg-surfaceSubtle/50",
                  )}
                >
                  <td className="px-3 py-2 text-left text-sm font-medium">
                    <span>{row.playerName}</span>
                  </td>
                  {table.roundNumbers.map((r) => {
                    const score = row.roundScores[r - 1] ?? 0;
                    return (
                      <td
                        key={r}
                        className="px-3 py-2 text-right text-sm tabular-nums"
                      >
                        {score > 0 ? score : "—"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">
                    {row.totalScore}
                  </td>
                </tr>
                {isExpandable && isExpanded && shotHistoryDisplay && (
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
