import { PageHeader } from "@/components/PageHeader";
import { NewMatchFlow } from "@/features/matchSetup/components/NewMatchFlow";
import { getCurrentUser } from "@/lib/getCurrentUser";
import {
  getDefaultMatchName,
  getLinkedPlayerByUserId,
  getMostRecentOwnedCompletedMatch,
  listMatchPlayersWithDisplayByMatchId,
} from "@/lib/repositories";

export default async function NewMatchPage() {
  const user = await getCurrentUser();
  const [defaultMatchName, recentMatch, linked] = await Promise.all([
    getDefaultMatchName(),
    user?.id ? getMostRecentOwnedCompletedMatch(user.id) : Promise.resolve(null),
    user?.id ? getLinkedPlayerByUserId(user.id) : Promise.resolve(null),
  ]);
  const recentPlayers =
    recentMatch != null
      ? await listMatchPlayersWithDisplayByMatchId(recentMatch.matchId)
      : [];

  return (
    <>
      <PageHeader
        title="New Match"
        description="Select players, set rounds, and start scoring."
      />
      <NewMatchFlow
        defaultMatchName={defaultMatchName}
        recentPlayers={recentPlayers.map((p) => ({
          playerId: p.playerId,
          name: p.name,
          avatarColor: p.avatarColor,
        }))}
        linkedPlayerId={linked?.playerId ?? null}
      />
    </>
  );
}
