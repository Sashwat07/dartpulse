import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { GlassCard } from "@/components/GlassCard";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPlayers } from "@/lib/repositories";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] ?? "").toUpperCase() + (parts[1][0] ?? "").toUpperCase();
  }
  const s = name.trim().slice(0, 2);
  return s ? s.toUpperCase() : "?";
}

export default async function PlayersPage() {
  const players = await listPlayers();

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="Players"
          description="View profiles, stats, and achievements."
        />
        <div className="mt-8">
          {players.length === 0 ? (
            <EmptyState
              title="No players yet"
              description="Create players when you start a new match, or add them from match setup."
            />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {players.map((player) => (
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
                      <span className="flex-1 truncate font-semibold text-foreground text-sm">
                        {player.name}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-mutedForeground group-hover:text-primaryNeon transition-colors">
                        Profile
                        <ArrowRight size={13} aria-hidden />
                      </span>
                    </GlassCard>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
