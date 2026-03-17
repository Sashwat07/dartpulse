"use client";

import Link from "next/link";
import { ChevronRight, Trophy } from "lucide-react";
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
    <StaggerChildren className="space-y-2" staggerDelay={0.04}>
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
                      {item.hasPlayoffs && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-primaryNeon/30 bg-primaryNeon/8 px-2 py-0.5 text-xs font-semibold text-primaryNeon">
                          <Trophy size={10} aria-hidden />
                          Playoffs
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
  );
}
