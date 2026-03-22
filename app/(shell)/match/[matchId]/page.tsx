import { PageHeader } from "@/components/PageHeader";
import { LiveMatchHydrator } from "@/features/liveMatch/components/LiveMatchHydrator";
import { LiveMatchScoring } from "@/features/liveMatch/components/LiveMatchScoring";
import { getOwnedMatchOrThrow } from "@/lib/auth/ownership";
import { requireUser } from "@/lib/requireUser";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function MatchPage({ params }: PageProps) {
  const user = await requireUser();
  const { matchId } = await params;

  const match = await getOwnedMatchOrThrow(matchId, user.id);

  return (
    <>
      <PageHeader title={match.name} />
      <LiveMatchHydrator matchId={matchId}>
        <LiveMatchScoring matchId={matchId} />
      </LiveMatchHydrator>
    </>
  );
}

