import type {
  MatchLeaderboardEntry,
  MatchPlayerWithDisplay,
  ThrowEvent,
} from "@/types/match";
import type { MatchStoreState } from "@/store/types";
import { getOrderedMatchPlayers } from "@/constants/liveMatch";

export const selectActiveMatch = (state: MatchStoreState) => state.activeMatch;
export const selectMatchPlayers = (state: MatchStoreState) => state.matchPlayers;
export const selectThrowEvents = (state: MatchStoreState) => state.throwEvents;

/** Turn order = order of matchPlayers (MVP). */
export const selectOrderedMatchPlayers = (state: MatchStoreState) =>
  getOrderedMatchPlayers(state.matchPlayers);

/** Throws for the current round only (regular match only; excludes playoff). */
export const selectCurrentRoundThrows = (state: MatchStoreState) => {
  const round = state.activeMatch?.currentRound;
  if (round == null) return [];
  return state.throwEvents.filter(
    (e) => !e.playoffMatchId && e.roundNumber === round,
  );
};

/** Player whose turn it is (from currentTurn). */
export const selectCurrentPlayer = (state: MatchStoreState): MatchPlayerWithDisplay | null => {
  const { currentTurn, matchPlayers } = state;
  if (!currentTurn) return null;
  return matchPlayers.find((p) => p.playerId === currentTurn.playerId) ?? null;
};

/** Next player in turn order (wrap around). */
export const selectNextPlayer = (state: MatchStoreState): MatchPlayerWithDisplay | null => {
  const ordered = getOrderedMatchPlayers(state.matchPlayers);
  if (ordered.length === 0 || !state.currentTurn) return null;
  const nextIndex = (state.currentTurn.turnIndex + 1) % ordered.length;
  return ordered[nextIndex] ?? null;
};

/** Whether the current round is complete: regular throws only, count >= players * shotsPerRound. */
export const selectIsRoundComplete = (state: MatchStoreState): boolean => {
  const round = state.activeMatch?.currentRound;
  if (round == null) return false;
  const shotsPerRound = state.activeMatch?.shotsPerRound ?? 1;
  const regularCount = state.throwEvents.filter(
    (e) =>
      e.eventType === "regular" &&
      !e.playoffMatchId &&
      e.roundNumber === round,
  ).length;
  return regularCount >= state.matchPlayers.length * shotsPerRound;
};

function computeDerivedLeaderboard(state: MatchStoreState): MatchLeaderboardEntry[] {
  const { throwEvents, matchPlayers, activeMatch, resolvedTieOrders } = state;
  const currentRound = Math.min(activeMatch?.currentRound ?? 1, activeMatch?.totalRounds ?? 1);
  const regularThrows = throwEvents.filter(
    (e) => e.eventType === "regular" && !e.playoffMatchId,
  );

  const totalByPlayer = new Map<string, number>();
  const roundByPlayer = new Map<string, number>();

  for (const e of regularThrows) {
    totalByPlayer.set(e.playerId, (totalByPlayer.get(e.playerId) ?? 0) + e.score);
    if (e.roundNumber === currentRound) {
      roundByPlayer.set(e.playerId, (roundByPlayer.get(e.playerId) ?? 0) + e.score);
    }
  }

  const playerIds = Array.from(new Set(matchPlayers.map((p) => p.playerId)));
  const entries: MatchLeaderboardEntry[] = playerIds.map((playerId) => {
    const player = matchPlayers.find((p) => p.playerId === playerId);
    return {
      playerId,
      playerName: player?.name ?? "",
      totalScore: totalByPlayer.get(playerId) ?? 0,
      roundScore: roundByPlayer.get(playerId) ?? 0,
      rank: 0,
    };
  });

  entries.sort((a, b) => b.totalScore - a.totalScore);

  let groupStart = 0;
  let orderIndex = 0;
  while (groupStart < entries.length) {
    const score = entries[groupStart].totalScore;
    let groupEnd = groupStart;
    while (groupEnd < entries.length && entries[groupEnd].totalScore === score) groupEnd++;
    const group = entries.slice(groupStart, groupEnd);
    if (group.length > 1 && orderIndex < resolvedTieOrders.length) {
      const order = resolvedTieOrders[orderIndex];
      const orderMap = new Map(order.map((id, i) => [id, i]));
      group.sort((a, b) => (orderMap.get(a.playerId) ?? 99) - (orderMap.get(b.playerId) ?? 99));
      for (let i = 0; i < group.length; i++) entries[groupStart + i] = group[i];
      orderIndex++;
    }
    groupStart = groupEnd;
  }

  entries.forEach((e, i) => {
    e.rank = i + 1;
  });
  return entries;
}

