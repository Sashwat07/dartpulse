import type { MatchOutcomeSummary } from "@/types/dto";
import type {
  Match,
  MatchLeaderboardEntry,
  MatchPlayerWithDisplay,
  Round,
  ThrowEvent,
} from "@/types/match";
import type { PlayoffMatch } from "@/types/playoff";
import { buildMatchOutcomeSummary } from "@/lib/matchOutcomeSummary";
import { getEffectiveBaseOrder, sortMatchPlayersByBaseOrder } from "@/lib/regularMatchTurn";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { deriveSuddenDeath } from "@/lib/suddenDeath";
import {
  getMatchById,
  getRoundsByMatchId,
  listMatchPlayersWithDisplayByMatchId,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByMatch,
} from "@/lib/repositories";
import { deriveMatchOutcome } from "@/lib/progression";
import type { RoundScoreTable } from "@/lib/roundScoreTable";
import { deriveRoundScoreTable } from "@/lib/roundScoreTable";
import type { ShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import { deriveShotHistoryDisplay } from "@/lib/shotHistoryDisplay";
import type { SuddenDeathScoreDisplay } from "@/lib/suddenDeathDisplay";
import { deriveSuddenDeathScoreDisplay } from "@/lib/suddenDeathDisplay";

/** Full payload for history detail page; all derivation done server-side. */
export type MatchHistoryPayload = {
  match: Match;
  matchPlayers: MatchPlayerWithDisplay[];
  throwEvents: ThrowEvent[];
  rounds: Round[];
  playoffMatches: PlayoffMatch[];
  leaderboard: MatchLeaderboardEntry[];
  matchOutcomeSummary: MatchOutcomeSummary;
  roundScoreTable: RoundScoreTable;
  suddenDeathDisplay: SuddenDeathScoreDisplay | null;
  shotHistoryDisplay: ShotHistoryDisplay;
};

/**
 * Load and derive full history payload for a completed match.
 * Returns null if match does not exist or status !== "matchFinished".
 * History pages must not derive; they consume this payload only.
 */
export async function getMatchHistoryPayload(
  matchId: string,
): Promise<MatchHistoryPayload | null> {
  const match = await getMatchById(matchId);
  if (match === null || match.status !== "matchFinished") {
    return null;
  }

  const [matchPlayers, throwEvents, rounds, playoffMatches] = await Promise.all([
    listMatchPlayersWithDisplayByMatchId(matchId),
    listThrowEventsByMatch(matchId),
    getRoundsByMatchId(matchId),
    listPlayoffMatchesByParentMatch(matchId),
  ]);

  const baseOrder = getEffectiveBaseOrder(match, matchPlayers);
  const sortedMatchPlayers = sortMatchPlayersByBaseOrder(matchPlayers, baseOrder);
  const shotsPerRound = match.shotsPerRound ?? 1;

  const { resolvedTieOrders } = deriveSuddenDeath(
    matchId,
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
    match.status,
    shotsPerRound,
  );

  const leaderboard = deriveLeaderboardFromThrowEvents(
    throwEvents,
    sortedMatchPlayers,
    resolvedTieOrders,
  );

  const matchOutcomeSummary = buildMatchOutcomeSummary(
    leaderboard,
    sortedMatchPlayers.length,
  );

  const roundScoreTable = deriveRoundScoreTable(
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
  );

  const suddenDeathDisplay = deriveSuddenDeathScoreDisplay(
    throwEvents,
    sortedMatchPlayers,
  );

  const shotHistoryDisplay = deriveShotHistoryDisplay(
    throwEvents,
    sortedMatchPlayers,
    match.totalRounds,
  );

  return {
    match,
    matchPlayers: sortedMatchPlayers,
    throwEvents,
    rounds,
    playoffMatches,
    leaderboard,
    matchOutcomeSummary,
    roundScoreTable,
    suddenDeathDisplay,
    shotHistoryDisplay,
  };
}

export type FinalPlacementRow = { playerId: string; rank: number };

/**
 * Canonical final resolved placement for every player in a completed match.
 * Shared by history, global leaderboard, and any consumer needing per-match finish order.
 *
 * - 2p: regular-match ranking (final).
 * - 3p: 1 = final winner, 2 = final loser, 3 = player not in final.
 * - 4+p: ranks 1–4 from completed playoff bracket: champion (final winner), 2nd (final loser),
 *   3rd (qualifier2 loser — loser Q1 vs winner elim), 4th (eliminator loser — 3rd vs 4th).
 *   Ranks 5+ = regular-match rank for players not in top four qualifiers.
 */
export function getFinalPlacementFromPayload(
  payload: MatchHistoryPayload,
): FinalPlacementRow[] {
  const ordered = [...payload.leaderboard].sort((a, b) => a.rank - b.rank);
  const n = payload.matchPlayers.length;

  if (n === 2) {
    return ordered.map((e) => ({ playerId: e.playerId, rank: e.rank }));
  }

  if (n === 3) {
    const finalM = payload.playoffMatches.find((m) => m.stage === "final");
    const w = finalM?.winnerId;
    const l = finalM?.loserId;
    if (!w || !l) return ordered.map((e) => ({ playerId: e.playerId, rank: e.rank }));
    const third = ordered.find((e) => e.playerId !== w && e.playerId !== l);
    return [
      { playerId: w, rank: 1 },
      { playerId: l, rank: 2 },
      { playerId: third?.playerId ?? "", rank: 3 },
    ].filter((r) => r.playerId);
  }

  const outcome = deriveMatchOutcome(payload.leaderboard, n);
  const topFour = outcome.topFour ?? [];
  const topSet = new Set(topFour);
  if (topFour.length < 4) {
    return ordered.map((e) => ({ playerId: e.playerId, rank: e.rank }));
  }

  const finalM = payload.playoffMatches.find((m) => m.stage === "final");
  const q2 = payload.playoffMatches.find((m) => m.stage === "qualifier2");
  const elim = payload.playoffMatches.find((m) => m.stage === "eliminator");
  const champion = finalM?.winnerId;
  const finalLoser = finalM?.loserId;
  const q2Loser = q2?.loserId;
  const elimLoser = elim?.loserId;
  if (!champion || !finalLoser || !q2Loser || !elimLoser) {
    return ordered.map((e) => ({ playerId: e.playerId, rank: e.rank }));
  }

  const playoffRanks = new Map<string, number>([
    [champion, 1],
    [finalLoser, 2],
    [q2Loser, 3],
    [elimLoser, 4],
  ]);

  const rows: FinalPlacementRow[] = [];
  for (const e of ordered) {
    if (topSet.has(e.playerId)) {
      const r = playoffRanks.get(e.playerId);
      if (r != null) rows.push({ playerId: e.playerId, rank: r });
    } else {
      rows.push({ playerId: e.playerId, rank: e.rank });
    }
  }
  return rows.sort((a, b) => a.rank - b.rank);
}

/**
 * Champion playerId for a completed match from its history payload.
 * 2-player: rank 1 from final leaderboard (matchOutcomeSummary.winnerPlayerId).
 * 3+ players: winner of final playoff match (playoffMatches.stage === "final").
 */
export function getChampionPlayerIdFromPayload(
  payload: MatchHistoryPayload,
): string | null {
  if (payload.matchPlayers.length === 2) {
    return payload.matchOutcomeSummary.winnerPlayerId ?? null;
  }
  const finalMatch = payload.playoffMatches.find((m) => m.stage === "final");
  return finalMatch?.winnerId ?? null;
}

/**
 * Champion playerId for a completed match; uses canonical derivation via getMatchHistoryPayload.
 * Returns null if match not found or not completed.
 */
export async function getMatchChampion(matchId: string): Promise<string | null> {
  const payload = await getMatchHistoryPayload(matchId);
  return payload ? getChampionPlayerIdFromPayload(payload) : null;
}

/**
 * Batched champion resolution for multiple matches.
 * Deduplicates matchIds, loads payloads in parallel, returns map of matchId -> championPlayerId (or null).
 * Use when multiple champions are needed in one request to avoid repeated per-match work.
 */
export async function getChampionsByMatchIds(
  matchIds: string[],
): Promise<Map<string, string | null>> {
  const unique = [...new Set(matchIds)];
  const payloads = await Promise.all(
    unique.map((id) => getMatchHistoryPayload(id)),
  );
  const map = new Map<string, string | null>();
  for (let i = 0; i < unique.length; i++) {
    const matchId = unique[i];
    const payload = payloads[i];
    map.set(
      matchId,
      payload ? getChampionPlayerIdFromPayload(payload) : null,
    );
  }
  return map;
}
