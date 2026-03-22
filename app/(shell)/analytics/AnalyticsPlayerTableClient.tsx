"use client";

import Link from "next/link";
import * as React from "react";
import type { PlayerAnalytics } from "@/lib/analytics/types";
import { GlassCard } from "@/components/GlassCard";
import { formatScore } from "@/lib/utils/dartScore";

const PAGE_SIZE = 10;
const PAGINATION_MIN = 10;

type Props = { players: PlayerAnalytics[] };

export function AnalyticsPlayerTableClient({ players }: Props) {
  const [page, setPage] = React.useState(0);
  const total = players.length;
  const showPagination = total >= PAGINATION_MIN;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const slice = showPagination
    ? players.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
    : players;
  const display = slice;

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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        {showPagination && (
          <nav
            className="flex items-center gap-2"
            aria-label="Analytics player table pagination"
          >
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-button border border-glassBorder bg-surfaceSubtle px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surfaceHover disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              Previous
            </button>
            <span className="text-sm text-mutedForeground tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-button border border-glassBorder bg-surfaceSubtle px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surfaceHover disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
            >
              Next
            </button>
          </nav>
        )}
      </div>
      <GlassCard className="overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-glassBorder">
              <th className="table-th text-left font-semibold text-foreground">Player</th>
              <th className="table-th text-right tabular-nums">Matches</th>
              <th className="table-th text-right tabular-nums">Wins</th>
              <th className="table-th text-right tabular-nums">Total pts</th>
              <th className="table-th text-right tabular-nums">Best throw</th>
              <th className="table-th text-right tabular-nums">Avg / round</th>
              <th className="table-th text-right tabular-nums">Throws</th>
            </tr>
          </thead>
          <tbody>
            {display.map((p) => (
              <tr
                key={p.playerId}
                className="border-b border-glassBorder/50 last:border-0 transition-colors hover:bg-surfaceSubtle"
              >
                <td className="table-td max-w-[12rem] truncate font-medium">
                  <Link
                    href={`/players/${p.playerId}`}
                    className="text-foreground hover:text-primaryNeon focus-ring rounded"
                  >
                    {p.playerName}
                  </Link>
                </td>
                <td className="table-td text-right tabular-nums text-foreground/80">
                  {p.matchesPlayed}
                </td>
                <td className="table-td text-right tabular-nums font-semibold text-foreground">
                  {p.wins}
                </td>
                <td className="table-td text-right tabular-nums text-foreground/80">
                  {formatScore(p.totalPoints)}
                </td>
                <td className="table-td text-right tabular-nums text-primaryNeon font-semibold">
                  {formatScore(p.bestThrow)}
                </td>
                <td className="table-td text-right tabular-nums text-foreground/80">
                  {formatScore(p.averageRoundScore)}
                </td>
                <td className="table-td text-right tabular-nums text-foreground/80">
                  {p.totalThrows}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
      <p className="text-xs text-mutedForeground">
        Same throw scope as Leaderboard (regular match + sudden death; no
        playoff throws).
      </p>
    </div>
  );
}
