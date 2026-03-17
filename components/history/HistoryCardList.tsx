"use client";

import Link from "next/link";
import * as React from "react";
import { ChevronRight, Search, Trophy } from "lucide-react";
import type { HistoryListItem } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";
import { useInfiniteReveal } from "@/hooks/useInfiniteReveal";

const CHUNK_SIZE = 10;

type HistoryCardListProps = {
  items: HistoryListItem[];
};

export function HistoryCardList({ items }: HistoryCardListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [visibleCount, setVisibleCount] = React.useState(CHUNK_SIZE);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.matchName.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const loadMore = React.useCallback(() => {
    setVisibleCount((n) => Math.min(filtered.length, n + CHUNK_SIZE));
  }, [filtered.length]);

  const sentinelRef = useInfiniteReveal(hasMore, loadMore);

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
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search by match name"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setVisibleCount(CHUNK_SIZE);
          }}
          className="w-full rounded-button border border-glassBorder bg-glassBackground py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-mutedForeground focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20 sm:max-w-xs"
          aria-label="Search history by match name"
        />
      </div>
      <StaggerChildren className="space-y-2" staggerDelay={0.04}>
      {visible.map((item) => {
        const date = item.completedAt ?? item.createdAt;
        const dateLabel = date
          ? new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" })
          : "—";
        const timeLabel = date
          ? new Date(date).toLocaleTimeString(undefined, { timeStyle: "short" })
          : null;
        const showWinner = item.isFullyComplete && item.championPlayerName;
        return (
          <StaggerChild key={item.matchId}>
            <Link href={`/history/${item.matchId}`} className="block">
              <GlassCard className="group p-4 transition-all hover:border-primaryNeon/30 hover:bg-surfaceSubtle">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.matchName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-mutedForeground">
                      <span>{dateLabel}</span>
                      {timeLabel != null && (
                        <span className="tabular-nums">{timeLabel}</span>
                      )}
                      <span>{item.playerCount} players</span>
                      {item.displayStatus === "playoffsPending" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                          Playoffs pending
                        </span>
                      )}
                      {item.hasPlayoffs && item.displayStatus === "complete" && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primaryNeon/30 bg-primaryNeon/8 px-2 py-0.5 text-xs font-semibold text-primaryNeon">
                          <Trophy size={10} aria-hidden />
                          Playoffs
                        </span>
                      )}
                      {showWinner && (
                        <span className="font-medium text-foreground">
                          Winner: {item.championPlayerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-mutedForeground group-hover:text-primaryNeon transition-colors">
                    View
                    <ChevronRight size={13} className="shrink-0" aria-hidden />
                  </span>
                </div>
              </GlassCard>
            </Link>
          </StaggerChild>
        );
      })}
      </StaggerChildren>
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex min-h-[24px] items-center justify-center py-3"
          aria-hidden
        >
          <span className="text-xs text-mutedForeground">Loading more…</span>
        </div>
      )}
    </div>
  );
}
