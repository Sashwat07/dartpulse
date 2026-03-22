"use client";

import type { MatchOutcomeSummary as MatchOutcomeSummaryType } from "@/types/dto";
import { GlassCard } from "@/components/GlassCard";

type MatchOutcomeSummaryProps = {
  summary: MatchOutcomeSummaryType;
};

/**
 * Presentational component for the completed-match outcome summary.
 * Renders final ranking, outcome block, pairing preview, and decision-right text.
 * Data is presentation-ready (decisionRights include playerName).
 */
export function MatchOutcomeSummary({ summary }: MatchOutcomeSummaryProps) {
  const { ranking, outcomeType, decisionRights } = summary;

  const outcomeLabel =
    outcomeType === "winner"
      ? "Winner"
      : outcomeType === "finalQualification"
        ? "Qualified for Final"
        : "Qualified for Playoffs";

  const winnerName =
    outcomeType === "winner" && summary.winnerPlayerId
      ? ranking.find((r) => r.playerId === summary.winnerPlayerId)?.playerName ?? ""
      : null;

  const hasPairings = summary.finalPairing || summary.qualifier1Pairing || summary.qualifier2Pairing;
  const hasDecisionRights = decisionRights.final || decisionRights.qualifier1 || decisionRights.qualifier2;

  return (
    <GlassCard className="px-4 py-3 border-amber-500/20 space-y-2.5">
      {/* Header row: status + outcome */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-xs font-semibold text-amber-400/90 uppercase tracking-wide">
          Match complete
        </p>
        <span className="text-[10px] font-medium text-amber-500/70 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
          {outcomeLabel}
          {winnerName ? ` · ${winnerName}` : ""}
        </span>
      </div>

      {/* Ranking — horizontal chips */}
      <div className="flex flex-wrap gap-1.5">
        {ranking.map(({ rank, playerName }) => (
          <span
            key={rank}
            className="inline-flex items-center gap-1.5 rounded border border-glassBorder bg-surfaceSubtle px-2 py-0.5 text-xs"
          >
            <span className="font-semibold text-amber-500/80">#{rank}</span>
            <span className="text-foreground/90">{playerName}</span>
          </span>
        ))}
      </div>

      {/* Pairings + decision rights — compact rows */}
      {(hasPairings || hasDecisionRights) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mutedForeground">
          {summary.finalPairing && (
            <span>
              <span className="font-medium text-foreground/60">Final:</span>{" "}
              {summary.finalPairing.player1Name} vs {summary.finalPairing.player2Name}
            </span>
          )}
          {summary.qualifier1Pairing && (
            <span>
              <span className="font-medium text-foreground/60">Q1:</span>{" "}
              {summary.qualifier1Pairing.player1Name} vs {summary.qualifier1Pairing.player2Name}
            </span>
          )}
          {summary.qualifier2Pairing && (
            <span>
              <span className="font-medium text-foreground/60">Eliminator:</span>{" "}
              {summary.qualifier2Pairing.player1Name} vs {summary.qualifier2Pairing.player2Name}
            </span>
          )}
          {decisionRights.final && (
            <span>{decisionRights.final.playerName} decides first throw (final).</span>
          )}
          {decisionRights.qualifier1 && (
            <span>{decisionRights.qualifier1.playerName} decides first throw (Q1).</span>
          )}
          {decisionRights.qualifier2 && (
            <span>{decisionRights.qualifier2.playerName} decides first throw (eliminator).</span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
