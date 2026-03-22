"use client";

import { useState, useCallback } from "react";
import { cn } from "@/utils/cn";
import { computeScore, type DartMultiplier } from "@/lib/utils/dartScore";
import { QuickScoreButtons } from "@/components/DartScoreInput/QuickScoreButtons";

const MULTIPLIERS: { id: DartMultiplier; label: string }[] = [
  { id: "single", label: "S" },
  { id: "double", label: "D" },
  { id: "triple", label: "T" },
  { id: "bull", label: "BULL" },
];

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

/** 36px minimum touch target; shared button base with focus-visible. */
const btnBase =
  "rounded-lg border tabular-nums font-medium transition-all duration-150 min-h-[36px] min-w-[36px] " +
  "shadow-[0_1px_0_var(--inputInsetHighlight)_inset] hover:brightness-110 active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const btnDefault =
  "border-glassBorder bg-glassBackground/80 hover:border-[var(--inputBorderHover)] hover:bg-glassBackground";

const btnActive =
  "border-primaryNeon/60 bg-primaryNeon/15 text-primaryNeon shadow-[0_0_12px_rgba(0,229,255,0.25)]";

type DartScoreInputProps = {
  onScore: (score: number) => void;
  disabled?: boolean;
  className?: string;
};

export function DartScoreInput({
  onScore,
  disabled = false,
  className,
}: DartScoreInputProps) {
  const [multiplier, setMultiplier] = useState<DartMultiplier>("single");

  const handleNumberClick = useCallback(
    (n: number) => {
      const score = computeScore(multiplier, n);
      onScore(score);
    },
    [multiplier, onScore],
  );

  const handleBullClick = useCallback(() => {
    onScore(50);
  }, [onScore]);

  return (
    <div className={cn("space-y-2", className)} role="group" aria-label="Score entry">
      {/* Multiplier row */}
      <div className="flex gap-1.5">
        {MULTIPLIERS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMultiplier(m.id)}
            disabled={disabled}
            className={cn(
              btnBase,
              "flex-1 px-1.5 py-1 text-xs",
              multiplier === m.id ? btnActive : btnDefault,
            )}
            aria-label={`Multiplier: ${m.label}${m.id === "bull" ? " (bullseye)" : ""}`}
            aria-pressed={multiplier === m.id}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Number grid (1–20) or Bull */}
      {multiplier === "bull" ? (
        <button
          type="button"
          onClick={handleBullClick}
          disabled={disabled}
          className={cn(btnBase, btnDefault, "w-full px-3 py-2 text-sm")}
          aria-label="Score: Bull (50 points)"
        >
          50 (BULL)
        </button>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {NUMBERS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleNumberClick(n)}
              disabled={disabled}
              className={cn(btnBase, btnDefault, "px-1 py-1 text-xs min-w-[36px]")}
              aria-label={`Number: ${n}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {/* Quick score actions */}
      <div>
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-mutedForeground/70">
          Quick
        </p>
        <QuickScoreButtons onScore={onScore} disabled={disabled} />
      </div>
    </div>
  );
}
