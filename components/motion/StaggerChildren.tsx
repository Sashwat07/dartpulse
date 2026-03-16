"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  MOTION_DURATION_MEDIUM,
  MOTION_EASE_OUT,
} from "@/lib/motionConstants";
import { cn } from "@/utils/cn";

type StaggerChildrenProps = {
  children: ReactNode;
  /** Delay between each child (seconds). Default 0.04. */
  staggerDelay?: number;
  className?: string;
};

const defaultStaggerDelay = 0.04;

export function StaggerChildren({
  children,
  staggerDelay = defaultStaggerDelay,
  className,
}: StaggerChildrenProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
            staggerDirection: 1,
          },
        },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  );
}

type StaggerChildProps = {
  children: ReactNode;
  className?: string;
};

/** Wrap each child in a StaggerChild when using StaggerChildren so they animate in sequence. */
export function StaggerChild({ children, className }: StaggerChildProps) {
  return (
    <motion.div
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: MOTION_DURATION_MEDIUM,
            ease: MOTION_EASE_OUT,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
