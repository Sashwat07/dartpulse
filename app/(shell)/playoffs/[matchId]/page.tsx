import { PlayoffView } from "@/features/playoffs/components/PlayoffView";
import { getOwnedMatchOrThrow } from "@/lib/auth/ownership";
import { requireUser } from "@/lib/requireUser";

type PageProps = {
  params: Promise<{ matchId: string }>;
};

export default async function PlayoffsPage({ params }: PageProps) {
  const user = await requireUser();
  const { matchId } = await params;

  await getOwnedMatchOrThrow(matchId, user.id);

  return <PlayoffView matchId={matchId} />;
}
