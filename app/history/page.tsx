import { getMatchChampion } from "@/lib/matchHistory";
import {
  listOwnedHistoryMatches,
  listPlayers,
} from "@/lib/repositories";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/requireUser";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { HistoryCardList } from "@/components/history/HistoryCardList";

export default async function HistoryPage() {
  const user = await requireUser();
  const rawItems = await listOwnedHistoryMatches(user.id);
  const completedItems = rawItems.filter((i) => i.isFullyComplete);
  const [champions, players] = await Promise.all([
    Promise.all(completedItems.map((i) => getMatchChampion(i.matchId))),
    listPlayers(),
  ]);
  const playerNames = new Map(players.map((p) => [p.playerId, p.name]));
  const items = rawItems.map((item) => {
    if (!item.isFullyComplete) return item;
    const idx = completedItems.findIndex((c) => c.matchId === item.matchId);
    const championId = idx >= 0 ? champions[idx] ?? null : null;
    return {
      ...item,
      championPlayerId: championId ?? undefined,
      championPlayerName: championId ? playerNames.get(championId) : undefined,
    };
  });

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="Match History"
          description="Completed matches and playoffs in progress. Click to view scoreboard, playoffs, and analytics."
        />
        <div className="mt-6">
          <HistoryCardList items={items} />
        </div>
      </PageTransition>
    </AppShell>
  );
}
