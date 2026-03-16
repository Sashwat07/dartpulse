"use client";

import type { ThrowEvent, MatchPlayerWithDisplay } from "@/types/match";

function playerName(players: MatchPlayerWithDisplay[], playerId: string): string {
  return players.find((p) => p.playerId === playerId)?.name ?? playerId;
}

/** Order by roundNumber, turnIndex, createdAt (display only). */
function orderThrows(events: ThrowEvent[]): ThrowEvent[] {
  return [...events].sort((a, b) => {
    if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
    if (a.turnIndex !== b.turnIndex) return a.turnIndex - b.turnIndex;
    return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
  });
}

type PlayoffThrowHistoryProps = {
  throwEvents: ThrowEvent[];
  matchPlayers: MatchPlayerWithDisplay[];
  /** Optional; compact single-line style when true */
  compact?: boolean;
};

/**
 * Presentational: regulation and sudden-death throw history for a playoff match.
 * Reused in bracket card expanded content and active playoff match.
 */
export function PlayoffThrowHistory({
  throwEvents,
  matchPlayers,
  compact = false,
}: PlayoffThrowHistoryProps) {
  if (throwEvents.length === 0) return null;
  const regulation = orderThrows(throwEvents.filter((e) => e.eventType === "regular"));
  const suddenDeath = orderThrows(throwEvents.filter((e) => e.eventType === "suddenDeath"));

  const throwItem = (t: ThrowEvent) => (
    <span
      key={t.throwEventId}
      className="tabular-nums mr-1.5 after:content-['·'] last:after:content-['']"
    >
      {playerName(matchPlayers, t.playerId)} {t.score}
    </span>
  );

  if (compact) {
    return (
      <div className="space-y-1 text-sm">
        {regulation.length > 0 && (
          <p className="text-mutedForeground">
            Regulation: {regulation.map((t) => throwItem(t))}
          </p>
        )}
        {suddenDeath.length > 0 && (
          <p className="text-amber-400/90">
            Sudden death: {suddenDeath.map((t) => throwItem(t))}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-sm">
      {regulation.length > 0 && (
        <p className="text-mutedForeground">
          Regulation: {regulation.map((t) => throwItem(t))}
        </p>
      )}
      {suddenDeath.length > 0 && (
        <p className="text-amber-400/90">
          Sudden death: {suddenDeath.map((t) => throwItem(t))}
        </p>
      )}
    </div>
  );
}
