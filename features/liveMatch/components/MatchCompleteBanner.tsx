"use client";

import Link from "next/link";
import { useMatchStore } from "@/store/useMatchStore";
import { MatchOutcomeSummary } from "./MatchOutcomeSummary";
import { PlayAgainButton } from "@/features/matchSetup/components/PlayAgainButton";

type MatchCompleteBannerProps = { matchId: string };

/**
 * When the regular phase is over and playoffs are required (3+ players), show Match
 * Outcome Summary and "Go to playoffs" CTA. Shown when we have an outcome that
 * indicates final/playoff qualification, regardless of matchFinished (so it appears
 * as soon as regular rounds are complete and remains until playoffs are fully done).
 * Play again only when the match is fully complete (matchFinished and no playoffs pending).
 */
export function MatchCompleteBanner({ matchId }: MatchCompleteBannerProps) {
  const activeMatch = useMatchStore((s) => s.activeMatch);
  const matchOutcomeSummary = useMatchStore((s) => s.matchOutcomeSummary);

  const showPlayoffsLink =
    matchOutcomeSummary?.outcomeType === "finalQualification" ||
    matchOutcomeSummary?.outcomeType === "playoffQualification";

  if (!matchOutcomeSummary) return null;
  if (!showPlayoffsLink && matchOutcomeSummary.outcomeType === "winner") {
    const isFullyComplete = activeMatch?.status === "matchFinished";
    if (!isFullyComplete) return null;
  }

  const isFullyComplete = activeMatch?.status === "matchFinished";
  const showPlayAgain = isFullyComplete;

  return (
    <div className="space-y-3">
      <MatchOutcomeSummary summary={matchOutcomeSummary} />
      <div className="flex flex-wrap items-center gap-3">
        {showPlayoffsLink && !isFullyComplete && (
          <Link
            href={`/playoffs/${matchId}`}
            className="inline-block text-sm text-amber-400 hover:underline"
          >
            Go to playoffs →
          </Link>
        )}
        {showPlayAgain && (
          <PlayAgainButton sourceMatchId={matchId} label="Play again" variant="button" />
        )}
      </div>
    </div>
  );
}
