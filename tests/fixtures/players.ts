import type { MatchPlayerWithDisplay } from "@/types/match";
import { FIXTURE_DATE } from "./constants";

/**
 * Minimal player-like shape for fixture use.
 * Use makeMatchPlayerWithDisplay to attach to a match.
 */
export type FixturePlayer = {
  playerId: string;
  name: string;
  avatarColor?: string;
};

/**
 * Build a MatchPlayerWithDisplay for use in domain logic (leaderboard, turn order, etc.).
 * Only includes fields needed by lib/leaderboard, lib/suddenDeath, lib/regularMatchTurn.
 */
export function makeMatchPlayerWithDisplay(
  overrides: {
    matchPlayerId: string;
    matchId: string;
    playerId: string;
    name: string;
    avatarColor?: string;
  } & Partial<Pick<MatchPlayerWithDisplay, "seedRank" | "finalRank" | "isQualifiedForPlayoffs">>,
): MatchPlayerWithDisplay {
  return {
    matchPlayerId: overrides.matchPlayerId,
    matchId: overrides.matchId,
    playerId: overrides.playerId,
    name: overrides.name,
    avatarColor: overrides.avatarColor,
    seedRank: overrides.seedRank,
    finalRank: overrides.finalRank,
    isQualifiedForPlayoffs: overrides.isQualifiedForPlayoffs ?? false,
    createdAt: FIXTURE_DATE,
  };
}

/** Canonical two-player set for scenarios. */
export const TWO_PLAYERS: FixturePlayer[] = [
  { playerId: "p-two-a", name: "Alice" },
  { playerId: "p-two-b", name: "Bob" },
];

/** Canonical four-player set for scenarios (order matters for base order). */
export const FOUR_PLAYERS: FixturePlayer[] = [
  { playerId: "p-four-a", name: "Alex" },
  { playerId: "p-four-b", name: "Blake" },
  { playerId: "p-four-c", name: "Casey" },
  { playerId: "p-four-d", name: "Drew" },
];
