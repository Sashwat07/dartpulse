import { PageHeader } from "@/components/PageHeader";
import { NewMatchFlow } from "@/features/matchSetup/components/NewMatchFlow";
import {
  getDefaultMatchName,
  getMostRecentOwnedCompletedMatch,
  listMatchPlayersWithDisplayByMatchId,
} from "@/lib/repositories";
import { requireUser } from "@/lib/requireUser";

export default async function NewMatchPage() {
  const user = await requireUser();
  const [defaultMatchName, recentMatch] = await Promise.all([
    getDefaultMatchName(),
    getMostRecentOwnedCompletedMatch(user.id),
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
      />
    </>
  );
}
