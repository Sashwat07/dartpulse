"use client";

import { create } from "zustand";

import type { MatchStatePayload } from "@/types/dto";
import type { ThrowEvent } from "@/types/match";
import type { MatchStore } from "@/store/types";

const initialState: Omit<
  MatchStore,
  "addThrow" | "undoLastThrow" | "advanceRound" | "generatePlayoffs" | "setMatchState"
> = {
  activeMatch: null,
  matchPlayers: [],
  rounds: [],
  throwEvents: [],
  currentTurn: null,
  matchLeaderboard: [],
  playoffState: "pending",
  playoffMatches: [],
  suddenDeathState: null,
  resolvedTieOrders: [],
  matchOutcomeSummary: null,
  undoLocked: false,
  sessionWriteEnabled: true,
  analyticsFilters: {},
  globalPlayerStats: {},
  uiFlags: {
    isScoreModalOpen: false,
    isUndoConfirmOpen: false,
  },
};

let addThrowInFlight = false;

/** Map state API payload to store update. Single place so payload shape cannot drift. */
function applyMatchStatePayload(payload: MatchStatePayload): Partial<MatchStore> {
  return {
    activeMatch: payload.match,
    matchPlayers: payload.matchPlayers,
    rounds: payload.rounds,
    throwEvents: payload.throwEvents,
    currentTurn: payload.currentTurn ?? null,
    suddenDeathState: payload.suddenDeathState ?? null,
    resolvedTieOrders: payload.resolvedTieOrders ?? [],
    matchOutcomeSummary: payload.matchOutcomeSummary ?? null,
    undoLocked: payload.undoLocked ?? false,
    sessionWriteEnabled: payload.sessionWriteEnabled !== false,
    matchLeaderboard: [],
  };
}

export const useMatchStore = create<MatchStore>((set, get) => ({
  ...initialState,

  addThrow: (score: number) => {
    if (addThrowInFlight) return;
    const state = get();
    const { activeMatch, currentTurn, sessionWriteEnabled } = state;
    if (!sessionWriteEnabled || !activeMatch || !currentTurn) return;

    addThrowInFlight = true;
    const matchId = activeMatch.matchId;
    const { playerId } = currentTurn;

    fetch(`/api/matches/${matchId}/throws`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, score }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<ThrowEvent>;
      })
      .then((created) => {
        const s = get();
        if (created.eventType === "suddenDeath" || s.suddenDeathState) {
          fetch(`/api/matches/${matchId}/state`)
            .then((r) => (r.ok ? r.json() : null))
            .then((payload: MatchStatePayload | null) => {
              if (payload) set(applyMatchStatePayload(payload));
            });
          return;
        }
        set({ throwEvents: [...s.throwEvents, created] });
        fetch(`/api/matches/${matchId}/state`)
          .then((r) => (r.ok ? r.json() : null))
          .then((payload: MatchStatePayload | null) => {
            if (payload) set(applyMatchStatePayload(payload));
          });
      })
      .catch(() => {})
      .finally(() => {
        addThrowInFlight = false;
      });
  },

  undoLastThrow: () => {
    const state = get();
    const matchId = state.activeMatch?.matchId;
    if (!matchId || !state.sessionWriteEnabled) return;

    fetch(`/api/matches/${matchId}/throws/undo`, { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<{ success: boolean }>;
      })
      .then((data) => {
        if (!data.success) return;
        return fetch(`/api/matches/${matchId}/state`).then((r) => {
          if (!r.ok) throw new Error(r.statusText);
          return r.json() as Promise<MatchStatePayload>;
        });
      })
      .then((payload) => {
        if (payload) set(applyMatchStatePayload(payload));
      })
      .catch(() => {});
  },

  advanceRound: () => {
    set((s) => s);
  },
  generatePlayoffs: () => {
    set((s) => s);
  },
  setMatchState: (payload) => {
    set(applyMatchStatePayload(payload));
  },
}));

