"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Search } from "lucide-react";
import * as React from "react";
import type { GlobalLeaderboardEntry } from "@/lib/leaderboard/types";
import { GlassCard } from "@/components/GlassCard";
import { MOTION_SPRING_SUBTLE } from "@/lib/motionConstants";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;
const PAGINATION_MIN = 10;

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
  { key: "wins",          label: "Wins",    defaultDir: "desc" },
  { key: "podiums",       label: "Podiums", defaultDir: "desc" },
  { key: "averageFinish", label: "Avg finish", defaultDir: "asc" },
  { key: "averageRoundScore", label: "Avg / round", defaultDir: "desc" },
  { key: "bestThrow",    label: "Best throw", defaultDir: "desc" },
  { key: "totalPoints",  label: "Total pts",  defaultDir: "desc" },
];

/* Grid: rank # | player | 7 stat columns */
const GRID = "grid-cols-[40px_1fr_72px_72px_80px_80px_80px_88px_88px]";

function compareBy(
  a: GlobalLeaderboardEntry,
  b: GlobalLeaderboardEntry,
  key: SortKey,
  dir: SortDir,
): number {
  let diff = 0;
  switch (key) {
    case "matchesPlayed":   diff = a.matchesPlayed - b.matchesPlayed; break;
    case "wins":            diff = a.wins - b.wins; break;
    case "podiums":         diff = a.podiums - b.podiums; break;
    case "averageFinish":   diff = a.averageFinish - b.averageFinish; break;
    case "averageRoundScore": diff = a.averageRoundScore - b.averageRoundScore; break;
    case "bestThrow":       diff = a.bestThrow - b.bestThrow; break;
    case "totalPoints":     diff = a.totalPoints - b.totalPoints; break;
  }
  if (diff !== 0) return dir === "asc" ? diff : -diff;
  return a.playerName.localeCompare(b.playerName);
}

