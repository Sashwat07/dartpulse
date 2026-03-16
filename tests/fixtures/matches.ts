import type { Match } from "@/types/match";
import { FIXTURE_DATE } from "./constants";

/**
 * Build a Match fixture with only fields needed for domain logic (turn order, status).
 * Omit optional timestamps if not needed.
 */
export function makeMatch(
  overrides: {
    matchId: string;
    name: string;
    mode: "casual" | "tournament";
    totalRounds: number;
    status: Match["status"];
    shotsPerRound?: number;
    playoffShotsPerRound?: number;
    basePlayerOrder?: string[];
  } & Partial<Pick<Match, "createdAt" | "startedAt" | "completedAt" | "createdByUserId">>,
): Match {
  return {
    matchId: overrides.matchId,
    name: overrides.name,
    mode: overrides.mode,
    totalRounds: overrides.totalRounds,
    status: overrides.status,
    shotsPerRound: overrides.shotsPerRound ?? 1,
    playoffShotsPerRound: overrides.playoffShotsPerRound,
    basePlayerOrder: overrides.basePlayerOrder,
    createdAt: overrides.createdAt ?? FIXTURE_DATE,
    startedAt: overrides.startedAt,
    completedAt: overrides.completedAt,
    createdByUserId: overrides.createdByUserId,
  };
}
