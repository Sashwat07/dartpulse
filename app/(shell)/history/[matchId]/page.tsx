import Link from "next/link";
import { notFound } from "next/navigation";

import { LiquidButton } from "@/components/ui/LiquidButton";
import { Trophy } from "lucide-react";

import { MatchEnergyMeter } from "@/components/analytics/MatchEnergyMeter";
import { MomentumTimeline } from "@/components/analytics/MomentumTimeline";
import { RoundHeatmap } from "@/components/analytics/RoundHeatmap";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { HistoryScoreTable } from "@/components/history/HistoryScoreTable";
import { MatchOutcomeSummary } from "@/features/liveMatch/components/MatchOutcomeSummary";
import { PlayAgainButton } from "@/features/matchSetup/components/PlayAgainButton";
import { PlayoffBracketFromPayload } from "@/features/playoffs/components/PlayoffBracketFromPayload";
import type { PlayoffStage } from "@/types/playoff";
import {
  detectComeback,
  getClutchPerformance,
  getMatchEnergy,
  getMomentumTimeline,
  getRoundHeatmap,
} from "@/lib/analytics";
import { assertHistoryMatchViewable } from "@/lib/auth/matchAccess";
import {
  getChampionPlayerIdFromPayload,
  getMatchHistoryPayload,
} from "@/lib/matchHistory";
import { getLinkedPlayerByUserId, getMatchById } from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";
import { PLAYOFF_STATUSES } from "@/lib/repositories/matchRepository";