let cachedLeaderboard: {
  throwEvents: MatchStoreState["throwEvents"];
  matchPlayers: MatchStoreState["matchPlayers"];
  resolvedTieOrders: MatchStoreState["resolvedTieOrders"];
  currentRound: number;
  result: MatchLeaderboardEntry[];
} | null = null;

/**
 * Derived (computed) match leaderboard from throwEvents + matchPlayers.
 * Uses only regular throws for scores; uses resolvedTieOrders for tie-breaking.
 */
export const selectDerivedMatchLeaderboard = (
  state: MatchStoreState,
): MatchLeaderboardEntry[] => {
  const currentRound = Math.min(state.activeMatch?.currentRound ?? 1, state.activeMatch?.totalRounds ?? 1);
  if (
    cachedLeaderboard &&
    cachedLeaderboard.throwEvents === state.throwEvents &&
    cachedLeaderboard.matchPlayers === state.matchPlayers &&
    cachedLeaderboard.resolvedTieOrders === state.resolvedTieOrders &&
    cachedLeaderboard.currentRound === currentRound
  ) {
    return cachedLeaderboard.result;
  }
  const result = computeDerivedLeaderboard(state);
  cachedLeaderboard = {
    throwEvents: state.throwEvents,
    matchPlayers: state.matchPlayers,
    resolvedTieOrders: state.resolvedTieOrders,
    currentRound,
    result,
  };
  return result;
};

/** Match leaderboard: same as derived (single source from selectors). */
export const selectMatchLeaderboard = selectDerivedMatchLeaderboard;

/** One row of the round-by-round score table (derived from throwEvents). */
export type RoundScoreRow = {
  playerId: string;
  playerName: string;
  roundScores: number[];
  totalScore: number;
};

/** Full round score table: players as rows, rounds as columns, totals. Derived from throwEvents only. */
export type RoundScoreTable = {
  roundNumbers: number[];
  rows: RoundScoreRow[];
};

function computeRoundScoreTable(state: MatchStoreState): RoundScoreTable {
  const { throwEvents, matchPlayers, activeMatch } = state;
  const totalRounds = activeMatch?.totalRounds ?? 1;
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1);
  const regularThrows = throwEvents.filter(
    (e) =>
      e.eventType === "regular" &&
      !e.playoffMatchId &&
      e.roundNumber <= totalRounds,
  );

  const scoreByPlayerByRound = new Map<string, Map<number, number>>();
  const totalByPlayer = new Map<string, number>();

  for (const e of regularThrows) {
    if (!scoreByPlayerByRound.has(e.playerId)) {
      scoreByPlayerByRound.set(e.playerId, new Map());
    }
    const roundMap = scoreByPlayerByRound.get(e.playerId)!;
    roundMap.set(e.roundNumber, (roundMap.get(e.roundNumber) ?? 0) + e.score);
    totalByPlayer.set(e.playerId, (totalByPlayer.get(e.playerId) ?? 0) + e.score);
  }

  const ordered = getOrderedMatchPlayers(matchPlayers);
  const rows: RoundScoreRow[] = ordered.map((p) => {
    const roundScores = roundNumbers.map((r) => scoreByPlayerByRound.get(p.playerId)?.get(r) ?? 0);
    const totalScore = totalByPlayer.get(p.playerId) ?? 0;
    return { playerId: p.playerId, playerName: p.name, roundScores, totalScore };
  });

  return { roundNumbers, rows };
}

let cachedRoundScoreTable: {
  throwEvents: MatchStoreState["throwEvents"];
  matchPlayers: MatchStoreState["matchPlayers"];
  totalRounds: number;
  result: RoundScoreTable;
} | null = null;

/**
 * Derived round-by-round score table (players as rows, rounds as columns). Fully derived from throwEvents.
 */
export const selectRoundScoreTable = (state: MatchStoreState): RoundScoreTable => {
  const totalRounds = state.activeMatch?.totalRounds ?? 1;
  if (
    cachedRoundScoreTable &&
    cachedRoundScoreTable.throwEvents === state.throwEvents &&
    cachedRoundScoreTable.matchPlayers === state.matchPlayers &&
    cachedRoundScoreTable.totalRounds === totalRounds
  ) {
    return cachedRoundScoreTable.result;
  }
  const result = computeRoundScoreTable(state);
  cachedRoundScoreTable = {
    throwEvents: state.throwEvents,
    matchPlayers: state.matchPlayers,
    totalRounds,
    result,
  };
  return result;
};

