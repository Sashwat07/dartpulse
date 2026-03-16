"use client";

import { useState, useCallback } from "react";
import type { PlayoffMatch } from "@/types/playoff";
import type { MatchPlayerWithDisplay } from "@/types/match";
import { GlassCard } from "@/components/GlassCard";
import { PlayoffMatchCard } from "./PlayoffMatchCard";

type PlayoffBracketProps = {
  matchId: string;
  playoffMatches: PlayoffMatch[];
  matchPlayers: MatchPlayerWithDisplay[];
  stageOrder: PlayoffMatch["stage"][];
  activePlayoffMatchId: string | null;
  onRefresh: () => void;
  /** When true (e.g. history page), bracket cards do not show Undo. */
  readOnly?: boolean;
  /** When true (final confirmed via "Match complete"), no Undo on any bracket card. */
  finalConfirmed?: boolean;
};

const STAGE_GROUPS: { label: string; stages: PlayoffMatch["stage"][] }[] = [
  { label: "Qualifier", stages: ["qualifier1", "qualifier2"] },
  { label: "Eliminator", stages: ["eliminator"] },
  { label: "Final", stages: ["final"] },
];

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
  const [expandedPlayoffMatchId, setExpandedPlayoffMatchId] = useState<string | null>(null);
  const matchesByStage = new Map(
    playoffMatches.map((m) => [m.stage, m]),
  );

  const handleExpandToggle = useCallback((playoffMatchId: string) => {
    setExpandedPlayoffMatchId((prev) =>
      prev === playoffMatchId ? null : playoffMatchId,
    );
  }, []);

  return (
    <GlassCard className="p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-mutedForeground">
        Bracket
      </h2>
      <div className="mt-4 flex flex-col gap-8">
        {STAGE_GROUPS.map((group) => {
          const matchesInGroup = group.stages
            .map((s) => matchesByStage.get(s))
            .filter(Boolean) as PlayoffMatch[];
          if (matchesInGroup.length === 0) return null;
          return (
            <section key={group.label} className="flex flex-col gap-3">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-mutedForeground">
                {group.label}
              </p>
              <ul className="flex flex-col gap-2">
                {matchesInGroup.map((m) => (
                  <li key={m.playoffMatchId}>
                    <PlayoffMatchCard
                      matchId={matchId}
                      playoffMatch={m}
                      matchPlayers={matchPlayers}
                      isActive={m.playoffMatchId === activePlayoffMatchId}
                      isExpanded={expandedPlayoffMatchId === m.playoffMatchId}
                      onExpandToggle={() => handleExpandToggle(m.playoffMatchId)}
                      onRefresh={onRefresh}
                      readOnly={readOnly}
                      finalConfirmed={finalConfirmed}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </GlassCard>
  );
}