function formatScore(n: number) {
  if (!Number.isFinite(n) || n >= 900) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const RANK_ACCENT: Record<number, string> = {
  0: "var(--championGold)",
  1: "var(--rankSilver)",
  2: "var(--rankBronze)",
};
const RANK_BG: Record<number, string> = {
  0: "rgba(255,215,0,0.06)",
  1: "rgba(192,192,192,0.05)",
  2: "rgba(205,127,50,0.05)",
};

type Props = { entries: GlobalLeaderboardEntry[] };

export function LeaderboardTableClient({ entries }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>("wins");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [page, setPage] = React.useState(0);

  const handleSort = React.useCallback((key: SortKey) => {
    setSortKey((k) => {
      if (k === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        const col = SORTABLE_COLUMNS.find((c) => c.key === key);
        setSortDir(col?.defaultDir ?? "desc");
      }
      return key;
    });
    setPage(0);
  }, []);

  const sorted = React.useMemo(() => {
    const copy = [...entries];
    copy.sort((a, b) => compareBy(a, b, sortKey, sortDir));
    return copy;
  }, [entries, sortKey, sortDir]);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((e) => e.playerName.toLowerCase().includes(q));
  }, [sorted, searchQuery]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const showPagination = totalFiltered >= PAGINATION_MIN;
  const paginated = React.useMemo(() => {
    if (!showPagination) return filtered;
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page, showPagination]);

  const displayRows = showPagination ? paginated : filtered;

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
    <div className="space-y-3">
      {/* Search + pagination controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Search by player name"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full rounded-button border border-glassBorder bg-glassBackground py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-mutedForeground focus:outline-none focus:ring-2 focus:ring-primaryNeon/20 sm:w-64"
            aria-label="Search leaderboard by player name"
          />
        </div>
        {showPagination && (
          <nav className="flex items-center gap-2" aria-label="Leaderboard pagination">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-button bg-glassBackground px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:text-primaryNeon disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
              style={{ boxShadow: "var(--panelShadow)" }}
            >
              Previous
            </button>
            <span className="text-sm text-mutedForeground tabular-nums px-1">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-button bg-glassBackground px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:text-primaryNeon disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
              style={{ boxShadow: "var(--panelShadow)" }}
            >
              Next
            </button>
          </nav>
        )}
      </div>

      {/* Scrollable container — keeps column alignment on narrow viewports */}
      <div className="overflow-x-auto pb-1">
        <div className={cn("min-w-[680px] space-y-2")}>

          {/* Floating column header row */}
          <div className={cn("grid items-center gap-0 px-4 pb-1", GRID)}>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-mutedForeground text-center">#</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-mutedForeground pl-1">Player</span>
            {SORTABLE_COLUMNS.map(({ key, label }) => {
              const active = sortKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSort(key)}
                  className={cn(
                    "text-right text-[10px] font-bold uppercase tracking-[0.16em] transition-colors hover:text-foreground cursor-pointer select-none inline-flex items-center justify-end gap-0.5",
                    active ? "text-primaryNeon" : "text-mutedForeground",
                  )}
                  aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {label}
                  <span className={cn("opacity-50", active && "opacity-100")} aria-hidden>
                    {active ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Individual raised row-cards */}
          {displayRows.map((row, idx) => {
            const globalIndex = showPagination ? page * PAGE_SIZE + idx : idx;
            const accentColor = RANK_ACCENT[globalIndex];
            const bgTint = RANK_BG[globalIndex];

            return (
              <motion.div
                layout
                transition={MOTION_SPRING_SUBTLE}
                key={row.playerId}
                className={cn(
                  "group relative rounded-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5",
                )}
                style={{
                  background: bgTint
                    ? `color-mix(in srgb, var(--glassBackground) 94%, transparent), ${bgTint}`
                    : "var(--glassBackground)",
                  boxShadow: "var(--panelShadow)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "var(--panelShadow), 0 0 0 1px color-mix(in srgb, var(--primaryNeon) 18%, transparent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "var(--panelShadow)";
                }}
              >
                {/* Medal accent bar — left edge for top 3 */}
                {accentColor && (
                  <span
                    className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
                    style={{ background: accentColor }}
                    aria-hidden
                  />
                )}

                <div className={cn("grid items-center gap-0", GRID)}>
                  {/* Rank */}
                  <span
                    className={cn(
                      "text-center text-sm font-bold tabular-nums",
                      globalIndex === 0 ? "text-championGold" :
                      globalIndex === 1 ? "text-rankSilver" :
                      globalIndex === 2 ? "text-rankBronze" :
                      "text-mutedForeground",
                    )}
                  >
                    {globalIndex + 1}
                  </span>

                  {/* Player name */}
                  <span className="max-w-[12rem] truncate pl-1 font-semibold text-sm">
                    <Link
                      href={`/players/${row.playerId}`}
                      className="text-foreground hover:text-primaryNeon focus-ring rounded transition-colors"
                    >
                      {row.playerName}
                    </Link>
                  </span>

                  {/* Stat columns — right-aligned */}
                  <span className="text-right tabular-nums text-sm text-foreground/75">{row.matchesPlayed}</span>
                  <span className="text-right tabular-nums text-sm font-bold text-foreground">{row.wins}</span>
                  <span className="text-right tabular-nums text-sm text-foreground/75">{row.podiums}</span>
                  <span className="text-right tabular-nums text-sm text-foreground/75">{formatScore(row.averageFinish)}</span>
                  <span className="text-right tabular-nums text-sm text-foreground/75">
                    {row.averageRoundScore.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </span>
                  <span className="text-right tabular-nums text-sm font-semibold text-primaryNeon">
                    {row.bestThrow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-right tabular-nums text-sm text-foreground/75">
                    {row.totalPoints.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-mutedForeground leading-relaxed">
        Rankings use final match placement (incl. playoffs). Click a column
        header to sort; click again to toggle order. Same throw scope as
        Analytics (regular match + sudden death; no playoff throws).
      </p>
    </div>
  );
}
