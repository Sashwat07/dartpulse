import type { MatchPlayerWithDisplay, SuddenDeathState, ThrowEvent } from "@/types/match";

const REGULAR = "regular" as const;

/** Regular-match throws only; excludes playoff throws so ranking never mixes. */
export function getRegularThrows(throwEvents: ThrowEvent[]): ThrowEvent[] {
  return throwEvents.filter((e) => e.eventType === REGULAR && !e.playoffMatchId);
}

export function isRegularRoundsComplete(
  throwEvents: ThrowEvent[],
  totalRounds: number,
  playerCount: number,
  shotsPerRound: number = 1,
): boolean {
  if (playerCount === 0) return false;
  const regular = getRegularThrows(throwEvents);
  const inFinal = regular.filter((e) => e.roundNumber === totalRounds);
  return inFinal.length === playerCount * shotsPerRound;
}

export function getTotalScoreByPlayerFromRegularThrows(
  throwEvents: ThrowEvent[],
): Map<string, number> {
  const regular = getRegularThrows(throwEvents);
  const map = new Map<string, number>();
  for (const e of regular) {
    map.set(e.playerId, (map.get(e.playerId) ?? 0) + e.score);
  }
  return map;
}

/**
 * Ranked groups: entries sorted by totalScore desc, then grouped by equal score.
 * Each group is an array of playerIds (same totalScore). Order of groups = rank order.
 */
export function getRankedTiedGroups(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
): string[][] {
  const totalByPlayer = getTotalScoreByPlayerFromRegularThrows(throwEvents);
  const order = matchPlayers.map((p) => p.playerId);
  const withScore = order
    .filter((id) => totalByPlayer.has(id))
    .map((id) => ({ playerId: id, totalScore: totalByPlayer.get(id)! }));
  withScore.sort((a, b) => b.totalScore - a.totalScore);
  const groups: string[][] = [];
  let i = 0;
  while (i < withScore.length) {
    const score = withScore[i].totalScore;
    const group = withScore.filter((e) => e.totalScore === score).map((e) => e.playerId);
    groups.push(group);
    i += group.length;
  }
  return groups.filter((g) => g.length > 1);
}

/**
 * First (highest-ranked) tied group. Null if no ties.
 */
export function getActiveTieGroup(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
): string[] | null {
  const groups = getRankedTiedGroups(throwEvents, matchPlayers);
  return groups.length > 0 ? groups[0] : null;
}

/**
 * Sudden-death turn order = match player order restricted to tiedPlayerIds.
 */
export function getSuddenDeathTurnOrder(
  matchPlayers: MatchPlayerWithDisplay[],
  tiedPlayerIds: string[],
): string[] {
  const set = new Set(tiedPlayerIds);
  return matchPlayers.map((p) => p.playerId).filter((id) => set.has(id));
}

/**
 * Internal: sudden-death rounds use roundNumber = totalRounds + N.
 */
export function getSuddenDeathRoundNumber(totalRounds: number, sdRoundIndex: number): number {
  return totalRounds + sdRoundIndex;
}

export function getSuddenDeathThrows(throwEvents: ThrowEvent[], tiedPlayerIds: string[]): ThrowEvent[] {
  const set = new Set(tiedPlayerIds);
  return throwEvents.filter((e) => e.eventType === "suddenDeath" && set.has(e.playerId));
}

/**
 * Reconstructs resolvedTieOrders from stored throwEvents for a finished match.
 * Uses only regular-match throws (excludes any throw with playoffMatchId).
 * Used when matchStatus === "matchFinished" so playoff bootstrap gets correct seeding.
 */