/** One row for sudden-death score display: player and score per SD round. */
export type SuddenDeathScoreRow = {
  playerId: string;
  playerName: string;
  roundScores: number[];
};

/** Sudden-death score display: SD round numbers and rows (players with scores per round). Separate from regular scoreboard. */
export type SuddenDeathScoreDisplay = {
  sdRoundNumbers: number[];
  rows: SuddenDeathScoreRow[];
};

function computeSuddenDeathScoreDisplay(state: MatchStoreState): SuddenDeathScoreDisplay | null {
  const { throwEvents, matchPlayers, suddenDeathState } = state;
  const sdThrows = throwEvents.filter(
    (e) => e.eventType === "suddenDeath" && !e.playoffMatchId,
  );

  const inActiveSuddenDeath =
    suddenDeathState?.tiedPlayerIds?.length && !suddenDeathState.isResolved;
  const participantIds = inActiveSuddenDeath
    ? new Set(suddenDeathState.tiedPlayerIds)
    : new Set(sdThrows.map((e) => e.playerId));

  if (participantIds.size === 0 && sdThrows.length === 0) return null;

  const sdRoundNumbers =
    sdThrows.length > 0
      ? Array.from(new Set(sdThrows.map((e) => e.roundNumber))).sort((a, b) => a - b)
      : [];

  const ordered = getOrderedMatchPlayers(matchPlayers).filter((p) =>
    participantIds.has(p.playerId),
  );
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
    roundScores: sdRoundNumbers.map((r) => scoreByPlayerByRound.get(p.playerId)?.get(r) ?? 0),
  }));

  return {
    sdRoundNumbers: sdRoundNumbers.length > 0 ? sdRoundNumbers : [],
    rows,
  };
}

let cachedSuddenDeathDisplay: {
  throwEvents: MatchStoreState["throwEvents"];
  matchPlayers: MatchStoreState["matchPlayers"];
  suddenDeathState: MatchStoreState["suddenDeathState"];
  result: SuddenDeathScoreDisplay | null;
} | null = null;

/**
 * Derived sudden-death score display (separate from regular rounds table).
 * Returns null when there are no sudden-death throws.
 * Result is cached so getSnapshot returns a stable reference and avoids infinite re-renders.
 */
export const selectSuddenDeathScoreDisplay = (
  state: MatchStoreState,
): SuddenDeathScoreDisplay | null => {
  if (
    cachedSuddenDeathDisplay &&
    cachedSuddenDeathDisplay.throwEvents === state.throwEvents &&
    cachedSuddenDeathDisplay.matchPlayers === state.matchPlayers &&
    cachedSuddenDeathDisplay.suddenDeathState === state.suddenDeathState
  ) {
    return cachedSuddenDeathDisplay.result;
  }
  const result = computeSuddenDeathScoreDisplay(state);
  cachedSuddenDeathDisplay = {
    throwEvents: state.throwEvents,
    matchPlayers: state.matchPlayers,
    suddenDeathState: state.suddenDeathState,
    result,
  };
  return result;
};

/** Shot history for display: ordered throwEvents only (regular match). Purely derived; no scoring logic. */
export type ShotHistoryDisplay = {
  regular: ThrowEvent[];
  suddenDeath: ThrowEvent[];
};

function compareThrowOrder(a: ThrowEvent, b: ThrowEvent): number {
  if (a.roundNumber !== b.roundNumber) return a.roundNumber - b.roundNumber;
  if (a.turnIndex !== b.turnIndex) return a.turnIndex - b.turnIndex;
  return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
}

function computeShotHistoryDisplay(state: MatchStoreState): ShotHistoryDisplay {
  const regular = state.throwEvents
    .filter((e) => !e.playoffMatchId && e.eventType === "regular")
    .slice()
    .sort(compareThrowOrder);
  const suddenDeath = state.throwEvents
    .filter((e) => !e.playoffMatchId && e.eventType === "suddenDeath")
    .slice()
    .sort(compareThrowOrder);
  return { regular, suddenDeath };
}

let cachedShotHistory: {
  throwEvents: MatchStoreState["throwEvents"];
  result: ShotHistoryDisplay;
} | null = null;

export const selectShotHistoryDisplay = (
  state: MatchStoreState,
): ShotHistoryDisplay => {
  if (
    cachedShotHistory &&
    cachedShotHistory.throwEvents === state.throwEvents
  ) {
    return cachedShotHistory.result;
  }
  const result = computeShotHistoryDisplay(state);
  cachedShotHistory = { throwEvents: state.throwEvents, result };
  return result;
};
