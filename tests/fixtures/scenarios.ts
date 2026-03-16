import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { MatchOutcome } from "@/lib/progression";
import { makeMatch } from "./matches";
import { makeMatchPlayerWithDisplay } from "./players";
import { makeThrowEvent } from "./throwEvents";
import { makePlayoffMatch } from "./playoffMatches";
import { TWO_PLAYERS, FOUR_PLAYERS } from "./players";

const M2 = "match-two";
const M4 = "match-four";
const M4P = "match-four-playoff";

// ----- Two-player normal finish -----

/** Match: 2 rounds, 1 shot/round, completed. No tie, no playoffs. */
export const twoPlayerNormalFinishMatch = makeMatch({
  matchId: M2,
  name: "Fixture Two Player",
  mode: "casual",
  totalRounds: 2,
  status: "matchFinished",
  shotsPerRound: 1,
  basePlayerOrder: [TWO_PLAYERS[0].playerId, TWO_PLAYERS[1].playerId],
});

export const twoPlayerNormalFinishPlayers: MatchPlayerWithDisplay[] = [
  makeMatchPlayerWithDisplay({
    matchPlayerId: "mp-two-a",
    matchId: M2,
    playerId: TWO_PLAYERS[0].playerId,
    name: TWO_PLAYERS[0].name,
  }),
  makeMatchPlayerWithDisplay({
    matchPlayerId: "mp-two-b",
    matchId: M2,
    playerId: TWO_PLAYERS[1].playerId,
    name: TWO_PLAYERS[1].name,
  }),
];

/** Round 1: A=20, B=15; Round 2: A=18, B=20. Totals: A=38, B=35. Winner A. */
export const twoPlayerNormalFinishThrowEvents: ThrowEvent[] = [
  makeThrowEvent({
    throwEventId: "te-two-1",
    matchId: M2,
    roundNumber: 1,
    playerId: TWO_PLAYERS[0].playerId,
    turnIndex: 0,
    score: 20,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-two-2",
    matchId: M2,
    roundNumber: 1,
    playerId: TWO_PLAYERS[1].playerId,
    turnIndex: 1,
    score: 15,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-two-3",
    matchId: M2,
    roundNumber: 2,
    playerId: TWO_PLAYERS[0].playerId,
    turnIndex: 0,
    score: 18,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-two-4",
    matchId: M2,
    roundNumber: 2,
    playerId: TWO_PLAYERS[1].playerId,
    turnIndex: 1,
    score: 20,
    eventType: "regular",
  }),
];

export const twoPlayerNormalFinishExpectedOutcome: MatchOutcome = {
  winner: TWO_PLAYERS[0].playerId,
};

export const twoPlayerNormalFinishExpectedRanking: string[] = [
  TWO_PLAYERS[0].playerId,
  TWO_PLAYERS[1].playerId,
];

/** Canonical scenario: two-player match, normal finish, no sudden death, no playoffs. */
export const twoPlayerNormalFinishScenario = {
  match: twoPlayerNormalFinishMatch,
  players: twoPlayerNormalFinishPlayers,
  throwEvents: twoPlayerNormalFinishThrowEvents,
  expectedOutcome: twoPlayerNormalFinishExpectedOutcome,
  expectedRanking: twoPlayerNormalFinishExpectedRanking,
};

// ----- Four-player tie leading to sudden death -----

/** Match: 1 round, 1 shot/round. After round 1, A/B/C tie at 20; D at 10. Sudden death resolves A > B > C. */
export const fourPlayerSuddenDeathMatch = makeMatch({
  matchId: M4,
  name: "Fixture Four Sudden Death",
  mode: "tournament",
  totalRounds: 1,
  status: "matchFinished",
  shotsPerRound: 1,
  basePlayerOrder: FOUR_PLAYERS.map((p) => p.playerId),
});

export const fourPlayerSuddenDeathPlayers: MatchPlayerWithDisplay[] = FOUR_PLAYERS.map(
  (p, i) =>
    makeMatchPlayerWithDisplay({
      matchPlayerId: `mp-four-${p.playerId}`,
      matchId: M4,
      playerId: p.playerId,
      name: p.name,
    }),
);

