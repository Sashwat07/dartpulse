import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";

/** One row for sudden-death score display. */
export type SuddenDeathScoreRow = {
  playerId: string;
  playerName: string;
  roundScores: number[];
};

/** Sudden-death score display for finished matches. */
export type SuddenDeathScoreDisplay = {
  sdRoundNumbers: number[];
  rows: SuddenDeathScoreRow[];
};

/**
 * Derive sudden-death score display from throwEvents and matchPlayers.
 * Pure function for history; for finished matches all SD participants come from throws.
 * Returns null when there are no sudden-death throws.
 */
export function deriveSuddenDeathScoreDisplay(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
): SuddenDeathScoreDisplay | null {
  const sdThrows = throwEvents.filter(
    (e) => e.eventType === "suddenDeath" && !e.playoffMatchId,
  );
  const participantIds = new Set(sdThrows.map((e) => e.playerId));
  if (participantIds.size === 0 && sdThrows.length === 0) return null;

  const sdRoundNumbers =
    sdThrows.length > 0
      ? Array.from(new Set(sdThrows.map((e) => e.roundNumber))).sort(
          (a, b) => a - b,
        )
      : [];

  const ordered = matchPlayers.filter((p) => participantIds.has(p.playerId));
  const scoreByPlayerByRound = new Map<string, Map<number, number>>();
  for (const e of sdThrows) {
    if (!scoreByPlayerByRound.has(e.playerId)) {
      scoreByPlayerByRound.set(e.playerId, new Map());
    }
    const roundMap = scoreByPlayerByRound.get(e.playerId)!;
    roundMap.set(e.roundNumber, (roundMap.get(e.roundNumber) ?? 0) + e.score);
  }

  const rows: SuddenDeathScoreRow[] = ordered.map((p) => ({
    playerId: p.playerId,
    playerName: p.name,
    roundScores: sdRoundNumbers.map(
      (r) => scoreByPlayerByRound.get(p.playerId)?.get(r) ?? 0,
    ),
  }));

  return {
    sdRoundNumbers: sdRoundNumbers.length > 0 ? sdRoundNumbers : [],
    rows,
  };
}