export function deriveResolvedTieOrdersFromThrowEvents(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  _totalRounds: number,
): string[][] {
  const allGroups = getRankedTiedGroups(throwEvents, matchPlayers);
  if (allGroups.length === 0) return [];

  const sdThrows = throwEvents.filter(
    (e) => e.eventType === "suddenDeath" && !e.playoffMatchId,
  );

  const resolvedTieOrders: string[][] = [];

  for (const group of allGroups) {
    const groupSd = sdThrows.filter((e) => group.includes(e.playerId));

    if (groupSd.length === 0) {
      const order = getSuddenDeathTurnOrder(matchPlayers, group);
      resolvedTieOrders.push(order);
      continue;
    }

    const byRound = new Map<number, ThrowEvent[]>();
    for (const e of groupSd) {
      const list = byRound.get(e.roundNumber) ?? [];
      list.push(e);
      byRound.set(e.roundNumber, list);
    }
    const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b);
    let currentSubset = [...group];
    let resolvedFromGroup: string[] = [];
    let pushedForGroup = false;

    for (const round of roundNumbers) {
      const throwsInRound = (byRound.get(round) ?? []).filter((e) =>
        currentSubset.includes(e.playerId),
      );
      if (throwsInRound.length < currentSubset.length) break;

      const scores = throwsInRound.map((e) => ({ playerId: e.playerId, score: e.score }));
      const maxScore = Math.max(...scores.map((s) => s.score));
      const order = [...scores].sort((a, b) => b.score - a.score).map((s) => s.playerId);
      const stillTiedIds = order.filter((id) => (scores.find((s) => s.playerId === id)?.score ?? 0) === maxScore);
      const losers = order.filter((id) => (scores.find((s) => s.playerId === id)?.score ?? 0) < maxScore);
      resolvedFromGroup.unshift(...losers);
      if (stillTiedIds.length <= 1) {
        resolvedTieOrders.push([...stillTiedIds, ...resolvedFromGroup]);
        pushedForGroup = true;
        break;
      }
      currentSubset = stillTiedIds;
    }

    if (!pushedForGroup) {
      const order = getSuddenDeathTurnOrder(matchPlayers, currentSubset);
      resolvedTieOrders.push([...order, ...resolvedFromGroup]);
    }
  }

  return resolvedTieOrders;
}

export type DeriveSuddenDeathResult = {
  suddenDeathState: SuddenDeathState | null;
  currentTurn: { playerId: string; turnIndex: number } | null;
  resolvedTieOrders: string[][];
  isMatchFullyComplete: boolean;
};

/**
 * Derives sudden-death state and current turn from throwEvents.
 * Supports one active tie group at a time (highest-ranked unresolved).
 * resolvedTieOrders: rank-ordered list of resolved group orders (for leaderboard).
 */
