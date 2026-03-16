"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  MOTION_DURATION_SHORT,
  MOTION_EASE_OUT,
} from "@/lib/motionConstants";
import { cn } from "@/utils/cn";

type ScorePulseProps = {
  /** Trigger re-pulse when this value changes. */
  trigger?: string | number;
  children: ReactNode;
  className?: string;
};

/**
 * Subtle scale/opacity pulse for score or value emphasis.
 * Presentational only; no gameplay/store dependency.
 * Re-pulses when `trigger` changes (e.g. last score).
 */
export function ScorePulse({
  trigger,
  children,
  className,
}: ScorePulseProps) {
  return (
    <motion.span
      key={trigger}
      className={cn("inline-block", className)}
      initial={{ scale: 1.15, opacity: 0.95 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        duration: MOTION_DURATION_SHORT,
        ease: MOTION_EASE_OUT,
      }}
    >
      {children}
    </motion.span>
  );
}
