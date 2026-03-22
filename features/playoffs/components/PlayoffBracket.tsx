"use client";

import { useState, useCallback, useRef, useLayoutEffect, useEffect } from "react";
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
    <div className="rounded-xl border border-dashed border-glassBorder/60 bg-surfaceSubtle/30 px-4 py-3 min-w-[200px]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-mutedForeground/40 italic">
        {label}
      </p>
    </div>
  );
}

/** Shown in the Final slot when Q1 is done but Q2 hasn't finished yet. */
function FinalPlaceholderCard({
  confirmedName,
  confirmedLabel,
}: {
  confirmedName: string;
  confirmedLabel: string;
}) {
  const initial = confirmedName.slice(0, 1).toUpperCase();
  return (
    <div className="rounded-xl border border-glassBorder/60 bg-glassBackground min-w-[200px]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-glassBorder/40">
        <span className="text-[9px] font-black uppercase tracking-widest text-mutedForeground/50">
          Grand Final
        </span>
        <span className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/30 italic">
          Pending
        </span>
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Confirmed participant */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 border border-primaryNeon/20 bg-primaryNeon/5">
          <span className="h-6 w-6 shrink-0 rounded-full bg-primaryNeon/15 border border-primaryNeon/25 flex items-center justify-center text-[9px] font-black text-primaryNeon">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">{confirmedName}</p>
            <p className="text-[9px] text-primaryNeon/60 font-semibold">{confirmedLabel}</p>
          </div>
        </div>
        {/* TBD slot */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 border border-dashed border-glassBorder/40">
          <span className="h-6 w-6 shrink-0 rounded-full bg-surfaceSubtle/50 border border-glassBorder/40 flex items-center justify-center text-[9px] font-black text-mutedForeground/30">
            ?
          </span>
          <p className="text-xs font-medium text-mutedForeground/40 italic">Q2 Winner — TBD</p>
        </div>
      </div>
    </div>
  );
}

/* ── Connector geometry helpers ─────────────────────────────── */

type Pt = { x: number; y: number };

/** Smooth cubic bezier — used for Q2→Final */
function cubicPath(from: Pt, to: Pt): string {
  const dx = Math.abs(to.x - from.x) * 0.5;
  return `M ${from.x},${from.y} C ${from.x + dx},${from.y} ${to.x - dx},${to.y} ${to.x},${to.y}`;
}

/**
 * Stepped elbow path: horizontal from start → vertical → horizontal to end.
 * `turnX` is the x-coordinate where the vertical segment sits.
 */
function elbowPath(from: Pt, to: Pt, turnX: number): string {
  return `M ${from.x},${from.y} H ${turnX} V ${to.y} H ${to.x}`;
}

/**
 * Elbow path with rounded corners at both bends.
 * Goes: horizontal → corner → vertical → corner → horizontal.
 */
function elbowRounded(from: Pt, to: Pt, turnX: number, r = 8): string {
  const goDown = to.y >= from.y;
  const sv = goDown ? 1 : -1;
  const rh1 = Math.min(r, Math.abs(turnX - from.x) * 0.45);
  const rh2 = Math.min(r, Math.abs(to.x - turnX) * 0.45);
  const rv  = Math.min(r, Math.abs(to.y - from.y) * 0.45);
  return [
    `M ${from.x},${from.y}`,
    `H ${turnX - rh1}`,
    `Q ${turnX},${from.y} ${turnX},${from.y + sv * rv}`,
    `V ${to.y - sv * rv}`,
    `Q ${turnX},${to.y} ${turnX + rh2},${to.y}`,
    `H ${to.x}`,
  ].join(" ");
}

function getPoints(
  el: HTMLElement | null,
  container: HTMLElement | null,
): { right: Pt; left: Pt } | null {
  if (!el || !container) return null;
  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const cy = r.top + r.height / 2 - c.top;
  return {
    right: { x: r.right - c.left, y: cy },
    left: { x: r.left - c.left, y: cy },
  };
}

/* ── Main component ──────────────────────────────────────────── */

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

  /* Refs for SVG measurement */
  const contentRef = useRef<HTMLDivElement>(null);
  const q1Ref = useRef<HTMLDivElement>(null);
  const elimRef = useRef<HTMLDivElement>(null);
  const q2Ref = useRef<HTMLDivElement>(null);
  const finalRef = useRef<HTMLDivElement>(null);

  interface ConnPath { id: string; d: string; winner: boolean; noArrow?: boolean }
  const [svgDims, setSvgDims] = useState({ w: 0, h: 0 });
  const [connPaths, setConnPaths] = useState<ConnPath[]>([]);

  const recompute = useCallback(() => {
    const c = contentRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    setSvgDims({ w: cr.width, h: cr.height });

    const q1p = getPoints(q1Ref.current, c);
    const ep  = getPoints(elimRef.current, c);
    const q2p = getPoints(q2Ref.current, c);
    const fp  = getPoints(finalRef.current, c);

    const paths: ConnPath[] = [];

    /* Q1 + Q2 → Final: both converge at a merge point, then one line with one arrow enters Final */
    if (q1p && q2p && fp) {
      const mergeX = (q2p.right.x + fp.left.x) / 2;
      const mergeY = fp.left.y; // Q2 and Final are vertically centered together

      // Q1 drops: right at Q1's height (above Q2), turns at mergeX, drops to mergeY — no arrow
      const r = 8;
      const rh = Math.min(r, Math.abs(mergeX - q1p.right.x) * 0.45);
      const rv = Math.min(r, Math.abs(mergeY - q1p.right.y) * 0.45);
      const q1Drop = [
        `M ${q1p.right.x},${q1p.right.y}`,
        `H ${mergeX - rh}`,
        `Q ${mergeX},${q1p.right.y} ${mergeX},${q1p.right.y + rv}`,
        `V ${mergeY}`,
      ].join(" ");
      paths.push({ id: "q1-drop", d: q1Drop, winner: true, noArrow: true });

      // Q2 approaches merge point horizontally — no arrow
      paths.push({ id: "q2-approach", d: `M ${q2p.right.x},${mergeY} H ${mergeX}`, winner: true, noArrow: true });

      // Single merged line from merge point into Final — one arrow
      paths.push({ id: "merge-final", d: `M ${mergeX},${mergeY} H ${fp.left.x}`, winner: true });
    } else if (q1p && fp) {
      // No Q2: direct elbow from Q1 to Final
      const turnX = (q1p.right.x + fp.left.x) / 2;
      paths.push({ id: "q1-final", d: elbowRounded(q1p.right, fp.left, turnX), winner: true });
    }

    /* Q1 loser → Q2 (elbow: short right, drop down, then right) */
    if (q1p && q2p) {
      const turnX = q1p.right.x + 32;
      paths.push({ id: "q1-q2", d: elbowRounded(q1p.right, q2p.left, turnX), winner: false });
    }

    /* Elim winner → Q2 (elbow: straight right, turn up, enter Q2) */
    if (ep && q2p) {
      const turnX = (ep.right.x + q2p.left.x) / 2;
      paths.push({ id: "elim-q2", d: elbowRounded(ep.right, q2p.left, turnX), winner: false });
    }

    setConnPaths(paths);
  }, []);

  /* Re-measure after card expansions / initial render */
  useLayoutEffect(() => {
    if (!hasFull) return;
    const raf = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(raf);
  }, [hasFull, recompute, expandedId]);

  /* Re-measure on container resize (handles window resize / sidebar toggle) */
  useEffect(() => {
    if (!hasFull) return;
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [hasFull, recompute]);

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
              <svg width="28" height="4" aria-hidden>
                <line x1="0" y1="2" x2="28" y2="2"
                  stroke="rgba(0,229,255,0.65)" strokeWidth="2" strokeDasharray="5 3" />
              </svg>
              <span className="text-[8px] font-bold uppercase tracking-widest text-primaryNeon/70">
                Winner path
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="28" height="4" aria-hidden>
                <line x1="0" y1="2" x2="28" y2="2"
                  stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              </svg>
              <span className="text-[8px] font-bold uppercase tracking-widest text-mutedForeground/45">
                Survivor path
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        {hasFull ? (
          /* ── Full bracket with SVG connectors ── */
          <div ref={contentRef} className="relative min-w-max">
            {/* SVG overlay — drawn BEHIND cards (z-index 0) */}
            <svg
              aria-hidden
              className="absolute top-0 left-0 pointer-events-none"
              width={svgDims.w || "100%"}
              height={svgDims.h || "100%"}
              style={{ overflow: "visible", zIndex: 0 }}
            >
              <defs>
                {/* Neon arrowhead for winner path */}
                <marker id="bp-arrow-winner" markerWidth="8" markerHeight="8"
                  refX="7" refY="3" orient="auto">
                  <path d="M0,0.5 L0,5.5 L7,3 z" fill="rgba(0,229,255,0.75)" />
                </marker>
                {/* Muted arrowhead for survivor path */}
                <marker id="bp-arrow-survivor" markerWidth="7" markerHeight="7"
                  refX="6" refY="3" orient="auto">
                  <path d="M0,0.5 L0,5.5 L6,3 z" fill="rgba(255,255,255,0.3)" />
                </marker>
              </defs>

              {connPaths.map(({ id, d, winner, noArrow }) => (
                <path
                  key={id}
                  d={d}
                  fill="none"
                  stroke={winner ? "rgba(0,229,255,0.65)" : "rgba(255,255,255,0.25)"}
                  strokeWidth={winner ? 2 : 1.5}
                  strokeDasharray={winner ? "6 4" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  markerEnd={noArrow ? undefined : winner ? "url(#bp-arrow-winner)" : "url(#bp-arrow-survivor)"}
                />
              ))}
            </svg>

            {/* Card layout — sits above SVG */}
            <div className="relative flex items-center gap-16" style={{ zIndex: 1 }}>

              {/* Left column: Q1 (top) + Elim (bottom) */}
              <div className="flex flex-col gap-10 shrink-0">
                {/* Q1 */}
                <div>
                  <div className="flex items-center justify-between px-0.5 mb-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                      Qualifier 1
                    </p>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-primaryNeon/75">
                      W → Final
                    </span>
                  </div>
                  <div ref={q1Ref}>
                    {q1 ? makeCard(q1, STAGE_NUMBER.qualifier1) : <EmptySlot label="TBD" />}
                  </div>
                  <p className="mt-1.5 px-0.5 text-[8px] font-medium text-mutedForeground/50">
                    L → Qualifier 2
                  </p>
                </div>

                {/* Eliminator */}
                <div>
                  <div className="flex items-center justify-between px-0.5 mb-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                      Eliminator
                    </p>
                    <span className="text-[8px] font-medium text-mutedForeground/50">
                      W → Qualifier 2
                    </span>
                  </div>
                  <div ref={elimRef}>
                    {elim ? makeCard(elim, STAGE_NUMBER.eliminator) : <EmptySlot label="TBD" />}
                  </div>
                </div>
              </div>

              {/* Q2 — vertically centered between Q1 and Elim */}
              <div className="shrink-0 self-center">
                <div className="flex items-center justify-between px-0.5 mb-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50">
                    Qualifier 2
                  </p>
                  <span className="text-[8px] font-medium text-mutedForeground/50">
                    W → Final
                  </span>
                </div>
                <div ref={q2Ref}>
                  {q2 ? makeCard(q2, STAGE_NUMBER.qualifier2) : (
                    <EmptySlot label="Q1 Loser vs Elim Winner" />
                  )}
                </div>
                <p className="mt-1.5 px-0.5 text-[8px] font-medium text-mutedForeground/40">
                  Q1 Loser vs Elim Winner
                </p>
              </div>

              {/* Final — vertically centered */}
              <div className="shrink-0 self-center">
                <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                  <Trophy size={10} className="text-championGold" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-championGold">
                    The Grand Final
                  </p>
                </div>
                <div ref={finalRef}>
                  {final_ ? makeCard(final_, STAGE_NUMBER.final) : (() => {
                    const q1WinnerId = q1?.winnerId;
                    const q1WinnerName = q1WinnerId
                      ? (matchPlayers.find((p) => p.playerId === q1WinnerId)?.name ?? null)
                      : null;
                    return q1WinnerName ? (
                      <FinalPlaceholderCard
                        confirmedName={q1WinnerName}
                        confirmedLabel="Q1 Winner — confirmed"
                      />
                    ) : (
                      <EmptySlot label="Q1 Winner vs Q2 Winner" />
                    );
                  })()}
                </div>

              </div>
            </div>
          </div>
        ) : (
          /* ── Partial bracket (simple flow) ── */
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
            {q2 && (
              <>
                <div className="flex items-stretch w-10 shrink-0 self-stretch">
                  <svg viewBox="0 0 40 100" className="w-full h-full text-foreground/25"
                    preserveAspectRatio="none" aria-hidden>
                    <line x1="0" y1="25" x2="20" y2="25" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="0" y1="75" x2="20" y2="75" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="20" y1="25" x2="20" y2="75" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="20" y1="50" x2="40" y2="50" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </div>
                <div className="flex flex-col justify-center shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-mutedForeground/50 mb-1.5 px-0.5">
                    Qualifier 2
                  </p>
                  {makeCard(q2, STAGE_NUMBER.qualifier2)}
                </div>
              </>
            )}
            {final_ && (
              <>
                <div className="flex items-center w-8 shrink-0 self-stretch">
                  <div className="w-full h-px bg-foreground/25" />
                </div>
                <div className="flex flex-col justify-center shrink-0">
                  <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
                    <Trophy size={10} className="text-championGold" />
                    <p className="text-[9px] font-bold uppercase tracking-widest text-championGold">
                      The Grand Final
                    </p>
                  </div>
                  {makeCard(final_, STAGE_NUMBER.final)}
                </div>
              </>
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