export function deriveSuddenDeath(
  matchId: string,
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  totalRounds: number,
  matchStatus: string,
  shotsPerRound: number = 1,
): DeriveSuddenDeathResult {
  const regularComplete = isRegularRoundsComplete(
    throwEvents,
    totalRounds,
    matchPlayers.length,
    shotsPerRound,
  );
  const totalByPlayer = getTotalScoreByPlayerFromRegularThrows(throwEvents);
  const allGroups = getRankedTiedGroups(throwEvents, matchPlayers);
  const resolvedTieOrders: string[][] = [];

  if (!regularComplete) {
    return {
      suddenDeathState: null,
      currentTurn: null,
      resolvedTieOrders: [],
      isMatchFullyComplete: false,
    };
  }

  if (matchStatus === "matchFinished") {
    const resolvedTieOrders = deriveResolvedTieOrdersFromThrowEvents(
      throwEvents,
      matchPlayers,
      totalRounds,
    );
    return {
      suddenDeathState: null,
      currentTurn: null,
      resolvedTieOrders,
      isMatchFullyComplete: true,
    };
  }

  const sdThrows = throwEvents.filter(
    (e) => e.eventType === "suddenDeath" && !e.playoffMatchId,
  );
  let activeGroup: string[] | null = null;
  /** When activeGroup is a still-tied subset, merge this with activeResolvedOrder to form one resolvedTieOrders entry for the score-tier group. */
  let resolvedFromGroupForActive: string[] = [];
  /** Index in allGroups of the score-tier group we're currently resolving (used for handoff to next group). */
  let currentGroupIndexForActive = 0;

  for (let groupIndex = 0; groupIndex < allGroups.length; groupIndex++) {
    const group = allGroups[groupIndex];
    const groupSd = sdThrows.filter((e) => group.includes(e.playerId));
    if (groupSd.length === 0) {
      activeGroup = group;
      currentGroupIndexForActive = groupIndex;
      break;
    }
    const byRound = new Map<number, ThrowEvent[]>();
    for (const e of groupSd) {
      const list = byRound.get(e.roundNumber) ?? [];
      list.push(e);
      byRound.set(e.roundNumber, list);
    }
    const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b);
    let currentSubset = [...group];
    let resolvedFromGroup: string[] = [];
    let foundActive = false;

    for (const round of roundNumbers) {
      const throwsInRound = (byRound.get(round) ?? []).filter((e) =>
        currentSubset.includes(e.playerId),
      );
      if (throwsInRound.length < currentSubset.length) {
        activeGroup = currentSubset;
        resolvedFromGroupForActive = [...resolvedFromGroup];
        currentGroupIndexForActive = groupIndex;
        foundActive = true;
        break;
      }
      const scores = throwsInRound.map((e) => ({ playerId: e.playerId, score: e.score }));
      const maxScore = Math.max(...scores.map((s) => s.score));
      const order = [...scores].sort((a, b) => b.score - a.score).map((s) => s.playerId);
      const stillTiedIds = order.filter((id) => (scores.find((s) => s.playerId === id)?.score ?? 0) === maxScore);
      const losers = order.filter((id) => (scores.find((s) => s.playerId === id)?.score ?? 0) < maxScore);
      resolvedFromGroup.unshift(...losers);
      if (stillTiedIds.length <= 1) {
        resolvedTieOrders.push([...stillTiedIds, ...resolvedFromGroup]);
        currentSubset = [];
        break;
      }
      currentSubset = stillTiedIds;
    }

    if (foundActive) break;

    if (currentSubset.length >= 2) {
      activeGroup = currentSubset;
      resolvedFromGroupForActive = [...resolvedFromGroup];
      currentGroupIndexForActive = groupIndex;
      break;
    }
  }

  if (activeGroup == null) {
    return {
      suddenDeathState: null,
      currentTurn: null,
      resolvedTieOrders,
      isMatchFullyComplete: true,
    };
  }

  const order = getSuddenDeathTurnOrder(matchPlayers, activeGroup);
  const groupSd = sdThrows.filter((e) => activeGroup!.includes(e.playerId));
  const byRound = new Map<number, ThrowEvent[]>();
  for (const e of groupSd) {
    const list = byRound.get(e.roundNumber) ?? [];
    list.push(e);
    byRound.set(e.roundNumber, list);
  }
  const roundNumbers = Array.from(byRound.keys()).sort((a, b) => a - b);
  const currentSDRound =
    roundNumbers.length === 0 ? totalRounds + 1 : roundNumbers[roundNumbers.length - 1];
  const throwsThisRound = byRound.get(currentSDRound) ?? [];
  const nextIndex = throwsThisRound.length;
  let activeGroupResolved = false;
  let activeResolvedOrder: string[] | undefined;
  let effectiveSDRound = currentSDRound;
  let cycleCompleteStillTied = false;
  if (nextIndex >= order.length) {
    const scores = throwsThisRound.map((e) => ({ playerId: e.playerId, score: e.score }));
    const maxScore = Math.max(...scores.map((s) => s.score));
    const winners = scores.filter((s) => s.score === maxScore);
    if (winners.length === 1) {
      activeGroupResolved = true;
      activeResolvedOrder = [...scores].sort((a, b) => b.score - a.score).map((s) => s.playerId);
    } else {
      cycleCompleteStillTied = true;
      effectiveSDRound = currentSDRound + 1;
    }
  }

  const currentGroup = allGroups[currentGroupIndexForActive];
  const groupScore = (currentGroup?.length && totalByPlayer.get(currentGroup[0])) ?? 0;
  const playersAbove = Array.from(totalByPlayer.entries())
    .filter(([, s]) => s > groupScore)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  const rankOffset = playersAbove.length;
  const groupLen = currentGroup?.length ?? 0;
  const resolvedRanksSoFar: { rank: number; playerId: string }[] = [
    ...playersAbove.map((playerId, i) => ({ rank: i + 1, playerId })),
    ...[...resolvedFromGroupForActive].reverse().map((playerId, i) => ({
      rank: rankOffset + groupLen - i,
      playerId,
    })),
  ];

  const suddenDeathState: SuddenDeathState = {
    matchId,
    tiedPlayerIds: activeGroup,
    stage: "suddenDeath",
    roundNumber: effectiveSDRound,
    isResolved: activeGroupResolved,
    ...(activeResolvedOrder && { resolvedTieOrder: activeResolvedOrder }),
    resolvedRanksSoFar: resolvedRanksSoFar.length > 0 ? resolvedRanksSoFar : undefined,
  };

  let currentTurn: { playerId: string; turnIndex: number } | null = null;
  if (cycleCompleteStillTied) {
    currentTurn = { playerId: order[0], turnIndex: 0 };
  } else if (!activeGroupResolved && nextIndex < order.length) {
    const playerId = order[nextIndex];
    currentTurn = { playerId, turnIndex: order.indexOf(playerId) };
  }

  const mergedOrder =
    activeResolvedOrder && activeGroupResolved
      ? [...activeResolvedOrder, ...resolvedFromGroupForActive]
      : null;
  const finalResolvedOrders = mergedOrder ? [...resolvedTieOrders, mergedOrder] : resolvedTieOrders;

  if (activeGroupResolved && currentGroupIndexForActive < allGroups.length - 1) {
    const nextGroup = allGroups[currentGroupIndexForActive + 1];
    const nextGroupScore = (nextGroup?.length && totalByPlayer.get(nextGroup[0])) ?? 0;
    const nextPlayersAbove = Array.from(totalByPlayer.entries())
      .filter(([, s]) => s > nextGroupScore)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
    const nextResolvedRanksSoFar: { rank: number; playerId: string }[] = nextPlayersAbove.map(
      (playerId, i) => ({ rank: i + 1, playerId }),
    );

    const nextOrder = getSuddenDeathTurnOrder(matchPlayers, nextGroup);
    const nextGroupSd = sdThrows.filter((e) => nextGroup.includes(e.playerId));
    const nextByRound = new Map<number, ThrowEvent[]>();
    for (const e of nextGroupSd) {
      const list = nextByRound.get(e.roundNumber) ?? [];
      list.push(e);
      nextByRound.set(e.roundNumber, list);
    }
    const nextRoundNumbers = Array.from(nextByRound.keys()).sort((a, b) => a - b);
    const allSdRoundNumbers = sdThrows.map((e) => e.roundNumber);
    const nextSDRound =
      nextRoundNumbers.length === 0
        ? (allSdRoundNumbers.length === 0 ? totalRounds + 1 : Math.max(...allSdRoundNumbers) + 1)
        : nextRoundNumbers[nextRoundNumbers.length - 1];
    const nextThrowsThisRound = nextByRound.get(nextSDRound) ?? [];
    const nextNextIndex = nextThrowsThisRound.length;
    const nextSuddenDeathState: SuddenDeathState = {
      matchId,
      tiedPlayerIds: nextGroup,
      stage: "suddenDeath",
      roundNumber: nextSDRound,
      isResolved: false,
      resolvedRanksSoFar: nextResolvedRanksSoFar.length > 0 ? nextResolvedRanksSoFar : undefined,
    };
    const nextCurrentTurn: { playerId: string; turnIndex: number } | null =
      nextNextIndex < nextOrder.length
        ? { playerId: nextOrder[nextNextIndex], turnIndex: nextNextIndex }
        : null;
    return {
      suddenDeathState: nextSuddenDeathState,
      currentTurn: nextCurrentTurn,
      resolvedTieOrders: finalResolvedOrders,
      isMatchFullyComplete: false,
    };
  }

  return {
    suddenDeathState,
    currentTurn,
    resolvedTieOrders: finalResolvedOrders,
    isMatchFullyComplete: activeGroupResolved && currentGroupIndexForActive >= allGroups.length - 1,
  };
}

