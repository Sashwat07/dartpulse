import { PageTransition } from "@/components/motion/PageTransition";
import { PageHeader } from "@/components/PageHeader";
import { getGlobalLeaderboardStandings } from "@/lib/leaderboard/globalStandings";
import { LeaderboardTableClient } from "./LeaderboardTableClient";

export default async function LeaderboardPage() {
  const entries = await getGlobalLeaderboardStandings();

  return (
    <PageTransition>
      <PageHeader
        title="Leaderboard"
        description="Global standings from completed matches only. Order by tab; default Overall (wins, avg finish, then scoring)."
      />
      <div className="mt-4">
        <LeaderboardTableClient entries={entries} />
      </div>
    </PageTransition>
  );
}
