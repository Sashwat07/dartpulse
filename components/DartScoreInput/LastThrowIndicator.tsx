"use client";

import { ScorePulse } from "@/components/motion/ScorePulse";
import { getScoreDisplayLabel } from "@/lib/utils/dartScore";
import { cn } from "@/utils/cn";

type LastThrowIndicatorProps = {
  /** Last throw score; when null, shows "—" or nothing. */
  lastScore: number | null;
  className?: string;
};

/** Displays "Last throw: T20 (+60)" with brief pulse when value changes. Informational only. */
export function LastThrowIndicator({
  lastScore,
  className,
}: LastThrowIndicatorProps) {
  const label = lastScore != null ? getScoreDisplayLabel(lastScore) : null;
  const display =
    lastScore != null
      ? label
        ? `${label} (+${lastScore})`
        : `+${lastScore}`
      : "—";

  return (
    <p
      className={cn(
        "text-xs font-medium text-mutedForeground tabular-nums",
        className,
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      Last throw:{" "}
      {lastScore != null ? (
        <ScorePulse trigger={lastScore}>
          <span className="text-foreground/90">{display}</span>
        </ScorePulse>
      ) : (
        <span>{display}</span>
      )}
    </p>
  );
}