/**
 * After regular rounds and any sudden death used for ranking/qualification are fully resolved,
 * whether the parent Match row should be set to `matchFinished`.
 *
 * - 2 players: no playoffs — mark finished so the flow is complete and "Play again" applies.
 * - 3+ players: playoffs follow — do not mark finished until playoff final confirmation
 *   (`complete-final`); keeps state API on the pre-playoff branch with playoff CTAs.
 */
export function shouldMarkMatchFinishedAfterRegularPhaseComplete(
  matchPlayerCount: number,
): boolean {
  return matchPlayerCount === 2;
}

/**
 * True when match can be considered finished: either status is matchFinished,
 * or regular rounds are complete and there are no unresolved ties (including shrinking subsets).
 * Delegates to deriveSuddenDeath so completion and tie resolution share one source of truth.
 */
export function isMatchFullyComplete(
  throwEvents: ThrowEvent[],
  matchPlayers: MatchPlayerWithDisplay[],
  totalRounds: number,
  matchStatus: string,
  shotsPerRound: number = 1,
): boolean {
  if (matchStatus === "matchFinished") return true;
  if (
    !isRegularRoundsComplete(
      throwEvents,
      totalRounds,
      matchPlayers.length,
      shotsPerRound,
    )
  )
    return false;
  const result = deriveSuddenDeath(
    "",
    throwEvents,
    matchPlayers,
    totalRounds,
    matchStatus,
    shotsPerRound,
  );
  return result.isMatchFullyComplete;
}