/** Regular round 1: A=20, B=20, C=20, D=10 (turnIndex 0,1,2,3). */
const fourPlayerRegularThrows: ThrowEvent[] = [
  makeThrowEvent({
    throwEventId: "te-four-r1",
    matchId: M4,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[0].playerId,
    turnIndex: 0,
    score: 20,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-r2",
    matchId: M4,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[1].playerId,
    turnIndex: 1,
    score: 20,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-r3",
    matchId: M4,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[2].playerId,
    turnIndex: 2,
    score: 20,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-r4",
    matchId: M4,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[3].playerId,
    turnIndex: 3,
    score: 10,
    eventType: "regular",
  }),
];

/** Sudden death round (totalRounds+0 = 2): A=15, B=10, C=8. Resolved order A, B, C. */
const fourPlayerSuddenDeathThrows: ThrowEvent[] = [
  makeThrowEvent({
    throwEventId: "te-four-sd1",
    matchId: M4,
    roundNumber: 2,
    playerId: FOUR_PLAYERS[0].playerId,
    turnIndex: 0,
    score: 15,
    eventType: "suddenDeath",
  }),
  makeThrowEvent({
    throwEventId: "te-four-sd2",
    matchId: M4,
    roundNumber: 2,
    playerId: FOUR_PLAYERS[1].playerId,
    turnIndex: 1,
    score: 10,
    eventType: "suddenDeath",
  }),
  makeThrowEvent({
    throwEventId: "te-four-sd3",
    matchId: M4,
    roundNumber: 2,
    playerId: FOUR_PLAYERS[2].playerId,
    turnIndex: 2,
    score: 8,
    eventType: "suddenDeath",
  }),
];

export const fourPlayerSuddenDeathThrowEvents: ThrowEvent[] = [
  ...fourPlayerRegularThrows,
  ...fourPlayerSuddenDeathThrows,
];

/** Resolved tie order for the tied group (A, B, C) after sudden death. Used with deriveLeaderboardFromThrowEvents. */
export const fourPlayerSuddenDeathResolvedTieOrders: string[][] = [
  [FOUR_PLAYERS[0].playerId, FOUR_PLAYERS[1].playerId, FOUR_PLAYERS[2].playerId],
];

export const fourPlayerSuddenDeathExpectedRanking: string[] = FOUR_PLAYERS.map((p) => p.playerId);

/** Canonical scenario: four players, tie after regular rounds, sudden death resolves ranking. */
export const fourPlayerSuddenDeathScenario = {
  match: fourPlayerSuddenDeathMatch,
  players: fourPlayerSuddenDeathPlayers,
  throwEvents: fourPlayerSuddenDeathThrowEvents,
  resolvedTieOrders: fourPlayerSuddenDeathResolvedTieOrders,
  expectedRanking: fourPlayerSuddenDeathExpectedRanking,
  expectedOutcome: { topFour: fourPlayerSuddenDeathExpectedRanking } as MatchOutcome,
};

// ----- Four-player playoff path -----

/** Match: finished regular rounds; top 4 advance to playoffs. */
export const fourPlayerPlayoffMatch = makeMatch({
  matchId: M4P,
  name: "Fixture Four Playoff",
  mode: "tournament",
  totalRounds: 1,
  status: "matchFinished",
  shotsPerRound: 1,
  playoffShotsPerRound: 1,
  basePlayerOrder: FOUR_PLAYERS.map((p) => p.playerId),
});

export const fourPlayerPlayoffPlayers: MatchPlayerWithDisplay[] = FOUR_PLAYERS.map((p, i) =>
  makeMatchPlayerWithDisplay({
    matchPlayerId: `mp-four-p-${p.playerId}`,
    matchId: M4P,
    playerId: p.playerId,
    name: p.name,
    isQualifiedForPlayoffs: i < 4,
  }),
);

