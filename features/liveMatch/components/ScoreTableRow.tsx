"use client";

import type React from "react";
import { ShotDots } from "@/components/ShotDots";
import { ScorePulse } from "@/components/motion/ScorePulse";
import type { RoundScoreRow } from "@/store/selectors";
import { cn } from "@/utils/cn";

type ScoreTableRowProps = {
  row: RoundScoreRow;
  roundNumbers: number[];
  currentRound: number;
  isCurrentPlayer: boolean;
  shotsTaken?: number;
  shotsPerRound?: number;
  /** When set, row is expandable and shows expand trigger. */
  isExpanded?: boolean;
  onToggle?: () => void;
  ariaControlsId?: string;
  /** Normalized 0–1 intensity per completed round (1 = highest score, 0 = lowest). */
  roundHeatIntensities?: Record<number, number>;
};

export function ScoreTableRow({
  row,
  roundNumbers,
  currentRound,
  isCurrentPlayer,
  shotsTaken,
  shotsPerRound,
  isExpanded,
  onToggle,
  ariaControlsId,
  roundHeatIntensities,
}: ScoreTableRowProps) {
  const showDots =
    shotsPerRound != null && shotsTaken != null && shotsPerRound > 0;
  const isExpandable = onToggle != null && ariaControlsId != null;

  return (
    <tr
      role={isExpandable ? "button" : undefined}
      tabIndex={isExpandable ? 0 : undefined}
      aria-expanded={isExpandable ? isExpanded : undefined}
      aria-controls={isExpandable ? ariaControlsId : undefined}
      aria-label={
        isExpandable
          ? isExpanded
            ? `Hide shot history for ${row.playerName}`
            : `Show shot history for ${row.playerName}`
          : undefined
      }
      onClick={isExpandable ? onToggle : undefined}
      onKeyDown={
        isExpandable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle?.();
              }
            }
          : undefined
      }
      className={cn(
        "border-b border-glassBorder/60 transition-colors",
        isCurrentPlayer &&
          "border-l-2 border-l-primaryNeon bg-primaryNeon/5",
        isExpandable && "cursor-pointer hover:bg-surfaceSubtle",
      )}
    >
      <td className="px-4 py-3 text-left text-sm">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span
            className={cn(
              "font-medium truncate",
              isCurrentPlayer && "font-semibold text-foreground",
            )}
          >
            {row.playerName}
          </span>
          {showDots && (
            <ShotDots shotsTaken={shotsTaken} shotsPerRound={shotsPerRound} />
          )}
        </div>
      </td>
      {roundNumbers.map((r) => {
        const score = row.roundScores[r - 1] ?? 0;
        const isCurrentCol = r === currentRound;
        const cellContent = score > 0 ? score : "—";

        const intensity = !isCurrentCol ? roundHeatIntensities?.[r] : undefined;
        const heatStyle: React.CSSProperties | undefined =
          intensity !== undefined
            ? {
                backgroundColor:
                  intensity > 0.6
                    ? `rgba(0,229,255,${((intensity - 0.6) / 0.4 * 0.22).toFixed(3)})`
                    : intensity < 0.35
                      ? `rgba(239,68,68,${((0.35 - intensity) / 0.35 * 0.15).toFixed(3)})`
                      : undefined,
              }
            : undefined;

        return (
          <td
            key={r}
            style={heatStyle}
            className={cn(
              "px-3 py-3 text-right text-sm tabular-nums",
              isCurrentCol ? "bg-primaryNeon/8 font-semibold text-foreground" : "text-foreground/75",
            )}
          >
            {isCurrentCol && score > 0 ? (
              <ScorePulse trigger={score}>{cellContent}</ScorePulse>
            ) : (
              cellContent
            )}
          </td>
        );
      })}
      <td className="px-4 py-3 text-right text-sm font-bold tabular-nums text-foreground">
        {row.totalScore}
      </td>
    </tr>
  );
}
