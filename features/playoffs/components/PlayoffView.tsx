"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Zap } from "lucide-react";
import Link from "next/link";

import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay, ThrowEvent } from "@/types/match";
import type { PlayoffTurnState } from "@/lib/playoffTurn";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { MOTION_TRANSITION_STANDARD } from "@/lib/motionConstants";
import { PlayoffBracket } from "./PlayoffBracket";
import { ActivePlayoffMatch } from "./ActivePlayoffMatch";
import { PlayoffScorePanel } from "./PlayoffScorePanel";
import { PlayAgainButton } from "@/features/matchSetup/components/PlayAgainButton";

type PlayoffState = {
  matchId: string;
  playoffMatches: PlayoffMatch[];
  activePlayoffMatchId: string | null;
  activePlayoffMatch?: PlayoffMatch;
  throwEventsForActive: ThrowEvent[];
  stageOrder: PlayoffMatch["stage"][];
  matchPlayers: MatchPlayerWithDisplay[];
  totalRounds: number;
  playoffShotsPerRound?: number;
  playoffTurnState?: PlayoffTurnState;
};

type PlayoffViewProps = { matchId: string };

function playerDisplayName(players: MatchPlayerWithDisplay[], id: string) {
  return players.find((p) => p.playerId === id)?.name ?? id;
}

