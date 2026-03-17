import { AppShell } from "@/components/AppShell";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPlayers } from "@/lib/repositories";
import { PlayersListClient } from "./PlayersListClient";

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
            <PlayersListClient players={players} />
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}