/** One round, 1 shot each: A=60, B=50, C=40, D=30. Clear top 4 order. */
export const fourPlayerPlayoffRegularThrowEvents: ThrowEvent[] = [
  makeThrowEvent({
    throwEventId: "te-four-p-1",
    matchId: M4P,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[0].playerId,
    turnIndex: 0,
    score: 60,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-p-2",
    matchId: M4P,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[1].playerId,
    turnIndex: 1,
    score: 50,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-p-3",
    matchId: M4P,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[2].playerId,
    turnIndex: 2,
    score: 40,
    eventType: "regular",
  }),
  makeThrowEvent({
    throwEventId: "te-four-p-4",
    matchId: M4P,
    roundNumber: 1,
    playerId: FOUR_PLAYERS[3].playerId,
    turnIndex: 3,
    score: 30,
    eventType: "regular",
  }),
];

const [A, B, C, D] = FOUR_PLAYERS.map((p) => p.playerId);

/** Playoff match IDs for bracket. */
export const PLAYOFF_IDS = {
  qualifier1: "pm-q1",
  qualifier2: "pm-q2",
  eliminator: "pm-elim",
  final: "pm-final",
} as const;

/** Q1: A vs B. Winner A, loser B. Q2: C vs D. Winner C, loser D. Eliminator: C vs B. Winner B, loser C. Final: A vs B. Winner A (champion). */
export const fourPlayerPlayoffMatchesProvisional = [
  makePlayoffMatch({
    playoffMatchId: PLAYOFF_IDS.qualifier1,
    parentMatchId: M4P,
    stage: "qualifier1",
    player1Id: A,
    player2Id: B,
    startingPlayerId: A,
    decidedByPlayerId: A,
    player1Score: 45,
    player2Score: 30,
    winnerId: A,
    loserId: B,
    status: "completed",
    resolvedBy: "normal",
  }),
  makePlayoffMatch({
    playoffMatchId: PLAYOFF_IDS.qualifier2,
    parentMatchId: M4P,
    stage: "qualifier2",
    player1Id: C,
    player2Id: D,
    startingPlayerId: C,
    decidedByPlayerId: C,
    player1Score: 40,
    player2Score: 25,
    winnerId: C,
    loserId: D,
    status: "completed",
    resolvedBy: "normal",
  }),
  makePlayoffMatch({
    playoffMatchId: PLAYOFF_IDS.eliminator,
    parentMatchId: M4P,
    stage: "eliminator",
    player1Id: C,
    player2Id: B,
    startingPlayerId: C,
    decidedByPlayerId: C,
    player1Score: 35,
    player2Score: 38,
    winnerId: B,
    loserId: C,
    status: "completed",
    resolvedBy: "normal",
  }),
  makePlayoffMatch({
    playoffMatchId: PLAYOFF_IDS.final,
    parentMatchId: M4P,
    stage: "final",
    player1Id: A,
    player2Id: B,
    startingPlayerId: A,
    decidedByPlayerId: A,
    player1Score: 42,
    player2Score: 40,
    winnerId: A,
    loserId: B,
    status: "provisionalCompleted",
    resolvedBy: "normal",
  }),
];

/** Same as above but final is "completed" (champion confirmed). For undo-blocked and read-only tests. */
export const fourPlayerPlayoffMatchesFinalConfirmed = fourPlayerPlayoffMatchesProvisional.map(
  (pm) =>
    pm.stage === "final"
      ? makePlayoffMatch({ ...pm, status: "completed" })
      : pm,
);

export const fourPlayerPlayoffExpectedChampionId = A;

/** Canonical scenario: four players, playoffs Q1/Q2/Eliminator/Final, provisional and confirmed final. */
export const fourPlayerPlayoffScenario = {
  match: fourPlayerPlayoffMatch,
  players: fourPlayerPlayoffPlayers,
  throwEvents: fourPlayerPlayoffRegularThrowEvents,
  playoffMatches: fourPlayerPlayoffMatchesProvisional,
  playoffMatchesFinalConfirmed: fourPlayerPlayoffMatchesFinalConfirmed,
  expectedChampionId: fourPlayerPlayoffExpectedChampionId,
  expectedRanking: [A, B, C, D] as string[],
};
