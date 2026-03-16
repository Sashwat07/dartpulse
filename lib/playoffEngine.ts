import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import { getEffectiveBaseOrder, sortMatchPlayersByBaseOrder } from "@/lib/regularMatchTurn";
import { deriveSuddenDeath } from "@/lib/suddenDeath";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { deriveMatchOutcome } from "@/lib/progression";
import {
  createPlayoffMatch,
  getMatchById,
  listPlayoffMatchesByParentMatch,
} from "@/lib/repositories";

/**
 * Bootstrap playoff matches when the regular match is finished.
 * Idempotent: if any playoff match exists for this parent, returns existing list.
 * Uses canonical effective player order (same as match state) so ranking and seeding
 * stay consistent regardless of which route invokes it.
 * - 2 players: no playoffs.
 * - 3 players: one final (rank 1 vs rank 2).
 * - 4+ players: qualifier1 (rank 1 vs 2), qualifier2 (rank 3 vs 4).
 */
export async function bootstrapPlayoffs(
  matchId: string,
  matchStatus: string,
  totalRounds: number,
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
): Promise<PlayoffMatch[]> {
  if (matchStatus !== "matchFinished") return [];

  const existing = await listPlayoffMatchesByParentMatch(matchId);
  if (existing.length > 0) return existing;

  const match = await getMatchById(matchId);
  if (match === null) return [];

  const baseOrder = getEffectiveBaseOrder(match, matchPlayers);
  const orderedMatchPlayers = sortMatchPlayersByBaseOrder(matchPlayers, baseOrder);

  const result = deriveSuddenDeath(
    matchId,
    throwEvents,
    orderedMatchPlayers,
    totalRounds,
    matchStatus,
  );
  const leaderboard = deriveLeaderboardFromThrowEvents(
    throwEvents,
    orderedMatchPlayers,
    result.resolvedTieOrders,
  );
  const outcome = deriveMatchOutcome(leaderboard, orderedMatchPlayers.length);

  if (orderedMatchPlayers.length === 2) return [];
  if (orderedMatchPlayers.length === 3 && outcome.topTwo?.length === 2) {
    const [rank1, rank2] = outcome.topTwo;
    const finalMatch = await createPlayoffMatch({
      parentMatchId: matchId,
      stage: "final",
      player1Id: rank1,
      player2Id: rank2,
      decidedByPlayerId: rank1,
    });
    return [finalMatch];
  }
  if (orderedMatchPlayers.length >= 4 && outcome.topFour && outcome.topFour.length >= 4) {
    const [r1, r2, r3, r4] = outcome.topFour;
    const qualifier1 = await createPlayoffMatch({
      parentMatchId: matchId,
      stage: "qualifier1",
      player1Id: r1,
      player2Id: r2,
      decidedByPlayerId: r1,
    });
    const qualifier2 = await createPlayoffMatch({
      parentMatchId: matchId,
      stage: "qualifier2",
      player1Id: r3,
      player2Id: r4,
      decidedByPlayerId: r3,
    });
    return [qualifier1, qualifier2];
  }
  return [];
}

/**
 * Create the next playoff match when prerequisites are met (4+ only).
 * - Eliminator: after qualifier1 and qualifier2 completed (winner Q2 vs loser Q1).
 * - Final: after eliminator completed (winner Q1 vs winner eliminator).
 */
export async function deriveNextPlayoffMatchIfNeeded(
  parentMatchId: string,
  playoffMatches: PlayoffMatch[],
): Promise<PlayoffMatch | null> {
  const byStage = (s: PlayoffMatch["stage"]) =>
    playoffMatches.find((m) => m.stage === s);

  const q1 = byStage("qualifier1");
  const q2 = byStage("qualifier2");
  const elim = byStage("eliminator");
  const finalMatch = byStage("final");

  if (q1 && q2 && q1.status === "completed" && q2.status === "completed" && !elim) {
    const loserQ1 = q1.loserId ?? (q1.player1Id === q1.winnerId ? q1.player2Id : q1.player1Id);
    const winnerQ2 = q2.winnerId ?? q2.player1Id;
    if (loserQ1 && winnerQ2) {
      const scoreWinnerQ2 =
        q2.winnerId === q2.player1Id ? (q2.player1Score ?? 0) : (q2.player2Score ?? 0);
      const scoreLoserQ1 =
        q1.loserId === q1.player1Id ? (q1.player1Score ?? 0) : (q1.player2Score ?? 0);
      const decidedByPlayerId =
        scoreWinnerQ2 >= scoreLoserQ1 ? winnerQ2 : loserQ1;
      return createPlayoffMatch({
        parentMatchId,
        stage: "eliminator",
        player1Id: winnerQ2,
        player2Id: loserQ1,
        decidedByPlayerId,
      });
    }
  }

  if (elim && elim.status === "completed" && !finalMatch) {
    const winnerQ1 = q1?.winnerId;
    const winnerElim = elim.winnerId;
    if (winnerQ1 && winnerElim) {
      return createPlayoffMatch({
        parentMatchId,
        stage: "final",
        player1Id: winnerQ1,
        player2Id: winnerElim,
        decidedByPlayerId: winnerQ1,
      });
    }
  }

  return null;
}
