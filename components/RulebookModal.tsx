"use client";

import { useEffect, useRef } from "react";
import { X, BookOpen, Zap, Trophy, Swords, CircleDot, Star } from "lucide-react";
import { cn } from "@/utils/cn";

type RulebookModalProps = {
  open: boolean;
  onClose: () => void;
};

const SCORING_ROWS = [
  { zone: "Miss", multiplier: "—", example: "0 pts", note: "Dart misses the board" },
  { zone: "Single", multiplier: "×1", example: "1 – 20 pts", note: "Outer large segment" },
  { zone: "Double", multiplier: "×2", example: "2 – 40 pts", note: "Thin outer ring" },
  { zone: "Triple", multiplier: "×3", example: "3 – 60 pts", note: "Thin inner ring" },
  { zone: "Outer Bull", multiplier: "—", example: "25 pts", note: "Green ring around bull" },
  { zone: "Bullseye", multiplier: "—", example: "50 pts", note: "Red centre" },
];

const PLAYOFF_STAGES = [
  {
    name: "Qualifier 1",
    abbr: "Q1",
    color: "text-primaryNeon",
    border: "border-primaryNeon/30",
    bg: "bg-primaryNeon/8",
    desc: "1st vs 2nd place. Winner goes straight to the Final — no more matches needed.",
  },
  {
    name: "Eliminator",
    abbr: "EL",
    color: "text-amber-500",
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    desc: "3rd vs 4th place. Loser is eliminated. Winner advances to Qualifier 2.",
  },
  {
    name: "Qualifier 2",
    abbr: "Q2",
    color: "text-orange-400",
    border: "border-orange-400/30",
    bg: "bg-orange-400/8",
    desc: "Q1 loser vs Eliminator winner. Last chance to reach the Final.",
  },
  {
    name: "Final",
    abbr: "🏆",
    color: "text-championGold",
    border: "border-amber-500/40",
    bg: "bg-amber-500/10",
    desc: "Q1 winner vs Q2 winner. The best of the best. Winner takes the title.",
  },
];

type SectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function Section({ icon, title, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primaryNeon/10 border border-primaryNeon/20 text-primaryNeon">
          {icon}
        </span>
        <h3 className="text-sm font-black uppercase tracking-[0.12em] text-foreground">{title}</h3>
      </div>
      <div className="pl-9.5 space-y-2 text-sm leading-relaxed text-foreground/75">
        {children}
      </div>
    </section>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-bold text-primaryNeon">{children}</span>
  );
}

function GoldHighlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-bold text-championGold">{children}</span>
  );
}

