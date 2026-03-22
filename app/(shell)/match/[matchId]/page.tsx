import { PageHeader } from "@/components/PageHeader";
import { LiveMatchHydrator } from "@/features/liveMatch/components/LiveMatchHydrator";
import { LiveMatchScoring } from "@/features/liveMatch/components/LiveMatchScoring";
import { getMatchViewAccessOrNotFound } from "@/lib/auth/matchAccess";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getLinkedPlayerByUserId } from "@/lib/repositories";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchPage({ params }: PageProps) {
  const { matchId } = await params;
  const user = await getCurrentUser();
  const linked = user?.id ? await getLinkedPlayerByUserId(user.id) : null;
  const { match } = await getMatchViewAccessOrNotFound(
    matchId,
    user?.id ?? null,
    linked?.playerId ?? null,
  );

  return (
    <>
      <PageHeader title={match.name} />
      <LiveMatchHydrator matchId={matchId}>
        <LiveMatchScoring matchId={matchId} />
      </LiveMatchHydrator>
    </>
  );
}

