"use client";

import { CurrentPlayerPanel } from "./CurrentPlayerPanel";
import { MatchCompleteBanner } from "./MatchCompleteBanner";
import { MatchInfoCard } from "./MatchInfoCard";
import { RoundProgressCard } from "./RoundProgressCard";
import { ScoreTable } from "./ScoreTable";
import { SuddenDeathScoreSection } from "./SuddenDeathScoreSection";

type LiveMatchScoringProps = { matchId: string };

export function LiveMatchScoring({ matchId }: LiveMatchScoringProps) {
  return (
    <div className="mt-6 space-y-6">
      <MatchCompleteBanner matchId={matchId} />
      <MatchInfoCard />
      <RoundProgressCard />
      <CurrentPlayerPanel />
      <ScoreTable />
      <SuddenDeathScoreSection />
    </div>
  );
}
