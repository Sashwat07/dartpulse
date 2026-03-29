"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronRight, Search, Trophy, Users, Calendar } from "lucide-react";
import type { HistoryListItem } from "@/types/match";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;

/* Grid column definition — shared between header and each row-card */
const GRID = "grid-cols-[1fr_160px_148px_108px_64px]";

type HistoryCardListProps = {
  items: HistoryListItem[];
};

export function HistoryCardList({ items }: HistoryCardListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.matchName.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (items.length === 0) {
    return (
      <EmptyState
        title="No match history"
        description="Finish a match to see it here. Completed matches and playoffs in progress appear with scoreboard and analytics."
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mutedForeground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search by match name"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-button border border-glassBorder bg-glassBackground py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-mutedForeground focus:outline-none focus:ring-2 focus:ring-primaryNeon/20"
          aria-label="Search history by match name"
        />
      </div>

      {/* Column header row — desktop, sits above the card stack */}
      <div className={cn("hidden sm:grid gap-0 px-5 pb-1", GRID)}>
        {["Match", "Winner", "Date", "Players", "Action"].map((col, i) => (
          <span
            key={col}
            className={cn(
              "text-[10px] font-bold uppercase tracking-[0.16em] text-mutedForeground",
              i === 4 && "text-right",
            )}
          >
            {col}
          </span>
        ))}
      </div>

      {/* Individual raised row-cards */}
      <StaggerChildren className="space-y-2.5" staggerDelay={0.04}>
        {visible.map((item) => {
          const date = item.completedAt ?? item.createdAt;
          const dateLabel = date
            ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
            : "—";
          const timeLabel = date
            ? new Date(date).toLocaleTimeString(undefined, { timeStyle: "short" })
            : null;
          const showWinner = item.isFullyComplete && item.championPlayerName;

          return (
            <StaggerChild key={item.matchId}>
              <Link href={`/history/${item.matchId}`} className="group block">
                <div
                  className="rounded-card px-5 py-4 transition-all duration-200 group-hover:-translate-y-0.5"
                  style={{
                    background: "var(--glassBackground)",
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
                  {/* Desktop: aligned grid row */}
                  <div className={cn("hidden sm:grid items-center gap-0", GRID)}>
                    {/* Match name + badges */}
                    <div className="flex flex-wrap items-center gap-2 min-w-0 pr-3">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.matchName}
                      </span>
                      {item.displayStatus === "playoffsPending" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                          Playoffs pending
                        </span>
                      )}
                      {item.hasPlayoffs && item.displayStatus === "complete" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primaryNeon/30 bg-primaryNeon/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primaryNeon">
                          <Trophy size={9} aria-hidden />
                          Playoffs
                        </span>
                      )}
                    </div>

                    {/* Winner */}
                    <div className="flex items-center gap-1.5 pr-3">
                      {showWinner ? (
                        <>
                          <Trophy size={11} className="text-amber-500/70 shrink-0" aria-hidden />
                          <span className="text-xs font-medium text-foreground/85 truncate">
                            {item.championPlayerName}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-mutedForeground/35">—</span>
                      )}
                    </div>

                    {/* Date */}
                    <div className="flex flex-col pr-3">
                      <span className="text-xs text-foreground/80 tabular-nums">{dateLabel}</span>
                      {timeLabel && (
                        <span className="text-[11px] text-mutedForeground tabular-nums">{timeLabel}</span>
                      )}
                    </div>

                    {/* Players */}
                    <div className="flex items-center gap-1.5 pr-3">
                      <Users size={11} className="text-mutedForeground shrink-0" aria-hidden />
                      <span className="text-xs text-foreground/80">{item.playerCount} players</span>
                    </div>

                    {/* Action */}
                    <div className="flex justify-end">
                      <span className="flex items-center gap-0.5 text-xs font-semibold text-mutedForeground transition-colors group-hover:text-primaryNeon">
                        View
                        <ChevronRight size={13} className="shrink-0" aria-hidden />
                      </span>
                    </div>
                  </div>

                  {/* Mobile layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground">
                            {item.matchName}
                          </span>
                          {item.displayStatus === "playoffsPending" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-500">
                              Playoffs pending
                            </span>
                          )}
                          {item.hasPlayoffs && item.displayStatus === "complete" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primaryNeon/30 bg-primaryNeon/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primaryNeon">
                              <Trophy size={9} aria-hidden />
                              Playoffs
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-mutedForeground">
                          {showWinner && (
                            <span className="flex items-center gap-1">
                              <Trophy size={10} className="text-amber-500/70" aria-hidden />
                              <span className="font-medium text-foreground/80">{item.championPlayerName}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar size={10} aria-hidden />
                            {dateLabel}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users size={10} aria-hidden />
                            {item.playerCount} players
                          </span>
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-mutedForeground transition-colors group-hover:text-primaryNeon">
                        View
                        <ChevronRight size={13} className="shrink-0" aria-hidden />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerChild>
          );
        })}
      </StaggerChildren>

      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        itemLabel="matches"
        onPageChange={handlePageChange}
      />
    </div>
  );
}
