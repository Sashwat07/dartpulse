import { GlassCard } from "@/components/GlassCard";
import { cn } from "@/utils/cn";

export type RoundHeatmapPlayer = {
  playerId: string;
  playerName: string;
};

export type RoundHeatmapRound = {
  round: number;
  scores: Record<string, number>;
};

type RoundHeatmapProps = {
  players: RoundHeatmapPlayer[];
  rounds: RoundHeatmapRound[];
};

/** Score tier for heatmap color scale (design-system chart tokens). */
type ScoreTier = "muted" | "secondary" | "primary" | "highlight";

function getScoreRange(rounds: RoundHeatmapRound[]): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  for (const r of rounds) {
    for (const v of Object.values(r.scores)) {
      if (typeof v === "number") {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
  }
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 0;
  return { min, max };
}

function getScoreTier(
  score: number,
  min: number,
  max: number,
): ScoreTier {
  if (min === max) return "primary";
  const range = max - min;
  const ratio = range > 0 ? (score - min) / range : 0;
  if (ratio <= 0.25) return "muted";
  if (ratio <= 0.5) return "secondary";
  if (ratio <= 0.75) return "primary";
  return "highlight";
}

/** Cell styles by score tier — chart tokens; opacity high enough to read heat clearly. */
const TIER_STYLES: Record<ScoreTier, string> = {
  muted: "bg-[#9CA3AF]/25 text-[#9CA3AF]",
  secondary: "bg-[#A855F7]/30 text-[#A855F7]",
  primary: "bg-primaryNeon/25 text-primaryNeon",
  highlight: "bg-championGold/30 text-championGold",
};

/**
 * Read-only round-by-round score heatmap. Uses chart token color scale;
 * table semantics preserved for accessibility.
 */
export function RoundHeatmap({ players, rounds }: RoundHeatmapProps) {
  if (rounds.length === 0 || players.length === 0) {
    return (
      <GlassCard className="min-w-0 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Round heatmap
        </h2>
        <p className="mt-3 text-sm text-mutedForeground break-words">No data.</p>
      </GlassCard>
    );
  }

  const { min, max } = getScoreRange(rounds);

  return (
    <GlassCard className="min-w-0 p-4 overflow-x-auto">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
          Round heatmap
        </h2>
        <p className="text-xs text-mutedForeground">
          Score per round. Color intensity by score (low → high).
        </p>
      </div>
      <div className="mt-4 min-w-0 overflow-x-auto">
        <table
          className="w-full min-w-[320px] border-collapse text-sm"
          role="table"
        >
          <thead>
            <tr className="border-b border-glassBorder text-left text-mutedForeground">
              <th scope="col" className="py-2.5 pr-3 font-medium">
                Player
              </th>
              {rounds.map((r) => (
                <th
                  key={r.round}
                  scope="col"
                  className="min-w-[2.75rem] py-2.5 pr-1 text-right font-medium tabular-nums"
                >
                  R{r.round}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.playerId}
                className="border-b border-glassBorder/80 last:border-0"
              >
                <td className="py-2 pr-3 font-medium text-foreground">
                  {player.playerName}
                </td>
                {rounds.map((r) => {
                  const value = r.scores[player.playerId];
                  const hasValue = value != null && typeof value === "number";
                  const tier = hasValue
                    ? getScoreTier(value, min, max)
                    : null;
                  return (
                    <td
                      key={r.round}
                      className="py-2 pr-1 text-right tabular-nums"
                    >
                      <span
                        className={cn(
                          "inline-block min-w-[2rem] rounded-button px-2 py-1 text-center font-semibold",
                          hasValue && tier
                            ? TIER_STYLES[tier]
                            : "text-mutedForeground",
                        )}
                      >
                        {hasValue ? value : "—"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
