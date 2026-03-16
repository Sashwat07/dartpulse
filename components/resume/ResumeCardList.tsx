"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import type { MatchStatus } from "@/types/match";
import type { ResumableMatchListItem } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StaggerChild, StaggerChildren } from "@/components/motion/StaggerChildren";

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

type ResumeCardListProps = {
  items: ResumableMatchListItem[];
};

export function ResumeCardList({ items }: ResumeCardListProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No matches in progress"
        description="Start a new match or return here after you begin one. Matches in progress appear here until they’re completed."
      />
    );
  }

  return (
    <StaggerChildren className="space-y-3" staggerDelay={0.04}>
      {items.map((item) => {
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
              <GlassCard className="group p-4 transition-colors hover:border-primaryNeon/40 hover:bg-surfaceSubtle">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-foreground truncate">
                      {item.matchName}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-mutedForeground">
                      <span>{item.playerCount} players</span>
                      <span>{dateLabel}</span>
                      <span className="rounded-full border border-glassBorder bg-surfaceSubtle px-2.5 py-1 text-xs font-medium text-mutedForeground">
                        {matchStatusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  <span className="flex shrink-0 items-center gap-1.5 rounded-button border border-primaryNeon/50 bg-primaryNeon/10 px-3 py-1.5 text-sm font-semibold text-primaryNeon group-hover:bg-primaryNeon/20">
                    <Play size={14} className="shrink-0" aria-hidden />
                    Continue
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
