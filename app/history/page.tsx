import { listOwnedCompletedMatches } from "@/lib/repositories";
import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/requireUser";
import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { HistoryCardList } from "@/components/history/HistoryCardList";

export default async function HistoryPage() {
  const user = await requireUser();
  const items = await listOwnedCompletedMatches(user.id);

  return (
    <AppShell>
      <PageTransition>
        <PageHeader
          title="Match History"
          description="Completed matches. Click to view scoreboard, playoffs, and analytics."
        />
        <div className="mt-6">
          <HistoryCardList items={items} />
        </div>
      </PageTransition>
    </AppShell>
  );
}
