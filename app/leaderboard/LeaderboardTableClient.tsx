"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import * as React from "react";
import type { GlobalLeaderboardEntry } from "@/lib/leaderboard/types";
import { GlassCard } from "@/components/GlassCard";
import { MOTION_SPRING_SUBTLE } from "@/lib/motionConstants";
import { cn } from "@/utils/cn";

type SortKey =
  | "matchesPlayed"
  | "wins"
  | "podiums"
  | "averageFinish"
  | "averageRoundScore"
  | "bestThrow"
  | "totalPoints";
type SortDir = "asc" | "desc";

const SORTABLE_COLUMNS: { key: SortKey; label: string; defaultDir: SortDir }[] = [
  { key: "matchesPlayed", label: "Matches", defaultDir: "desc" },
  { key: "wins", label: "Wins", defaultDir: "desc" },
  { key: "podiums", label: "Podiums", defaultDir: "desc" },
  { key: "averageFinish", label: "Avg finish", defaultDir: "asc" },
  { key: "averageRoundScore", label: "Avg / round", defaultDir: "desc" },
  { key: "bestThrow", label: "Best throw", defaultDir: "desc" },
  { key: "totalPoints", label: "Total pts", defaultDir: "desc" },
];

function compareBy(
  a: GlobalLeaderboardEntry,
  b: GlobalLeaderboardEntry,
  key: SortKey,
  dir: SortDir,
): number {
  let diff = 0;
  switch (key) {
    case "matchesPlayed":
      diff = a.matchesPlayed - b.matchesPlayed;
      break;
    case "wins":
      diff = a.wins - b.wins;
      break;
    case "podiums":
      diff = a.podiums - b.podiums;
      break;
    case "averageFinish":
      diff = a.averageFinish - b.averageFinish;
      break;
    case "averageRoundScore":
      diff = a.averageRoundScore - b.averageRoundScore;
      break;
    case "bestThrow":
      diff = a.bestThrow - b.bestThrow;
      break;
    case "totalPoints":
      diff = a.totalPoints - b.totalPoints;
      break;
  }
  if (diff !== 0) return dir === "asc" ? diff : -diff;
  return a.playerName.localeCompare(b.playerName);
}

function formatScore(n: number) {
  if (!Number.isFinite(n) || n >= 900) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const RANK_1_STYLE =
  "border-l-2 border-l-championGold bg-championGold/5 shadow-[0_0_12px_rgba(255,215,0,0.2)]";
const RANK_2_STYLE =
  "border-l-2 border-l-[#C0C0C0] bg-[#C0C0C0]/5";
const RANK_3_STYLE =
  "border-l-2 border-l-[#CD7F32] bg-[#CD7F32]/5";

function getRankRowStyle(rankIndex: number): string {
  if (rankIndex === 0) return RANK_1_STYLE;
  if (rankIndex === 1) return RANK_2_STYLE;
  if (rankIndex === 2) return RANK_3_STYLE;
  return "border-l-2 border-l-transparent";
}

type Props = { entries: GlobalLeaderboardEntry[] };

export function LeaderboardTableClient({ entries }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>("wins");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const handleSort = React.useCallback((key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      const col = SORTABLE_COLUMNS.find((c) => c.key === key);
      setSortDir(col?.defaultDir ?? "desc");
      setSortKey(key);
    }
  }, [sortKey]);

  const sorted = React.useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => compareBy(a, b, sortKey, sortDir));
    return copy;
  }, [entries, sortKey, sortDir]);

  if (entries.length === 0) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-mutedForeground">
          No completed matches yet. Finish a match to see global standings.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-glassBorder text-mutedForeground">
              <th className="w-12 px-3 py-3 text-center font-semibold tabular-nums">#</th>
              <th className="px-3 py-3 font-medium">Player</th>
              {SORTABLE_COLUMNS.map(({ key, label }) => {
                const active = sortKey === key;
                return (
                  <th
                    key={key}
                    className={cn(
                      "px-3 py-3 text-right font-medium tabular-nums",
                      "cursor-pointer select-none hover:text-foreground",
                      active && "text-foreground",
                    )}
                    onClick={() => handleSort(key)}
                    scope="col"
                    aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <span
                        className={cn(
                          "text-xs opacity-70",
                          active && "opacity-100",
                        )}
                        aria-hidden
                      >
                        {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <motion.tr
                layout
                transition={MOTION_SPRING_SUBTLE}
                key={row.playerId}
                className={cn(
                  "border-b border-glassBorder/60 last:border-0",
                  getRankRowStyle(i),
                )}
              >
                <td
                  className={cn(
                    "px-3 py-2.5 text-center text-base font-semibold tabular-nums",
                    i < 3
                      ? i === 0
                        ? "text-championGold"
                        : i === 1
                          ? "text-[#C0C0C0]"
                          : "text-[#CD7F32]"
                      : "text-mutedForeground",
                  )}
                >
                  {i + 1}
                </td>
                <td className="max-w-[12rem] truncate px-3 py-2.5 font-medium">
                  <Link
                    href={`/players/${row.playerId}`}
                    className="text-foreground hover:text-primaryNeon focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] rounded"
                  >
                    {row.playerName}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.matchesPlayed}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.wins}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.podiums}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {formatScore(row.averageFinish)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.averageRoundScore.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.bestThrow.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {row.totalPoints.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className="text-xs text-mutedForeground">
        Rankings use final match placement (incl. playoffs). Click a column
        header to sort; click again to toggle order. Same throw scope as
        Analytics (regular match + sudden death; no playoff throws).
      </p>
    </div>
  );
}
