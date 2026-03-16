"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { X } from "lucide-react";
import type { ListPlayersResponse } from "@/types/dto";
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
};

export function NewMatchFlow({ defaultMatchName, recentPlayers = [] }: NewMatchFlowProps) {
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
    <div className="mt-6 space-y-6">
      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-2">
          Select players (order = turn order)
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
            className="w-full rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm"
            aria-describedby="player-search-hint"
          />
          <p id="player-search-hint" className="mt-1 text-xs text-mutedForeground">
            {searchTrimmed.length === 0
              ? "Recent players from your last match are below. Search to find more."
              : `${searchResults.length} player${searchResults.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {searchTrimmed.length === 0 ? (
          <>
            {recentPlayers.length > 0 && (
              <>
                <p className="text-xs font-medium text-mutedForeground mb-1.5">
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
                        className={`inline-flex items-center gap-2 rounded-button border px-3 py-2 text-sm font-medium transition-colors shrink-0 ${
                          selected
                            ? "border-primaryNeon bg-primaryNeon/10 text-foreground"
                            : "border-glassBorder bg-glassBackground text-mutedForeground hover:border-glassBorder/80 hover:text-foreground"
                        }`}
                        aria-pressed={selected}
                      >
                        {p.avatarColor && (
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: p.avatarColor }}
                            aria-hidden
                          />
                        )}
                        <span>{p.name}</span>
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
            <p className="text-xs font-medium text-mutedForeground mb-1.5">
              Search results
            </p>
            {searchResults.length === 0 ? (
              <p className="text-sm text-mutedForeground">No players match your search.</p>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((p) => (
                  <li key={p.playerId}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.playerId)}
                        onChange={() => togglePlayer(p.playerId)}
                        className="rounded border-glassBorder"
                      />
                      <span>{p.name}</span>
                      {p.avatarColor && (
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.avatarColor }}
                          aria-hidden
                        />
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="mt-4 pt-3 border-t border-glassBorder">
          <p className="text-xs font-medium text-mutedForeground mb-2">
            Selected players (turn order)
          </p>
          {selectedOrder.length === 0 ? (
            <p className="text-sm text-mutedForeground">No players selected.</p>
          ) : (
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              {selectedOrder.map((p) => (
                <li key={p.playerId} className="flex items-center gap-2 group">
                  {p.avatarColor && (
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.avatarColor }}
                      aria-hidden
                    />
                  )}
                  <span className="font-medium flex-1 min-w-0">{p.name}</span>
                  <button
                    type="button"
                    onClick={() => togglePlayer(p.playerId)}
                    className="shrink-0 rounded p-1 text-mutedForeground hover:text-foreground hover:bg-surfaceSubtle focus:outline-none focus-visible:ring-2 focus-visible:ring-primaryNeon"
                    aria-label={`Remove ${p.name} from selection`}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-2">
          Add player
        </h3>
        <form onSubmit={handleAddPlayer} className="flex flex-wrap gap-2 items-end">
          <div>
            <label htmlFor="new-player-name" className="sr-only">
              Name
            </label>
            <input
              id="new-player-name"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Name"
              className="rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="new-player-color" className="block text-xs text-mutedForeground mb-1.5">
              Color (required)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="new-player-color"
                type="color"
                value={newPlayerColor || "#888888"}
                onChange={(e) => setNewPlayerColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-glassBorder bg-glassBackground p-0.5 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded"
                aria-required="true"
              />
              <span className="text-xs text-mutedForeground tabular-nums min-w-[4rem]">
                {newPlayerColor ? newPlayerColor : "Pick a color"}
              </span>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canAddPlayer}
            className="rounded-button border border-glassBorder bg-glassBackground px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {createPlayerMutation.isPending ? "Adding…" : "Add player"}
          </button>
        </form>
        {createPlayerMutation.isError && (
          <p className="mt-2 text-sm text-destructive">
            {createPlayerMutation.error instanceof Error
              ? createPlayerMutation.error.message
              : "Failed to add player"}
          </p>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-mutedForeground mb-3">
          Match settings
        </h3>
        <form onSubmit={handleCreateMatch} className="space-y-4">
          <div>
            <label htmlFor="match-name" className="text-sm font-medium text-mutedForeground">
              Match name
            </label>
            <input
              id="match-name"
              type="text"
              value={matchName}
              onChange={(e) => setMatchName(e.target.value)}
              placeholder={defaultMatchName}
              className="mt-1 block w-full rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="total-rounds" className="text-sm font-medium text-mutedForeground">
              Total rounds
            </label>
            <input
              id="total-rounds"
              type="number"
              min={1}
              value={totalRounds}
              onChange={(e) => setTotalRounds(Number(e.target.value) || 1)}
              className="mt-1 block rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label htmlFor="shots-per-round" className="text-sm font-medium text-mutedForeground">
              Shots per round
            </label>
            <input
              id="shots-per-round"
              type="number"
              min={1}
              value={shotsPerRound}
              onChange={(e) => setShotsPerRound(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1 block rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm w-24"
            />
          </div>
          <div>
            <label htmlFor="playoff-shots" className="text-sm font-medium text-mutedForeground">
              Playoff shots per round (optional)
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
              className="mt-1 block rounded-md border border-glassBorder bg-glassBackground px-3 py-2 text-sm w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="shuffle-order"
              type="checkbox"
              checked={shuffle}
              onChange={(e) => setShuffle(e.target.checked)}
              className="rounded border-glassBorder"
            />
            <label htmlFor="shuffle-order" className="text-sm font-medium text-mutedForeground">
              Shuffle turn order before start
            </label>
          </div>
          <button
            type="submit"
            disabled={!canCreate || createMatchMutation.isPending}
            className="rounded-button border border-glassBorder bg-glassBackground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {createMatchMutation.isPending ? "Creating…" : "Create match"}
          </button>
          {!canCreate && selectedOrder.length > 0 && selectedOrder.length < 2 && (
            <p className="text-sm text-mutedForeground">
              Select at least 2 players.
            </p>
          )}
          {createError && (
            <p className="text-sm text-destructive">{createError}</p>
          )}
        </form>
      </GlassCard>
    </div>
  );
}
