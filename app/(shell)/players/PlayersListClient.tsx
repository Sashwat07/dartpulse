"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, Search } from "lucide-react";
import type { Player } from "@/types/player";
import { GlassCard } from "@/components/GlassCard";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 12;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "").toUpperCase() + (parts[1][0] ?? "").toUpperCase();
  }
  const s = name.trim().slice(0, 2);
  return s ? s.toUpperCase() : "?";
}

type Props = { players: Player[] };

export function PlayersListClient({ players }: Props) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mutedForeground"
          aria-hidden
        />
        <input
          type="search"
          placeholder="Search by player name"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full rounded-button border border-glassBorder bg-glassBackground py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-mutedForeground focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20 sm:max-w-xs"
          aria-label="Search players by name"
        />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((player) => (
          <li key={player.playerId}>
            <Link href={`/players/${player.playerId}`} className="block">
              <GlassCard className="group flex items-center gap-4 p-4 transition-all hover:border-primaryNeon/30 hover:bg-surfaceSubtle hover:shadow-glowShadow">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold tabular-nums transition-all"
                  style={{
                    backgroundColor: player.avatarColor
                      ? `${player.avatarColor}25`
                      : "var(--primaryNeon)15",
                    color: player.avatarColor ?? "var(--primaryNeon)",
                    boxShadow: player.avatarColor
                      ? `0 0 0 1px ${player.avatarColor}30`
                      : "0 0 0 1px rgba(0,229,255,0.2)",
                  }}
                  aria-hidden
                >
                  {getInitials(player.name)}
                </div>
                <span className="flex-1 truncate text-sm font-semibold text-foreground">
                  {player.name}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-mutedForeground transition-colors group-hover:text-primaryNeon">
                  Profile
                  <ArrowRight size={13} aria-hidden />
                </span>
              </GlassCard>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={safePage}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        itemLabel="players"
        onPageChange={handlePageChange}
      />
    </div>
  );
}
