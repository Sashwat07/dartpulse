"use client";

import { ScorePulse } from "@/components/motion/ScorePulse";
import { cn } from "@/utils/cn";

type ThrowFeedbackProps = {
  /** Last submitted score; when null, nothing is shown. */
  score: number | null;
  className?: string;
};

/** Brief throw feedback: shows "+{score}" with pulse when score changes. Non-blocking, presentational. */
export function ThrowFeedback({ score, className }: ThrowFeedbackProps) {
  if (score === null) return null;
  return (
    <ScorePulse trigger={score} className={cn("tabular-nums", className)}>
      <span className="text-sm font-medium text-primaryNeon">+{score}</span>
    </ScorePulse>
  );
}
