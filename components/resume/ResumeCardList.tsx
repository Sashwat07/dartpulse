"use client";

import Link from "next/link";
import * as React from "react";
import { Play, Search } from "lucide-react";
import type { MatchStatus } from "@/types/match";
import type { ResumableMatchListItem } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";
import { useInfiniteReveal } from "@/hooks/useInfiniteReveal";

const CHUNK_SIZE = 10;

function matchStatusLabel(status: MatchStatus): string {
  const labels: Record<MatchStatus, string> = {
    matchCreated: "Created",
    matchStarted: "In progress",
    roundActive: "In progress",
    roundComplete: "In progress",
    playoffPhase: "Playoffs",
    qualifier1Active: "Playoffs",
    qualifier2Active: "Playoffs",
    eliminatorActive: "Playoffs",
    finalActive: "Playoffs",
    matchFinished: "Complete",
  };
  return labels[status] ?? status;
}

function matchStatusColor(status: MatchStatus): string {
  if (status === "playoffPhase" || status.includes("Active")) {
    return "border-primaryNeon/30 bg-primaryNeon/8 text-primaryNeon";
  }
  return "border-glassBorder bg-surfaceSubtle text-mutedForeground";
}

type ResumeCardListProps = {
  items: ResumableMatchListItem[];
};

export function ResumeCardList({ items }: ResumeCardListProps) {
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

  const sentinelRef = useInfiniteReveal(hasMore, loadMore, {
    layoutCheckDeps: [visibleCount, filtered.length],
  });

  if (items.length === 0) {
    return (
      <EmptyState
        title="No matches in progress"
        description="Start a new match or return here after you begin one. Matches in progress appear here until they're completed."
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
          aria-label="Search resume by match name"
        />
      </div>
      <StaggerChildren className="space-y-2" staggerDelay={0.04}>
      {visible.map((item) => {
        const href =
          item.resumeTo === "playoffs"
            ? `/playoffs/${item.matchId}`
            : `/match/${item.matchId}`;
        const dateLabel = item.createdAt
          ? new Date(item.createdAt).toLocaleDateString(undefined, {
              dateStyle: "medium",
            })
          : "—";
        return (
          <StaggerChild key={item.matchId}>
            <Link href={href} className="block">
              <GlassCard className="group p-4 transition-all hover:border-primaryNeon/30 hover:bg-surfaceSubtle">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {item.matchName}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-mutedForeground">
                      <span>{item.playerCount} players</span>
                      <span>{dateLabel}</span>
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${matchStatusColor(item.status)}`}>
                        {matchStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  {/* Liquid glass CTA pill — sits inside the card Link */}
                  <span
                    className={`relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                      item.canResume
                        ? "text-primaryNeon group-hover:scale-[1.04]"
                        : "text-mutedForeground group-hover:scale-[1.03]"
                    }`}
                    style={{
                      boxShadow: item.canResume
                        ? "0 0 8px rgba(0,0,0,0.03),0 2px 6px rgba(0,0,0,0.08),inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.14),inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.9),inset 1px 1px 1px -0.5px rgba(255,255,255,0.65),inset -1px -1px 1px -0.5px rgba(255,255,255,0.65),inset 0 0 6px 6px rgba(255,255,255,0.10),inset 0 0 2px 2px rgba(255,255,255,0.06),0 0 16px rgba(0,229,255,0.12)"
                        : "0 0 8px rgba(0,0,0,0.03),0 2px 6px rgba(0,0,0,0.08),inset 3px 3px 0.5px -3.5px rgba(255,255,255,0.08),inset -3px -3px 0.5px -3.5px rgba(255,255,255,0.5),inset 1px 1px 1px -0.5px rgba(255,255,255,0.35),inset -1px -1px 1px -0.5px rgba(255,255,255,0.35),inset 0 0 6px 6px rgba(255,255,255,0.06),inset 0 0 2px 2px rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* Backdrop glass distortion layer */}
                    <span
                      aria-hidden
                      className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
                      style={{ backdropFilter: 'url("#dartpulse-liquid-glass")' }}
                    />
                    <Play size={12} className="relative z-10 shrink-0" aria-hidden />
                    <span className="relative z-10">{item.canResume ? "Continue" : "View"}</span>
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
