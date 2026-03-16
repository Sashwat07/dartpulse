"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { CompletedMatchListItem } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";

type HistoryCardListProps = {
  items: CompletedMatchListItem[];
};

export function HistoryCardList({ items }: HistoryCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No completed matches"
        description="Finish a match to see it here. Completed matches appear with scoreboard, playoffs, and analytics."
      />
    );
  }

  return (
    <StaggerChildren className="space-y-3" staggerDelay={0.04}>
      {items.map((item) => {
        const date = item.completedAt ?? item.createdAt;
        const dateLabel = date
          ? new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" })
          : "—";
        const timeLabel = date
          ? new Date(date).toLocaleTimeString(undefined, { timeStyle: "short" })
          : null;
        return (
          <StaggerChild key={item.matchId}>
            <Link href={`/history/${item.matchId}`} className="block">
              <GlassCard className="group p-4 transition-colors hover:border-primaryNeon/40 hover:bg-surfaceSubtle">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {item.matchName}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-mutedForeground">
                      <span>{dateLabel}</span>
                      {timeLabel != null && (
                        <span className="tabular-nums">{timeLabel}</span>
                      )}
                      <span>{item.playerCount} players</span>
                      {item.hasPlayoffs && (
                        <span className="rounded-full border border-primaryNeon/40 bg-primaryNeon/10 px-2.5 py-1 text-xs font-medium text-primaryNeon">
                          Playoffs
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-mutedForeground group-hover:text-primaryNeon">
                    View
                    <ChevronRight size={14} className="shrink-0" aria-hidden />
                  </span>
                </div>
              </GlassCard>
            </Link>
          </StaggerChild>
        );
      })}
    </StaggerChildren>
  );
}
