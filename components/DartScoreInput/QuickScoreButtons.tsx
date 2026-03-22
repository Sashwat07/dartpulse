"use client";

import { cn } from "@/utils/cn";

const QUICK_SCORES = [
  { label: "T20", score: 60 },
  { label: "D20", score: 40 },
  { label: "Bull", score: 50 },
] as const;

const btnBase =
  "rounded-lg border border-glassBorder bg-glassBackground/80 tabular-nums font-medium transition-all duration-150 min-h-[32px] min-w-[36px] " +
  "shadow-[0_1px_0_var(--inputInsetHighlight)_inset] hover:border-[var(--inputBorderHover)] hover:bg-glassBackground hover:brightness-110 " +
  "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type QuickScoreButtonsProps = {
  onScore: (score: number) => void;
  disabled?: boolean;
  className?: string;
};

/** One-tap quick score actions: T20, D20, Bull. Presentational only. */
export function QuickScoreButtons({
  onScore,
  disabled = false,
  className,
}: QuickScoreButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {QUICK_SCORES.map(({ label, score }) => (
        <button
          key={score}
          type="button"
          onClick={() => onScore(score)}
          disabled={disabled}
          className={cn(btnBase, "flex-1 basis-0 px-2 text-xs")}
          aria-label={`Quick score: ${label} (${score} points)`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
