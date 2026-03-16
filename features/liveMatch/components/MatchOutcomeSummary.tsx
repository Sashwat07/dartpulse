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

  return (
    <GlassCard className="p-4 space-y-4 border-amber-500/20">
      <p className="text-sm font-semibold text-amber-400/90">Match complete</p>

      {/* A. Final Ranking */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          Final ranking
        </p>
        <ul className="space-y-1">
          {ranking.map(({ rank, playerName }) => (
            <li key={rank} className="text-sm">
              <span className="font-medium text-amber-500/90">Rank {rank}</span>
              <span className="ml-2">{playerName}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* B. Outcome */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Outcome
        </p>
        <p className="text-sm font-medium">
          {outcomeLabel}
          {winnerName != null && winnerName !== "" && (
            <span className="ml-2 text-amber-400">{winnerName}</span>
          )}
        </p>
      </section>

      {/* C. Pairing preview */}
      {(summary.finalPairing || summary.qualifier1Pairing || summary.qualifier2Pairing) && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Pairing preview
          </p>
          <ul className="space-y-1.5 text-sm">
            {summary.finalPairing && (
              <li>
                <span className="text-muted-foreground">Final:</span>{" "}
                {summary.finalPairing.player1Name} vs {summary.finalPairing.player2Name}
              </li>
            )}
            {summary.qualifier1Pairing && (
              <li>
                <span className="text-muted-foreground">Qualifier 1:</span>{" "}
                {summary.qualifier1Pairing.player1Name} vs {summary.qualifier1Pairing.player2Name}
              </li>
            )}
            {summary.qualifier2Pairing && (
              <li>
                <span className="text-muted-foreground">Qualifier 2:</span>{" "}
                {summary.qualifier2Pairing.player1Name} vs {summary.qualifier2Pairing.player2Name}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* D. Decision-right text */}
      {(decisionRights.final || decisionRights.qualifier1 || decisionRights.qualifier2) && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            First throw
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {decisionRights.final && (
              <li>
                {decisionRights.final.playerName} decides first throw for the final.
              </li>
            )}
            {decisionRights.qualifier1 && (
              <li>
                {decisionRights.qualifier1.playerName} decides first throw for Qualifier 1.
              </li>
            )}
            {decisionRights.qualifier2 && (
              <li>
                {decisionRights.qualifier2.playerName} decides first throw for Qualifier 2.
              </li>
            )}
          </ul>
        </section>
      )}
    </GlassCard>
  );
}
