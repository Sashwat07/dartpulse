/**
 * Shared motion constants for Phase 11 UI polish.
 * Aligns with docs/design-system.md: 150ms–200ms, easeOut, spring 200/20.
 */

/** Short duration (e.g. micro-feedback, pulses). */
export const MOTION_DURATION_SHORT = 0.15;

/** Medium duration (e.g. entrances, transitions). */
export const MOTION_DURATION_MEDIUM = 0.2;

/** Standard easing for most transitions (design system: easeOut). */
export const MOTION_EASE_OUT = "easeOut" as const;

/** Spring config for subtle layout movement (e.g. reorder, position). */
export const MOTION_SPRING_SUBTLE = {
  type: "spring" as const,
  stiffness: 200,
  damping: 20,
};

/** Transition for quick fade/slide (entrance). */
export const MOTION_TRANSITION_QUICK = {
  duration: MOTION_DURATION_SHORT,
  ease: MOTION_EASE_OUT,
};

/** Transition for standard fade/slide. */
export const MOTION_TRANSITION_STANDARD = {
  duration: MOTION_DURATION_MEDIUM,
  ease: MOTION_EASE_OUT,
};
