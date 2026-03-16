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
        <div className="mt-6">
        {players.length === 0 ? (
          <EmptyState
            title="No players yet"
            description="Create players when you start a new match, or add them from match setup."
          />
        ) : (
          <ul className="space-y-3">
            {players.map((player) => (
              <li key={player.playerId}>
                <Link href={`/players/${player.playerId}`} className="block">
                  <GlassCard className="group flex items-center justify-between gap-4 p-4 transition-colors hover:border-primaryNeon/40 hover:bg-surfaceSubtle">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums text-foreground"
                        style={{
                          backgroundColor: player.avatarColor
                            ? `${player.avatarColor}30`
                            : "var(--primaryNeon)20",
                          color: player.avatarColor ?? "var(--primaryNeon)",
                        }}
                        aria-hidden
                      >
                        {getInitials(player.name)}
                      </div>
                      <span className="truncate font-medium text-foreground">
                        {player.name}
                      </span>
                    </div>
                    <span className="flex shrink-0 items-center gap-2 text-sm font-medium text-mutedForeground group-hover:text-primaryNeon">
                      View profile
                      <ArrowRight size={14} aria-hidden />
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
