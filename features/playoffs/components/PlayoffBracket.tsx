"use client";

import { useState, useCallback } from "react";
import { Trophy } from "lucide-react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay } from "@/types/match";
import { PlayoffMatchCard } from "./PlayoffMatchCard";

type PlayoffBracketProps = {
  matchId: string;
  playoffMatches: PlayoffMatch[];
  matchPlayers: MatchPlayerWithDisplay[];
  stageOrder: PlayoffMatch["stage"][];
  activePlayoffMatchId: string | null;
  onRefresh: () => void;
  readOnly?: boolean;
  finalConfirmed?: boolean;
};

const STAGE_NUMBER: Record<PlayoffMatch["stage"], string> = {
  qualifier1: "01",
  eliminator: "02",
  qualifier2: "03",
  final: "04",
};

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-glassBorder/60 bg-surfaceSubtle/30 px-4 py-3 min-w-[180px]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mutedForeground/40 italic">
        {label}
      </p>
    </div>
  );
}

function PathBadge({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: "neon" | "muted";
}) {
  return (
    <span
      className={
        variant === "neon"
          ? "text-[8px] font-bold uppercase tracking-wider text-primaryNeon/75"
          : "text-[8px] font-medium text-mutedForeground/50"
      }
    >
      {children}
    </span>
  );
}

/**
 * Winner-path horizontal connector: dashed cyan line + solid arrowhead.
 * Uses CSS border-dashed + a CSS triangle — no SVG, no markers, works at any width.
 */
function WinnerArrow() {
  return (
    <div className="flex items-center w-full">
      <div className="flex-1 border-t-[2px] border-dashed border-primaryNeon/65" />
      {/* CSS triangle arrowhead */}
      <div
        className="shrink-0"
        style={{
          width: 0,
          height: 0,
          borderTop: "5px solid transparent",
          borderBottom: "5px solid transparent",
          borderLeft: "7px solid color-mix(in srgb, var(--color-primaryNeon, #22d3ee) 65%, transparent)",
        }}
      />
    </div>
  );
}

/**
 * Survivor-path horizontal connector: solid muted line + small arrowhead.
 */
function SurvivorArrow() {
  return (
    <div className="flex items-center w-full">
      <div className="flex-1 border-t border-foreground/30" />
      <div
        className="shrink-0"
        style={{
          width: 0,
          height: 0,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
          borderLeft: "6px solid color-mix(in srgb, var(--color-foreground, currentColor) 30%, transparent)",
        }}
      />
    </div>
  );
}

/**
 * Column-2 connector spanning both grid rows.
 *
 * Shows three CSS lines:
 *   ① Dashed cyan horizontal at ~28% height  → Q1 winner heading right toward Final
 *   ② Solid muted vertical at x=0, 28%→72%  → Q1 loser path heading down
 *   ③ Solid muted horizontal at ~72% height  → Q1 loser + Elim winner merging → Q2
 *
 * 28% ≈ center of row-1 (Q1 card), 72% ≈ center of row-2 (Elim card),
 * assuming both rows are roughly equal height.
 */
function DualPathConnector() {
  return (
    <div
      style={{ gridRow: "1 / 3", gridColumn: 2 }}
      className="self-stretch relative"
    >
      {/* ① Winner: dashed cyan line going right */}
      <div
        className="absolute left-0 right-0 border-t-[2px] border-dashed border-primaryNeon/65"
        style={{ top: "28%" }}
      />

      {/* ② Loser: solid vertical going down */}
      <div
        className="absolute border-l border-foreground/30"
        style={{ left: "2px", top: "28%", height: "44%" }}
      />

      {/* ③ Merge: solid horizontal going right (with small arrowhead) */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{ top: "72%" }}
      >
        <div className="flex-1 border-t border-foreground/30" />
        <div
          className="shrink-0"
          style={{
            width: 0,
            height: 0,
            borderTop: "4px solid transparent",
            borderBottom: "4px solid transparent",
            borderLeft: "6px solid color-mix(in srgb, var(--color-foreground, currentColor) 30%, transparent)",
          }}
        />
      </div>
    </div>
  );
}

/** Simple 1-input → 1-output line for partial brackets */
function StraightConnector() {
  return (
    <div className="flex items-center w-8 shrink-0 self-stretch">
      <div className="w-full h-px bg-foreground/25" />
    </div>
  );
}

