"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/utils/cn";
import { computeScore, type DartMultiplier } from "@/lib/utils/dartScore";
import { QuickScoreButtons } from "@/components/DartScoreInput/QuickScoreButtons";

type DraggableMultiplier = Exclude<DartMultiplier, "bull">;

const MULTIPLIERS: { id: DartMultiplier; label: string; draggable?: boolean }[] = [
  { id: "single", label: "S", draggable: true },
  { id: "double", label: "D", draggable: true },
  { id: "triple", label: "T", draggable: true },
  { id: "bull", label: "BULL" },
];

const NUMBERS = Array.from({ length: 20 }, (_, i) => i + 1);

const MULTIPLIER_LABELS: Record<DraggableMultiplier, string> = {
  single: "S",
  double: "D",
  triple: "T",
};

/** 36px minimum touch target; shared button base with focus-visible. */
const btnBase =
  "rounded-lg border tabular-nums font-medium transition-all duration-150 min-h-[36px] min-w-[36px] " +
  "shadow-[0_1px_0_var(--inputInsetHighlight)_inset] hover:brightness-110 active:scale-[0.98] " +
  "disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const btnDefault =
  "border-glassBorder bg-glassBackground/80 hover:border-[var(--inputBorderHover)] hover:bg-glassBackground";

const btnActive =
  "border-primaryNeon/60 bg-primaryNeon/15 text-primaryNeon shadow-[0_0_12px_rgba(0,229,255,0.25)]";

const btnDropTarget =
  "border-primaryNeon/80 bg-primaryNeon/20 text-primaryNeon scale-105 shadow-[0_0_16px_rgba(0,229,255,0.4)]";

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
  const [dragMultiplier, setDragMultiplier] = useState<DraggableMultiplier | null>(null);
  const [dragOverNumber, setDragOverNumber] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleNumberClick = useCallback(
    (n: number) => {
      const score = computeScore(multiplier, n);
      onScore(score);
    },
    [multiplier, onScore],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, m: DraggableMultiplier) => {
      setDragMultiplier(m);
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("text/plain", m);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDragMultiplier(null);
    setDragOverNumber(null);
    dragCounter.current = 0;
  }, []);

  const handleNumberDragEnter = useCallback(
    (e: React.DragEvent, n: number) => {
      e.preventDefault();
      dragCounter.current += 1;
      setDragOverNumber(n);
    },
    [],
  );

  const handleNumberDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOverNumber(null);
    }
  }, []);

  const handleNumberDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleNumberDrop = useCallback(
    (e: React.DragEvent, n: number) => {
      e.preventDefault();
      const dropped = (e.dataTransfer.getData("text/plain") as DraggableMultiplier) || dragMultiplier;
      if (dropped && dropped !== "bull") {
        const score = computeScore(dropped, n);
        onScore(score);
      }
      setDragMultiplier(null);
      setDragOverNumber(null);
      dragCounter.current = 0;
    },
    [dragMultiplier, onScore],
  );

  const isDragging = dragMultiplier !== null;

  return (
    <div className={cn("space-y-2", className)} role="group" aria-label="Score entry">
      {/* Multiplier row */}
      <div className="flex gap-1.5">
        {MULTIPLIERS.map((m) => (
          <button
            key={m.id}
            type="button"
            draggable={!disabled && !!m.draggable}
            onClick={() => setMultiplier(m.id)}
            onDragStart={
              m.draggable
                ? (e) => handleDragStart(e, m.id as DraggableMultiplier)
                : undefined
            }
            onDragEnd={m.draggable ? handleDragEnd : undefined}
            disabled={disabled}
            className={cn(
              btnBase,
              "flex-1 px-1.5 py-1 text-xs",
              multiplier === m.id ? btnActive : btnDefault,
              m.draggable && !disabled && "cursor-grab active:cursor-grabbing",
            )}
            aria-label={`Multiplier: ${m.label}${m.id === "bull" ? " (bullseye)" : ""}${m.draggable ? " (draggable)" : ""}`}
            aria-pressed={multiplier === m.id}
            title={m.draggable ? `Drag ${m.label} onto a number to score instantly` : undefined}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Drag hint */}
      {isDragging && (
        <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-primaryNeon/80 animate-pulse">
          Drop on a number → {MULTIPLIER_LABELS[dragMultiplier!]} score
        </p>
      )}
      {!isDragging && !disabled && (
        <p className="text-center text-[9px] text-mutedForeground/40 tracking-wide">
          Tip: drag S / D / T onto a number
        </p>
      )}

      {/* Number grid (1–20) or Bull options */}
      {multiplier === "bull" && !isDragging ? (
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => onScore(25)}
            disabled={disabled}
            className={cn(btnBase, btnDefault, "px-3 py-2 text-sm")}
            aria-label="Score: 25 (Outer Bull)"
          >
            <span className="block text-xs font-bold">25</span>
            <span className="block text-[9px] text-mutedForeground/60 font-normal">Outer Bull</span>
          </button>
          <button
            type="button"
            onClick={() => onScore(50)}
            disabled={disabled}
            className={cn(btnBase, btnDefault, "px-3 py-2 text-sm")}
            aria-label="Score: 50 (Bullseye)"
          >
            <span className="block text-xs font-bold">50</span>
            <span className="block text-[9px] text-mutedForeground/60 font-normal">Bullseye</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1.5">
          {NUMBERS.map((n) => {
            const isOver = dragOverNumber === n;
            const previewScore = isOver && dragMultiplier
              ? computeScore(dragMultiplier, n)
              : null;
            return (
              <button
                key={n}
                type="button"
                onClick={() => handleNumberClick(n)}
                onDragEnter={(e) => handleNumberDragEnter(e, n)}
                onDragLeave={handleNumberDragLeave}
                onDragOver={handleNumberDragOver}
                onDrop={(e) => handleNumberDrop(e, n)}
                disabled={disabled}
                className={cn(
                  btnBase,
                  "px-1 py-1 text-xs min-w-[36px] relative",
                  isOver ? btnDropTarget : btnDefault,
                  isDragging && !isOver && "opacity-70",
                )}
                aria-label={`Number: ${n}${previewScore !== null ? `, drop to score ${previewScore}` : ""}`}
              >
                {isOver && previewScore !== null ? (
                  <span className="font-bold text-[11px]">{previewScore}</span>
                ) : (
                  n
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Quick: 0, 25 (outer bull), 50 (bull) */}
      <div>
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-mutedForeground/70">
          Quick
        </p>
        <QuickScoreButtons onScore={onScore} disabled={disabled} />
      </div>
    </div>
  );
}
