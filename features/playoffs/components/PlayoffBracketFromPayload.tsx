"use client";

import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay } from "@/types/match";
import { PlayoffBracket } from "./PlayoffBracket";

type PlayoffBracketFromPayloadProps = {
  matchId: string;
  playoffMatches: PlayoffMatch[];
  matchPlayers: MatchPlayerWithDisplay[];
  stageOrder: PlayoffMatch["stage"][];
};

/**
 * Client wrapper for showing the bracket on server-rendered pages (e.g. history).
 * Supplies a no-op onRefresh so the parent stays a Server Component.
 */
export function PlayoffBracketFromPayload({
  matchId,
  playoffMatches,
  matchPlayers,
  stageOrder,
}: PlayoffBracketFromPayloadProps) {
  return (
    <PlayoffBracket
      matchId={matchId}
      playoffMatches={playoffMatches}
      matchPlayers={matchPlayers}
      stageOrder={stageOrder}
      activePlayoffMatchId={null}
      onRefresh={() => {}}
      readOnly
      finalConfirmed={playoffMatches.some(
        (m) => m.stage === "final" && m.status === "completed",
      )}
    />
  );
}
