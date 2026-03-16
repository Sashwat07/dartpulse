"use client";

import Link from "next/link";
import { useMatchStore } from "@/store/useMatchStore";
import { MatchOutcomeSummary } from "./MatchOutcomeSummary";
import { PlayAgainButton } from "@/features/matchSetup/components/PlayAgainButton";

type MatchCompleteBannerProps = { matchId: string };

/**
 * When the regular match is finished, show Match Outcome Summary and, for 3+ player
 * outcomes (final or playoff qualification), a link to playoffs.
 * Go to playoffs link is shown based on matchOutcomeSummary.outcomeType, not player count.
 */
export function MatchCompleteBanner({ matchId }: MatchCompleteBannerProps) {
  const activeMatch = useMatchStore((s) => s.activeMatch);
  const matchOutcomeSummary = useMatchStore((s) => s.matchOutcomeSummary);

  const isFinished = activeMatch?.status === "matchFinished";
  if (!isFinished || !matchOutcomeSummary) return null;

  const showPlayoffsLink =
    matchOutcomeSummary.outcomeType === "finalQualification" ||
    matchOutcomeSummary.outcomeType === "playoffQualification";

  // Play again only when the overall match is fully complete (no pending playoffs).
  const showPlayAgain = isFinished && !showPlayoffsLink;

  return (
    <div className="space-y-3">
      <MatchOutcomeSummary summary={matchOutcomeSummary} />
      <div className="flex flex-wrap items-center gap-3">
        {showPlayoffsLink && (
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
