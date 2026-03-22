"use client";

import { CurrentPlayerPanel } from "./CurrentPlayerPanel";
import { MatchCompleteBanner } from "./MatchCompleteBanner";
import { MatchInfoCard } from "./MatchInfoCard";
import { ScoreTable } from "./ScoreTable";
import { SuddenDeathScoreSection } from "./SuddenDeathScoreSection";

type LiveMatchScoringProps = { matchId: string };

export function LiveMatchScoring({ matchId }: LiveMatchScoringProps) {
  return (
    <div className="mt-3 space-y-3">
      <MatchCompleteBanner matchId={matchId} />
      <div className="grid grid-cols-1 md:grid-cols-[284px_1fr] gap-3 items-start">
        <CurrentPlayerPanel />
        <div className="space-y-3">
          <MatchInfoCard />
          <ScoreTable />
          <SuddenDeathScoreSection />
        </div>
      </div>
    </div>
  );
}
