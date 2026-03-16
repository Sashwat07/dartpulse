import { notFound } from "next/navigation";

import { MatchEnergyMeter } from "@/components/analytics/MatchEnergyMeter";
import { MomentumTimeline } from "@/components/analytics/MomentumTimeline";
import { RoundHeatmap } from "@/components/analytics/RoundHeatmap";
import { AppShell } from "@/components/AppShell";
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
import { getOwnedMatchOrThrow } from "@/lib/auth/ownership";
import { getMatchHistoryPayload } from "@/lib/matchHistory";
import { requireUser } from "@/lib/requireUser";

const BRACKET_STAGE_ORDER: PlayoffStage[] = [
  "qualifier1",
  "qualifier2",
  "eliminator",
  "final",
];

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchHistoryDetailPage({ params }: PageProps) {
  const user = await requireUser();
  const { matchId } = await params;

  await getOwnedMatchOrThrow(matchId, user.id);

  const payload = await getMatchHistoryPayload(matchId);
  if (payload === null) {
    notFound();
  }

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

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title={match.name}
          description={`Completed ${dateLabel} · ${matchPlayers.length} players`}
        />

        <div className="mt-6 space-y-8">
        {/* Match info */}
        <GlassCard className="p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
            Match info
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-mutedForeground">Rounds</dt>
              <dd>{match.totalRounds}</dd>
            </div>
            <div>
              <dt className="text-mutedForeground">Shots per round</dt>
              <dd>{match.shotsPerRound ?? 1}</dd>
            </div>
            {match.playoffShotsPerRound != null && (
              <div>
                <dt className="text-mutedForeground">Playoff shots per round</dt>
                <dd>{match.playoffShotsPerRound}</dd>
              </div>
            )}
          </dl>
        </GlassCard>

        {/* Outcome summary (final ranking + winner/qualification) */}
        <MatchOutcomeSummary summary={matchOutcomeSummary} />

        <div>
          <PlayAgainButton
            sourceMatchId={matchId}
            label="Play again"
            variant="button"
          />
        </div>

        {/* Scoreboard (expandable rows show shot history inline) */}
        <HistoryScoreTable
          table={roundScoreTable}
          shotHistoryDisplay={shotHistoryDisplay}
          totalRounds={match.totalRounds}
        />

        {/* Sudden death (if present) */}
        {suddenDeathDisplay !== null && (
          <GlassCard className="p-4 overflow-x-auto">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
              Sudden death
            </h2>
            <table className="w-full min-w-[200px] border-collapse">
              <thead>
                <tr className="border-b border-glassBorder text-left text-sm text-mutedForeground">
                  <th className="px-3 py-2 font-medium">Player</th>
                  {suddenDeathDisplay.sdRoundNumbers.map((r, i) => (
                    <th
                      key={r}
                      className="px-3 py-2 text-right font-medium"
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
                    <td className="px-3 py-2 text-left text-sm font-medium">
                      {row.playerName}
                    </td>
                    {suddenDeathDisplay.sdRoundNumbers.map((r, i) => {
                      const score = row.roundScores[i] ?? 0;
                      return (
                        <td
                          key={r}
                          className="px-3 py-2 text-right text-sm tabular-nums"
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
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
            Match analytics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
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
          <GlassCard className="p-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
              Clutch (final round)
            </h2>
            <ul className="space-y-1 text-sm">
              {clutch.map((c) => (
                <li key={c.playerId}>
                  {c.playerName}: {c.averageFinalRoundScore} avg
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
    </AppShell>
  );
}