function LiveFeed({
  throwEvents,
  matchPlayers,
}: {
  throwEvents: ThrowEvent[];
  matchPlayers: MatchPlayerWithDisplay[];
}) {
  const recent = [...throwEvents].reverse().slice(0, 6);
  return (
    <div className="rounded-xl border border-glassBorder bg-glassBackground p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={12} className="text-primaryNeon" />
          <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
            Live Feed
          </span>
        </div>
        {throwEvents.length > 0 && (
          <span className="rounded-full bg-primaryNeon/15 border border-primaryNeon/30 px-2 py-0.5 text-[9px] font-bold text-primaryNeon tabular-nums">
            {throwEvents.length}
          </span>
        )}
      </div>
      {recent.length === 0 ? (
        <p className="text-[11px] text-mutedForeground">No throws yet.</p>
      ) : (
        <ol className="space-y-2.5">
          {recent.map((e, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="text-[9px] font-bold tabular-nums text-primaryNeon/50 mt-0.5 w-4 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-semibold truncate ${i === 0 ? "text-foreground" : "text-foreground/70"}`}>
                  {playerDisplayName(matchPlayers, e.playerId)}
                </p>
                <p className="text-[10px] text-mutedForeground tabular-nums">+{e.score} pts</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

const PLAYOFF_STAGE_SORT: PlayoffMatch["stage"][] = [
  "qualifier1",
  "eliminator",
  "qualifier2",
  "final",
];

function TournamentProgress({ matches }: { matches: PlayoffMatch[] }) {
  const ordered = [...matches].sort(
    (a, b) => PLAYOFF_STAGE_SORT.indexOf(a.stage) - PLAYOFF_STAGE_SORT.indexOf(b.stage),
  );
  const total = ordered.length;
  const done = ordered.filter(
    (m) => m.status === "completed" || m.status === "provisionalCompleted",
  ).length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-glassBorder bg-glassBackground p-4 space-y-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
        Tournament Progress
      </span>
      <div>
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-mutedForeground">Matches completed</span>
          <span className="font-bold text-foreground tabular-nums">
            {done}/{total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surfaceSubtle">
          <div
            className="h-full rounded-full bg-primaryNeon transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ordered.map((m) => {
          const label =
            m.stage === "qualifier1"
              ? "Q1"
              : m.stage === "qualifier2"
                ? "Q2"
                : m.stage === "eliminator"
                  ? "Elim"
                  : "Final";
          const done =
            m.status === "completed" || m.status === "provisionalCompleted";
          const active = m.status === "active";
          return (
            <div
              key={m.playoffMatchId}
              className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${
                done
                  ? "border-primaryNeon/20 bg-primaryNeon/5"
                  : active
                    ? "border-primaryNeon/40 bg-primaryNeon/10"
                    : "border-glassBorder bg-surfaceSubtle/50"
              }`}
            >
              <span className="text-[10px] font-semibold text-mutedForeground">{label}</span>
              <span
                className={`text-[9px] font-bold uppercase ${
                  done ? "text-primaryNeon" : active ? "text-primaryNeon animate-pulse" : "text-mutedForeground/40"
                }`}
              >
                {done ? "Done" : active ? "Live" : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlayoffView({ matchId }: PlayoffViewProps) {
  const [state, setState] = useState<PlayoffState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch(`/api/playoffs/${matchId}/state`);
      if (!res.ok) {
        setError("Failed to load playoff state");
        return;
      }
      const data = await res.json();
      setState(data);
      setError(null);
    } catch {
      setError("Failed to load playoff state");
    }
  };

  useEffect(() => {
    fetchState();
  }, [matchId]);

  if (error) {
    return (
      <ErrorState
        description={error}
        action={
          <button
            type="button"
            onClick={() => {
              setError(null);
              fetchState();
            }}
            className="rounded-button border border-glassBorder bg-glassBackground px-3 py-1.5 text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        }
      />
    );
  }

  if (state === null) {
    return <LoadingCard message="Loading playoff state…" />;
  }

  if (state.playoffMatches.length === 0) {
    return (
      <div className="rounded-xl border border-glassBorder bg-glassBackground p-4">
        <p className="text-sm text-mutedForeground">
          No playoffs for this match.
        </p>
        <Link
          href={`/match/${matchId}`}
          className="mt-2 inline-block text-sm text-mutedForeground hover:text-primaryNeon"
        >
          ← Back to match
        </Link>
      </div>
    );
  }

  const finalMatch = state.playoffMatches.find((m) => m.stage === "final");
  const finalConfirmed = finalMatch?.status === "completed";
  const allComplete = state.playoffMatches.every(
    (m) =>
      m.status === "completed" ||
      (m.stage === "final" && m.status === "provisionalCompleted"),
  );
  const championId =
    finalMatch?.winnerId != null &&
    (finalMatch.status === "completed" ||
      finalMatch.status === "provisionalCompleted")
      ? finalMatch.winnerId
      : null;
  const championName = championId
    ? state.matchPlayers.find((p) => p.playerId === championId)?.name ?? championId
    : null;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={MOTION_TRANSITION_STANDARD}
    >
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-primaryNeon border border-primaryNeon/30 bg-primaryNeon/5 px-2.5 py-1 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-primaryNeon animate-pulse" />
            Major Event
          </span>
          <h1 className="font-display text-3xl font-black tracking-tight text-foreground mt-1 leading-none">
            PLAYOFFS{" "}
            <span className="text-primaryNeon italic">BRACKET</span>
          </h1>
        </div>

        {allComplete && championName && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-championGold/40 bg-championGold/10 px-3 py-1.5">
              <Trophy size={14} className="text-championGold" />
              <span className="text-sm font-bold text-championGold">
                {championName}
              </span>
            </div>
            {finalConfirmed && (
              <PlayAgainButton
                sourceMatchId={matchId}
                label="Play again"
                variant="button"
              />
            )}
          </div>
        )}
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_256px] gap-4 items-start">
        {/* Left: bracket + active panel */}
        <div className="space-y-4 min-w-0">
          <PlayoffBracket
            matchId={matchId}
            playoffMatches={state.playoffMatches}
            matchPlayers={state.matchPlayers}
            stageOrder={state.stageOrder}
            activePlayoffMatchId={state.activePlayoffMatchId}
            onRefresh={fetchState}
            finalConfirmed={finalConfirmed}
          />
          {state.activePlayoffMatch && (
            <ActivePlayoffMatch
              matchId={matchId}
              playoffMatch={state.activePlayoffMatch}
              throwEvents={state.throwEventsForActive}
              matchPlayers={state.matchPlayers}
              totalRounds={state.totalRounds}
              playoffShotsPerRound={state.playoffShotsPerRound ?? 1}
              playoffTurnState={state.playoffTurnState}
              onThrowAdded={fetchState}
              hideScoreInput
            />
          )}
        </div>

        {/* Right: live feed + progress + score input */}
        <div className="space-y-3">
          <LiveFeed
            throwEvents={state.throwEventsForActive}
            matchPlayers={state.matchPlayers}
          />
          <TournamentProgress matches={state.playoffMatches} />
          {state.activePlayoffMatch && (
            <PlayoffScorePanel
              matchId={matchId}
              playoffMatch={state.activePlayoffMatch}
              throwEvents={state.throwEventsForActive}
              matchPlayers={state.matchPlayers}
              totalRounds={state.totalRounds}
              playoffShotsPerRound={state.playoffShotsPerRound ?? 1}
              playoffTurnState={state.playoffTurnState}
              onThrowAdded={fetchState}
            />
          )}
        </div>
      </div>

      <Link
        href={`/match/${matchId}`}
        className="inline-block text-xs text-mutedForeground transition-colors hover:text-primaryNeon"
      >
        ← Back to match
      </Link>
    </motion.div>
  );
}
