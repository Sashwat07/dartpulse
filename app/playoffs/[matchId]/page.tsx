import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
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

  return (
    <AppShell>
      <PageHeader
        title="Playoffs"
        description={`Match ${matchId.slice(-6)}`}
      />
      <div className="mt-3">
        <PlayoffView matchId={matchId} />
      </div>
    </AppShell>
  );
}
