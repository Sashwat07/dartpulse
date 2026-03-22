import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import { getEffectiveBaseOrder, sortMatchPlayersByBaseOrder } from "@/lib/regularMatchTurn";
import { deriveSuddenDeath } from "@/lib/suddenDeath";
import { isRegularRoundsComplete } from "@/lib/suddenDeath";
import { deriveLeaderboardFromThrowEvents } from "@/lib/leaderboard";
import { deriveMatchOutcome } from "@/lib/progression";
import {
  createPlayoffMatch,
  getMatchById,
  listPlayoffMatchesByParentMatch,
} from "@/lib/repositories";

/**
 * True when the match is eligible for playoff bootstrap / "Go to playoffs".
 * Aligns with match state API: matchFinished, or regular rounds complete with 3+ players
 * (match record may still be roundActive; we derive from throw data).
 */
export function isPlayoffBootstrapEligible(
  matchStatus: string,
  totalRounds: number,
  throwEvents: ThrowEvent[],
  matchPlayerCount: number,
  shotsPerRound: number,
): boolean {
  if (matchStatus === "matchFinished") return true;
  return (
    matchPlayerCount >= 3 &&
    isRegularRoundsComplete(throwEvents, totalRounds, matchPlayerCount, shotsPerRound)
  );
}

/**
 * Bootstrap playoff matches when the regular match is finished (matchFinished)
 * or when regular rounds are complete and 3+ players (before final confirmation).
 * Idempotent: if any playoff match exists for this parent, returns existing list.
 * - 2 players: no playoffs.
 * - 3 players: one final (rank 1 vs rank 2).
 * - 4+ players: qualifier1 (rank 1 vs 2), eliminator (rank 3 vs 4). Qualifier2 and final are derived later.
 */
export async function bootstrapPlayoffs(
  matchId: string,
  matchStatus: string,
  totalRounds: number,
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  shotsPerRound: number = 1,
): Promise<PlayoffMatch[]> {
  if (!isPlayoffBootstrapEligible(matchStatus, totalRounds, throwEvents, matchPlayers.length, shotsPerRound))
    return [];

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
    shotsPerRound,
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
    const eliminatorMatch = await createPlayoffMatch({
      parentMatchId: matchId,
      stage: "eliminator",
      player1Id: r3,
      player2Id: r4,
      decidedByPlayerId: r3,
    });
    return [qualifier1, eliminatorMatch];
  }
  return [];
}

/**
 * Create the next playoff match when prerequisites are met (4+ only).
 * - Qualifier2: after qualifier1 and eliminator completed (loser Q1 vs winner eliminator).
 * - Final: after qualifier2 completed (winner Q1 vs winner Q2).
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

  if (q1 && elim && q1.status === "completed" && elim.status === "completed" && !q2) {
    const loserQ1 = q1.loserId ?? (q1.player1Id === q1.winnerId ? q1.player2Id : q1.player1Id);
    const winnerElim = elim.winnerId ?? elim.player1Id;
    if (loserQ1 && winnerElim) {
      const scoreWinnerElim =
        elim.winnerId === elim.player1Id ? (elim.player1Score ?? 0) : (elim.player2Score ?? 0);
      const scoreLoserQ1 =
        q1.loserId === q1.player1Id ? (q1.player1Score ?? 0) : (q1.player2Score ?? 0);
      const decidedByPlayerId =
        scoreWinnerElim >= scoreLoserQ1 ? winnerElim : loserQ1;
      return createPlayoffMatch({
        parentMatchId,
        stage: "qualifier2",
        player1Id: loserQ1,
        player2Id: winnerElim,
        decidedByPlayerId,
      });
    }
  }

  if (q2 && q2.status === "completed" && !finalMatch) {
    const winnerQ1 = q1?.winnerId;
    const winnerQ2 = q2.winnerId;
    if (winnerQ1 && winnerQ2) {
      return createPlayoffMatch({
        parentMatchId,
        stage: "final",
        player1Id: winnerQ1,
        player2Id: winnerQ2,
        decidedByPlayerId: winnerQ1,
      });
    }
  }

  return null;
}
