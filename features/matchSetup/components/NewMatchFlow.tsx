"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { X } from "lucide-react";
import type { ListPlayersResponse } from "@/types/dto";
import { Button } from "@/components/ui/button";
import { LiquidButton } from "@/components/ui/LiquidButton";
import { GlassCard } from "@/components/GlassCard";
import { LoadingCard } from "@/components/ui/LoadingCard";
import { ErrorState } from "@/components/ui/ErrorState";

async function fetchPlayers(): Promise<ListPlayersResponse> {
  const res = await fetch("/api/players");
  if (!res.ok) throw new Error("Failed to load players");
  return res.json();
}

async function createPlayer(body: { name: string; avatarColor?: string }) {
  const res = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create player");
  return data as { playerId: string; name: string; avatarColor?: string };
}

async function createMatch(body: {
  name?: string;
  mode: "casual";
  totalRounds: number;
  playerIds: string[];
  shotsPerRound?: number;
  playoffShotsPerRound?: number;
  shuffle?: boolean;
}) {
  const res = await fetch("/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to create match");
  return data as { matchId: string };
}

type PlayerOption = { playerId: string; name: string; avatarColor?: string };

type NewMatchFlowProps = {
  defaultMatchName: string;
  /** Players from the current user's most recent completed match (not preselected). */
  recentPlayers?: PlayerOption[];
  /** Logged-in user's linked player (highlighted, not auto-selected). */
  linkedPlayerId?: string | null;
};

const inputCls =
  "w-full rounded-button border border-glassBorder bg-glassBackground px-3 py-2.5 text-sm text-foreground placeholder:text-mutedForeground transition-colors focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20";

const inputNarrowCls =
  "rounded-button border border-glassBorder bg-glassBackground px-3 py-2.5 text-sm text-foreground tabular-nums transition-colors focus:border-primaryNeon/60 focus:outline-none focus:ring-2 focus:ring-primaryNeon/20 w-24";