/** Simple 2-input fork for partial brackets without eliminator */
function ForkConnector() {
  return (
    <div className="flex items-stretch w-10 shrink-0 self-stretch">
      <svg
        viewBox="0 0 40 100"
        className="w-full h-full text-foreground/25"
        preserveAspectRatio="none"
        aria-hidden
      >
        <line x1="0" y1="25" x2="20" y2="25" stroke="currentColor" strokeWidth="1.5" />
        <line x1="0" y1="75" x2="20" y2="75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="25" x2="20" y2="75" stroke="currentColor" strokeWidth="1.5" />
        <line x1="20" y1="50" x2="40" y2="50" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function PlayoffBracket({
  matchId,
  playoffMatches,
  matchPlayers,
  stageOrder,
  activePlayoffMatchId,
  onRefresh,
  readOnly = false,
  finalConfirmed = false,
}: PlayoffBracketProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const byStage = new Map(playoffMatches.map((m) => [m.stage, m]));
  const q1 = byStage.get("qualifier1");
  const q2 = byStage.get("qualifier2");
  const elim = byStage.get("eliminator");
  const final_ = byStage.get("final");

  const hasFull = !!(q1 && elim);

  const makeCard = (match: PlayoffMatch, num: string) => (
    <PlayoffMatchCard
      matchId={matchId}
      playoffMatch={match}
      matchPlayers={matchPlayers}
      matchNumber={num}
      isActive={match.playoffMatchId === activePlayoffMatchId}
      isExpanded={expandedId === match.playoffMatchId}
      onExpandToggle={() => handleToggle(match.playoffMatchId)}
      onRefresh={onRefresh}
      readOnly={readOnly}
      finalConfirmed={finalConfirmed}
    />
  );

  return (
    <div className="rounded-xl border border-glassBorder bg-glassBackground p-4">
      {/* Header + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-[10px] font-black uppercase tracking-widest text-mutedForeground">
          Bracket
        </p>
        {hasFull && (
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 border-t-[2px] border-dashed border-primaryNeon/65" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-primaryNeon/70">
                Winner path
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 border-t border-foreground/30" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-mutedForeground/45">
                Survivor path
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        {hasFull ? (
          /**
           * Full bracket — 2-row × 5-col CSS grid
           *
           *  Col:    1        2         3           4       5
           *  Row 1: [Q1]  [dual-conn] [bypass  ─────────►] [Final]
           *  Row 2: [Elim][         ] [Q2]     [─────────►]
           *
           *  Col 2 spans rows 1-2 (DualPathConnector)
           *  Col 5 spans rows 1-2 (Final card)
           */
          <div
            className="grid min-w-max"
            style={{ gridTemplateColumns: "auto 52px auto 48px auto" }}
          >
            {/* Q1 — row 1, col 1 */}
            <div style={{ gridRow: 1, gridColumn: 1 }} className="self-center pb-6">
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                  Qualifier 1
                </p>
                <PathBadge variant="neon">W → Final</PathBadge>
              </div>
              {q1 ? makeCard(q1, STAGE_NUMBER.qualifier1) : <EmptySlot label="TBD" />}
              <p className="mt-1.5 px-0.5">
                <PathBadge variant="muted">L → Qualifier 2</PathBadge>
              </p>
            </div>

            {/* Dual-path connector — spans rows 1–2, col 2 */}
            <DualPathConnector />

            {/* Winner bypass — row 1, cols 3–4 */}
            <div
              style={{ gridRow: 1, gridColumn: "3 / 5" }}
              className="self-center px-1"
            >
              <WinnerArrow />
            </div>

            {/* Final card — spans rows 1–2, col 5 */}
            <div
              style={{ gridRow: "1 / 3", gridColumn: 5 }}
              className="self-center pl-1"
            >
              <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                <Trophy size={10} className="text-championGold" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-championGold">
                  The Grand Final
                </p>
              </div>
              {final_ ? (
                makeCard(final_, STAGE_NUMBER.final)
              ) : (
                <EmptySlot label="Q1 Winner vs Q2 Winner" />
              )}
            </div>

            {/* Eliminator — row 2, col 1 */}
            <div style={{ gridRow: 2, gridColumn: 1 }} className="self-center pt-6">
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                  Eliminator
                </p>
                <PathBadge variant="muted">W → Qualifier 2</PathBadge>
              </div>
              {elim ? makeCard(elim, STAGE_NUMBER.eliminator) : <EmptySlot label="TBD" />}
            </div>

            {/* Qualifier 2 — row 2, col 3 */}
            <div style={{ gridRow: 2, gridColumn: 3 }} className="self-center">
              <div className="flex items-center justify-between px-0.5 mb-1.5">
                <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                  Qualifier 2
                </p>
                <PathBadge variant="muted">W → Final</PathBadge>
              </div>
              {q2 ? makeCard(q2, STAGE_NUMBER.qualifier2) : <EmptySlot label="TBD" />}
              <p className="mt-1.5 px-0.5">
                <PathBadge variant="muted">Q1 Loser vs Elim Winner</PathBadge>
              </p>
            </div>

            {/* Q2 → Final connector — row 2, col 4 */}
            <div
              style={{ gridRow: 2, gridColumn: 4 }}
              className="self-center px-1"
            >
              <SurvivorArrow />
            </div>
          </div>
        ) : (
          /* Partial bracket */
          <div className="flex items-stretch gap-0">
            {(q1 || elim) && (
              <div className="flex flex-col gap-4 shrink-0">
                {q1 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50 mb-1.5 px-0.5">
                      Qualifier 1
                    </p>
                    {makeCard(q1, STAGE_NUMBER.qualifier1)}
                  </div>
                )}
                {elim && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50 mb-1.5 px-0.5">
                      Eliminator
                    </p>
                    {makeCard(elim, STAGE_NUMBER.eliminator)}
                  </div>
                )}
              </div>
            )}
            {(q1 || elim) && q2 ? <ForkConnector /> : (q1 || elim) ? <StraightConnector /> : null}
            {q2 && (
              <>
                <div className="flex flex-col justify-center shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50 mb-1.5 px-0.5">
                    Qualifier 2
                  </p>
                  {makeCard(q2, STAGE_NUMBER.qualifier2)}
                </div>
                <StraightConnector />
              </>
            )}
            {final_ && (
              <div className="flex flex-col justify-center shrink-0">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                  <Trophy size={10} className="text-championGold" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-championGold">
                    The Grand Final
                  </p>
                </div>
                {makeCard(final_, STAGE_NUMBER.final)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Format explainer */}
      {hasFull && (
        <div className="mt-4 pt-3 border-t border-glassBorder/40">
          <p className="text-[8px] font-black uppercase tracking-widest text-mutedForeground/30 mb-1.5">
            Format
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {[
              "Q1 Winner → Grand Final (direct)",
              "Q1 Loser + Eliminator Winner → Qualifier 2",
              "Qualifier 2 Winner → Grand Final",
            ].map((rule) => (
              <p key={rule} className="text-[9px] text-mutedForeground/50">
                · {rule}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