export function RulebookModal({ open, onClose }: RulebookModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Rulebook"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-overlay backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden
      />

      {/* Modal panel */}
      <div className="relative z-10 flex flex-col w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] rounded-t-2xl sm:rounded-2xl border border-glassBorder bg-glassBackground shadow-panelShadow backdrop-blur-[24px] overflow-hidden">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 px-6 py-4 border-b border-glassBorder">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primaryNeon/12 border border-primaryNeon/25">
              <BookOpen size={16} className="text-primaryNeon" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-black tracking-tight text-foreground">Rulebook</h2>
              <p className="text-[11px] text-mutedForeground">Everything you need to play like a pro</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rulebook"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-glassBorder text-mutedForeground hover:border-primaryNeon/40 hover:text-primaryNeon transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-7">

          {/* Objective */}
          <Section icon={<Star size={14} />} title="The Objective">
            <p>
              Score as many points as possible across all rounds. The player with the{" "}
              <Highlight>highest total score</Highlight> at the end of the match wins the league
              stage and enters the playoffs.
            </p>
          </Section>

          {/* The Dartboard */}
          <Section icon={<CircleDot size={14} />} title="The Dartboard">
            <p>
              A standard dartboard is divided into <Highlight>20 numbered segments</Highlight> (1–20),
              plus a centre bull. Each segment has three scoring zones: a large single area, a thin{" "}
              <Highlight>double ring</Highlight> on the outside, and a thin{" "}
              <Highlight>triple ring</Highlight> in the middle.
            </p>

            {/* Scoring table */}
            <div className="mt-3 rounded-xl border border-glassBorder overflow-hidden">
              <div className="grid grid-cols-[1fr_56px_88px] border-b border-glassBorder bg-surfaceMuted px-4 py-2">
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-mutedForeground">Zone</span>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-mutedForeground text-center">Mult.</span>
                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-mutedForeground text-right">Score</span>
              </div>
              {SCORING_ROWS.map((row, i) => (
                <div
                  key={row.zone}
                  className={cn(
                    "grid grid-cols-[1fr_56px_88px] items-center px-4 py-2.5 text-xs",
                    i < SCORING_ROWS.length - 1 && "border-b border-glassBorder/50",
                    row.zone === "Triple" && "bg-primaryNeon/4",
                    row.zone === "Bullseye" && "bg-amber-500/5",
                  )}
                >
                  <div>
                    <span className={cn(
                      "font-semibold",
                      row.zone === "Triple" ? "text-primaryNeon" : "text-foreground/85",
                      row.zone === "Bullseye" ? "text-amber-500" : "",
                    )}>
                      {row.zone}
                    </span>
                    <span className="block text-[10px] text-mutedForeground">{row.note}</span>
                  </div>
                  <span className="text-center font-mono font-bold text-foreground/60">{row.multiplier}</span>
                  <span className={cn(
                    "text-right font-bold tabular-nums",
                    row.zone === "Triple" ? "text-primaryNeon" : "text-foreground/80",
                    row.zone === "Bullseye" ? "text-amber-500" : "",
                  )}>
                    {row.example}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-mutedForeground mt-1">
              💡 <span className="font-semibold">Pro tip:</span> Triple 20 is the holy grail —{" "}
              <Highlight>60 points</Highlight> in a single dart. That&apos;s what the pros aim for.
            </p>
          </Section>

          {/* How a Round Works */}
          <Section icon={<Zap size={14} />} title="How a Round Works">
            <p>
              Each player throws a set number of darts per round (configured before the match —
              typically <Highlight>1–3 shots</Highlight>). Turns go in order until every player has
              thrown. Then the next round begins.
            </p>
            <p>
              Your round score is the <Highlight>sum of all darts thrown</Highlight> in that round.
              A dart that misses the board scores <Highlight>0</Highlight> — it still counts as a
              throw, it just doesn&apos;t add to your total.
            </p>
            <p>
              After all rounds are completed, scores are totalled. The ranking determines who goes
              into which playoff bracket.
            </p>
          </Section>

          {/* Playoffs */}
          <Section icon={<Swords size={14} />} title="The Playoffs">
            <p>
              The top 4 players qualify for playoffs. It&apos;s a{" "}
              <GoldHighlight>knockout format</GoldHighlight> designed to reward consistency but
              give everyone a shot — even a 3rd-place finish can lead to the title.
            </p>

            <div className="mt-3 space-y-2">
              {PLAYOFF_STAGES.map((stage) => (
                <div
                  key={stage.name}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-3",
                    stage.border,
                    stage.bg,
                  )}
                >
                  <span className={cn(
                    "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-black border",
                    stage.border,
                    stage.color,
                  )}>
                    {stage.abbr}
                  </span>
                  <div>
                    <p className={cn("text-xs font-black", stage.color)}>{stage.name}</p>
                    <p className="text-xs text-foreground/70 mt-0.5">{stage.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-mutedForeground">
              🎯 <span className="font-semibold">First throw advantage:</span> Before each playoff
              match, one player wins the first-throw decision. This gives them the choice of who
              throws first — a small but real edge.
            </p>
          </Section>

          {/* Winning */}
          <Section icon={<Trophy size={14} />} title="Winning a Playoff Match">
            <p>
              Each playoff match runs for a fixed number of rounds. The player with the{" "}
              <Highlight>higher total score</Highlight> at the end wins and advances.
            </p>
            <p>
              If scores are <GoldHighlight>exactly tied</GoldHighlight>, the match goes to{" "}
              <GoldHighlight>Sudden Death</GoldHighlight> — one dart each, highest score wins.
              Sudden death repeats until the tie is broken. No draws, ever.
            </p>
          </Section>

          {/* Quick reference */}
          <div className="rounded-xl border border-primaryNeon/20 bg-primaryNeon/5 px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primaryNeon/60 mb-2">Quick Reference</p>
            <ul className="space-y-1.5 text-xs text-foreground/75">
              <li>• Max single dart score: <Highlight>60</Highlight> (Triple 20)</li>
              <li>• Bullseye: <Highlight>50 pts</Highlight> · Outer bull: <Highlight>25 pts</Highlight></li>
              <li>• A miss still counts as a throw — scores <Highlight>0</Highlight></li>
              <li>• Rankings 1–4 enter the playoff bracket</li>
              <li>• Finals winner = <GoldHighlight>Champion 🏆</GoldHighlight></li>
            </ul>
          </div>

          <p className="text-center text-xs text-mutedForeground pb-2">
            Now stop reading and start throwing. 🎯
          </p>
        </div>
      </div>
    </div>
  );
}
