"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronRight, Search, Trophy, Users, Calendar } from "lucide-react";
import type { HistoryListItem } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;

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
    <div className="space-y-4">
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
          className="w-full rounded-button border border-glassBorder bg-glassBackground py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-mutedForeground focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20"
          aria-label="Search history by match name"
        />
      </div>

      <GlassCard className="overflow-hidden p-0">
        {/* Column headers — desktop only, pinned inside the card */}
        <div className="hidden sm:grid grid-cols-[1fr_160px_148px_108px_64px] gap-0 border-b border-glassBorder bg-surfaceMuted px-5 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">Match</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">Winner</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">Date</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground">Players</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mutedForeground text-right">Action</span>
        </div>

        <StaggerChildren staggerDelay={0.035}>
          {visible.map((item, idx) => {
            const date = item.completedAt ?? item.createdAt;
            const dateLabel = date
              ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "—";
            const timeLabel = date
              ? new Date(date).toLocaleTimeString(undefined, { timeStyle: "short" })
              : null;
            const showWinner = item.isFullyComplete && item.championPlayerName;
            const isLast = idx === visible.length - 1;

            return (
              <StaggerChild key={item.matchId}>
                <Link
                  href={`/history/${item.matchId}`}
                  className={cn(
                    "group block px-5 py-3.5 transition-colors hover:bg-surfaceHover",
                    !isLast && "border-b border-glassBorder/50",
                  )}
                >
                  {/* Desktop: grid row aligned to header columns */}
                  <div className="hidden sm:grid grid-cols-[1fr_160px_148px_108px_64px] items-center gap-0">
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
                </Link>
              </StaggerChild>
            );
          })}
        </StaggerChildren>
      </GlassCard>

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
