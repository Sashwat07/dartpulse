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
  if (items.length === 0) {
    return (
      <EmptyState
        title="No matches in progress"
        description="Start a new match or return here after you begin one. Matches in progress appear here until they're completed."
      />
    );
  }

  return (
    <StaggerChildren className="space-y-2" staggerDelay={0.04}>
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
                  <span className="flex shrink-0 items-center gap-1.5 rounded-button border border-primaryNeon/40 bg-primaryNeon/10 px-3 py-1.5 text-xs font-semibold text-primaryNeon group-hover:bg-primaryNeon/20 transition-colors">
                    <Play size={12} className="shrink-0" aria-hidden />
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
