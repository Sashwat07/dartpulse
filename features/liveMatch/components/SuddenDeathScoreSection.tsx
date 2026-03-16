"use client";

import { selectActiveMatch, selectSuddenDeathScoreDisplay } from "@/store/selectors";
import { useMatchStore } from "@/store/useMatchStore";
import { GlassCard } from "@/components/GlassCard";

function getName(matchPlayers: { playerId: string; name: string }[], playerId: string): string {
  return matchPlayers.find((p) => p.playerId === playerId)?.name ?? playerId;
}

/**
 * Sudden-death score display: separate from the regular rounds scoreboard.
 * Shows resolved ranks so far, still-tied players, and each tied player's score per SD round.
 * Regular-match sudden death only (this component is not used for playoff SD).
 */
export function SuddenDeathScoreSection() {
  const display = useMatchStore(selectSuddenDeathScoreDisplay);
  const suddenDeathState = useMatchStore((s) => s.suddenDeathState);
  const matchPlayers = useMatchStore((s) => s.matchPlayers);
  const activeMatch = useMatchStore(selectActiveMatch);

  const inSuddenDeath = suddenDeathState && !suddenDeathState.isResolved;
  const isRegularMatchSd = suddenDeathState?.stage === "suddenDeath";
  const showSection = display !== null || inSuddenDeath;

  if (!showSection) return null;

  const totalRounds = activeMatch?.totalRounds ?? 1;
  const resolvedRanks = suddenDeathState?.resolvedRanksSoFar ?? [];
  const stillTiedIds = suddenDeathState?.tiedPlayerIds ?? [];

  return (
    <GlassCard className="p-4 overflow-x-auto border-amber-500/20">
      <h2 className="text-sm font-medium text-amber-400/90 mb-3">Sudden death</h2>

      {isRegularMatchSd && (resolvedRanks.length > 0 || stillTiedIds.length > 0) && (
        <div className="mb-4 space-y-3">
          {resolvedRanks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-1.5">
                Resolved ranks so far
              </p>
              <ul className="space-y-1 text-sm">
                {resolvedRanks
                  .slice()
                  .sort((a, b) => a.rank - b.rank)
                  .map(({ rank, playerId }) => (
                    <li key={playerId}>
                      <span className="font-medium text-amber-500/90">{rank}.</span>{" "}
                      {getName(matchPlayers, playerId)}
                    </li>
                  ))}
              </ul>
            </div>
          )}
          {stillTiedIds.length > 0 && (
            <div>
              <p className="text-xs font-medium text-mutedForeground uppercase tracking-wide mb-1.5">
                Still tied
              </p>
              <p className="text-sm">
                {stillTiedIds.map((id) => getName(matchPlayers, id)).join(", ")}
              </p>
            </div>
          )}
        </div>
      )}

      {display === null ? (
        <p className="text-sm text-mutedForeground">
          {inSuddenDeath ? "Scores will appear as each player throws." : "No sudden-death throws yet."}
        </p>
      ) : display.rows.length === 0 ? (
        <p className="text-sm text-mutedForeground">Scores will appear as each player throws.</p>
      ) : (
        <table className="w-full min-w-[240px] border-collapse">
          <thead>
            <tr className="border-b border-glassBorder text-left text-sm text-mutedForeground">
              <th className="px-3 py-2 font-medium">Player</th>
              {display.sdRoundNumbers.map((r) => (
                <th key={r} className="px-3 py-2 text-right font-medium">
                  SD{r - totalRounds}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {display.rows.map((row) => (
              <tr key={row.playerId} className="border-b border-glassBorder/50 text-sm">
                <td className="px-3 py-2 font-medium">{row.playerName}</td>
                {display.sdRoundNumbers.map((r, i) => (
                  <td key={r} className="px-3 py-2 text-right tabular-nums">
                    {row.roundScores[i] > 0 ? row.roundScores[i] : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </GlassCard>
  );
}
