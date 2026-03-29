"use client";

import Link from "next/link";
import * as React from "react";
import type { PlayerAnalytics } from "@/lib/analytics/types";
import { GlassCard } from "@/components/GlassCard";
import { formatScore } from "@/lib/utils/dartScore";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 10;
const PAGINATION_MIN = 10;

/* Grid: player | matches | wins | total pts | best throw | avg/round | throws */
const GRID = "grid-cols-[1fr_72px_64px_88px_88px_88px_72px]";

type Props = { players: PlayerAnalytics[] };

export function AnalyticsPlayerTableClient({ players }: Props) {
  const [page, setPage] = React.useState(0);
  const total = players.length;
  const showPagination = total >= PAGINATION_MIN;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = showPagination
    ? players.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : players;

  if (players.length === 0) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-mutedForeground">
          No player participation in completed matches yet.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-2">
      {showPagination && (
        <div className="flex items-center justify-end gap-2">
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
        </div>
      )}

      {/* Scrollable wrapper for narrow viewports */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[580px] space-y-2">

          {/* Floating column header */}
          <div className={cn("grid items-center gap-0 px-4 pb-1", GRID)}>
            {[
              { label: "Player",     align: "left" },
              { label: "Matches",    align: "right" },
              { label: "Wins",       align: "right" },
              { label: "Total pts",  align: "right" },
              { label: "Best throw", align: "right" },
              { label: "Avg / round",align: "right" },
              { label: "Throws",     align: "right" },
            ].map(({ label, align }) => (
              <span
                key={label}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-[0.16em] text-mutedForeground",
                  align === "right" && "text-right",
                )}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Individual raised row-cards */}
          {slice.map((p) => (
            <div
              key={p.playerId}
              className="group rounded-card px-4 py-3 transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: "var(--glassBackground)", boxShadow: "var(--panelShadow)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "var(--panelShadow), 0 0 0 1px color-mix(in srgb, var(--primaryNeon) 18%, transparent)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "var(--panelShadow)";
              }}
            >
              <div className={cn("grid items-center gap-0", GRID)}>
                <span className="max-w-[14rem] truncate font-medium text-sm">
                  <Link
                    href={`/players/${p.playerId}`}
                    className="text-foreground hover:text-primaryNeon focus-ring rounded transition-colors"
                  >
                    {p.playerName}
                  </Link>
                </span>
                <span className="text-right tabular-nums text-sm text-foreground/80">{p.matchesPlayed}</span>
                <span className="text-right tabular-nums text-sm font-semibold text-foreground">{p.wins}</span>
                <span className="text-right tabular-nums text-sm text-foreground/80">{formatScore(p.totalPoints)}</span>
                <span className="text-right tabular-nums text-sm font-semibold text-primaryNeon">{formatScore(p.bestThrow)}</span>
                <span className="text-right tabular-nums text-sm text-foreground/80">{formatScore(p.averageRoundScore)}</span>
                <span className="text-right tabular-nums text-sm text-foreground/80">{p.totalThrows}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-mutedForeground">
        Same throw scope as Leaderboard (regular match + sudden death; no
        playoff throws).
      </p>
    </div>
  );
}