export function NewMatchFlow({
  defaultMatchName,
  recentPlayers = [],
  linkedPlayerId = null,
}: NewMatchFlowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [matchName, setMatchName] = useState(defaultMatchName);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalRounds, setTotalRounds] = useState(3);
  const [shotsPerRound, setShotsPerRound] = useState(1);
  const [playoffShotsPerRound, setPlayoffShotsPerRound] = useState<number | "">("");
  const [shuffle, setShuffle] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerColor, setNewPlayerColor] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });

  const createPlayerMutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setNewPlayerName("");
      setNewPlayerColor("");
      setSelectedIds((prev) =>
        prev.includes(created.playerId) ? prev : [...prev, created.playerId],
      );
    },
  });

  const isYou = (playerId: string) =>
    linkedPlayerId != null && linkedPlayerId !== "" && playerId === linkedPlayerId;

  const createMatchMutation = useMutation({
    mutationFn: createMatch,
    onSuccess: (data) => {
      router.push(`/match/${data.matchId}`);
    },
    onError: (err) => {
      setCreateError(err instanceof Error ? err.message : "Failed to create match");
    },
  });

  const players = data?.players ?? [];
  const allPlayersById = new Map<string, PlayerOption>();
  for (const p of recentPlayers) allPlayersById.set(p.playerId, p);
  for (const p of players) if (!allPlayersById.has(p.playerId)) allPlayersById.set(p.playerId, p);
  const allPlayers = Array.from(allPlayersById.values());
  const selectedOrder = selectedIds
    .map((id) => allPlayers.find((p) => p.playerId === id))
    .filter(Boolean) as PlayerOption[];
  const canCreate = selectedOrder.length >= 2 && totalRounds >= 1;

  const searchTrimmed = searchQuery.trim().toLowerCase();
  const searchResults =
    searchTrimmed.length === 0
      ? []
      : players.filter((p) => p.name.toLowerCase().includes(searchTrimmed));

  const togglePlayer = (playerId: string) => {
    setSelectedIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId],
    );
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPlayerName.trim();
    const color = newPlayerColor.trim();
    if (!name || !color) return;
    setCreateError(null);
    createPlayerMutation.mutate({
      name,
      avatarColor: color,
    });
  };

  const canAddPlayer =
    newPlayerName.trim() !== "" &&
    newPlayerColor.trim() !== "" &&
    !createPlayerMutation.isPending;

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) return;
    setCreateError(null);
    createMatchMutation.mutate({
      name: matchName.trim() || undefined,
      mode: "casual",
      totalRounds,
      playerIds: selectedOrder.map((p) => p.playerId),
      shotsPerRound: shotsPerRound >= 1 ? shotsPerRound : 1,
      playoffShotsPerRound:
        playoffShotsPerRound === "" || playoffShotsPerRound < 1
          ? undefined
          : playoffShotsPerRound,
      shuffle,
    });
  };

  if (isLoading) {
    return (
      <div className="mt-6">
        <LoadingCard message="Loading players…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6">
        <ErrorState
          title="Could not load players"
          description={
            error instanceof Error ? error.message : "Failed to load players"
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Player selection */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground mb-3">
          Select players <span className="text-mutedForeground/60 normal-case">(order = turn order)</span>
        </h3>
        <div className="mb-3">
          <label htmlFor="player-search" className="sr-only">
            Search players
          </label>
          <input
            id="player-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search to add players…"
            className={inputCls}
            aria-describedby="player-search-hint"
          />
          <p id="player-search-hint" className="mt-1.5 text-xs text-mutedForeground">
            {searchTrimmed.length === 0
              ? "Recent players from your last match are below. Search to find more."
              : `${searchResults.length} player${searchResults.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {searchTrimmed.length === 0 ? (
          <>
            {recentPlayers.length > 0 && (
              <>
                <p className="text-xs font-semibold text-mutedForeground mb-2">
                  Recent players
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Recent players">
                  {recentPlayers.map((p) => {
                    const selected = selectedIds.includes(p.playerId);
                    return (
                      <button
                        key={p.playerId}
                        type="button"
                        onClick={() => togglePlayer(p.playerId)}
                        className={`inline-flex items-center gap-2 rounded-button border px-3 py-2 text-sm font-medium transition-all shrink-0 active:scale-[0.97] ${
                          selected
                            ? "border-primaryNeon/40 bg-primaryNeon/10 text-primaryNeon"
                            : "border-glassBorder bg-glassBackground text-mutedForeground hover:border-glassBorder/80 hover:text-foreground"
                        }`}
                        aria-pressed={selected}
                      >
                        {p.avatarColor && (
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: p.avatarColor }}
                            aria-hidden
                          />
                        )}
                        <span>{p.name}</span>
                        {isYou(p.playerId) && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-primaryNeon border border-primaryNeon/35 rounded px-1.5 py-px shrink-0">
                            You
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {recentPlayers.length === 0 && (
              <p className="text-sm text-mutedForeground">
                Search above to add players. You need at least 2 for a match.
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-xs font-semibold text-mutedForeground mb-2">
              Search results
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-mutedForeground">No players match your search.</p>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((p) => (
                  <li key={p.playerId}>
                    <label className="flex items-center gap-2.5 cursor-pointer rounded-button px-2 py-1.5 hover:bg-surfaceSubtle transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.playerId)}
                        onChange={() => togglePlayer(p.playerId)}
                        className="rounded border-glassBorder accent-primaryNeon"
                      />
                      {p.avatarColor && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                          aria-hidden
                        />
                      )}
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                      {isYou(p.playerId) && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-primaryNeon border border-primaryNeon/35 rounded px-1.5 py-px">
                          You
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {/* Selected players */}
        <div className="mt-3 pt-3 border-t border-glassBorder">
          <p className="text-xs font-semibold text-mutedForeground mb-2">
            Selected players <span className="text-mutedForeground/60 normal-case font-normal">(turn order)</span>
          </p>
          {selectedOrder.length === 0 ? (
            <p className="text-sm text-mutedForeground">No players selected.</p>
          ) : (
            <ol className="space-y-1.5">
              {selectedOrder.map((p, idx) => (
                <li key={p.playerId} className="flex items-center gap-2.5 text-sm">
                  <span className="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-mutedForeground">
                    {idx + 1}.
                  </span>
                  {p.avatarColor && (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.avatarColor }}
                      aria-hidden
                    />
                  )}
                  <span className="font-medium flex-1 min-w-0 text-foreground inline-flex items-center gap-2 flex-wrap">
                    {p.name}
                    {isYou(p.playerId) && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-primaryNeon border border-primaryNeon/35 rounded px-1.5 py-px shrink-0">
                        You
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => togglePlayer(p.playerId)}
                    className="shrink-0 rounded-button p-1 text-mutedForeground hover:text-foreground hover:bg-surfaceSubtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon transition-colors"
                    aria-label={`Remove ${p.name} from selection`}
                  >
                    <X size={13} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </GlassCard>

      {/* Add player */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground mb-3">
          Add new player
        </h3>
        <form onSubmit={handleAddPlayer} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label htmlFor="new-player-name" className="block text-xs font-medium text-mutedForeground mb-1.5">
              Name
            </label>
            <input
              id="new-player-name"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="new-player-color" className="block text-xs font-medium text-mutedForeground mb-1.5">
              Color (required)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="new-player-color"
                type="color"
                value={newPlayerColor || "#888888"}
                onChange={(e) => setNewPlayerColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-button border border-glassBorder bg-glassBackground p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
                aria-required="true"
              />
              <span className="text-xs text-mutedForeground tabular-nums min-w-[4rem]">
                {newPlayerColor ? newPlayerColor : "Pick"}
              </span>
            </div>
          </div>
          <LiquidButton
            type="submit"
            variant="light"
            size="md"
            disabled={!canAddPlayer}
          >
            {createPlayerMutation.isPending ? "Adding…" : "Add player"}
          </LiquidButton>
        </form>
        {createPlayerMutation.isError && (
          <p className="mt-2 text-sm text-destructive">
            {createPlayerMutation.error instanceof Error
              ? createPlayerMutation.error.message
              : "Failed to add player"}
          </p>
        )}
      </GlassCard>

      {/* Match settings */}
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-mutedForeground mb-3">
          Match settings
        </h3>
        <form onSubmit={handleCreateMatch} className="space-y-3">
          <div>
            <label htmlFor="match-name" className="block text-xs font-medium text-mutedForeground mb-1.5">
              Match name
            </label>
            <input
              id="match-name"
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder={defaultMatchName}
              className={inputCls}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="total-rounds" className="block text-xs font-medium text-mutedForeground mb-1.5">
                Total rounds
              </label>
              <input
                id="total-rounds"
                type="number"
                min={1}
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value) || 1)}
                className={inputNarrowCls}
              />
            </div>
            <div>
              <label htmlFor="shots-per-round" className="block text-xs font-medium text-mutedForeground mb-1.5">
                Shots per round
              </label>
              <input
                id="shots-per-round"
                type="number"
                min={1}
                value={shotsPerRound}
                onChange={(e) => setShotsPerRound(Math.max(1, Number(e.target.value) || 1))}
                className={inputNarrowCls}
              />
            </div>
            <div>
              <label htmlFor="playoff-shots" className="block text-xs font-medium text-mutedForeground mb-1.5">
                Playoff shots <span className="opacity-60">(optional)</span>
              </label>
              <input
                id="playoff-shots"
                type="number"
                min={1}
                value={playoffShotsPerRound === "" ? "" : playoffShotsPerRound}
                onChange={(e) => {
                  const v = e.target.value;
                  setPlayoffShotsPerRound(v === "" ? "" : Math.max(1, Number(v) || 0));
                }}
                placeholder="Same as above"
                className={inputNarrowCls}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              id="shuffle-order"
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="rounded border-glassBorder accent-primaryNeon w-4 h-4 cursor-pointer"
            />
            <label htmlFor="shuffle-order" className="text-sm font-medium text-mutedForeground cursor-pointer">
              Shuffle turn order before start
            </label>
          </div>

          <div className="pt-1">
            <LiquidButton
              type="submit"
              variant="brand"
              size="lg"
              disabled={!canCreate || createMatchMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMatchMutation.isPending ? "Creating…" : "Create match"}
            </LiquidButton>
            {!canCreate && selectedOrder.length > 0 && selectedOrder.length < 2 && (
              <p className="mt-2 text-sm text-mutedForeground">
                Select at least 2 players.
              </p>
            )}
            {createError && (
              <p className="mt-2 text-sm text-destructive">{createError}</p>
            )}
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
