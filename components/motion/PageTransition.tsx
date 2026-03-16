"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  MOTION_DURATION_MEDIUM,
  MOTION_EASE_OUT,
} from "@/lib/motionConstants";
import { cn } from "@/utils/cn";

type PageTransitionProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Optional page-level wrapper: subtle fade/slide on mount.
 * Safe to wrap server-rendered content; no route transition system.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: MOTION_DURATION_MEDIUM,
        ease: MOTION_EASE_OUT,
      }}
    >
      {children}
    </motion.div>
  );
}