const BRACKET_STAGE_ORDER: PlayoffStage[] = [
  "qualifier1",
  "eliminator",
  "qualifier2",
  "final",
];

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchHistoryDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { matchId } = await params;

  const linked = await getLinkedPlayerByUserId(user.id);
  await assertHistoryMatchViewable(matchId, user.id, linked?.playerId ?? null);

  const payload = await getMatchHistoryPayload(matchId);
  if (payload === null) {
    const match = await getMatchById(matchId);
    const isPlayoffPending =
      match &&
      (match.status === "roundComplete" ||
        (PLAYOFF_STATUSES as readonly string[]).includes(match.status));
    if (isPlayoffPending) {
      const isOwner = match.createdByUserId === user.id;
      return (
        <PageTransition>
          <PageHeader
            title={match.name}
            description="Playoffs in progress. Complete the final and confirm to mark this match complete."
          />
          <div className="mt-4">
            <GlassCard className="p-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  <Trophy size={18} aria-hidden />
                  Playoffs pending
                </span>
                <p className="text-sm text-mutedForeground">
                  This match is not fully complete until you confirm the final result.
                </p>
                <LiquidButton asChild variant="brand" size="sm">
                  <Link href={`/playoffs/${matchId}`}>
                    {isOwner ? "Continue playoffs" : "View playoffs"}
                  </Link>
                </LiquidButton>
              </div>
            </GlassCard>
          </div>
        </PageTransition>
      );
    }
    notFound();
  }

  const championPlayerId = getChampionPlayerIdFromPayload(payload);
  const championName =
    championPlayerId != null
      ? payload.matchPlayers.find((p) => p.playerId === championPlayerId)?.name ??
        null
      : null;

  const {
    match,
    matchPlayers,
    matchOutcomeSummary,
    roundScoreTable,
    suddenDeathDisplay,
    shotHistoryDisplay,
    playoffMatches,
  } = payload;

  const completedAt = match.completedAt ?? match.createdAt;
  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : "—";

  const stageOrder = BRACKET_STAGE_ORDER.filter((s) =>
    playoffMatches.some((m) => m.stage === s),
  );

  const momentum = getMomentumTimeline(payload);
  const heatmap = getRoundHeatmap(payload);
  const matchEnergy = getMatchEnergy(payload);
  const comeback = detectComeback(payload);
  const clutch = getClutchPerformance(payload);
  const playerNames: Record<string, string> = Object.fromEntries(
    matchPlayers.map((p) => [p.playerId, p.name]),
  );

  const isOwner = match.createdByUserId === user.id;

  return (
    <PageTransition>
        <PageHeader
          title={match.name}
          description={`Completed ${dateLabel} · ${matchPlayers.length} players`}
        />

        <div className="mt-4 space-y-4">
        {/* Match info bar */}
        <div className="rounded-card border border-glassBorder overflow-hidden shadow-panelShadow bg-glassBackground backdrop-blur-[20px]">
          {/* Winner hero — only when there's a champion */}
          {championName != null && (
            <div className="relative flex items-center gap-4 px-6 py-4 overflow-hidden border-b border-amber-500/20 bg-amber-500/8">
              {/* Glow orb behind trophy */}
              <div
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full blur-xl opacity-30 pointer-events-none"
                style={{ background: "radial-gradient(circle, rgba(251,191,36,0.8), transparent)" }}
                aria-hidden
              />
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-amber-500/40 bg-amber-500/15">
                <Trophy size={16} className="text-championGold" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-championGold/60 mb-0.5">Champion</p>
                <p className="text-base font-black tracking-tight text-championGold truncate">{championName}</p>
              </div>
            </div>
          )}

          {/* Stat bar */}
          <div className="flex flex-wrap">
            {[
              { label: "Rounds", value: match.totalRounds },
              { label: "Shots / Round", value: match.shotsPerRound ?? 1 },
              ...(match.playoffShotsPerRound != null
                ? [{ label: "Playoff Shots", value: match.playoffShotsPerRound }]
                : []),
              { label: "Players", value: matchPlayers.length },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={`flex flex-col justify-center px-6 py-4 min-w-[100px] ${i > 0 ? "border-l border-glassBorder" : ""}`}
              >
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-mutedForeground mb-1">
                  {stat.label}
                </span>
                <span className="text-2xl font-black tabular-nums leading-none text-foreground">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome summary (final ranking + winner/qualification) */}
        <MatchOutcomeSummary summary={matchOutcomeSummary} />

        {isOwner && (
          <div>
            <PlayAgainButton
              sourceMatchId={matchId}
              label="Play again"
              variant="button"
            />
          </div>
        )}

        {/* Scoreboard (expandable rows show shot history inline) */}
        <HistoryScoreTable
          table={roundScoreTable}
          shotHistoryDisplay={shotHistoryDisplay}
          totalRounds={match.totalRounds}
        />

        {/* Sudden death (if present) */}
        {suddenDeathDisplay !== null && (
          <GlassCard className="overflow-x-auto p-0">
            <div className="px-5 pt-4 pb-3 border-b border-glassBorder">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">Sudden Death</h2>
            </div>
            <table className="w-full min-w-[200px] border-collapse">
              <thead>
                <tr className="border-b border-glassBorder text-left text-xs text-mutedForeground">
                  <th className="px-5 py-2.5 font-semibold">Player</th>
                  {suddenDeathDisplay.sdRoundNumbers.map((r, i) => (
                    <th
                      key={r}
                      className="px-3 py-2.5 text-right font-semibold"
                    >
                      SD{i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suddenDeathDisplay.rows.map((row) => (
                  <tr
                    key={row.playerId}
                    className="border-b border-glassBorder"
                  >
                    <td className="px-5 py-3 text-left text-sm font-medium">
                      {row.playerName}
                    </td>
                    {suddenDeathDisplay.sdRoundNumbers.map((r, i) => {
                      const score = row.roundScores[i] ?? 0;
                      return (
                        <td
                          key={r}
                          className="px-3 py-3 text-right text-sm tabular-nums"
                        >
                          {score > 0 ? score : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        )}

        {/* Match analytics (reuses same components as analytics page polish) */}
        <section className="space-y-2">
          <h2 className="section-heading">Match analytics</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <MomentumTimeline timeline={momentum} playerNames={playerNames} />
            <MatchEnergyMeter
              energyScore={matchEnergy.energyScore}
              leadChanges={matchEnergy.leadChanges}
              closeRounds={matchEnergy.closeRounds}
              clutchRoundShift={matchEnergy.clutchRoundShift}
            />
          </div>
          <RoundHeatmap
            players={heatmap.players}
            rounds={heatmap.rounds}
          />
        </section>
        {comeback.isComeback && (
          <GlassCard className="p-4 border-amber-500/20">
            <p className="text-sm font-medium text-amber-400/90">
              Comeback win — winner was last at some point in the match.
            </p>
          </GlassCard>
        )}
        {clutch.length > 0 && (
          <GlassCard className="p-0 overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-glassBorder">
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground">Clutch — Final Round</h2>
            </div>
            <ul className="divide-y divide-glassBorder/50">
              {clutch.map((c) => (
                <li key={c.playerId} className="flex items-center justify-between px-5 py-2.5 text-sm">
                  <span className="text-foreground/85 font-medium">{c.playerName}</span>
                  <span className="tabular-nums text-foreground/60">{c.averageFinalRoundScore} avg</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}

        {/* Playoff bracket (read-only: expandable cards, no active match) */}
        {playoffMatches.length > 0 && (
          <PlayoffBracketFromPayload
            matchId={matchId}
            playoffMatches={playoffMatches}
            matchPlayers={matchPlayers}
            stageOrder={stageOrder}
          />
        )}
        </div>
    </PageTransition>
  );
}
