"use client";

import { Trophy, ArrowRight } from "lucide-react";
import type { MatchOutcomeSummary as MatchOutcomeSummaryType } from "@/types/dto";

type MatchOutcomeSummaryProps = {
  summary: MatchOutcomeSummaryType;
};

const RANK_MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/**
 * Presentational component for the completed-match outcome summary.
 * Renders final ranking, outcome block, pairing preview, and decision-right text.
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

  const hasPairings =
    summary.finalPairing || summary.qualifier1Pairing || summary.qualifier2Pairing;
  const hasDecisionRights =
    decisionRights.final || decisionRights.qualifier1 || decisionRights.qualifier2;

  const pairings = [
    summary.finalPairing && { label: "Final", ...summary.finalPairing },
    summary.qualifier1Pairing && { label: "Q1", ...summary.qualifier1Pairing },
    summary.qualifier2Pairing && { label: "Eliminator", ...summary.qualifier2Pairing },
  ].filter(Boolean) as { label: string; player1Name: string; player2Name: string }[];

  const decisions = [
    decisionRights.final && { label: "Final", ...decisionRights.final },
    decisionRights.qualifier1 && { label: "Q1", ...decisionRights.qualifier1 },
    decisionRights.qualifier2 && { label: "Eliminator", ...decisionRights.qualifier2 },
  ].filter(Boolean) as { label: string; playerName: string }[];

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-amber-500/15 bg-amber-500/8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
            <Trophy size={10} className="text-amber-400" />
          </span>
          <span className="text-xs font-black uppercase tracking-widest text-amber-400">
            League Matches Complete
          </span>
        </div>
        <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
          {outcomeLabel}
          {winnerName ? ` · ${winnerName}` : ""}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ── Rankings ── */}
        <div className="flex flex-wrap items-center gap-2">
          {ranking.map(({ rank, playerName }) => {
            const isFirst = rank === 1;
            return (
              <div
                key={rank}
                className={
                  isFirst
                    ? "inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/12 px-3 py-1.5"
                    : "inline-flex items-center gap-1.5 rounded-lg border border-glassBorder/60 bg-glassBackground px-2.5 py-1"
                }
              >
                <span
                  className={
                    isFirst
                      ? "text-sm font-black text-amber-400 tabular-nums"
                      : "text-[10px] font-bold text-mutedForeground/60 tabular-nums"
                  }
                >
                  {RANK_MEDAL[rank] ?? `#${rank}`}
                </span>
                <span
                  className={
                    isFirst
                      ? "text-sm font-bold text-amber-100"
                      : "text-xs font-medium text-foreground/75"
                  }
                >
                  {playerName}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Pairings + Decision rights ── */}
        {(hasPairings || hasDecisionRights) && (
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1 border-t border-amber-500/10">
            {pairings.map(({ label, player1Name, player2Name }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/50">
                  {label}
                </span>
                <span className="text-[11px] font-semibold text-foreground/80">
                  {player1Name}
                </span>
                <ArrowRight size={9} className="text-mutedForeground/40 shrink-0" />
                <span className="text-[11px] font-semibold text-foreground/80">
                  {player2Name}
                </span>
              </div>
            ))}
            {decisions.map(({ label, playerName }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/40">
                  {label} throw
                </span>
                <span className="text-[11px] font-medium text-foreground/60">
                  {playerName} decides
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
