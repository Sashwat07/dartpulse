import { PlayoffView } from "@/features/playoffs/components/PlayoffView";
import { getMatchViewAccessOrNotFound } from "@/lib/auth/matchAccess";
import { getCurrentUser } from "@/lib/getCurrentUser";
import { getLinkedPlayerByUserId } from "@/lib/repositories";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function PlayoffsPage({ params }: PageProps) {
  const { matchId } = await params;
  const user = await getCurrentUser();
  const linked = user?.id ? await getLinkedPlayerByUserId(user.id) : null;
  await getMatchViewAccessOrNotFound(
    matchId,
    user?.id ?? null,
    linked?.playerId ?? null,
  );

  return <PlayoffView matchId={matchId} />;
}
