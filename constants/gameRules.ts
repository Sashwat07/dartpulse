/**
 * Dart scoring rules (PRD §17, entity-model §9).
 * Valid throw scores: 0 (miss), Single 1–20, Double 2–40, Triple 3–60,
 * Outer bull 25, Bull 50.
 * Max shot = 60 (triple 20).
 */
export const BULLSEYE_SCORE = 50;

/** Valid dart score range (inclusive). 0 = miss/bust. */
export const DART_SCORE_MIN = 0;
export const DART_SCORE_MAX = 60;

export const MVP_SCORE_MIN = DART_SCORE_MIN;
export const MVP_SCORE_MAX = DART_SCORE_MAX;
