"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { PlayoffTurnState } from "@/lib/playoffTurn";
import { GlassCard } from "@/components/GlassCard";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { MOTION_TRANSITION_STANDARD } from "@/lib/motionConstants";
import { PlayoffBracket } from "./PlayoffBracket";
import { ActivePlayoffMatch } from "./ActivePlayoffMatch";
import { PlayAgainButton } from "@/features/matchSetup/components/PlayAgainButton";
import Link from "next/link";

type PlayoffState = {
  matchId: string;
  playoffMatches: PlayoffMatch[];
  activePlayoffMatchId: string | null;
  activePlayoffMatch?: PlayoffMatch;
  throwEventsForActive: ThrowEvent[];
  stageOrder: PlayoffMatch["stage"][];
  matchPlayers: MatchPlayerWithDisplay[];
  totalRounds: number;
  playoffShotsPerRound?: number;
  playoffTurnState?: PlayoffTurnState;
};

type PlayoffViewProps = { matchId: string };

export function PlayoffView({ matchId }: PlayoffViewProps) {
  const [state, setState] = useState<PlayoffState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`/api/playoffs/${matchId}/state`);
      if (!res.ok) {
        setError("Failed to load playoff state");
        return;
      }
      const data = await res.json();
      setState(data);
      setError(null);
    } catch {
      setError("Failed to load playoff state");
    }
  };

  useEffect(() => {
    fetchState();
  }, [matchId]);

  if (error) {
    return (
      <ErrorState
        description={error}
        action={
          <button
            type="button"
            onClick={() => {
              setError(null);
              fetchState();
            }}
            className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (state === null) {
    return <LoadingCard message="Loading playoff state…" />;
  }

  if (state.playoffMatches.length === 0) {
    return (
      <GlassCard className="p-4">
        <p className="text-sm text-mutedForeground">
          No playoffs for this match (2-player match or match not finished).
        </p>
        <Link
          href={`/match/${matchId}`}
          className="mt-2 inline-block text-sm text-mutedForeground transition-colors hover:text-primaryNeon hover:underline"
        >
          Back to match
        </Link>
      </GlassCard>
    );
  }

  const allComplete = state.playoffMatches.every(
    (m) =>
      m.status === "completed" ||
      (m.stage === "final" && m.status === "provisionalCompleted"),
  );
  const finalMatch = state.playoffMatches.find((m) => m.stage === "final");
  const finalConfirmed = finalMatch?.status === "completed";
  const championId =
    finalMatch?.winnerId != null &&
    (finalMatch.status === "completed" || finalMatch.status === "provisionalCompleted")
      ? finalMatch.winnerId
      : null;
  const championName = championId
    ? state.matchPlayers.find((p) => p.playerId === championId)?.name ?? championId
    : null;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION_TRANSITION_STANDARD}
    >
      <PlayoffBracket
        matchId={matchId}
        playoffMatches={state.playoffMatches}
        matchPlayers={state.matchPlayers}
        stageOrder={state.stageOrder}
        activePlayoffMatchId={state.activePlayoffMatchId}
        onRefresh={fetchState}
        finalConfirmed={state.playoffMatches.some(
          (m) => m.stage === "final" && m.status === "completed",
        )}
      />
      {state.activePlayoffMatch && (
        <ActivePlayoffMatch
          matchId={matchId}
          playoffMatch={state.activePlayoffMatch}
          throwEvents={state.throwEventsForActive}
          matchPlayers={state.matchPlayers}
          totalRounds={state.totalRounds}
          playoffShotsPerRound={state.playoffShotsPerRound ?? 1}
          playoffTurnState={state.playoffTurnState}
          onThrowAdded={fetchState}
        />
      )}
      {allComplete && championName && (
        <GlassCard className="p-4 border-amber-500/30">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground">
            Champion
          </h2>
          <p className="mt-2 text-xl font-semibold text-amber-400">{championName}</p>
          {finalConfirmed && (
            <div className="mt-3">
              <PlayAgainButton sourceMatchId={matchId} label="Play again" variant="button" />
            </div>
          )}
        </GlassCard>
      )}
      <Link
        href={`/match/${matchId}`}
        className="inline-block text-sm text-mutedForeground transition-colors hover:text-primaryNeon hover:underline"
      >
        Back to match
      </Link>
    </motion.div>
  );
}
