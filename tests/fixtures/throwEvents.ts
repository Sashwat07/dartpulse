import type { ThrowEvent } from "@/types/match";
import { FIXTURE_DATE } from "./constants";

/** Valid dart score range: 1–60 (single/double/triple 1–20, bull 50). */
const MIN_SCORE = 1;
const MAX_SCORE = 60;
const BULLSEYE = 50;

/**
 * Build a ThrowEvent fixture. Used by unit tests (leaderboard, sudden death, turn derivation).
 * Regular throws must not set playoffMatchId; sudden death uses eventType "suddenDeath".
 */
export function makeThrowEvent(
  overrides: {
    throwEventId: string;
    matchId: string;
    roundNumber: number;
    playerId: string;
    turnIndex: number;
    score: number;
    eventType: "regular" | "suddenDeath";
    roundId?: string;
    playoffMatchId?: string;
    isBullseye?: boolean;
  } & Partial<Pick<ThrowEvent, "createdAt">>,
): ThrowEvent {
  const score = overrides.score;
  if (score < MIN_SCORE || score > MAX_SCORE) {
    throw new Error(`Fixture score must be ${MIN_SCORE}–${MAX_SCORE}, got ${score}`);
  }
  return {
    throwEventId: overrides.throwEventId,
    matchId: overrides.matchId,
    roundId: overrides.roundId,
    roundNumber: overrides.roundNumber,
    playerId: overrides.playerId,
    turnIndex: overrides.turnIndex,
    score: overrides.score,
    isBullseye: overrides.isBullseye ?? score === BULLSEYE,
    eventType: overrides.eventType,
    playoffMatchId: overrides.playoffMatchId,
    createdAt: overrides.createdAt ?? FIXTURE_DATE,
  };
}
